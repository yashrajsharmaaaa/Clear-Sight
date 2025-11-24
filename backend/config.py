"""
Simple Configuration for Clear Sight Deployment
"""

import os
from pathlib import Path


def get_database_path():
    """Get database path"""
    return os.environ.get('DATABASE_PATH', str(Path(__file__).parent / 'clear_sight.db'))


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
    
    db_path = Path(get_database_path())
    db_path.parent.mkdir(parents=True, exist_ok=True)


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