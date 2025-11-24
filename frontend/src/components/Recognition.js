import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import apiService from '../services/api';

const Recognition = () => {
  const webcamRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [status, setStatus] = useState('');

  // Simple video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  // Simple recognition function
  const recognizeFace = async () => {
    if (!webcamRef.current || isRecognizing) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    setIsRecognizing(true);
    setStatus('🔍 Recognizing face...');
    
    try {
      const result = await apiService.recognizeFace(imageSrc);
      setRecognitionResult(result);

      
      if (result.recognized) {
        setStatus(`✅ Welcome back, ${result.user.name}! (Confidence: ${Math.round(result.confidence * 100)}%)`);
      } else {
        setStatus('❌ Face not recognized. Please register first or try again.');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setStatus('❌ Error connecting to server');
    } finally {
      setIsRecognizing(false);
    }
  };

  // Simple clear function
  const clearResults = () => {
    setRecognitionResult(null);
    setStatus('');
  };

  return (
    <div className="page-container">
      <h2 className="page-title">🔍 Face Recognition</h2>
      
      <div className="camera-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="camera-feed"
        />
        
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

      <div className="camera-controls">
        <button 
          className="btn btn-primary" 
          onClick={recognizeFace}
          disabled={isRecognizing}
        >
          {isRecognizing ? (
            <>
              <span className="loading"></span> Recognizing...
            </>
          ) : (
            '🔍 Recognize Face'
          )}
        </button>
        

        
        {recognitionResult && (
          <button 
            className="btn btn-warning" 
            onClick={clearResults}
          >
            🗑️ Clear Results
          </button>
        )}
      </div>

      {status && (
        <div className={`status-message ${
          status.includes('✅') || status.includes('Welcome') ? 'status-success' : 
          status.includes('🔄') || status.includes('⏸️') ? 'status-info' : 'status-error'
        }`}>
          {status}
        </div>
      )}

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
          <li>🔄 Use auto-recognition for hands-free operation</li>
        </ul>
      </div>
    </div>
  );
};

export default Recognition;