# 👤 ClearSight - Employee Attendance System

A modern facial recognition attendance system built with React and Flask. Register employees, recognize faces in real-time, and track attendance with an intuitive dashboard.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-000000.svg)

---

## ✨ Features

- **Employee Registration** - Capture photos and store employee details
- **Live Face Recognition** - Real-time recognition with confidence scoring
- **Attendance Dashboard** - View users, logs, and statistics
- **Data Export** - Export attendance logs to CSV
- **Mobile Responsive** - Works on all devices

---

## 🛠️ Tech Stack

**Backend:** Flask, OpenCV, ONNX Runtime, MySQL  
**Frontend:** React 18, Axios, React Webcam  
**AI/ML:** OpenCV Haar Cascades, 512-dim face embeddings, cosine similarity

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

---

## 📖 Usage

1. **Register** - Capture employee photo and fill in details
2. **Recognize** - Click button to recognize registered faces
3. **Dashboard** - View users, logs, and export data

---

## ⚙️ Configuration

**Backend** (`backend/.env`):
```env
MYSQL_HOST=your_host
MYSQL_PORT=3306
MYSQL_DATABASE=your_db
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
CONFIDENCE_THRESHOLD=0.65
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
ClearSight/
├── backend/
│   ├── app.py              # Flask API
│   ├── face_processor.py   # Face recognition
│   ├── database.py         # Database ops
│   └── models/             # ONNX model
└── frontend/
    └── src/
        ├── components/     # React components
        └── services/       # API integration
```

---

## 👤 Author

**Yashraj Sharma**

- GitHub: [@yashrajsharmaaaa](https://github.com/yashrajsharmaaaa)
- LinkedIn: [yashrajsharmaaaa](https://www.linkedin.com/in/yashrajsharmaaaa/)
- Email: yashrajsharma413@gmail.com

---

**⭐ Star this repo if you find it useful!**

