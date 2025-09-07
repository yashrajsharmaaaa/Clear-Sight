import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import apiService from '../services/api';

const Registration = () => {
  const webcamRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [status, setStatus] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setStatus('📸 Photo captured! Please fill in your details and register.');
    }
  }, [webcamRef]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setStatus('');
    setRegistrationResult(null);
  };

  const registerUser = async () => {
    if (!name.trim()) {
      setStatus('❌ Please enter your name');
      return;
    }

    if (!capturedImage) {
      setStatus('❌ Please capture a photo first');
      return;
    }

    setIsRegistering(true);
    setStatus('🔄 Registering user...');

    try {
      const result = await apiService.registerUser(name.trim(), email.trim(), capturedImage);
      setRegistrationResult(result);
      
      if (result.success) {
        setStatus(`✅ Registration successful! User ID: ${result.user_id}`);
        // Clear form after successful registration
        setTimeout(() => {
          setName('');
          setEmail('');
          setCapturedImage(null);
          setRegistrationResult(null);
          setStatus('');
        }, 3000);
      } else {
        setStatus(`❌ Registration failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setStatus('❌ Error connecting to server');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">➕ User Registration</h2>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Camera Section */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3>📷 Capture Photo</h3>
          <div className="camera-container">
            {!capturedImage ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="camera-feed"
              />
            ) : (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="camera-feed"
                style={{ maxWidth: '100%' }}
              />
            )}
          </div>
          
          <div className="camera-controls">
            {!capturedImage ? (
              <button 
                className="btn btn-primary" 
                onClick={capturePhoto}
              >
                📸 Capture Photo
              </button>
            ) : (
              <button 
                className="btn btn-warning" 
                onClick={retakePhoto}
              >
                🔄 Retake Photo
              </button>
            )}
          </div>
        </div>

        {/* Registration Form */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3>📝 User Details</h3>
          <form onSubmit={(e) => { e.preventDefault(); registerUser(); }}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email (optional)"
              />
            </div>

            <button 
              type="submit"
              className="btn btn-success" 
              disabled={isRegistering || !capturedImage || !name.trim()}
              style={{ width: '100%' }}
            >
              {isRegistering ? (
                <>
                  <span className="loading"></span> Registering...
                </>
              ) : (
                '✅ Register User'
              )}
            </button>
          </form>
        </div>
      </div>

      {status && (
        <div className={`status-message ${
          status.includes('✅') ? 'status-success' : 
          status.includes('📸') || status.includes('🔄') ? 'status-info' : 'status-error'
        }`}>
          {status}
        </div>
      )}

      <div style={{ marginTop: '30px', opacity: 0.8 }}>
        <h4>📋 Registration Guidelines:</h4>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>🔆 Ensure good lighting on your face</li>
          <li>👤 Make sure only one person is visible in the photo</li>
          <li>👀 Look directly at the camera</li>
          <li>😊 Keep a neutral expression</li>
          <li>📏 Maintain appropriate distance from camera</li>
        </ul>
      </div>
    </div>
  );
};

export default Registration;