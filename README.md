# ClearSight - Facial Recognition System

A facial recognition web application built with React and Flask.

## Features
- Face detection and recognition
- User registration with photos
- Dashboard to view users and logs

## Tech Stack
- **Frontend**: React, Axios
- **Backend**: Python Flask, OpenCV
- **Database**: MySQL (production) / SQLite (legacy support)

## Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MySQL 8.0 or higher (see [MySQL Setup Guide](MYSQL_SETUP.md))

### Database Configuration

ClearSight uses MySQL for production deployments. For detailed MySQL installation and configuration instructions, see the **[MySQL Setup Guide](MYSQL_SETUP.md)**.

**Quick MySQL Setup:**

1. Install MySQL on your system (see [MYSQL_SETUP.md](MYSQL_SETUP.md) for platform-specific instructions)

2. Create database and user:
   ```sql
   CREATE DATABASE clearsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'clearsight_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON clearsight.* TO 'clearsight_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Configure environment variables in `backend/.env`:
   ```bash
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight
   MYSQL_USER=clearsight_user
   MYSQL_PASSWORD=your_secure_password
   MYSQL_POOL_SIZE=5
   ```

For complete setup instructions including cloud platform configurations (AWS RDS, Google Cloud SQL, Railway, PlanetScale), see [MYSQL_SETUP.md](MYSQL_SETUP.md).

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your MySQL credentials

# Initialize database schema
python database.py

# Start the application
python app.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build
```

Then open http://localhost:5000 (Flask serves the built React app)

## How It Works

1. **Face Detection**: Upload an image or use webcam to detect faces
2. **User Registration**: Register users by capturing their face and basic info  
3. **Face Recognition**: The system compares new faces against registered users
4. **Results Display**: Shows recognition results with confidence scores


## Key Learning Concepts

This project demonstrates:

- **Full-Stack Development**: Frontend and backend integration
- **Computer Vision**: Face detection and recognition using OpenCV
- **REST API Design**: Clean API endpoints with proper HTTP methods
- **Database Design**: SQLite database with relationships
- **React Development**: Component-based UI with hooks
- **Docker Containerization**: Multi-service container setup
- **File Handling**: Image upload and processing
- **Error Handling**: Proper error responses and validation


## Demo

1. Start the application
2. Navigate to the Registration page
3. Enter your name and capture/upload a photo
4. Go to Recognition page
5. Upload a photo to test recognition
6. View results and user dashboard

## Deployment

### Production Deployment with MySQL

ClearSight is designed for production deployment with MySQL database. The application supports various cloud platforms:

#### Supported Platforms

- **AWS RDS**: Managed MySQL with automatic backups and scaling
- **Google Cloud SQL**: Fully managed MySQL with high availability
- **Railway**: Simple deployment with built-in MySQL provisioning
- **PlanetScale**: Serverless MySQL with branching and scaling
- **Render**: Deploy with external MySQL provider

#### Environment Variables for Production

Ensure these variables are set in your production environment:

```bash
# MySQL Configuration (Required)
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_DATABASE=clearsight
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-secure-password

# Connection Pool Settings
MYSQL_POOL_SIZE=10
MYSQL_POOL_RECYCLE=3600

# Application Settings
SECRET_KEY=your-production-secret-key
CORS_ORIGINS=https://your-frontend-domain.com

# Optional Settings
MIN_SHARPNESS=30.0
MIN_BRIGHTNESS=60.0
MAX_BRIGHTNESS=200.0
```

#### Deployment Steps

1. **Set up MySQL database** on your chosen platform (see [MYSQL_SETUP.md](MYSQL_SETUP.md))
2. **Configure environment variables** in your deployment platform
3. **Deploy application code** to your hosting service
4. **Initialize database schema** by running `python database.py`
5. **Verify connection** and test application endpoints

For platform-specific deployment instructions, see:
- [MYSQL_SETUP.md](MYSQL_SETUP.md) - MySQL setup for all platforms
- [RENDER_CONFIG.md](RENDER_CONFIG.md) - Render-specific deployment guide

### Database Migration

If you're migrating from SQLite to MySQL, the application automatically handles schema creation. Simply:

1. Set up your MySQL database
2. Configure environment variables
3. Run `python database.py` to create tables
4. (Optional) Migrate existing data using a migration script

## Future Enhancements

- Real-time webcam recognition
- Multiple face detection in single image
- User authentication system
- REST API improvements
- Mobile responsive design
- Performance optimizations
- Advanced analytics dashboard
- Multi-region database replication

## What I Learned

Building this project taught me:

- **Computer Vision Integration**: Working with OpenCV and face recognition libraries
- **Full-Stack Architecture**: Designing scalable frontend and backend systems
- **API Development**: Creating RESTful APIs with proper error handling
- **Database Design**: Structuring relational data for face recognition
- **Database Migration**: Migrating from SQLite to MySQL for production scalability
- **Connection Pooling**: Implementing efficient database connection management
- **Cloud Database Integration**: Deploying with managed MySQL services (AWS RDS, Cloud SQL)
- **Docker Containerization**: Multi-service application deployment
- **React State Management**: Handling complex UI state and API interactions
- **File Upload Handling**: Secure image processing and storage
- **Production Deployment**: Environment-based configuration and cloud platform deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: (https://github.com/yashrajsharmaaaa)
- LinkedIn: (https://www.linkedin.com/in/yashrajsharmaaaa/)]
- Email: [yashrajsharma413@gmail.com]

