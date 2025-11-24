# ClearSight - Facial Recognition System

A facial recognition web application built with React and Flask.

## Features
- Face detection and recognition
- User registration with photos
- Dashboard to view users and logs

## Tech Stack
- **Frontend**: React, Axios
- **Backend**: Python Flask, OpenCV, mysql-connector-python
- **Database**: MySQL (production-ready with connection pooling)

## Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MySQL 8.0 or higher

### Database Configuration

ClearSight uses MySQL for production deployments with connection pooling for optimal performance.

**MySQL Setup:**

1. **Install MySQL** on your system or use a cloud provider (Railway, PlanetScale, AWS RDS, Google Cloud SQL)

2. **Create database and user:**
   ```sql
   CREATE DATABASE clearsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'clearsight_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON clearsight.* TO 'clearsight_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Configure environment variables** in `backend/.env`:
   ```bash
   DATABASE_TYPE=mysql
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight
   MYSQL_USER=clearsight_user
   MYSQL_PASSWORD=your_secure_password
   MYSQL_POOL_SIZE=5
   ```

**Cloud MySQL Providers:**
- **Railway**: Built-in MySQL service with easy setup
- **PlanetScale**: Serverless MySQL with free tier
- **AWS RDS**: Enterprise-grade managed MySQL
- **Google Cloud SQL**: Fully managed MySQL with high availability

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
- **Database Design**: MySQL with connection pooling and relationships
- **Production Database**: MySQL migration with connection pool management
- **React Development**: Component-based UI with hooks
- **Cloud Deployment**: Multi-platform deployment (Render, Railway)
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

### Production Deployment

ClearSight is production-ready with MySQL database support and connection pooling.

#### Supported Platforms

- **Render**: Web service deployment (use Railway/PlanetScale for MySQL)
- **Railway**: Built-in MySQL database service
- **PlanetScale**: Serverless MySQL with free tier
- **AWS RDS**: Enterprise-grade managed MySQL
- **Google Cloud SQL**: Fully managed MySQL

#### Environment Variables for Production

```bash
# Database Configuration (Required)
DATABASE_TYPE=mysql
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_DATABASE=clearsight
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-secure-password

# Connection Pool Settings
MYSQL_POOL_SIZE=10

# Application Settings
SECRET_KEY=your-production-secret-key
CORS_ORIGINS=https://your-frontend-domain.com
```

#### Quick Deployment Steps

1. **Set up MySQL database** on Railway, PlanetScale, or your preferred provider
2. **Configure environment variables** in your deployment platform
3. **Deploy application** to Render or your hosting service
4. **Database schema** initializes automatically on first run
5. **Verify** application is running and connected to MySQL

#### Example: Render + Railway MySQL

1. Create MySQL database on Railway
2. Copy connection credentials from Railway dashboard
3. Create web service on Render
4. Add Railway MySQL credentials as environment variables on Render
5. Deploy and verify

## Future Enhancements

- Real-time webcam recognition
- Multiple face detection in single image
- User authentication system
- Mobile responsive design
- Advanced analytics dashboard
- Database read replicas for scaling
- Redis caching layer
- API rate limiting

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

