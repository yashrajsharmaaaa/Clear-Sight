import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import apiService from '../services/api';

const Registration = () => {
  const webcamRef = useRef(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
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

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [captureHover, setCaptureHover] = useState(false);
  const [registerHover, setRegisterHover] = useState(false);

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
      console.log('Registering user with data:', {
        name: name.trim(),
        email: email.trim(),
        employeeId: employeeId.trim(),
        department: department.trim(),
        imageDataLength: capturedImage ? capturedImage.length : 0
      });
      
      // Log the API base URL from the service
      console.log('Using API service for registration');
      
      const result = await apiService.registerUser(name.trim(), email.trim(), capturedImage, employeeId.trim(), department.trim());
      console.log('Registration response:', result);
      setRegistrationResult(result);
      
      if (result.success) {
        setStatus(`✅ Registration successful! User ID: ${result.user_id}`);
        // Clear form after successful registration
        setTimeout(() => {
          setName('');
          setEmployeeId('');
          setDepartment('');
          setEmail('');
          setCapturedImage(null);
          setRegistrationResult(null);
          setStatus('');
        }, 3000);
      } else {
        setStatus(`❌ Registration failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      console.error('Error status:', error.response ? error.response.status : 'No status');
      setStatus(`❌ Error connecting to server: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '40px 16px', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#1E293B' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Employee Registration</h2>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)', padding: 24 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Left: Camera */}
            <div style={{ flex: '1 1 340px' }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                {!capturedImage ? (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    style={{ width: '100%', aspectRatio: '4 / 3', display: 'block', background: '#0f172a10' }}
                  />
                ) : (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    style={{ width: '100%', aspectRatio: '4 / 3', display: 'block' }}
                  />
                )}
              </div>
              <div style={{ marginTop: 12 }}>
                {!capturedImage ? (
                  <button
                    onClick={capturePhoto}
                    onMouseEnter={() => setCaptureHover(true)}
                    onMouseLeave={() => setCaptureHover(false)}
                    style={{
                      width: '100%',
                      backgroundColor: captureHover ? '#2563EB' : '#3B82F6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Capture Photo
                  </button>
                ) : (
                  <button
                    onClick={retakePhoto}
                    style={{
                      width: '100%',
                      backgroundColor: '#E2E8F0',
                      color: '#1E293B',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Retake Photo
                  </button>
                )}
              </div>
            </div>

            {/* Right: Form */}
            <div style={{ flex: '1 1 340px' }}>
              <form onSubmit={(e) => { e.preventDefault(); registerUser(); }}>
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="name" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholder="Enter your full name"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${nameFocused ? '#3B82F6' : '#E2E8F0'}`,
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label htmlFor="employeeId" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Employee ID *</label>
                    <input
                      type="text"
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g., EMP-1024"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B'
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="department" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Department *</label>
                    <input
                      type="text"
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., Engineering"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="Enter your email (optional)"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${emailFocused ? '#3B82F6' : '#E2E8F0'}`,
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  onMouseEnter={() => setRegisterHover(true)}
                  onMouseLeave={() => setRegisterHover(false)}
                  disabled={isRegistering || !capturedImage || !name.trim() || !employeeId.trim() || !department.trim()}
                  style={{
                    width: '100%',
                    backgroundColor: (isRegistering || !capturedImage || !name.trim()) ? '#93C5FD' : (registerHover ? '#2563EB' : '#3B82F6'),
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 16px',
                    fontWeight: 700,
                    cursor: (isRegistering || !capturedImage || !name.trim() || !employeeId.trim() || !department.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isRegistering ? 'Registering...' : 'Register Employee'}
                </button>
              </form>

              {status && (
                <div style={{ marginTop: 16, fontSize: 14, color: status.includes('✅') ? '#166534' : (status.includes('📸') || status.includes('🔄') ? '#334155' : '#B91C1C') }}>
                  {status}
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <h4 style={{ margin: 0, marginBottom: 8, fontWeight: 700, color: '#1E293B' }}>Employee Registration Guidelines</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#64748B' }}>
                  <li style={{ marginBottom: 6 }}>• Ensure good lighting on your face</li>
                  <li style={{ marginBottom: 6 }}>• Only one person should be visible</li>
                  <li style={{ marginBottom: 6 }}>• Look directly at the camera</li>
                  <li style={{ marginBottom: 6 }}>• Keep a neutral expression</li>
                  <li style={{ marginBottom: 0 }}>• Maintain appropriate distance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;