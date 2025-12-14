"""
Simple configuration management.
Loads settings from environment variables.
"""

import os
from pathlib import Path


def get_flask_config():
    """
    Get Flask configuration.
    
    Returns:
        dict: Flask config settings
    """
    is_production = os.environ.get('FLASK_ENV') != 'development'
    secret_key = os.environ.get('SECRET_KEY')
    
    # In production, SECRET_KEY is required
    if is_production and not secret_key:
        raise ValueError(
            "SECRET_KEY is required in production. "
            "Generate one with: python -c 'import secrets; print(secrets.token_hex(32))'"
        )
    
    # In development, generate a random key if not provided
    if not secret_key:
        import secrets
        secret_key = secrets.token_hex(32)
        print("⚠ WARNING: Using random SECRET_KEY for development")
    
    # Get database path (SQLite file)
    db_path = os.environ.get('DATABASE_PATH', 'clearsight.db')
    
    return {
        'SECRET_KEY': secret_key,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,  # Disable Flask-SQLAlchemy event system (saves memory)
        'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB max file upload
        'DEBUG': not is_production
    }


def get_cors_config():
    """
    Get CORS (Cross-Origin Resource Sharing) configuration.
    This allows the React frontend to talk to the Flask backend.
    
    Returns:
        dict: CORS settings
    """
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
    
    # Split comma-separated origins
    if cors_origins == '*':
        origins = ['*']
    else:
        origins = [origin.strip() for origin in cors_origins.split(',')]
    
    return {
        'origins': origins,
        'methods': ['GET', 'POST', 'DELETE'],
        'allow_headers': ['Content-Type']
    }


def get_recognition_config():
    """
    Get face recognition settings.
    
    Returns:
        dict: Recognition config
    """
    return {
        # How strict to be when matching faces (0.0-1.0)
        # Lower = stricter (fewer false positives, more false negatives)
        # Higher = more lenient (more false positives, fewer false negatives)
        # Default 0.6 is a good balance
        'tolerance': float(os.environ.get('FACE_TOLERANCE', '0.6')),
        
        # Minimum brightness for acceptable image (0-255)
        'min_brightness': float(os.environ.get('MIN_BRIGHTNESS', '50')),
        
        # Maximum brightness for acceptable image (0-255)
        'max_brightness': float(os.environ.get('MAX_BRIGHTNESS', '200'))
    }


def ensure_directories():
    """Create required directories if they don't exist."""
    # Create faces directory for storing images
    faces_dir = Path(__file__).parent / 'static' / 'faces'
    faces_dir.mkdir(parents=True, exist_ok=True)
