"""
Simple Flask API for face recognition attendance system.
Uses SQLAlchemy ORM and face_recognition library.
Enhanced with rate limiting and JWT authentication.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, 
    get_jwt_identity, get_jwt
)
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from functools import wraps

from database import db, init_database, User, RecognitionLog
from face_processor import FaceProcessor
from config import get_flask_config, get_cors_config, get_recognition_config, ensure_directories
from validators import validate_registration_data, validate_user_id, ValidationError

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Apply configuration
app.config.update(get_flask_config())

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.environ.get('JWT_EXPIRY_HOURS', 24)))

# Initialize JWT
jwt = JWTManager(app)

# Setup CORS (allows React frontend to call this API)
CORS(app, **get_cors_config())

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[os.environ.get('RATE_LIMIT_DEFAULT', '200 per hour')],
    storage_uri=os.environ.get('RATE_LIMIT_STORAGE', 'memory://'),
    strategy='fixed-window'
)

# Initialize database
init_database(app)

# Create directories
ensure_directories()

# Initialize face processor
face_processor = FaceProcessor()

# Get recognition settings
recognition_config = get_recognition_config()

# Frontend build directory
FRONTEND_BUILD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')
)


@app.route('/health', methods=['GET'])
@limiter.exempt  # Health check should not be rate limited
def health_check():
    """Check if API is running."""
    return jsonify({
        'status': 'healthy',
        'message': 'ClearSight API is running',
        'timestamp': datetime.now().isoformat(),
        'auth_enabled': os.environ.get('AUTH_ENABLED', 'false').lower() == 'true'
    })


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")  # Strict limit on login attempts
def login():
    """
    Authenticate and get JWT token.
    
    Expects JSON with:
    - username: Admin username
    - password: Admin password
    
    Returns:
    - access_token: JWT token for authenticated requests
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        # Simple authentication (in production, use proper password hashing)
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        
        if username == admin_username and password == admin_password:
            # Create JWT token with user identity
            access_token = create_access_token(
                identity=username,
                additional_claims={'role': 'admin'}
            )
            return jsonify({
                'access_token': access_token,
                'token_type': 'Bearer',
                'expires_in': int(app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds())
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def optional_jwt_required(fn):
    """
    Decorator that makes JWT optional based on AUTH_ENABLED env var.
    If AUTH_ENABLED=true, JWT is required. Otherwise, endpoint is public.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_enabled = os.environ.get('AUTH_ENABLED', 'false').lower() == 'true'
        if auth_enabled:
            # JWT is required
            return jwt_required()(fn)(*args, **kwargs)
        else:
            # JWT is optional, proceed without authentication
            return fn(*args, **kwargs)
    return wrapper


@app.route('/api/register', methods=['POST'])
@limiter.limit("10 per hour")  # Limit registration attempts
@optional_jwt_required
def register_user():
    """
    Register a new employee with their face.
    
    Expects JSON with:
    - name: Full name
    - employee_id: Unique employee ID
    - department: Department name
    - age: Age (18-120)
    - gender: Male/Female/Other
    - email: Email (optional)
    - image_data: Base64 encoded image from webcam
    """
    try:
        # Get data from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate input data
        try:
            name, email, employee_id, department, age, gender = validate_registration_data(data)
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        
        # Get image data
        image_data = data.get('image_data')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode image
        try:
            image = face_processor.decode_image(image_data)
        except Exception as e:
            return jsonify({'error': f'Failed to decode image: {str(e)}'}), 400
        
        # Check image quality
        quality = face_processor.assess_image_quality(image)
        if quality['is_too_dark']:
            return jsonify({'error': 'Image too dark. Please improve lighting.'}), 400
        if quality['is_too_bright']:
            return jsonify({'error': 'Image too bright. Please reduce lighting.'}), 400
        if quality['is_too_small']:
            return jsonify({'error': 'Image too small. Please move closer to camera.'}), 400
        
        # Detect face
        face_locations, face_encodings = face_processor.detect_face(image)
        
        if len(face_locations) == 0:
            return jsonify({'error': 'No face detected. Please ensure your face is visible.'}), 400
        
        if len(face_locations) > 1:
            return jsonify({'error': 'Multiple faces detected. Please ensure only one person is visible.'}), 400
        
        # Get the face encoding (128 numbers that represent the face)
        face_encoding = face_encodings[0]
        
        # Check if employee_id already exists
        existing_user = User.query.filter_by(employee_id=employee_id).first()
        if existing_user:
            return jsonify({'error': f'Employee ID {employee_id} already registered'}), 400
        
        # Save face image
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"user_{timestamp}_{employee_id}.jpg"
        image_path = face_processor.save_face_image(image, filename)
        
        # Create new user
        user = User(
            name=name,
            employee_id=employee_id,
            department=department,
            email=email,
            age=age,
            gender=gender,
            image_path=image_path
        )
        user.set_face_encoding(face_encoding)
        
        # Save to database
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user_id': user.id,
            'message': f'Employee {name} registered successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/recognize', methods=['POST'])
@limiter.limit("30 per minute")  # Limit recognition attempts to prevent abuse
def recognize_face():
    """
    Recognize a face from webcam image.
    
    Expects JSON with:
    - image_data: Base64 encoded image
    
    Returns:
    - recognized: True/False
    - user: User info if recognized
    - confidence: How confident we are (0-1)
    """
    try:
        # Get image data
        data = request.get_json()
        if not data or 'image_data' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode image
        try:
            image = face_processor.decode_image(data['image_data'])
        except Exception as e:
            return jsonify({'error': f'Failed to decode image: {str(e)}'}), 400
        
        # Detect face
        face_locations, face_encodings = face_processor.detect_face(image)
        
        if len(face_encodings) == 0:
            return jsonify({
                'recognized': False,
                'message': 'No face detected in image'
            })
        
        # Use first detected face
        unknown_encoding = face_encodings[0]
        
        # Get all registered users
        users = User.query.all()
        
        if len(users) == 0:
            return jsonify({
                'recognized': False,
                'message': 'No users registered in system'
            })
        
        # Compare with each registered user
        best_match = None
        best_confidence = 0.0
        
        for user in users:
            known_encoding = user.get_face_encoding()
            if known_encoding is None:
                continue
            
            # Compare faces
            is_match, confidence = face_processor.compare_faces(
                known_encoding,
                unknown_encoding,
                tolerance=recognition_config['tolerance']
            )
            
            # Keep track of best match
            if is_match and confidence > best_confidence:
                best_confidence = confidence
                best_match = user
        
        # If we found a match
        if best_match:
            # Log the recognition
            log = RecognitionLog(
                user_id=best_match.id,
                confidence=best_confidence
            )
            db.session.add(log)
            db.session.commit()
            
            return jsonify({
                'recognized': True,
                'user': {
                    'id': best_match.id,
                    'name': best_match.name,
                    'email': best_match.email,
                    'employee_id': best_match.employee_id,
                    'department': best_match.department
                },
                'confidence': best_confidence
            })
        else:
            return jsonify({
                'recognized': False,
                'message': 'Face not recognized'
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/users', methods=['GET'])
@optional_jwt_required
def get_users():
    """Get all registered users."""
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/<int:user_id>', methods=['GET'])
@optional_jwt_required
def get_user(user_id):
    """Get a specific user by ID."""
    try:
        # Validate user_id
        try:
            user_id = validate_user_id(user_id)
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        
        # Fixed: Use db.session.get() instead of deprecated Query.get()
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/<int:user_id>', methods=['DELETE'])
@limiter.limit("20 per hour")  # Limit delete operations
@optional_jwt_required
def delete_user(user_id):
    """Delete a user."""
    try:
        # Validate user_id
        try:
            user_id = validate_user_id(user_id)
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        
        # Fixed: Use db.session.get() instead of deprecated Query.get()
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete image file if it exists
        if user.image_path and os.path.exists(user.image_path):
            try:
                os.remove(user.image_path)
            except:
                pass  # Continue even if file deletion fails
        
        # Delete user (cascade will delete recognition logs)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/logs', methods=['GET'])
@optional_jwt_required
def get_logs():
    """Get recent recognition logs."""
    try:
        # Get last 50 logs
        logs = RecognitionLog.query.order_by(
            RecognitionLog.timestamp.desc()
        ).limit(50).all()
        
        return jsonify({
            'logs': [log.to_dict() for log in logs]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
@optional_jwt_required
def get_stats():
    """Get system statistics."""
    try:
        # Total users
        total_users = User.query.count()
        
        # Total recognitions
        total_recognitions = RecognitionLog.query.count()
        
        # Average confidence (handle case when no logs exist)
        avg_confidence = db.session.query(
            db.func.avg(RecognitionLog.confidence)
        ).scalar()
        avg_confidence = float(avg_confidence) if avg_confidence else 0.0
        
        # Recent activity (last 24 hours)
        day_ago = datetime.now() - timedelta(days=1)
        recent_activity = RecognitionLog.query.filter(
            RecognitionLog.timestamp >= day_ago
        ).count()
        
        # Most active users (top 5) - only if there are logs
        most_active = []
        if total_recognitions > 0:
            most_active_query = db.session.query(
                User.name,
                db.func.count(RecognitionLog.id).label('count')
            ).join(RecognitionLog).group_by(User.id).order_by(
                db.text('count DESC')
            ).limit(5).all()
            most_active = [
                {'name': name, 'count': count}
                for name, count in most_active_query
            ]
        
        return jsonify({
            'totalUsers': total_users,
            'totalRecognitions': total_recognitions,
            'avgConfidence': round(avg_confidence, 3),
            'recentActivity': recent_activity,
            'mostActiveUsers': most_active
        })
        
    except Exception as e:
        print(f"Stats endpoint error: {str(e)}")  # Log error for debugging
        return jsonify({
            'error': 'Failed to fetch statistics',
            'details': str(e)
        }), 500


@app.route('/api/export/logs', methods=['GET'])
@limiter.limit("10 per hour")  # Limit export operations
@optional_jwt_required
def export_logs():
    """Export recognition logs as CSV."""
    try:
        logs = RecognitionLog.query.order_by(
            RecognitionLog.timestamp.desc()
        ).limit(1000).all()
        
        # Create CSV data
        csv_data = "User Name,Email,Employee ID,Confidence,Timestamp\n"
        for log in logs:
            user = log.user
            csv_data += f"{user.name},{user.email or ''},{user.employee_id},{log.confidence},{log.timestamp}\n"
        
        return jsonify({
            'success': True,
            'csv_data': csv_data,
            'total_records': len(logs)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend."""
    try:
        if path and os.path.exists(os.path.join(FRONTEND_BUILD_DIR, path)):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    except Exception:
        return jsonify({'error': 'Frontend not found. Run: cd frontend && npm run build'}), 404


if __name__ == '__main__':
    app.run(
        debug=app.config['DEBUG'],
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5000))
    )
