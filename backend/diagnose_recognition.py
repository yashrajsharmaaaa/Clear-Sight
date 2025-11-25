"""
Diagnostic script to troubleshoot face recognition issues
Run this to check your configuration and test face matching
"""

import os
from dotenv import load_dotenv
from database import get_user_features
from face_processor import FaceProcessor
from config import get_recognition_config

# Load environment variables
load_dotenv()

def diagnose():
    print("=" * 60)
    print("FACE RECOGNITION DIAGNOSTIC TOOL")
    print("=" * 60)
    print()
    
    # Check configuration
    print("1. CONFIGURATION CHECK")
    print("-" * 60)
    config = get_recognition_config()
    print(f"✓ Similarity Threshold: {config['similarity_threshold']}")
    print(f"✓ Min Sharpness: {config['min_sharpness']}")
    print(f"✓ Min Brightness: {config['min_brightness']}")
    print(f"✓ Max Brightness: {config['max_brightness']}")
    print(f"✓ Use Preprocessing: {config['use_preprocessing']}")
    print(f"✓ Feature Dimension: {config['feature_dimension']}")
    print()
    
    # Check registered users
    print("2. REGISTERED USERS CHECK")
    print("-" * 60)
    try:
        users = get_user_features()
        print(f"✓ Total registered users: {len(users)}")
        for user in users:
            print(f"  - {user['name']} (ID: {user['id']})")
            features = user['face_features']
            print(f"    Feature vector length: {len(features)}")
            print(f"    Feature range: [{min(features):.2f}, {max(features):.2f}]")
        print()
    except Exception as e:
        print(f"✗ Error loading users: {e}")
        print()
        return
    
    # Check face processor
    print("3. FACE PROCESSOR CHECK")
    print("-" * 60)
    try:
        processor = FaceProcessor()
        print(f"✓ Face processor initialized")
        print(f"✓ Using preprocessing: {processor.use_preprocessing}")
        print(f"✓ Similarity threshold: {processor.similarity_threshold}")
        print()
    except Exception as e:
        print(f"✗ Error initializing face processor: {e}")
        print()
        return
    
    # Recommendations
    print("4. RECOMMENDATIONS")
    print("-" * 60)
    
    if config['similarity_threshold'] > 0.65:
        print("⚠ Similarity threshold is high (> 0.65)")
        print("  Consider lowering to 0.55-0.60 for better recognition")
        print()
    
    if config['min_sharpness'] > 35:
        print("⚠ Sharpness threshold is high (> 35)")
        print("  Consider lowering to 30.0 if images are being rejected")
        print()
    
    if len(users) == 0:
        print("⚠ No users registered!")
        print("  Register yourself first in the Registration page")
        print()
    elif len(users) == 1:
        print("✓ One user registered - good for testing")
        print()
    
    print("5. TROUBLESHOOTING TIPS")
    print("-" * 60)
    print("If recognition is not working:")
    print()
    print("A. Check Image Quality:")
    print("   - Ensure good lighting (not too dark or bright)")
    print("   - Face should be clearly visible")
    print("   - Look directly at camera")
    print("   - Remove glasses if possible")
    print()
    print("B. Adjust Thresholds (in .env file):")
    print("   SIMILARITY_THRESHOLD=0.55  # Lower = more lenient")
    print("   MIN_SHARPNESS=30.0         # Lower = accept blurrier images")
    print("   MIN_BRIGHTNESS=50.0        # Lower = accept darker images")
    print("   MAX_BRIGHTNESS=220.0       # Higher = accept brighter images")
    print()
    print("C. Re-register Your Face:")
    print("   - Delete existing registration")
    print("   - Register again with good lighting")
    print("   - Use similar lighting conditions for recognition")
    print()
    print("D. Check Browser Console:")
    print("   - Open Developer Tools (F12)")
    print("   - Look for errors in Console tab")
    print("   - Check Network tab for API responses")
    print()
    print("E. Check Backend Logs:")
    print("   - Look for similarity scores in terminal")
    print("   - Check if face detection is working")
    print("   - Verify feature extraction is successful")
    print()
    
    print("=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    diagnose()
