import React, { useState, useCallback } from 'react';
import WebcamCapture from './WebcamCapture';
import apiService from '../services/api';

const Registration = () => {
  const [captureFunction, setCaptureFunction] = useState(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [status, setStatus] = useState('');

  const handleCaptureReady = useCallback((captureFn) => {
    setCaptureFunction(() => captureFn);
  }, []);

  const capturePhoto = useCallback(() => {
    if (captureFunction) {
      const imageSrc = captureFunction();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setStatus('📸 Photo captured! Please fill in your details and register.');
      }
    }
  }, [captureFunction]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setStatus('');
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
      const result = await apiService.registerUser(name.trim(), email.trim(), capturedImage, employeeId.trim(), department.trim(), age.trim(), gender);
      
      if (result.success) {
        setStatus(`✅ Registration successful! User ID: ${result.user_id}`);
        // Clear form after successful registration
        setTimeout(() => {
          setName('');
          setEmployeeId('');
          setDepartment('');
          setEmail('');
          setAge('');
          setGender('');
          setCapturedImage(null);
          setStatus('');
        }, 3000);
      } else {
        setStatus(`❌ Registration failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`❌ Error connecting to server: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#1E293B', height: '100vh', overflow: 'hidden', boxSizing: 'border-box', maxWidth: '100vw' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Employee Registration</h2>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)', padding: 24, height: 'calc(100vh - 80px)', boxSizing: 'border-box', overflow: 'hidden', maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: 24, height: '100%', maxWidth: '100%' }}>
          {/* Left: Camera */}
          <div style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid #E2E8F0', background: '#000', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!capturedImage ? (
                <WebcamCapture onCapture={handleCaptureReady} width={640} height={480} />
              ) : (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              {!capturedImage ? (
                <button
                  onClick={capturePhoto}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 16px', fontWeight: 600, fontSize: 14, backgroundColor: '#3b82f6', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}
                >
                  📸 Capture Photo
                </button>
              ) : (
                <button
                  onClick={retakePhoto}
                  className="btn btn-warning"
                  style={{ width: '100%', padding: '12px 16px', fontWeight: 600, fontSize: 14, backgroundColor: '#f59e0b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}
                >
                  🔄 Retake Photo
                </button>
              )}
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', paddingRight: '8px' }}>
            <form onSubmit={(e) => { e.preventDefault(); registerUser(); }}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Full Name *</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '11px 14px', 
                    fontSize: 14, 
                    boxSizing: 'border-box',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label htmlFor="age" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Age *</label>
                  <input
                    type="number"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g., 25"
                    required
                    min="18"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      fontSize: 14,
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      backgroundColor: '#fff',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label htmlFor="gender" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Gender *</label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      fontSize: 14,
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      backgroundColor: '#fff',
                      color: gender ? '#1E293B' : '#94a3b8',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label htmlFor="employeeId" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Employee ID *</label>
                  <input
                    type="text"
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g., EMP-1024"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      fontSize: 14,
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      backgroundColor: '#fff',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label htmlFor="department" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Department *</label>
                  <input
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Engineering"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      fontSize: 14,
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      outline: 'none',
                      backgroundColor: '#fff',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label htmlFor="email" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com (optional)"
                  style={{ 
                    width: '100%', 
                    padding: '11px 14px', 
                    fontSize: 14, 
                    boxSizing: 'border-box',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fff'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering || !capturedImage || !name.trim() || !employeeId.trim() || !department.trim() || !age.trim() || !gender}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  fontWeight: 700,
                  fontSize: 15,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (isRegistering || !capturedImage || !name.trim() || !employeeId.trim() || !department.trim() || !age.trim() || !gender) ? 'not-allowed' : 'pointer',
                  opacity: (isRegistering || !capturedImage || !name.trim() || !employeeId.trim() || !department.trim() || !age.trim() || !gender) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {isRegistering ? '⏳ Registering...' : '✅ Register Employee'}
              </button>
            </form>

            {status && (
              <div style={{ marginTop: 12, padding: 11, fontSize: 13, borderRadius: 10, backgroundColor: status.includes('✅') ? '#dcfce7' : status.includes('📸') || status.includes('🔄') ? '#dbeafe' : '#fee2e2', color: status.includes('✅') ? '#166534' : status.includes('📸') || status.includes('🔄') ? '#1e40af' : '#991b1b', border: `2px solid ${status.includes('✅') ? '#86efac' : status.includes('📸') || status.includes('🔄') ? '#93c5fd' : '#fca5a5'}` }}>
                {status}
              </div>
            )}

            <div style={{ marginTop: 16, padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, border: '2px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                📋 Registration Guidelines
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#64748b', fontSize: 12, lineHeight: 1.7 }}>
                <li>• Ensure good lighting on your face</li>
                <li>• Only one person should be visible</li>
                <li>• Look directly at the camera</li>
                <li>• Keep a neutral expression</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
