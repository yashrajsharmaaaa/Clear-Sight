# ClearSight - Smart Face Recognition System

> Automatic face recognition system

A modern web application that automatically recognizes faces using your webcam. Built with React and Flask, featuring real-time detection and enhanced accuracy through advanced image preprocessing.

---

## ✨ Key Features

- 🎥 **Automatic Recognition** - No button clicks needed, just look at the camera
- 🎯 **High Accuracy** - AI preprocessing adapts to different lighting conditions
- ⚙️ **Easy Configuration** - Tune settings for your specific needs
- 📊 **User Dashboard** - Track registrations and recognition logs
- 🚀 **Production Ready** - MySQL database with connection pooling

---

## 📖 How It Works

1. **Register Users** - Capture face photos and save user info
2. **Automatic Detection** - System monitors webcam continuously
3. **Smart Recognition** - AI preprocessing improves accuracy
4. **Instant Results** - See who's recognized automatically

### The Technology

- **Face Detection**: OpenCV Haar Cascades
- **Preprocessing**: CLAHE normalization + denoising
- **Feature Extraction**: 512-dimensional embeddings
- **Matching**: Cosine similarity + Euclidean distance

---

## 📁 Project Structure

```
ClearSight/
├── backend/
│   ├── app.py              # Flask application
│   ├── face_processor.py   # Face recognition logic
│   ├── database.py         # MySQL operations
│   └── config.py           # Configuration management
├── frontend/
│   └── src/
│       ├── components/     # React components
│       └── services/       # API integration
└── README.md
```


## 🎯 Use Cases

- **Office Access Control** - Automatic employee recognition
- **Attendance Systems** - Track who's present automatically
- **Smart Home** - Recognize family members
- **Event Check-in** - Fast, contactless registration
- **Security Systems** - Monitor and identify visitors

---

## 👤 Author

**Yashraj Sharma**

- GitHub: [@yashrajsharmaaaa](https://github.com/yashrajsharmaaaa)
- LinkedIn: [yashrajsharmaaaa](https://www.linkedin.com/in/yashrajsharmaaaa/)
- Email: yashrajsharma413@gmail.com

