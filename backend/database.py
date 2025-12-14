"""
Simple database setup using SQLAlchemy ORM.
No complex connection pooling - SQLAlchemy handles it automatically.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Create SQLAlchemy instance
# This will be initialized in app.py with app.config
db = SQLAlchemy()


class User(db.Model):
    """
    User model - stores employee information and face encoding.
    
    Face encoding is a 128-number list that represents the face.
    We store it as JSON text in the database.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    
    # Store face encoding as JSON text
    # face_recognition library gives us a list of 128 numbers
    face_encoding = db.Column(db.Text, nullable=False)
    
    image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship: one user has many recognition logs
    recognition_logs = db.relationship('RecognitionLog', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert user to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'employee_id': self.employee_id,
            'department': self.department,
            'email': self.email,
            'age': self.age,
            'gender': self.gender,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def get_face_encoding(self):
        """Get face encoding as a list of numbers."""
        if self.face_encoding:
            return json.loads(self.face_encoding)
        return None
    
    def set_face_encoding(self, encoding):
        """Save face encoding (list of numbers) as JSON text."""
        self.face_encoding = json.dumps(encoding.tolist())


class RecognitionLog(db.Model):
    """
    Recognition log - records when someone is recognized.
    Stores the confidence score (how sure we are it's them).
    """
    __tablename__ = 'recognition_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert log to dictionary for API responses."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'confidence': self.confidence,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


def init_database(app):
    """
    Initialize database with the Flask app.
    Creates all tables if they don't exist.
    """
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ Database initialized successfully")
