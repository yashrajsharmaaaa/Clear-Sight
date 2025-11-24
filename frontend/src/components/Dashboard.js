import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    successRate: 0,
    mostActiveUsers: []
  });

  // Memoized format functions
  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }, []);

  const formatConfidence = useCallback((confidence) => {
    return Math.round(confidence * 100);
  }, []);

  // Memoized load function with debounced API calls
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    
    // Track loading state for each data type
    let loadingStates = {
      users: true,
      logs: true,
      stats: true
    };
    
    // Update loading state when all data is loaded
    const updateLoadingState = () => {
      if (!loadingStates.users && !loadingStates.logs && !loadingStates.stats) {
        setLoading(false);
      }
    };
    
    // Use debounced methods for better performance
    apiService.debouncedGetUsers((data, error) => {
      if (!error) setUsers(data.users || []);
      loadingStates.users = false;
      updateLoadingState();
    });
    
    apiService.debouncedGetLogs((data, error) => {
      if (!error) setLogs(data.logs || []);
      loadingStates.logs = false;
      updateLoadingState();
    });
    
    apiService.debouncedGetStats((data, error) => {
      if (!error) setStats(data);
      loadingStates.stats = false;
      updateLoadingState();
    });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
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
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-warning'}`}
          onClick={() => setActiveTab('users')}
          style={{ marginRight: '10px', padding: '10px 20px', fontSize: '1.1em' }}
        >
          👥 Users ({users.length})
        </button>
        <button 
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-warning'}`}
          onClick={() => setActiveTab('logs')}
          style={{ padding: '10px 20px', fontSize: '1.1em' }}
        >
          📋 Logs ({logs.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-section">
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>👥 Registered Users</h3>
          {users.length === 0 ? (
            <div className="status-message status-info" style={{ textAlign: 'center', padding: '20px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '10px' }}>
              <p>No users registered yet. Go to the Registration page to add users.</p>
            </div>
          ) : (
            <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {users.map((user) => (
                <div key={user.id} className="user-card" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>👤 {user.name}</h4>
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
        <div style={{ marginTop: '30px', marginBottom: '30px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>🏆 Most Active Users</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {stats.mostActiveUsers.map(([userName, count], index) => (
              <div key={userName} style={{ 
                background: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '10px', 
                padding: '15px', 
                textAlign: 'center',
                border: index === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
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
          style={{ padding: '10px 20px', fontSize: '1.1em' }}
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
          style={{ padding: '10px 20px', fontSize: '1.1em' }}
        >
          📊 Export Logs
        </button>
      </div>
    </div>
  );
};

export default Dashboard;