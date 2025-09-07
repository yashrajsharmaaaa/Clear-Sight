import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import apiService from '../services/api';

const Camera = () => {
  const webcamRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [status, setStatus] = useState('');
  const [facesDetected, setFacesDetected] = useState([]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setIsDetecting(true);
      setStatus('Detecting faces...');
      
      try {
        const result = await apiService.detectFace(imageSrc);
        setDetectionResult(result);
        setFacesDetected(result.faces || []);
        
        if (result.success) {
          if (result.faces_detected > 0) {
            setStatus(`✅ ${result.faces_detected} face(s) detected successfully!`);
          } else {
            setStatus('⚠️ No faces detected in the image');
          }
        } else {
          setStatus('❌ Face detection failed');
        }
      } catch (error) {
        console.error('Error detecting faces:', error);
        setStatus('❌ Error connecting to server');
      } finally {
        setIsDetecting(false);
      }
    }
  }, [webcamRef]);

  const clearResults = () => {
    setDetectionResult(null);
    setFacesDetected([]);
    setStatus('');
  };

  return (
    <div className="page-container">
      <h2 className="page-title">📷 Live Camera Feed</h2>
      
      <div className="camera-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="camera-feed"
        />
        
        {/* Render face detection boxes */}
        {facesDetected.map((face, index) => (
          <div
            key={index}
            className="face-box"
            style={{
              left: `${face.x}px`,
              top: `${face.y}px`,
              width: `${face.width}px`,
              height: `${face.height}px`,
            }}
          >
            <div className="confidence-label">
              {Math.round(face.confidence * 100)}%
            </div>
          </div>
        ))}
      </div>

      <div className="camera-controls">
        <button 
          className="btn btn-primary" 
          onClick={capture}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <>
              <span className="loading"></span> Detecting...
            </>
          ) : (
            '📸 Detect Faces'
          )}
        </button>
        
        {detectionResult && (
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
          status.includes('✅') ? 'status-success' : 
          status.includes('⚠️') ? 'status-info' : 'status-error'
        }`}>
          {status}
        </div>
      )}

      {detectionResult && (
        <div className="detection-info">
          <h3>Detection Results:</h3>
          <p><strong>Faces Found:</strong> {detectionResult.faces_detected}</p>
          {detectionResult.faces && detectionResult.faces.length > 0 && (
            <div>
              <h4>Face Details:</h4>
              {detectionResult.faces.map((face, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <p>Face {index + 1}: Position ({face.x}, {face.y}), Size: {face.width}x{face.height}, Confidence: {Math.round(face.confidence * 100)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', opacity: 0.8 }}>
        <p>💡 <strong>Tip:</strong> Make sure your face is well-lit and clearly visible in the camera for better detection accuracy.</p>
      </div>
    </div>
  );
};

export default Camera;