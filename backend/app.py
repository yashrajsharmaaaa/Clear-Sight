from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import os
from datetime import datetime
from dotenv import load_dotenv
from database import init_database, add_user, get_all_users, get_user_by_id, log_recognition, get_recognition_logs, get_user_features
from face_processor import FaceProcessor
from config import get_flask_config, get_cors_config, ensure_directories, get_upload_path

# Load environment variables from .env file
load_dotenv()

# Initialize directories
ensure_directories()

FRONTEND_BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'))
app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='/')

# Apply Flask configuration
flask_config = get_flask_config()
app.config.update(flask_config)

# Apply CORS configuration
cors_config = get_cors_config()
CORS(app, resources={r"/*": cors_config}, supports_credentials=False)

# Configuration
UPLOAD_FOLDER = get_upload_path()
SIMILARITY_THRESHOLD = float(os.environ.get('SIMILARITY_THRESHOLD', 0.65))
MIN_SHARPNESS = float(os.environ.get('MIN_SHARPNESS', 30.0))
BRIGHTNESS_RANGE = (
    float(os.environ.get('MIN_BRIGHTNESS', 60.0)),
    float(os.environ.get('MAX_BRIGHTNESS', 200.0))
)

# Initialize database and face processor (singleton pattern)
init_database()
face_processor = FaceProcessor()

