import React, { useState, useCallback } from 'react';
import WebcamCapture from './WebcamCapture';
import apiService from '../services/api';

const Recognition = () => {
  const [captureFunction, setCaptureFunction] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);

  const handleCaptureReady = useCallback((captureFn) => {
    setCaptureFunction(() => captureFn);
  }, []);

  const handleRecognize = async () => {
    if (!captureFunction) {
      alert('Webcam not ready');
      return;
    }

    const imageSrc = captureFunction();
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

  const clearResults = () => {
    setRecognitionResult(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#1E293B', height: '100vh', overflow: 'hidden', boxSizing: 'border-box', maxWidth: '100vw' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Live Recognition</h2>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)', padding: 24, height: 'calc(100vh - 80px)', boxSizing: 'border-box', overflow: 'hidden', maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: 24, height: '100%', maxWidth: '100%' }}>
          {/* Left: Camera */}
          <div style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid #E2E8F0', background: '#000', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WebcamCapture onCapture={handleCaptureReady} width={640} height={480} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button
                onClick={handleRecognize}
                disabled={isRecognizing}
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  fontWeight: 600, 
                  fontSize: 14, 
                  backgroundColor: '#3b82f6', 
                  border: 'none', 
                  borderRadius: '10px', 
                  color: 'white', 
                  cursor: isRecognizing ? 'not-allowed' : 'pointer',
                  opacity: isRecognizing ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isRecognizing) e.target.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (!isRecognizing) e.target.style.backgroundColor = '#3b82f6';
                }}
              >
                {isRecognizing ? '⏳ Recognizing...' : '🔍 Recognize Face'}
              </button>
              
              {recognitionResult && (
                <button
                  onClick={clearResults}
                  style={{ 
                    padding: '12px 16px', 
                    fontWeight: 600, 
                    fontSize: 14, 
                    backgroundColor: '#64748b', 
                    border: 'none', 
                    borderRadius: '10px', 
                    color: 'white', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#64748b'}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Right: Results */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', paddingRight: '8px' }}>
            {isRecognizing && (
              <div style={{ padding: 20, textAlign: 'center', backgroundColor: '#dbeafe', borderRadius: 12, border: '2px solid #93c5fd' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e40af' }}>Recognizing face...</p>
              </div>
            )}

            {recognitionResult && (
              <div>
                {recognitionResult.recognized ? (
                  <div style={{ backgroundColor: '#dcfce7', borderRadius: 12, padding: 24, border: '2px solid #86efac' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 50, marginBottom: 10 }}>✅</div>
                      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#166534' }}>Face Recognized!</h3>
                    </div>
                    
                    <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 16 }}>
                      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>NAME</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>👤 {recognitionResult.user.name}</div>
                      </div>
                      
                      {recognitionResult.user.email && (
                        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>EMAIL</div>
                          <div style={{ fontSize: 15, color: '#1e293b' }}>📧 {recognitionResult.user.email}</div>
                        </div>
                      )}
                      
                      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>CONFIDENCE</div>
                        <div style={{ fontSize: 15, color: '#1e293b' }}>
                          🎯 {Math.round(recognitionResult.confidence * 100)}%
                          <div style={{ marginTop: 6, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(recognitionResult.confidence * 100)}%`, backgroundColor: '#22c55e', transition: 'width 0.3s' }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>USER ID</div>
                        <div style={{ fontSize: 15, color: '#1e293b' }}>🆔 {recognitionResult.user.id}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>RECOGNIZED AT</div>
                        <div style={{ fontSize: 15, color: '#1e293b' }}>⏰ {new Date().toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 24, border: '2px solid #fca5a5' }}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 50, marginBottom: 10 }}>❌</div>
                      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Face Not Recognized</h3>
                      <p style={{ margin: 0, fontSize: 14, color: '#7f1d1d' }}>{recognitionResult.message}</p>
                    </div>
                    
                    <div style={{ backgroundColor: 'white', borderRadius: 10, padding: 16 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                        Please make sure you're registered in the system or try again with better lighting and positioning.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isRecognizing && !recognitionResult && (
              <div style={{ padding: 24, backgroundColor: '#f8fafc', borderRadius: 12, border: '2px solid #e2e8f0' }}>
                <h4 style={{ margin: 0, marginBottom: 12, fontWeight: 700, fontSize: 15, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  💡 Recognition Tips
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.8 }}>
                  <li>• Ensure your face is well-lit</li>
                  <li>• Make sure only your face is visible</li>
                  <li>• Position yourself at the same distance as during registration</li>
                  <li>• Keep a similar facial expression as your registered photo</li>
                  <li>• Click "Recognize Face" button when ready</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recognition;
