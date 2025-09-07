import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecognitions: 0,
    avgConfidence: 0,
    recentActivity: 0,
    successRate: 0,
    mostActiveUsers: [],
    systemUptime: 'Unknown',
    faceDetectionMode: 'Unknown'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersResponse, logsResponse, statsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getLogs(),
        apiService.getSystemStats()
      ]);

      setUsers(usersResponse.users || []);
      setLogs(logsResponse.logs || []);
      setStats(statsResponse);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatConfidence = (confidence) => {
    return Math.round(confidence * 100);
  };

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">📊 Dashboard</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <span className="loading" style={{ width: '40px', height: '40px' }}></span>
          <p style={{ marginTop: '20px' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">📊 System Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div className="stat-card" style={{ 
          background: 'rgba(76, 175, 80, 0.2)', 
          border: '1px solid rgba(76, 175, 80, 0.4)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>👥 Total Users</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0 }}>{stats.totalUsers}</p>
        </div>
        
        <div className="stat-card" style={{ 
          background: 'rgba(33, 150, 243, 0.2)', 
          border: '1px solid rgba(33, 150, 243, 0.4)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>🔍 Total Recognitions</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0 }}>{stats.totalRecognitions}</p>
        </div>
        
        <div className="stat-card" style={{ 
          background: 'rgba(255, 152, 0, 0.2)', 
          border: '1px solid rgba(255, 152, 0, 0.4)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ff9800' }}>🎯 Avg Confidence</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0 }}>
            {stats.avgConfidence > 0 ? `${formatConfidence(stats.avgConfidence)}%` : 'N/A'}
          </p>
        </div>
        
        <div className="stat-card" style={{ 
          background: 'rgba(156, 39, 176, 0.2)', 
          border: '1px solid rgba(156, 39, 176, 0.4)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#9c27b0' }}>⚡ Recent Activity</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0 }}>{stats.recentActivity}</p>
          <small style={{ opacity: 0.8 }}>Last 24 hours</small>
        </div>
        
        <div className="stat-card" style={{ 
          background: 'rgba(76, 175, 80, 0.2)', 
          border: '1px solid rgba(76, 175, 80, 0.4)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>🎯 Success Rate</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0 }}>{stats.successRate}%</p>
          <small style={{ opacity: 0.8 }}>High confidence</small>
        </div>
        
        <div className="stat-card" style={{ 
          background: 'rgba(255, 87, 34, 0.2)', 
          border: '1px solid rgba(255, 87, 34, 0.4)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ff5722' }}>🔧 Detection Mode</h3>
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: 0 }}>{stats.faceDetectionMode}</p>
          <small style={{ opacity: 0.8 }}>Current system</small>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '20px' }}>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-warning'}`}
          onClick={() => setActiveTab('users')}
          style={{ marginRight: '10px' }}
        >
          👥 Registered Users ({users.length})
        </button>
        <button 
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-warning'}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Recognition Logs ({logs.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-section">
          <h3>👥 Registered Users</h3>
          {users.length === 0 ? (
            <div className="status-message status-info">
              <p>No users registered yet. Go to the Registration page to add users.</p>
            </div>
          ) : (
            <div className="users-grid">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <h4>👤 {user.name}</h4>
                  {user.email && <p>📧 {user.email}</p>}
                  <p>🆔 <strong>ID:</strong> {user.id}</p>
                  <p>📅 <strong>Registered:</strong> {formatDate(user.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="logs-section">
          <h3>📋 Recognition Logs</h3>
          {logs.length === 0 ? (
            <div className="status-message status-info">
              <p>No recognition events logged yet. Use the Recognition page to identify users.</p>
            </div>
          ) : (
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <strong>👤 {log.user_name}</strong>
                      {log.user_email && <span style={{ opacity: 0.8 }}> ({log.user_email})</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span style={{ 
                        background: 'rgba(76, 175, 80, 0.2)', 
                        padding: '4px 8px', 
                        borderRadius: '8px',
                        fontSize: '0.9em'
                      }}>
                        🎯 {formatConfidence(log.confidence)}%
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
      )}

      {/* Most Active Users Section */}
      {stats.mostActiveUsers && stats.mostActiveUsers.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>🏆 Most Active Users</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {stats.mostActiveUsers.map(([userName, count], index) => (
              <div key={userName} style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '10px', 
                padding: '15px', 
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h4 style={{ margin: '0 0 5px 0' }}>#{index + 1} {userName}</h4>
                <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}>{count} recognitions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          className="btn btn-primary" 
          onClick={loadDashboardData}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading"></span> Refreshing...
            </>
          ) : (
            '🔄 Refresh Data'
          )}
        </button>
        
        <button 
          className="btn btn-success" 
          onClick={async () => {
            try {
              const response = await apiService.exportLogs();
              const blob = new Blob([response.csv_data], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `clear-sight-logs-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              console.error('Export failed:', error);
            }
          }}
        >
          📊 Export Logs
        </button>
      </div>

      {/* System Info */}
      <div style={{ marginTop: '30px', opacity: 0.8, textAlign: 'center' }}>
        <h4>ℹ️ System Information</h4>
        <p>Clear Sight Facial Recognition System v1.0</p>
        <p>Backend: Python Flask + OpenCV | Frontend: React</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;