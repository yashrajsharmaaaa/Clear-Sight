from flask import Flask, request, jsonify, send_from_directory
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from PIL import Image
import io
import os
from datetime import datetime
import sqlite3
import json
from database import init_database, add_user, get_all_users, get_user_by_id, log_recognition, get_recognition_logs, get_user_features
from face_processor import FaceProcessor

app = Flask(__name__)

# Configure CORS for production
allowed_origins = [
    "http://localhost:3000",  # Local development
    "https://*.vercel.app",   # Vercel deployments
    "https://your-custom-domain.com"  # Replace with your domain
]

# Get CORS origins from environment variable if available
cors_origins = os.environ.get('CORS_ORIGINS', ','.join(allowed_origins)).split(',')
CORS(app, origins=cors_origins)

# Configuration
UPLOAD_FOLDER = 'static/faces'
DATABASE_PATH = 'clear_sight.db'
SIMILARITY_THRESHOLD = 0.7

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('static', exist_ok=True)

# Initialize database and face processor
init_database()
face_processor = FaceProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Clear Sight API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status', methods=['GET'])
def api_status():
    """API status endpoint"""
    return jsonify({
        'api_version': '1.0.0',
        'service': 'Clear Sight Face Recognition',
        'features': {
            'face_detection': True,
            'face_registration': True,
            'face_recognition': True,
            'user_management': True
        }
    })

@app.route('/api/detect-face', methods=['POST'])
def detect_face():
    """Detect faces in uploaded image"""
    try:
        # Handle base64 image data
        if request.json and 'image_data' in request.json:
            image = face_processor.decode_image(request.json['image_data'])
        # Handle file upload
        elif 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
            image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Detect faces
        faces = face_processor.detect_faces(image)
        
        face_data = []
        for face in faces:
            face_data.append({
                'x': face['x'],
                'y': face['y'],
                'width': face['width'],
                'height': face['height'],
                'confidence': face['confidence']
            })
        
        return jsonify({
            'success': True,
            'faces_detected': len(faces),
            'faces': face_data
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user with face data"""
    try:
        # Get user data
        name = request.form.get('name') if request.form else None
        email = request.form.get('email') if request.form else None
        if request.json:
            name = name or request.json.get('name')
            email = email or request.json.get('email')
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        # Handle image data
        if request.json and 'image_data' in request.json:
            image = face_processor.decode_image(request.json['image_data'])
        elif 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
            image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Detect faces
        faces = face_processor.detect_faces(image)
        
        if len(faces) == 0:
            return jsonify({'error': 'No face detected in image'}), 400
        
        if len(faces) > 1:
            return jsonify({'error': 'Multiple faces detected. Please provide an image with only one face'}), 400
        
        # Extract features from the detected face
        face_data = faces[0]
        face_features = face_processor.extract_face_features(face_data['face_image'])
        
        # Save face image
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"user_{timestamp}_{name.replace(' ', '_')}.jpg"
        image_path = face_processor.save_face_image(face_data['face_image'], filename)
        
        # Add user to database
        user_id = add_user(name, email, face_features, image_path)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'message': f'User {name} registered successfully',
            'face_detected': True
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    """Recognize face in uploaded image"""
    try:
        # Handle image data
        if request.json and 'image_data' in request.json:
            image = face_processor.decode_image(request.json['image_data'])
        elif 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
            image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Detect faces
        faces = face_processor.detect_faces(image)
        
        if len(faces) == 0:
            return jsonify({
                'recognized': False,
                'message': 'No face detected in image'
            })
        
        # Use the first detected face
        face_data = faces[0]
        face_features = face_processor.extract_face_features(face_data['face_image'])
        
        # Get all registered users
        registered_users = get_user_features()
        
        best_match = None
        best_similarity = 0.0
        similarity_threshold = SIMILARITY_THRESHOLD
        
        # Compare with all registered users
        for user in registered_users:
            similarity = face_processor.compare_faces(face_features, user['face_features'])
            
            if similarity > best_similarity and similarity > similarity_threshold:
                best_similarity = similarity
                best_match = user
        
        if best_match:
            # Log recognition
            log_recognition(best_match['id'], best_similarity)
            
            # Get user details
            user_details = get_user_by_id(best_match['id'])
            
            if user_details:
                return jsonify({
                    'recognized': True,
                    'user': {
                        'id': user_details['id'],
                        'name': user_details['name'],
                        'email': user_details['email']
                    },
                    'confidence': best_similarity,
                    'bounding_box': [
                        face_data['x'], face_data['y'], 
                        face_data['width'], face_data['height']
                    ]
                })
            else:
                return jsonify({
                    'recognized': False,
                    'message': 'User details not found'
                })
        else:
            return jsonify({
                'recognized': False,
                'message': 'Face not recognized',
                'confidence': best_similarity
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all registered users"""
    try:
        users = get_all_users()
        return jsonify({'users': users})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get recognition logs"""
    try:
        logs = get_recognition_logs(50)
        return jsonify({'logs': logs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user details by ID"""
    try:
        user = get_user_by_id(user_id)
        if user:
            # Don't return face features in API response
            del user['face_features']
            return jsonify({'user': user})
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def api_get_system_stats():
    """Get comprehensive system statistics"""
    try:
        users = get_all_users()
        logs = get_recognition_logs(1000)  # Get more logs for better stats
        
        total_users = len(users)
        total_recognitions = len(logs)
        
        # Calculate average confidence
        avg_confidence = 0
        if logs:
            avg_confidence = sum(log['confidence'] for log in logs) / len(logs)
        
        # Calculate recognition rate (last 24 hours)
        from datetime import datetime, timedelta
        day_ago = datetime.now() - timedelta(days=1)
        recent_logs = []
        for log in logs:
            try:
                # Handle different timestamp formats
                timestamp_str = log['timestamp']
                if 'T' in timestamp_str:
                    # ISO format
                    if timestamp_str.endswith('Z'):
                        timestamp_str = timestamp_str.replace('Z', '+00:00')
                    log_time = datetime.fromisoformat(timestamp_str)
                else:
                    # SQLite format
                    log_time = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                
                if log_time > day_ago:
                    recent_logs.append(log)
            except (ValueError, KeyError):
                # Skip logs with invalid timestamps
                continue
        
        recent_activity = len(recent_logs)
        
        # Calculate success rate
        high_confidence_logs = [log for log in logs if log['confidence'] > 0.7]
        success_rate = len(high_confidence_logs) / len(logs) * 100 if logs else 0
        
        # Get most active users
        user_activity = {}
        for log in logs:
            user_name = log['user_name']
            user_activity[user_name] = user_activity.get(user_name, 0) + 1
        
        most_active_users = sorted(user_activity.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return jsonify({
            'total_users': total_users,
            'total_recognitions': total_recognitions,
            'average_confidence': round(avg_confidence, 3),
            'recent_activity_24h': recent_activity,
            'success_rate': round(success_rate, 1),
            'most_active_users': most_active_users,
            'system_uptime': 'Active',
            'face_detection_mode': 'OpenCV' if not face_processor.use_face_recognition else 'Advanced'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/logs', methods=['GET'])
def api_export_logs():
    """Export recognition logs as CSV"""
    try:
        logs = get_recognition_logs(1000)
        
        csv_data = "User Name,Email,Confidence,Timestamp\n"
        for log in logs:
            csv_data += f"{log['user_name']},{log.get('user_email', '')},{log['confidence']},{log['timestamp']}\n"
        
        return jsonify({
            'success': True,
            'csv_data': csv_data,
            'total_records': len(logs)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Use PORT environment variable for deployment platforms
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)
