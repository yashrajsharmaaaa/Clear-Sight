# 🔍 ClearSight - Facial Recognition System

A full-stack facial recognition web application built with React and Python Flask.

## Features

- **Face Detection** - Detect faces in images
- **User Registration** - Register users with facial data
- **Face Recognition** - Identify registered users
- **Dashboard** - View users and recognition history

## Tech Stack

**Backend**: Python, Flask, OpenCV, SQLite  
**Frontend**: React, Axios, React Webcam

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

**Access**: http://localhost:3000

## Project Structure
```
ClearSight/
├── backend/
│   ├── app.py              # Flask application
│   ├── database.py         # Database operations
│   ├── face_processor.py   # Face recognition logic
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   └── services/       # API communication
    └── package.json        # Node dependencies
```

## API Endpoints

- `POST /api/detect-face` - Detect faces in image
- `POST /api/register` - Register new user
- `POST /api/recognize` - Recognize face
- `GET /api/users` - Get all users
- `GET /api/logs` - Get recognition logs

## How It Works

1. **Face Detection**: Upload an image or use webcam to detect faces
2. **User Registration**: Register users by capturing their face and basic info  
3. **Face Recognition**: The system compares new faces against registered users
4. **Results Display**: Shows recognition results with confidence scores

## Deployment

Deploy your project for **FREE** using:

### Frontend → Vercel (Free)
```bash
# Push to GitHub first, then:
# 1. Connect to vercel.com
# 2. Import your repository
# 3. Set root directory: frontend
# 4. Deploy!
```

### Backend → Railway (Free)
```bash
# Push to GitHub first, then:
# 1. Connect to railway.app
# 2. Import your repository  
# 3. Set root directory: backend
# 4. Deploy!
```

📖 **Detailed guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

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

## Troubleshooting

### Common Issues

#### Face Recognition Installation
```
# Linux/Ubuntu
sudo apt-get install cmake build-essential

# macOS
brew install cmake

# Windows
# Install Visual Studio Build Tools

```

#### Docker Issues
```
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up

```


## Demo

1. Start the application
2. Navigate to the Registration page
3. Enter your name and capture/upload a photo
4. Go to Recognition page
5. Upload a photo to test recognition
6. View results and user dashboard

## Future Enhancements

- Real-time webcam recognition
- Multiple face detection in single image
- User authentication system
- REST API improvements
- Mobile responsive design
- Performance optimizations

## What I Learned

Building this project taught me:

- **Computer Vision Integration**: Working with OpenCV and face recognition libraries
- **Full-Stack Architecture**: Designing scalable frontend and backend systems
- **API Development**: Creating RESTful APIs with proper error handling
- **Database Design**: Structuring relational data for face recognition
- **Docker Containerization**: Multi-service application deployment
- **React State Management**: Handling complex UI state and API interactions
- **File Upload Handling**: Secure image processing and storage

## Contributing

Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests
- Ask questions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [Your GitHub Profile]
- LinkedIn: [Your LinkedIn Profile]
- Email: [Your Email]

---
**Built as a portfolio project to demonstrate full-stack development skills** 🚀
