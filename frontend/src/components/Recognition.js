import React, { useState, useRef, Suspense } from 'react';
const Webcam = React.lazy(() => import('react-webcam'));
import apiService from '../services/api';

const Recognition = () => {
  const webcamRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);

  // Simple video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  // Manual recognition function
  const handleRecognize = async () => {
    if (!webcamRef.current) {
      alert('Webcam not ready');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert('Failed to capture image');
      return;
    }

    setIsRecognizing(true);
    setRecognitionResult(null);

    try {
      const result = await apiService.recognizeFace(imageSrc);
      setRecognitionResult(result);
    } catch (error) {
      console.error('Recognition error:', error);
      setRecognitionResult({
        recognized: false,
        message: 'Recognition failed. Please try again.'
      });
    } finally {
      setIsRecognizing(false);
    }
  };

  // Simple clear function
  const clearResults = () => {
    setRecognitionResult(null);
  };

  return (
    <div className="page-container">
      <h2 className="page-title">🔍 Face Recognition</h2>
      
      <div className="camera-container">
        <Suspense
          fallback={
            <div
              className="camera-feed"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e2e8f0',
                aspectRatio: '4 / 3',
                width: '100%'
              }}
            >
              Loading camera...
            </div>
          }
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="camera-feed"
            style={{ transform: 'scaleX(-1)' }}
          />
        </Suspense>
        
        {/* Show recognition result overlay */}
        {recognitionResult && recognitionResult.recognized && recognitionResult.bounding_box && (
          <div
            className="face-box"
            style={{
              left: `${recognitionResult.bounding_box[0]}px`,
              top: `${recognitionResult.bounding_box[1]}px`,
              width: `${recognitionResult.bounding_box[2]}px`,
              height: `${recognitionResult.bounding_box[3]}px`,
              borderColor: '#4CAF50',
            }}
          >
            <div className="confidence-label" style={{ backgroundColor: 'rgba(76, 175, 80, 0.9)' }}>
              {recognitionResult.user.name} - {Math.round(recognitionResult.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Recognition status */}
      {isRecognizing && (
        <div className="status-message status-info" style={{ marginTop: '20px' }}>
          <span className="loading"></span> Recognizing face...
        </div>
      )}

      <div className="camera-controls" style={{ marginTop: '20px' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleRecognize}
          disabled={isRecognizing}
        >
          {isRecognizing ? '⏳ Recognizing...' : '🔍 Recognize Face'}
        </button>
        
        {recognitionResult && (
          <button 
            className="btn btn-warning" 
            onClick={clearResults}
            style={{ marginLeft: '10px' }}
          >
            🗑️ Clear Results
          </button>
        )}
      </div>

      {recognitionResult && (
        <div className="recognition-details" style={{ marginTop: '20px' }}>
          <h3>Recognition Result:</h3>
          {recognitionResult.recognized ? (
            <div className="user-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <h4>👤 {recognitionResult.user.name}</h4>
              {recognitionResult.user.email && (
                <p>📧 {recognitionResult.user.email}</p>
              )}
              <p>🎯 <strong>Confidence:</strong> {Math.round(recognitionResult.confidence * 100)}%</p>
              <p>🆔 <strong>User ID:</strong> {recognitionResult.user.id}</p>
              <p>⏰ <strong>Recognized at:</strong> {new Date().toLocaleString()}</p>
            </div>
          ) : (
            <div className="status-message status-error">
              <h4>❌ Face Not Recognized</h4>
              <p>{recognitionResult.message}</p>
              <p>Please make sure you're registered in the system or try again with better lighting.</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', opacity: 0.8 }}>
        <h4>💡 Recognition Tips:</h4>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>🔆 Ensure your face is well-lit</li>
          <li>👤 Make sure only your face is visible</li>
          <li>📏 Position yourself at the same distance as during registration</li>
          <li>😐 Keep a similar facial expression as your registered photo</li>
          <li>🎯 Click "Recognize Face" button when ready</li>
        </ul>
      </div>
    </div>
  );
};

export default Recognition;
