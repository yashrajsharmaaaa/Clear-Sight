import json
from datetime import datetime
import os
from contextlib import contextmanager
from queue import Queue, Empty
import threading
import mysql.connector
from mysql.connector import Error as MySQLError

# Import configuration management
from config import get_database_config


class MySQLConnectionPool:
    """
    Manages a pool of MySQL connections for efficient resource usage.
    Implements connection validation and automatic reconnection.
    """
    
    def __init__(self, config):
        """
        Initialize connection pool with configuration.
        
        Args:
            config (dict): MySQL configuration dictionary with keys:
                - host: MySQL server hostname
                - port: MySQL server port
                - database: Database name
                - user: Database username
                - password: Database password
                - pool_size: Maximum number of connections in pool (default: 5)
                - pool_recycle: Connection recycle time in seconds (default: 3600)
        
        Raises:
            MySQLError: If initial connection pool creation fails
        """
        self.config = {
            'host': config['host'],
            'port': config['port'],
            'database': config['database'],
            'user': config['user'],
            'password': config['password'],
            'autocommit': False,
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci',
        }
        self.pool_size = config.get('pool_size', 5)
        self.pool_recycle = config.get('pool_recycle', 3600)
        
        # Thread-safe queue for connection pool
        self.pool = Queue(maxsize=self.pool_size)
        self.lock = threading.Lock()
        self._closed = False
        
        # Initialize the pool with connections
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize the connection pool with new connections."""
        for _ in range(self.pool_size):
            try:
                conn = self._create_connection()
                self.pool.put(conn)
            except MySQLError as e:
                # If we can't create initial connections, raise error
                raise MySQLError(
                    f"Failed to initialize MySQL connection pool: {str(e)}"
                ) from e
    
    def _create_connection(self):
        """
        Create a new MySQL connection.
        
        Returns:
            mysql.connector.connection.MySQLConnection: New MySQL connection
            
        Raises:
            MySQLError: If connection creation fails
        """
        try:
            conn = mysql.connector.connect(**self.config)
            return conn
        except MySQLError as e:
            raise MySQLError(
                f"Failed to create MySQL connection to {self.config['host']}:"
                f"{self.config['port']}/{self.config['database']}: {str(e)}"
            ) from e
    
    def _validate_connection(self, conn):
        """
        Validate that a connection is still alive and reconnect if needed.
        
        Args:
            conn: MySQL connection to validate
            
        Returns:
            mysql.connector.connection.MySQLConnection: Valid connection (may be new)
        """
        try:
            # Ping the connection to check if it's alive
            conn.ping(reconnect=True, attempts=3, delay=1)
            return conn
        except MySQLError:
            # If ping fails, create a new connection
            try:
                conn.close()
            except:
                pass  # Ignore errors when closing dead connection
            return self._create_connection()
    
    @contextmanager
    def get_connection(self):
        """
        Context manager to retrieve a connection from the pool.
        
        Yields:
            mysql.connector.connection.MySQLConnection: Database connection
            
        Raises:
            RuntimeError: If pool is closed
            MySQLError: If connection cannot be obtained or validated
            
        Example:
            with pool.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users")
                results = cursor.fetchall()
        """
        if self._closed:
            raise RuntimeError("Connection pool is closed")
        
        conn = None
        try:
            # Get connection from pool (block if none available)
            conn = self.pool.get(timeout=30)
            
            # Validate and potentially reconnect
            conn = self._validate_connection(conn)
            
            yield conn
            
            # Commit any pending transactions
            if conn.in_transaction:
                conn.commit()
                
        except Empty:
            raise MySQLError(
                "Timeout waiting for connection from pool. "
                "Pool may be exhausted or connections are not being returned."
            )
        except Exception as e:
            # Rollback on error
            if conn and conn.is_connected():
                try:
                    conn.rollback()
                except:
                    pass
            raise
        finally:
            # Always return connection to pool
            if conn:
                try:
                    # Ensure connection is in a clean state
                    if conn.is_connected():
                        if conn.in_transaction:
                            conn.rollback()
                        self.pool.put(conn)
                    else:
                        # Connection is dead, create a new one
                        new_conn = self._create_connection()
                        self.pool.put(new_conn)
                except Exception as e:
                    # If we can't return to pool, try to create a new connection
                    try:
                        new_conn = self._create_connection()
                        self.pool.put(new_conn)
                    except:
                        pass  # Pool will be one connection short
    
    def close_all(self):
        """
        Close all connections in the pool and mark pool as closed.
        Should be called during application shutdown.
        """
        with self.lock:
            if self._closed:
                return
            
            self._closed = True
            
            # Close all connections in the pool
            while not self.pool.empty():
                try:
                    conn = self.pool.get_nowait()
                    if conn and conn.is_connected():
                        conn.close()
                except Empty:
                    break
                except Exception:
                    pass  # Ignore errors during cleanup


# Global connection pool instance (initialized when needed)
_mysql_pool = None
_pool_lock = threading.Lock()


def _get_mysql_pool():
    """
    Get or create the global MySQL connection pool.
    
    Returns:
        MySQLConnectionPool: Global connection pool instance
    """
    global _mysql_pool
    
    if _mysql_pool is None:
        with _pool_lock:
            # Double-check locking pattern
            if _mysql_pool is None:
                config = get_database_config()
                _mysql_pool = MySQLConnectionPool(config)
    
    return _mysql_pool


@contextmanager
def get_db_connection():
    """
    Context manager for MySQL database connections.
    Returns a connection from the connection pool.
    
    Yields:
        mysql.connector.connection.MySQLConnection: MySQL database connection
        
    Raises:
        ValueError: If database configuration is invalid
        MySQLError: If MySQL connection fails
        
    Example:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            results = cursor.fetchall()
    """
    try:
        pool = _get_mysql_pool()
        with pool.get_connection() as conn:
            yield conn
            
    except ValueError as e:
        # Configuration or validation errors
        raise ValueError(f"Database configuration error: {str(e)}") from e
    except MySQLError as e:
        # MySQL-specific errors
        raise MySQLError(
            f"MySQL connection error: {str(e)}. "
            f"Please check your MySQL configuration and ensure the server is running."
        ) from e
    except Exception as e:
        # Catch-all for unexpected errors
        raise RuntimeError(f"Unexpected database connection error: {str(e)}") from e

def init_database():
    """
    Initialize the MySQL database with required tables.
    
    Creates the following tables if they don't exist:
    - users: Stores user information and face features
    - recognition_logs: Stores face recognition events
    
    Raises:
        MySQLError: If schema creation fails with details about the error
        RuntimeError: If an unexpected error occurs during initialization
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Create users table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        employee_id VARCHAR(50),
                        department VARCHAR(100),
                        email VARCHAR(100),
                        face_features TEXT NOT NULL,
                        image_path VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_users_name (name),
                        INDEX idx_users_employee_id (employee_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ''')
                
            except MySQLError as e:
                raise MySQLError(
                    f"Failed to create 'users' table: {str(e)}. "
                    f"Please check database permissions and MySQL server status."
                ) from e
            
            try:
                # Create recognition logs table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS recognition_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT,
                        confidence DECIMAL(5,4),
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        INDEX idx_logs_timestamp (timestamp),
                        INDEX idx_logs_user_id (user_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ''')
                
            except MySQLError as e:
                raise MySQLError(
                    f"Failed to create 'recognition_logs' table: {str(e)}. "
                    f"Please ensure the 'users' table was created successfully and "
                    f"that foreign key constraints are supported (InnoDB engine)."
                ) from e
            
            conn.commit()
            
    except MySQLError:
        # Re-raise MySQL errors with context already added
        raise
    except Exception as e:
        # Catch any unexpected errors
        raise RuntimeError(
            f"Unexpected error during database initialization: {str(e)}. "
            f"Please check your database configuration and server status."
        ) from e

def add_user(name, email, face_features, image_path=None, employee_id=None, department=None):
    """Add a new user to the database"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (name, employee_id, department, email, face_features, image_path)
            VALUES (%s, %s, %s, %s, %s, %s)
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
            FROM users WHERE id = %s
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
            VALUES (%s, %s)
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
            LIMIT %s
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