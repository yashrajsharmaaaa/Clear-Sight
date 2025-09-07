import cv2
import numpy as np
from PIL import Image
import base64
import io
import os

# Try to import face_recognition, fallback to OpenCV-only if not available
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
    print("face_recognition library available - using advanced recognition")
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("face_recognition library not available - using OpenCV-based recognition")

class FaceProcessor:
    def __init__(self):
        # Load OpenCV face cascade
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        # Load eye cascade for better detection
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        self.use_face_recognition = FACE_RECOGNITION_AVAILABLE
        
        if self.use_face_recognition:
            print("Initialized with face_recognition library")
        else:
            print("Initialized with OpenCV-only mode")
        
    def decode_image(self, image_data):
        """Decode base64 image data to OpenCV format"""
        try:
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise ValueError(f"Failed to decode image: {str(e)}")
    
    def detect_faces(self, image):
        """Detect faces in image using face_recognition or OpenCV"""
        if self.use_face_recognition:
            return self._detect_faces_with_face_recognition(image)
        else:
            return self._detect_faces_with_opencv(image)
    
    def _detect_faces_with_face_recognition(self, image):
        """Detect faces using face_recognition library"""
        # Convert BGR to RGB for face_recognition
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_image)
        
        detected_faces = []
        for (top, right, bottom, left) in face_locations:
            # Convert to OpenCV format (x, y, w, h)
            x, y, w, h = left, top, right - left, bottom - top
            
            # Extract face region
            face_roi = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)[y:y+h, x:x+w]
            
            detected_faces.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': 0.9,  # face_recognition is generally more accurate
                'face_image': face_roi
            })
        
        return detected_faces
    
    def _detect_faces_with_opencv(self, image):
        """Detect faces using OpenCV (fallback method)"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        detected_faces = []
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Detect eyes in face region for validation
            eyes = self.eye_cascade.detectMultiScale(face_roi, 1.1, 3)
            
            # Only include faces with detected eyes (better quality)
            confidence = 0.8 if len(eyes) >= 2 else 0.6
            
            detected_faces.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': confidence,
                'face_image': face_roi
            })
        
        return detected_faces
    
    def extract_face_features(self, face_image):
        """Extract features from face image using face_recognition or OpenCV"""
        if self.use_face_recognition:
            return self._extract_features_with_face_recognition(face_image)
        else:
            return self._extract_features_with_opencv(face_image)
    
    def _extract_features_with_face_recognition(self, face_image):
        """Extract face encoding using face_recognition library"""
        try:
            # Convert grayscale to RGB if needed
            if len(face_image.shape) == 2:
                face_rgb = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB)
            else:
                face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Get face encodings
            encodings = face_recognition.face_encodings(face_rgb)
            
            if len(encodings) > 0:
                return encodings[0].tolist()
            else:
                # Fallback to OpenCV method if no encoding found
                return self._extract_features_with_opencv(cv2.cvtColor(face_rgb, cv2.COLOR_RGB2GRAY))
        
        except Exception as e:
            # Fallback to OpenCV method on error
            gray_face = face_image if len(face_image.shape) == 2 else cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            return self._extract_features_with_opencv(gray_face)
    
    def _extract_features_with_opencv(self, face_image):
        """Extract basic features from face image for recognition (fallback method)"""
        try:
            # Resize face to standard size
            face_resized = cv2.resize(face_image, (100, 100))
            
            # Apply histogram equalization for better feature extraction
            face_eq = cv2.equalizeHist(face_resized)
            
            # Extract LBP (Local Binary Pattern) features
            lbp_features = self._extract_lbp_features(face_eq)
            
            # Extract HOG (Histogram of Oriented Gradients) features
            hog_features = self._extract_hog_features(face_eq)
            
            # Combine features
            features = np.concatenate([lbp_features, hog_features])
            
            return features.tolist()
        
        except Exception as e:
            raise ValueError(f"Failed to extract features: {str(e)}")    
    def _extract_lbp_features(self, image):
        """Extract Local Binary Pattern features"""
        height, width = image.shape
        lbp_image = np.zeros((height, width), dtype=np.uint8)
        
        for i in range(1, height - 1):
            for j in range(1, width - 1):
                center = image[i, j]
                pattern = 0
                
                # 8-neighbor LBP
                neighbors = [
                    image[i-1, j-1], image[i-1, j], image[i-1, j+1],
                    image[i, j+1], image[i+1, j+1], image[i+1, j],
                    image[i+1, j-1], image[i, j-1]
                ]
                
                for idx, neighbor in enumerate(neighbors):
                    if neighbor >= center:
                        pattern |= (1 << idx)
                
                lbp_image[i, j] = pattern
        
        # Create histogram of LBP patterns
        hist, _ = np.histogram(lbp_image.ravel(), bins=256, range=(0, 256))
        hist = hist.astype(np.float32)
        hist = hist / (hist.sum() + 1e-6)  # Normalize
        
        return hist
    
    def _extract_hog_features(self, image):
        """Extract Histogram of Oriented Gradients features"""
        # Calculate gradients
        grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate magnitude and orientation
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        orientation = np.arctan2(grad_y, grad_x) * 180 / np.pi
        orientation[orientation < 0] += 180
        
        # Create HOG descriptor
        cell_size = 8
        num_bins = 9
        height, width = image.shape
        
        hog_features = []
        
        for i in range(0, height - cell_size, cell_size):
            for j in range(0, width - cell_size, cell_size):
                cell_mag = magnitude[i:i+cell_size, j:j+cell_size]
                cell_ori = orientation[i:i+cell_size, j:j+cell_size]
                
                # Create histogram for this cell
                hist, _ = np.histogram(cell_ori, bins=num_bins, range=(0, 180), weights=cell_mag)
                hog_features.extend(hist)
        
        # Normalize
        hog_features = np.array(hog_features, dtype=np.float32)
        hog_features = hog_features / (np.linalg.norm(hog_features) + 1e-6)
        
        return hog_features[:64]  # Limit feature vector size
    
    def compare_faces(self, features1, features2):
        """Compare two face feature vectors"""
        if self.use_face_recognition and len(features1) == 128 and len(features2) == 128:
            # Use face_recognition's distance calculation for face encodings
            return self._compare_face_encodings(features1, features2)
        else:
            # Use OpenCV-based comparison
            return self._compare_opencv_features(features1, features2)
    
    def _compare_face_encodings(self, encoding1, encoding2):
        """Compare face encodings using face_recognition library"""
        try:
            distance = face_recognition.face_distance([np.array(encoding1)], np.array(encoding2))[0]
            # Convert distance to similarity (lower distance = higher similarity)
            similarity = 1.0 - distance
            return float(max(0.0, similarity))
        except Exception as e:
            return self._compare_opencv_features(encoding1, encoding2)
    
    def _compare_opencv_features(self, features1, features2):
        """Compare feature vectors using cosine similarity"""
        try:
            features1 = np.array(features1)
            features2 = np.array(features2)
            
            # Ensure same length
            min_len = min(len(features1), len(features2))
            features1 = features1[:min_len]
            features2 = features2[:min_len]
            
            # Calculate cosine similarity
            dot_product = np.dot(features1, features2)
            norm1 = np.linalg.norm(features1)
            norm2 = np.linalg.norm(features2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        
        except Exception as e:
            return 0.0
    
    def save_face_image(self, face_image, filename):
        """Save face image to disk"""
        try:
            filepath = os.path.join('static/faces', filename)
            cv2.imwrite(filepath, face_image)
            return filepath
        except Exception as e:
            raise ValueError(f"Failed to save image: {str(e)}")