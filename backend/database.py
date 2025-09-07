import sqlite3
import json
import base64
from datetime import datetime
import os

DATABASE_PATH = 'clear_sight.db'

def init_database():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            face_features TEXT NOT NULL,
            image_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create recognition logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recognition_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            confidence REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def add_user(name, email, face_features, image_path=None):
    """Add a new user to the database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO users (name, email, face_features, image_path)
        VALUES (?, ?, ?, ?)
    ''', (name, email, json.dumps(face_features), image_path))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return user_id

def get_all_users():
    """Get all registered users"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, name, email, created_at FROM users
        ORDER BY created_at DESC
    ''')
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'created_at': row[3]
        })
    
    conn.close()
    return users

def get_user_by_id(user_id):
    """Get user by ID"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, name, email, face_features, image_path, created_at 
        FROM users WHERE id = ?
    ''', (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'face_features': json.loads(row[3]),
            'image_path': row[4],
            'created_at': row[5]
        }
    return None

def log_recognition(user_id, confidence):
    """Log a recognition event"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO recognition_logs (user_id, confidence)
        VALUES (?, ?)
    ''', (user_id, confidence))
    
    conn.commit()
    conn.close()

def get_recognition_logs(limit=50):
    """Get recent recognition logs with user information"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT u.name, u.email, r.confidence, r.timestamp
        FROM recognition_logs r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.timestamp DESC
        LIMIT ?
    ''', (limit,))
    
    logs = []
    for row in cursor.fetchall():
        logs.append({
            'user_name': row[0],
            'user_email': row[1],
            'confidence': row[2],
            'timestamp': row[3]
        })
    
    conn.close()
    return logs

def get_user_features():
    """Get all user face features for comparison"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, name, face_features FROM users
    ''')
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'name': row[1],
            'face_features': json.loads(row[2])
        })
    
    conn.close()
    return users

# Initialize database when module is imported
if __name__ == '__main__':
    init_database()
    print("Database initialized successfully!")