# No need for periodic cache clearing with simplified caching

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve the frontend application"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

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

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user with face data"""
    try:
        print("Registration request received")
        print("Request JSON:", request.json)
        print("Request form:", request.form)
        print("Request files:", request.files)
        print("Request headers:", dict(request.headers))
        print("Request content type:", request.content_type)
        
        # Get employee data
        name = request.form.get('name') if request.form else None
        email = request.form.get('email') if request.form else None
        employee_id = request.form.get('employee_id') if request.form else None
        department = request.form.get('department') if request.form else None
        if request.json:
            name = name or request.json.get('name')
            email = email or request.json.get('email')
            employee_id = employee_id or request.json.get('employee_id')
            department = department or request.json.get('department')
        
        print("Extracted data:", {
            "name": name,
            "email": email,
            "employee_id": employee_id,
            "department": department
        })
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        # Handle image data
        image = None
        try:
            # Log request content type for debugging
            print("Request content type:", request.content_type)
            
            if request.json and 'image_data' in request.json:
                print("Found image_data in JSON")
                try:
                    image_data = request.json['image_data']
                    if not isinstance(image_data, str) or not image_data.startswith('data:image/'):
                        print("Invalid image data format in JSON")
                        return jsonify({'error': 'Invalid image data format. Must be a base64 encoded image string'}), 400
                    
                    image = face_processor.decode_image(image_data)
                    if image is not None:
                        print("Decoded image from JSON, shape:", image.shape)
                    else:
                        print("Failed to decode image from JSON")
                        return jsonify({'error': 'Failed to decode image from base64 data'}), 400
                except Exception as e:
                    print(f"Error decoding JSON image: {str(e)}")
                    return jsonify({'error': f'Error decoding image: {str(e)}'}), 400
                    
            elif request.files and 'image' in request.files:
                print("Found image in files")
                try:
                    file = request.files['image']
                    if file.filename == '':
                        print("Empty filename")
                        return jsonify({'error': 'No selected image file'}), 400
                        
                    image_bytes = file.read()
                    if not image_bytes:
                        print("Empty image file")
                        return jsonify({'error': 'Empty image file'}), 400
                        
                    print("Image data read from file, size:", len(image_bytes))
                    nparr = np.frombuffer(image_bytes, np.uint8)
                    print("Converted to numpy array, size:", len(nparr))
                    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if image is None:
                        print("Failed to decode image from file")
                        return jsonify({'error': 'Failed to decode image file. Format may be unsupported'}), 400
                        
                    print("Decoded image, shape:", image.shape)
                except Exception as e:
                    print(f"Error processing file image: {str(e)}")
                    return jsonify({'error': f'Error processing image file: {str(e)}'}), 400
            else:
                # Try to find any image data in the request
                print("Searching for image in all files...")
                found_image = False
                
                for key in request.files:
                    print(f"Found file with key: {key}")
                    try:
                        file = request.files[key]
                        image_bytes = file.read()
                        if not image_bytes:
                            continue
                            
                        print(f"Image data read from {key}, size:", len(image_bytes))
                        nparr = np.frombuffer(image_bytes, np.uint8)
                        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        
                        if image is not None:
                            print(f"Decoded image from {key}, shape:", image.shape)
                            found_image = True
                            break
                    except Exception as e:
                        print(f"Error processing file {key}: {str(e)}")
                        continue
                
                if not found_image:
                    print("No valid image found in request")
                    return jsonify({'error': 'No image provided or invalid image format'}), 400
        except Exception as img_error:
            print(f"Error processing image data: {str(img_error)}")
            return jsonify({'error': f'Error processing image: {str(img_error)}'}), 400
        
        if image is None:
            return jsonify({'error': 'Failed to decode image data'}), 400
            
        print("Image successfully decoded, shape:", image.shape)
        
        # Detect faces
        try:
            if image is None or image.size == 0:
                print("Invalid image for face detection: empty or None")
                return jsonify({'error': 'Invalid image for face detection'}), 400
                
            # Check image dimensions
            if image.shape[0] < 50 or image.shape[1] < 50:
                print(f"Image too small for reliable face detection: {image.shape[1]}x{image.shape[0]}")
                return jsonify({'error': 'Image too small for reliable face detection'}), 400
                
            faces = face_processor.detect_faces(image)
            print(f"Detected {len(faces)} faces in the image")
            
            if len(faces) == 0:
                print("No faces detected in the image")
                return jsonify({'error': 'No face detected in image. Please ensure your face is clearly visible'}), 400
                
            if len(faces) > 1:
                print(f"Multiple faces ({len(faces)}) detected in the image")
                return jsonify({'error': 'Multiple faces detected. Please provide an image with only one face'}), 400
                
        except Exception as face_error:
            print(f"Error detecting faces: {str(face_error)}")
            return jsonify({'error': f'Face detection failed: {str(face_error)}'}), 400
        
        # Extract features from the detected face
        try:
            face_data = faces[0]
            if face_data is None or 'face_image' not in face_data:
                print("Invalid face data structure")
                return jsonify({'error': 'Invalid face detection result'}), 400
                
            # Assess face quality
            try:
                quality = face_processor.assess_face_quality(face_data['face_image'])
                print(f"Face quality assessment: sharpness={quality['sharpness']}, brightness={quality['brightness']}")
                
                if quality['sharpness'] < MIN_SHARPNESS:
                    print(f"Face image too blurry: {quality['sharpness']} < {MIN_SHARPNESS}")
                    return jsonify({
                        'error': 'Face image too blurry. Please ensure good lighting and hold the camera steady.',
                        'quality': quality
                    }), 400
                    
                if not (BRIGHTNESS_RANGE[0] <= quality['brightness'] <= BRIGHTNESS_RANGE[1]):
                    print(f"Face image brightness out of range: {quality['brightness']} not in {BRIGHTNESS_RANGE}")
                    if quality['brightness'] < BRIGHTNESS_RANGE[0]:
                        message = 'Face image too dark. Please improve lighting.'
                    else:
                        message = 'Face image too bright. Please reduce lighting or avoid direct light sources.'
                    return jsonify({'error': message, 'quality': quality}), 400
            except Exception as quality_error:
                print(f"Error assessing face quality: {str(quality_error)}")
                return jsonify({'error': f'Error assessing face quality: {str(quality_error)}'}), 400
            
            # Extract face features
            try:
                face_features = face_processor.extract_face_features(face_data['face_image'])
                if face_features is None or len(face_features) == 0:
                    print("Failed to extract face features")
                    return jsonify({'error': 'Failed to extract face features. Please try again with a clearer image'}), 400
                print(f"Successfully extracted face features, length: {len(face_features)}")
            except Exception as feature_error:
                print(f"Error extracting face features: {str(feature_error)}")
                return jsonify({'error': f'Error extracting face features: {str(feature_error)}'}), 400
            
            # Save face image
            try:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"user_{timestamp}_{name.replace(' ', '_')}.jpg"
                image_path = face_processor.save_face_image(face_data['face_image'], filename)
                print(f"Face image saved to: {image_path}")
            except Exception as save_error:
                print(f"Error saving face image: {str(save_error)}")
                return jsonify({'error': f'Error saving face image: {str(save_error)}'}), 500
        except Exception as process_error:
            print(f"Error processing face data: {str(process_error)}")
            return jsonify({'error': f'Error processing face data: {str(process_error)}'}), 500
        
        # Add user to database
        try:
            user_id = add_user(name, email, face_features, image_path, employee_id, department)
            print(f"User added to database with ID: {user_id}")
            
            return jsonify({
                'success': True,
                'user_id': user_id,
                'message': f'Employee {name} registered successfully',
                'face_detected': True
            })
        except Exception as db_error:
            print(f"Error adding user to database: {str(db_error)}")
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
    
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
        quality = face_processor.assess_face_quality(face_data['face_image'])
        if quality['sharpness'] < MIN_SHARPNESS or not (BRIGHTNESS_RANGE[0] <= quality['brightness'] <= BRIGHTNESS_RANGE[1]):
            return jsonify({'recognized': False, 'message': 'Low-quality face image. Improve lighting or focus.', 'quality': quality})
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

@app.route('/api/recognition-logs', methods=['GET'])
def get_recognition_logs_api():
    """Get recognition logs with optional limit parameter"""
    try:
        # Get limit parameter from query string, default to 50
        limit = request.args.get('limit', default=50, type=int)
        
        # Validate limit is positive
        if limit <= 0:
            limit = 50
        
        # Call existing database function
        logs = get_recognition_logs(limit)
        
        return jsonify({'logs': logs}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch recognition logs'}), 500

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
            avg_confidence = sum(log.get('confidence', 0) for log in logs) / len(logs)
        
        # Calculate recognition rate (last 24 hours)
        from datetime import timedelta
        day_ago = datetime.now() - timedelta(days=1)
        recent_logs = []
        for log in logs:
            try:
                # Handle different timestamp formats
                timestamp_str = log['timestamp']
                try:
                    if 'T' in timestamp_str:
                        # ISO format
                        if timestamp_str.endswith('Z'):
                            timestamp_str = timestamp_str.replace('Z', '+00:00')
                        log_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00') if timestamp_str.endswith('Z') else timestamp_str)
                    else:
                        # SQLite format
                        log_time = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                    
                    if log_time > day_ago:
                        recent_logs.append(log)
                except (ValueError, TypeError):
                    # Skip logs with invalid timestamps
                    continue
            except (ValueError, TypeError, KeyError):
                # Skip logs with invalid timestamps
                continue
        
        recent_activity = len(recent_logs)
        
        # Calculate success rate
        high_confidence_logs = [log for log in logs if log.get('confidence', 0) > 0.7]
        success_rate = len(high_confidence_logs) / len(logs) * 100 if logs else 0
        
        # Get most active users
        user_activity = {}
        for log in logs:
            user_name = log['user_name']
            user_activity[user_name] = user_activity.get(user_name, 0) + 1
        
        most_active_users = sorted(user_activity.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Add cache statistics
        cache_stats = face_processor.get_cache_stats() if hasattr(face_processor, 'get_cache_stats') else {}
        
        return jsonify({
            'totalUsers': total_users,
            'totalRecognitions': total_recognitions,
            'avgConfidence': round(avg_confidence, 3),
            'recentActivity': recent_activity,
            'successRate': round(success_rate, 1),
            'mostActiveUsers': most_active_users,
            'systemUptime': 'Active',
            'faceDetectionMode': 'OpenCV' if not face_processor.use_face_recognition else 'Advanced',
            'cache': cache_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
@app.route('/api/performance', methods=['GET'])
def get_performance():
    """Get system performance metrics"""
    import psutil
    try:
        stats = {
            'cpu': psutil.cpu_percent(interval=0.1),
            'memory': psutil.virtual_memory()._asdict(),
            'cache': face_processor.get_cache_stats() if hasattr(face_processor, 'get_cache_stats') else {}
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/logs', methods=['GET'])
def api_export_logs():
    """Export recognition logs as CSV"""
    try:
        logs = get_recognition_logs(1000)
        
        csv_data = "User Name,Email,Confidence,Timestamp\n"
        for log in logs:
            csv_data += f"{log['user_name']},{log.get('user_email', '')},{log.get('confidence', 0)},{log['timestamp']}\n"
        
        return jsonify({
            'success': True,
            'csv_data': csv_data,
            'total_records': len(logs)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    try:
        if os.path.exists(os.path.join(FRONTEND_BUILD_DIR, path)):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    except Exception:
        return jsonify({'error': 'Frontend build not found. Please run frontend build.'}), 404

if __name__ == '__main__':
    app.run(
        debug=os.environ.get('FLASK_ENV') == 'development',
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5000))
    )
