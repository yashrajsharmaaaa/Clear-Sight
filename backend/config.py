"""
Configuration for Clear Sight Deployment - MySQL Only
"""

import os
from pathlib import Path


def get_mysql_connection_string():
    """
    Constructs MySQL connection string from environment variables.
    
    Returns:
        str: MySQL connection string
        
    Raises:
        ValueError: If required MySQL environment variables are missing
    """
    # Required MySQL variables
    required_vars = {
        'MYSQL_HOST': os.environ.get('MYSQL_HOST'),
        'MYSQL_DATABASE': os.environ.get('MYSQL_DATABASE'),
        'MYSQL_USER': os.environ.get('MYSQL_USER'),
        'MYSQL_PASSWORD': os.environ.get('MYSQL_PASSWORD'),
    }
    
    # Check for missing required variables
    missing_vars = [key for key, value in required_vars.items() if not value]
    if missing_vars:
        raise ValueError(
            f"Missing required MySQL environment variables: {', '.join(missing_vars)}. "
            f"Please set these variables for MySQL connection"
        )
    
    # Optional variables with defaults
    port = os.environ.get('MYSQL_PORT', '3306')
    
    return f"mysql://{required_vars['MYSQL_USER']}:{required_vars['MYSQL_PASSWORD']}@{required_vars['MYSQL_HOST']}:{port}/{required_vars['MYSQL_DATABASE']}"


def get_database_config():
    """
    Returns MySQL database configuration from environment variables.
    
    Returns:
        dict: Configuration dictionary with keys:
            - host: MySQL server hostname
            - port: MySQL server port
            - database: Database name
            - user: Database username
            - password: Database password
            - pool_size: Connection pool size
            - pool_recycle: Connection recycle time in seconds
            
    Raises:
        ValueError: If required variables are missing
    """
    # Validate required MySQL variables
    required_vars = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        raise ValueError(
            f"Missing required MySQL environment variables: {', '.join(missing_vars)}. "
            f"Please set these variables for MySQL connection"
        )
    
    return {
        'host': os.environ.get('MYSQL_HOST'),
        'port': int(os.environ.get('MYSQL_PORT', '3306')),
        'database': os.environ.get('MYSQL_DATABASE'),
        'user': os.environ.get('MYSQL_USER'),
        'password': os.environ.get('MYSQL_PASSWORD'),
        'pool_size': int(os.environ.get('MYSQL_POOL_SIZE', '5')),
        'pool_recycle': int(os.environ.get('MYSQL_POOL_RECYCLE', '3600'))
    }


def get_upload_path():
    """Get upload path"""
    return os.environ.get('UPLOAD_PATH', str(Path(__file__).parent / 'static' / 'faces'))


def get_cors_origins():
    """Get CORS origins"""
    cors_env = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
    if cors_env == '*':
        return ['*']
    return [origin.strip() for origin in cors_env.split(',') if origin.strip()]


def ensure_directories():
    """Create required directories"""
    upload_path = Path(get_upload_path())
    upload_path.mkdir(parents=True, exist_ok=True)


def get_flask_config():
    """Get Flask configuration"""
    return {
        'DEBUG': os.environ.get('FLASK_ENV') == 'development',
        'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB
        'SECRET_KEY': os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production'),
    }


def get_cors_config():
    """Get CORS configuration"""
    return {
        'origins': get_cors_origins(),
        'supports_credentials': False,
    }


def get_recognition_config():
    """
    Get face recognition configuration parameters from environment variables.
    
    Returns:
        dict: Configuration dictionary with keys:
            - similarity_threshold: Minimum similarity score for face match (0.0-1.0)
            - min_face_size: Minimum face size in pixels for detection
            - max_face_size: Maximum face size in pixels for detection
            - feature_dimension: Dimension of feature vectors
            - use_preprocessing: Whether to apply preprocessing to faces
            - min_sharpness: Minimum sharpness threshold for quality assessment
            - min_brightness: Minimum brightness threshold for quality assessment
            - max_brightness: Maximum brightness threshold for quality assessment
    """
    return {
        'similarity_threshold': float(os.environ.get('SIMILARITY_THRESHOLD', '0.65')),
        'min_face_size': int(os.environ.get('MIN_FACE_SIZE', '80')),
        'max_face_size': int(os.environ.get('MAX_FACE_SIZE', '400')),
        'feature_dimension': int(os.environ.get('FEATURE_DIMENSION', '512')),
        'use_preprocessing': os.environ.get('USE_PREPROCESSING', 'true').lower() == 'true',
        'min_sharpness': float(os.environ.get('MIN_SHARPNESS', '40.0')),
        'min_brightness': float(os.environ.get('MIN_BRIGHTNESS', '70.0')),
        'max_brightness': float(os.environ.get('MAX_BRIGHTNESS', '190.0')),
    }