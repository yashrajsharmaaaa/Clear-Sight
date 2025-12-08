import React, { useRef, useCallback, useEffect, useState } from 'react';

const WebcamCapture = ({ onCapture, width = 640, height = 480 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: 'user'
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (mounted) {
          setError('Camera access denied or unavailable. Please check your camera permissions.');
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [width, height]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image horizontally
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.95);
  }, []);

  useEffect(() => {
    if (onCapture) {
      onCapture(captureImage);
    }
  }, [captureImage, onCapture]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '4 / 3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fee',
        color: '#c00',
        padding: '20px',
        textAlign: 'center',
        borderRadius: '8px'
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>📷 {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          display: 'block',
          background: '#000',
          transform: 'scaleX(-1)'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!isReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
          color: 'white'
        }}>
          Loading camera...
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
