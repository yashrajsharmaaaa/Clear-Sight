"""
Simple face recognition using the face_recognition library.
This library does all the hard work for us - no manual feature extraction needed.
"""

import face_recognition
import numpy as np
from PIL import Image
import base64
import io
import os


class FaceProcessor:
    """
    Handles face detection and recognition.
    Uses the face_recognition library which is built on dlib.
    """
    
    def __init__(self):
        # Directory to save face images
        self.faces_dir = os.path.join(os.path.dirname(__file__), 'static', 'faces')
        os.makedirs(self.faces_dir, exist_ok=True)
    
    def decode_image(self, image_data):
        """
        Convert base64 image data to numpy array.
        
        Args:
            image_data: Base64 encoded image string (from webcam)
            
        Returns:
            numpy array: Image in RGB format
        """
        try:
            # Remove the "data:image/jpeg;base64," prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_data)
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB (face_recognition needs RGB)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            return np.array(image)
            
        except Exception as e:
            raise ValueError(f"Failed to decode image: {str(e)}")
    
    def detect_face(self, image):
        """
        Detect faces in an image.
        
        Args:
            image: numpy array (RGB image)
            
        Returns:
            tuple: (face_locations, face_encodings)
                   face_locations: list of (top, right, bottom, left) tuples
                   face_encodings: list of 128-number arrays (one per face)
        """
        # Find all faces in the image
        # This returns a list of bounding boxes: [(top, right, bottom, left), ...]
        face_locations = face_recognition.face_locations(image)
        
        # Get face encodings (128 numbers that represent each face)
        # This is the "fingerprint" of the face
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        return face_locations, face_encodings
    
    def compare_faces(self, known_encoding, unknown_encoding, tolerance=0.6):
        """
        Compare two face encodings to see if they match.
        
        Args:
            known_encoding: Face encoding from database (128 numbers)
            unknown_encoding: Face encoding from new photo (128 numbers)
            tolerance: How strict to be (lower = stricter). Default 0.6 is good.
            
        Returns:
            tuple: (is_match, distance)
                   is_match: True if faces match
                   distance: How different they are (lower = more similar)
        """
        # Calculate face distance (0 = identical, 1 = completely different)
        # This uses Euclidean distance between the 128-number vectors
        distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
        
        # Check if distance is below tolerance
        is_match = distance <= tolerance
        
        # Convert distance to confidence (0-1 scale, higher = more confident)
        # Formula: confidence = 1 - (distance / 1.0)
        confidence = max(0, 1 - distance)
        
        return is_match, confidence
    
    def save_face_image(self, image, filename):
        """
        Save face image to disk.
        
        Args:
            image: numpy array (RGB image)
            filename: Name to save file as
            
        Returns:
            str: Full path to saved image
        """
        try:
            filepath = os.path.join(self.faces_dir, filename)
            
            # Convert numpy array to PIL Image and save
            pil_image = Image.fromarray(image)
            pil_image.save(filepath)
            
            return filepath
            
        except Exception as e:
            raise ValueError(f"Failed to save image: {str(e)}")
    
    def assess_image_quality(self, image):
        """
        Basic image quality check.
        
        Args:
            image: numpy array (RGB image)
            
        Returns:
            dict: Quality metrics (brightness, size)
        """
        # Calculate average brightness (0-255)
        brightness = np.mean(image)
        
        # Get image dimensions
        height, width = image.shape[:2]
        
        return {
            'brightness': float(brightness),
            'width': width,
            'height': height,
            'is_too_dark': brightness < 50,
            'is_too_bright': brightness > 200,
            'is_too_small': width < 200 or height < 200
        }
