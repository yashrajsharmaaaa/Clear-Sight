import cv2
import numpy as np
from PIL import Image
import base64
import io
import os
import time
from config import get_recognition_config

class FaceProcessor:
    def __init__(self):
        # Load configuration
        self.config = get_recognition_config()
        
        # Load OpenCV face cascade
        self.face_cascade = self._load_cascade('haarcascade_frontalface_default.xml')
        self.faces_dir = os.path.join(os.path.dirname(__file__), 'static', 'faces')
        os.makedirs(self.faces_dir, exist_ok=True)
        # ONNX model via OpenCV DNN
        self.embedding_net = self._load_embedding_model()
        self.embedding_input_size = (112, 112)
        
        # Simple cache for processed faces
        self.face_embeddings_cache = {}
        
        # Detection settings - use configured values
        self.detection_scale_factor = 1.1
        self.detection_min_neighbors = 5
        self.detection_min_size = (self.config['min_face_size'], self.config['min_face_size'])
        
        # Recognition thresholds from configuration
        self.similarity_threshold = self.config['similarity_threshold']
        self.min_sharpness = self.config['min_sharpness']
        self.min_brightness = self.config['min_brightness']
        self.max_brightness = self.config['max_brightness']
        self.use_preprocessing = self.config['use_preprocessing']
    
    def _load_cascade(self, cascade_name):
        """Load cascade classifier with multiple fallback paths"""
        try:
            # Primary method - use cv2.data.haarcascades
            cascade_path = cv2.data.haarcascades + cascade_name  # type: ignore
            cascade = cv2.CascadeClassifier(cascade_path)
            if not cascade.empty():
                return cascade
        except AttributeError:
            pass
        
        # Fallback methods
        fallback_paths = [
            # Standard OpenCV installation paths
            cascade_name,
            f'/usr/share/opencv4/haarcascades/{cascade_name}',
            f'/usr/local/share/opencv4/haarcascades/{cascade_name}',
            # Windows paths
            f'C:/opencv/build/etc/haarcascades/{cascade_name}',
            # Python package paths
            f'{cv2.__file__.replace("__init__.py", "")}data/haarcascades/{cascade_name}'
        ]
        
        for path in fallback_paths:
            try:
                cascade = cv2.CascadeClassifier(path)
                if not cascade.empty():
                    return cascade
            except Exception:
                continue
        
        # If all else fails, create empty classifier and warn
        print(f"Warning: Could not load {cascade_name}. Face detection may not work properly.")
        return cv2.CascadeClassifier()
        
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

    def _load_embedding_model(self):
        """Attempt to load an ONNX face embedding model using OpenCV DNN."""
        try:
            models_dir = os.path.join(os.path.dirname(__file__), 'models')
            for name in ['face_embedding.onnx', 'arcface_r100.onnx', 'mobilefacenet.onnx']:
                path = os.path.join(models_dir, name)
                if os.path.exists(path):
                    net = cv2.dnn.readNetFromONNX(path)
                    return net
        except Exception:
            pass
        return None
    
    def preprocess_face(self, face_image):
        """
        Apply preprocessing to normalize face image
        - Histogram equalization for lighting normalization
        - Gaussian blur for noise reduction
        - Resize to standard dimensions
        """
        try:
            # Convert to grayscale if needed
            if len(face_image.shape) == 3:
                gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_image
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            normalized = clahe.apply(gray)
            
            # Slight Gaussian blur to reduce noise
            denoised = cv2.GaussianBlur(normalized, (3, 3), 0)
            
            return denoised
        except Exception as e:
            # If preprocessing fails, return original image
            if len(face_image.shape) == 3:
                return cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            return face_image
    
    def detect_faces(self, image):
        """Detect faces in image using OpenCV with basic caching"""
        if image is None or image.size == 0:
            return []
            
        # Generate a simple hash of the image for caching
        image_hash = hash(image.tobytes())
        
        # Check if we have this image in cache
        if image_hash in self.face_embeddings_cache and 'faces' in self.face_embeddings_cache[image_hash]:
            return self.face_embeddings_cache[image_hash]['faces']
        
        # Detect faces with OpenCV
        faces = self._detect_faces_with_opencv(image)
            
        # Basic cache implementation
        self.face_embeddings_cache[image_hash] = {
            'faces': faces,
            'timestamp': time.time()
        }
        
        # Keep cache size manageable (simple approach)
        if len(self.face_embeddings_cache) > 50:  # Reduced cache size
            self.face_embeddings_cache.clear()
        
        return faces
    
    def _detect_faces_with_face_recognition(self, image):
        """Detect faces using face_recognition library"""
        if not face_recognition:
            return self._detect_faces_with_opencv(image)
            
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
        """Detect faces using OpenCV"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=self.detection_scale_factor,
            minNeighbors=self.detection_min_neighbors,
            minSize=self.detection_min_size,
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        detected_faces = []
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            detected_faces.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
                'confidence': 0.85,  # OpenCV cascade detector doesn't provide confidence, use default
                'face_image': face_roi
            })
        
        return detected_faces
    
    def extract_face_features(self, face_image):
        """Extract features from face image using ONNX or OpenCV with preprocessing"""
        # Apply preprocessing to normalize face image
        preprocessed = self.preprocess_face(face_image)
        
        # Prefer ONNX embedding model if available
        if self.embedding_net is not None:
            return self._extract_features_with_onnx(preprocessed)
        else:
            return self._extract_features_with_opencv(preprocessed)

    def _extract_features_with_onnx(self, face_image):
        """Extract face embeddings using an ONNX model via OpenCV DNN."""
        try:
            if face_image is None or face_image.size == 0:
                return self._extract_features_with_opencv(face_image)
                
            # Generate a hash for the face image for caching
            face_hash = hash(face_image.tobytes())
            
            # Check if we have this face embedding in cache
            if face_hash in self.face_embeddings_cache and 'embedding' in self.face_embeddings_cache[face_hash]:
                return self.face_embeddings_cache[face_hash]['embedding']
                
            # Ensure grayscale to RGB and resize to model input
            if len(face_image.shape) == 2:
                rgb = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB)
            else:
                rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            rgb = cv2.resize(rgb, self.embedding_input_size)
            blob = cv2.dnn.blobFromImage(rgb, scalefactor=1/255.0, size=self.embedding_input_size)
            self.embedding_net.setInput(blob)
            emb = self.embedding_net.forward()
            emb = emb.reshape(-1)
            result = emb.astype(np.float32).tolist()
            
            # Cache the embedding
            self.face_embeddings_cache[face_hash] = {
                'embedding': result,
                'timestamp': time.time()
            }
            
            return result
        except Exception:
            return self._extract_features_with_opencv(face_image)
    

    
    def _extract_features_with_opencv(self, face_image):
        """Extract enhanced features from face image for recognition (fallback method)"""
        try:
            # Resize face to standard size
            face_resized = cv2.resize(face_image, (100, 100))
            
            # Apply histogram equalization for better feature extraction
            face_eq = cv2.equalizeHist(face_resized)
            
            # Extract LBP (Local Binary Pattern) features with 512 bins
            lbp_features = self._extract_lbp_features(face_eq)
            
            # Extract multi-scale HOG (Histogram of Oriented Gradients) features
            hog_features = self._extract_hog_features(face_eq)
            
            # Weighted feature fusion (0.6 LBP + 0.4 HOG)
            # Normalize each feature type first
            lbp_normalized = lbp_features / (np.linalg.norm(lbp_features) + 1e-6)
            hog_normalized = hog_features / (np.linalg.norm(hog_features) + 1e-6)
            
            # Apply weights and combine
            lbp_weighted = lbp_normalized * 0.6
            hog_weighted = hog_normalized * 0.4
            
            features = np.concatenate([lbp_weighted, hog_weighted])
            
            return features.tolist()
        
        except Exception as e:
            raise ValueError(f"Failed to extract features: {str(e)}")    
    def _extract_lbp_features(self, image):
        """Extract Local Binary Pattern features with increased bins (512)"""
        height, width = image.shape
        lbp_image = np.zeros((height, width), dtype=np.uint16)  # Use uint16 for more bins
        
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
        
        # Create histogram of LBP patterns with 512 bins for better discrimination
        hist, _ = np.histogram(lbp_image.ravel(), bins=512, range=(0, 512))
        hist = hist.astype(np.float32)
        hist = hist / (hist.sum() + 1e-6)  # Normalize
        
        return hist
    
    def _extract_hog_features(self, image):
        """Extract multi-scale Histogram of Oriented Gradients features"""
        # Calculate gradients
        grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate magnitude and orientation
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        orientation = np.arctan2(grad_y, grad_x) * 180 / np.pi
        orientation[orientation < 0] += 180
        
        height, width = image.shape
        num_bins = 9
        
        # Multi-scale HOG: 8x8 and 16x16 cells
        all_hog_features = []
        
        for cell_size in [8, 16]:
            if height < cell_size or width < cell_size:
                # Return zero features for very small images
                all_hog_features.extend(np.zeros(32, dtype=np.float32))
                continue
            
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
            
            # Limit feature vector size per scale
            all_hog_features.extend(hog_features[:32])
        
        return np.array(all_hog_features, dtype=np.float32)
    
    def compare_faces(self, features1, features2):
        """Compare two face feature vectors using enhanced similarity metrics"""
        return self._compare_opencv_features(features1, features2)
    
    def _cosine_similarity(self, features1, features2):
        """Calculate cosine similarity between two feature vectors"""
        try:
            # Calculate cosine similarity
            dot_product = np.dot(features1, features2)
            norm1 = np.linalg.norm(features1)
            norm2 = np.linalg.norm(features2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception:
            return 0.0
    
    def _euclidean_distance(self, features1, features2):
        """Calculate euclidean distance between two feature vectors"""
        try:
            distance = np.linalg.norm(features1 - features2)
            return float(distance)
        except Exception:
            return float('inf')
    
    def _compare_opencv_features(self, features1, features2):
        """Compare feature vectors using weighted combination of cosine similarity and euclidean distance"""
        try:
            features1 = np.array(features1)
            features2 = np.array(features2)
            
            # Ensure same length
            min_len = min(len(features1), len(features2))
            features1 = features1[:min_len]
            features2 = features2[:min_len]
            
            # Calculate cosine similarity (primary metric)
            cosine_sim = self._cosine_similarity(features1, features2)
            
            # Calculate euclidean distance (secondary metric)
            euclidean_dist = self._euclidean_distance(features1, features2)
            # Convert distance to similarity score (inverse relationship)
            euclidean_sim = 1.0 / (1.0 + euclidean_dist)
            
            # Weighted combination (0.7 cosine + 0.3 euclidean)
            similarity = 0.7 * cosine_sim + 0.3 * euclidean_sim
            
            return float(similarity)
        
        except Exception as e:
            return 0.0
    
    def save_face_image(self, face_image, filename):
        """Save face image to disk"""
        try:
            filepath = os.path.join(self.faces_dir, filename)
            cv2.imwrite(filepath, face_image)
            return filepath
        except Exception as e:
            raise ValueError(f"Failed to save image: {str(e)}")

    def assess_face_quality(self, face_image):
        """Compute simple quality metrics (sharpness and brightness)."""
        try:
            gray = face_image if len(face_image.shape) == 2 else cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            # Sharpness via Laplacian variance
            lap = cv2.Laplacian(gray, cv2.CV_64F)
            sharpness = float(lap.var())
            # Brightness via mean intensity
            brightness = float(np.mean(gray))
            return {
                'sharpness': sharpness,
                'brightness': brightness
            }
        except Exception:
            return {
                'sharpness': 0.0,
                'brightness': 0.0
            }
    
    def is_face_quality_acceptable(self, face_image):
        """
        Check if face quality meets configured thresholds.
        
        Args:
            face_image: Face image to assess
            
        Returns:
            tuple: (is_acceptable: bool, quality_metrics: dict)
        """
        quality = self.assess_face_quality(face_image)
        
        is_acceptable = (
            quality['sharpness'] >= self.min_sharpness and
            self.min_brightness <= quality['brightness'] <= self.max_brightness
        )
        
        return is_acceptable, quality
            
    def clear_cache(self, max_age_seconds=3600):
        """Clear old entries from the cache"""
        import time
        current_time = time.time()
        keys_to_remove = []
        
        for key, value in self.face_embeddings_cache.items():
            if current_time - value['timestamp'] > max_age_seconds:
                keys_to_remove.append(key)
                
        for key in keys_to_remove:
            del self.face_embeddings_cache[key]
            
        return len(keys_to_remove)
        
    def get_cache_stats(self):
        """Return cache statistics"""
        return {
            'cache_size': len(self.face_embeddings_cache)
        }
        
    def clear_cache(self, max_age_seconds=None):
        """Clear the cache"""
        self.face_embeddings_cache.clear()