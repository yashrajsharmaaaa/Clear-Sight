import React from 'react';

const LogsTab = ({ logs, formatDate, formatConfidencePercent }) => {
  return (
    <div className="logs-section">
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 Recognition Logs</h3>
      {logs.length === 0 ? (
        <div className="status-message status-info" style={{ textAlign: 'center', padding: '20px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '10px' }}>
          <p>No recognition events logged yet. Use the Recognition page to identify users.</p>
        </div>
      ) : (
        <div className="logs-container" style={{ maxHeight: '500px', overflowY: 'auto', padding: '10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
          {logs.map((log, index) => (
            <div key={index} className="log-entry" style={{ padding: '12px', marginBottom: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <strong>👤 {log.user_name}</strong>
                  {log.user_email && <span style={{ opacity: 0.8 }}> ({log.user_email})</span>}
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span style={{ 
                    background: log.confidence > 0.7 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)', 
                    padding: '4px 8px', 
                    borderRadius: '8px',
                    fontSize: '0.9em'
                  }}>
                    🎯 {formatConfidencePercent(log.confidence)}%
                  </span>
                  <span style={{ opacity: 0.8, fontSize: '0.9em' }}>
                    ⏰ {formatDate(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogsTab;

