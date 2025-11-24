import sqlite3
import json
from datetime import datetime
import os
from contextlib import contextmanager

# Import configuration management
try:
    from config import get_database_path
    DATABASE_PATH = get_database_path()
except ImportError:
    # Fallback for when config module is not available
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'clear_sight.db')

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize the SQLite database with required tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create users table with index
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                employee_id VARCHAR(50),
                department VARCHAR(100),
                email VARCHAR(100),
                face_features TEXT NOT NULL,
                image_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create recognition logs table with index
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recognition_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                confidence REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON recognition_logs(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_user_id ON recognition_logs(user_id)')
        
        conn.commit()

        # Ensure columns exist on legacy DBs
        cursor.execute('PRAGMA table_info(users)')
        existing_cols = {row[1] for row in cursor.fetchall()}
        if 'employee_id' not in existing_cols:
            cursor.execute('ALTER TABLE users ADD COLUMN employee_id VARCHAR(50)')
        if 'department' not in existing_cols:
            cursor.execute('ALTER TABLE users ADD COLUMN department VARCHAR(100)')
        conn.commit()

def add_user(name, email, face_features, image_path=None, employee_id=None, department=None):
    """Add a new user to the database"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (name, employee_id, department, email, face_features, image_path)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, employee_id, department, email, json.dumps(face_features), image_path))
        
        user_id = cursor.lastrowid
        conn.commit()
        return user_id

def get_all_users():
    """Get all registered users"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, employee_id, department, email, created_at FROM users
            ORDER BY created_at DESC
        ''')
        
        return [{
            'id': row[0],
            'name': row[1],
            'employee_id': row[2],
            'department': row[3],
            'email': row[4],
            'created_at': row[5]
        } for row in cursor.fetchall()]

def get_user_by_id(user_id):
    """Get user by ID"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, employee_id, department, email, face_features, image_path, created_at 
            FROM users WHERE id = ?
        ''', (user_id,))
        
        row = cursor.fetchone()
        
        if row:
            return {
                'id': row[0],
                'name': row[1],
                'employee_id': row[2],
                'department': row[3],
                'email': row[4],
                'face_features': json.loads(row[5]),
                'image_path': row[6],
                'created_at': row[7]
            }
        return None

def log_recognition(user_id, confidence):
    """Log a recognition event"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO recognition_logs (user_id, confidence)
            VALUES (?, ?)
        ''', (user_id, confidence))
        conn.commit()

def get_recognition_logs(limit=50):
    """Get recent recognition logs with user information"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.name, u.email, r.confidence, r.timestamp
            FROM recognition_logs r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        return [{
            'user_name': row[0],
            'user_email': row[1],
            'confidence': row[2],
            'timestamp': row[3]
        } for row in cursor.fetchall()]

def get_user_features():
    """Get all user face features for comparison"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, face_features FROM users
        ''')
        
        return [{
            'id': row[0],
            'name': row[1],
            'face_features': json.loads(row[2])
        } for row in cursor.fetchall()]

# Initialize database when module is imported
if __name__ == '__main__':
    init_database()
    print("Database initialized successfully!")