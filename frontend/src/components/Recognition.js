import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import apiService from '../services/api';

// Configuration constants for automatic recognition
const AUTO_RECOGNITION_INTERVAL = 2000; // Check every 2 seconds
const MIN_RECOGNITION_DELAY = 3000; // Minimum 3s between recognitions
const FACE_DETECTION_CONFIDENCE_THRESHOLD = 0.5;

const Recognition = () => {
  const webcamRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [status, setStatus] = useState('');
  
  // Automatic recognition state management
  const [autoRecognitionEnabled, setAutoRecognitionEnabled] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastRecognitionTime, setLastRecognitionTime] = useState(0);

  // Simple video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  // Helper function to select largest face from multiple detected faces
  const selectLargestFace = (faces) => {
    if (!faces || faces.length === 0) return null;
    
    // Calculate area for each face and select the one with largest area
    let largestFace = faces[0];
    let maxArea = faces[0].width * faces[0].height;
    
    for (let i = 1; i < faces.length; i++) {
      const area = faces[i].width * faces[i].height;
      if (area > maxArea) {
        maxArea = area;
        largestFace = faces[i];
      }
    }
    
    return largestFace;
  };

  // Continuous face detection and recognition loop
  useEffect(() => {
    if (!autoRecognitionEnabled) return;
    
    const interval = setInterval(async () => {
      // Skip if already recognizing or detecting
      if (isRecognizing || isDetecting) return;
      
      // Check if webcam is ready
      if (!webcamRef.current) return;
      
      // Capture current frame
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      
      // Detect face in current frame
      setIsDetecting(true);
      try {
        const detectionResult = await apiService.detectFace(imageSrc);
        
        // Handle structured error responses from API service
        if (detectionResult.error) {
          console.error('Face detection error:', detectionResult.error);
          setStatus('⚠️ Detection error. Retrying...');
          // Don't stop auto-recognition on error
        } else if (detectionResult.success && detectionResult.faces_detected > 0) {
          // Select largest face if multiple faces detected
          const selectedFace = selectLargestFace(detectionResult.faces);
          
          // Face detected - trigger recognition with debouncing
          const now = Date.now();
          if (now - lastRecognitionTime >= MIN_RECOGNITION_DELAY) {
            await performRecognition(imageSrc, selectedFace);
          }
        } else {
          // No face detected - update status
          setStatus('👀 Monitoring for faces...');
        }
      } catch (error) {
        // This catch handles unexpected errors (network issues, etc.)
        console.error('Unexpected face detection error:', error);
        setStatus('⚠️ Connection error. Retrying...');
        // Don't stop auto-recognition on error
      } finally {
        setIsDetecting(false);
      }
    }, AUTO_RECOGNITION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRecognitionEnabled, isRecognizing, isDetecting, lastRecognitionTime]);

  // Perform recognition with selected face
  const performRecognition = async (imageSrc, selectedFace) => {
    setIsRecognizing(true);
    setLastRecognitionTime(Date.now());
    
    try {
      const result = await apiService.recognizeFace(imageSrc);
      
      // Handle structured error responses from API service
      if (result.error) {
        console.error('Recognition error:', result.error);
        // Set error result but continue monitoring
        setRecognitionResult({ 
          recognized: false, 
          message: result.message || 'Recognition failed. Continuing to monitor...',
          error: result.error
        });
      } else {
        setRecognitionResult(result);
      }
    } catch (error) {
      // This catch handles unexpected errors (network issues, etc.)
      console.error('Unexpected recognition error:', error);
      // Set error result but continue monitoring
      setRecognitionResult({ 
        recognized: false, 
        message: 'Error connecting to server. Continuing to monitor...' 
      });
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

      {/* Auto-recognition status indicators */}
      <div className="auto-recognition-status" style={{ marginTop: '20px', marginBottom: '20px' }}>
        {autoRecognitionEnabled && !isRecognizing && !isDetecting && !recognitionResult && (
          <div className="status-message status-info">
            👀 Monitoring for faces...
          </div>
        )}
        
        {isDetecting && (
          <div className="status-message status-info">
            🔍 Detecting face...
          </div>
        )}
        
        {isRecognizing && (
          <div className="status-message status-info">
            <span className="loading"></span> Recognizing...
          </div>
        )}
        
        {recognitionResult && recognitionResult.recognized && (
          <div className="status-message status-success">
            ✅ Welcome back, {recognitionResult.user.name}! (Confidence: {Math.round(recognitionResult.confidence * 100)}%)
          </div>
        )}
        
        {recognitionResult && !recognitionResult.recognized && (
          <div className="status-message status-error">
            ❌ Face not recognized. Continuing to monitor...
          </div>
        )}
      </div>

      <div className="camera-controls">
        {recognitionResult && (
          <button 
            className="btn btn-warning" 
            onClick={clearResults}
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
        <h4>💡 Automatic Recognition Tips:</h4>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>🔆 Ensure your face is well-lit</li>
          <li>👤 Make sure only your face is visible</li>
          <li>📏 Position yourself at the same distance as during registration</li>
          <li>😐 Keep a similar facial expression as your registered photo</li>
          <li>🤖 The system automatically recognizes faces - no button needed!</li>
          <li>⏱️ Recognition happens every few seconds when a face is detected</li>
        </ul>
      </div>
    </div>
  );
};

export default Recognition;