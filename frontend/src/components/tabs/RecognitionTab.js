import React from 'react';
import { formatTimestamp, formatConfidence } from '../../utils/formatters';

const RecognitionTab = ({ recognitionLogs, error, onRetry }) => {
  return (
    <div className="recognition-logs-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>🎯 Recent Recognition Events</h3>
        <div style={{ fontSize: '0.9em', opacity: 0.7 }}>
          Auto-refreshes every 30 seconds
        </div>
      </div>
      {error ? (
        <div className="status-message status-error" style={{ textAlign: 'center', padding: '20px', borderRadius: '10px' }}>
          <p style={{ marginBottom: '10px' }}>❌ {error}</p>
          <button 
            className="btn btn-primary" 
            onClick={onRetry}
            style={{ padding: '8px 16px' }}
          >
            🔄 Retry
          </button>
        </div>
      ) : recognitionLogs.length === 0 ? (
        <div className="status-message status-info" style={{ textAlign: 'center', padding: '30px', borderRadius: '12px' }}>
          <div style={{ fontSize: '3em', marginBottom: '10px' }}>📭</div>
          <p style={{ fontSize: '1.1em', margin: 0 }}>No recognition events logged yet.</p>
          <p style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '5px' }}>Use the Recognition page to identify users.</p>
        </div>
      ) : (
        <div className="recognition-logs-list" style={{ maxHeight: '600px', overflowY: 'auto', padding: '5px' }}>
          {recognitionLogs.map((log, index) => {
            const confidenceValue = parseFloat(log.confidence);
            const isHighConfidence = confidenceValue >= 0.8;
            const isMediumConfidence = confidenceValue >= 0.6 && confidenceValue < 0.8;
            const isLowConfidence = confidenceValue < 0.6;
            return (
              <div 
                key={index} 
                className="recognition-log-card"
                style={{ 
                  background: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '10px',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 250px', minWidth: '0' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '1.5em', lineHeight: 1 }}>👤</span>
                      <strong style={{ fontSize: '1.15em', color: '#1E293B', wordBreak: 'break-word' }}>
                        {log.user_name}
                      </strong>
                    </div>
                    {log.user_email && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9em',
                        color: '#64748B',
                        marginLeft: '32px'
                      }}>
                        <span>📧</span>
                        <span style={{ wordBreak: 'break-all' }}>{log.user_email}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.9em',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      background: isHighConfidence ? '#ECFDF5' : isMediumConfidence ? '#FEF3C7' : '#FEF2F2',
                      color: isHighConfidence ? '#065F46' : isMediumConfidence ? '#92400E' : '#991B1B',
                      border: `1px solid ${isHighConfidence ? '#A7F3D0' : isMediumConfidence ? '#FDE68A' : '#FECACA'}`
                    }}>
                      <span style={{ fontSize: '1.1em' }}>{isHighConfidence ? '✓' : isMediumConfidence ? '○' : '!'}</span>
                      <span>{formatConfidence(log.confidence)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85em', color: '#64748B', whiteSpace: 'nowrap', padding: '6px 10px', background: '#F1F5F9', borderRadius: '8px' }}>
                      <span>🕐</span>
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecognitionTab;

