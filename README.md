# ClearSight - Face Recognition Attendance System

A simple employee attendance system using face recognition.

## 🎯 Features

- **Employee Registration**: Capture employee photo and details
- **Face Recognition**: Automatic attendance tracking via face recognition
- **Dashboard**: View employees, attendance logs, and statistics
- **Export**: Download attendance logs as CSV

## 🛠️ Tech Stack

**Backend:**
- Flask (Python web framework)
- SQLAlchemy (Database ORM)
- face_recognition library (Face detection & recognition)
- SQLite (Database)

**Frontend:**
- React 18
- Axios (API calls)
- react-webcam (Camera access)

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- Webcam

## 🚀 Quick Start

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Generate SECRET_KEY and add to .env
python -c "import secrets; print(secrets.token_hex(32))"

# Run the server
python app.py
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env .env.local      # Windows
cp .env .env.local        # Mac/Linux

# Start development server
npm start
```

Frontend runs on: `http://localhost:3000`

## 📖 How It Works

### 1. Registration
1. Employee enters their details (name, employee ID, department, etc.)
2. System captures their photo via webcam
3. `face_recognition` library detects the face and creates a 128-number "encoding"
4. Encoding is saved to database along with employee details

### 2. Recognition
1. System captures photo via webcam
2. Detects face and creates encoding
3. Compares encoding with all registered employees
4. If match found (within tolerance threshold), logs attendance

### 3. Face Encoding
- Each face is converted to a 128-number list (like a fingerprint)
- Comparing two encodings tells us if they're the same person
- Uses Euclidean distance: closer numbers = same person

## 🔧 Configuration

Edit `backend/.env`:

```env
# How strict face matching is (0.0-1.0)
# Lower = stricter (fewer false matches)
# Higher = more lenient (more false rejections)
FACE_TOLERANCE=0.6

# Image quality thresholds
MIN_BRIGHTNESS=50   # Reject if too dark
MAX_BRIGHTNESS=200  # Reject if too bright
```

## 📁 Project Structure

```
ClearSight/
├── backend/
│   ├── app.py              # Main Flask app
│   ├── database.py         # SQLAlchemy models
│   ├── face_processor.py   # Face recognition logic
│   ├── config.py           # Configuration
│   ├── validators.py       # Input validation
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── components/    # React components
│   │   └── services/      # API service
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend config
│
└── README.md
```

## 🐛 Troubleshooting

### "No module named 'face_recognition'"
```bash
# Install dlib first (face_recognition dependency)
pip install dlib
pip install face_recognition
```

### "Camera not accessible"
- Check browser permissions (allow camera access)
- Ensure no other app is using the camera
- Try a different browser (Chrome recommended)

### "No face detected"
- Ensure good lighting
- Face the camera directly
- Move closer to camera
- Remove glasses/hat if possible

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new employee |
| POST | `/api/recognize` | Recognize face |
| GET | `/api/users` | Get all employees |
| GET | `/api/user/<id>` | Get specific employee |
| DELETE | `/api/user/<id>` | Delete employee |
| GET | `/api/logs` | Get recognition logs |
| GET | `/api/stats` | Get statistics |
| GET | `/api/export/logs` | Export logs as CSV |

## 🎓 Learning Resources

- [face_recognition library docs](https://github.com/ageitgey/face_recognition)
- [Flask documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM tutorial](https://docs.sqlalchemy.org/en/14/orm/tutorial.html)
- [React documentation](https://react.dev/)

## 📄 License

MIT License - feel free to use for learning and projects!

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## ⚠️ Important Notes

- This is a **learning project** - not production-ready
- Face recognition accuracy depends on lighting and camera quality
- SQLite is used for simplicity - use PostgreSQL/MySQL for production
- No authentication/authorization implemented
- Store face encodings securely in production
