import React, { useState, useEffect, useCallback, Suspense } from 'react';
import apiService from '../services/api';
import { formatTimestamp, formatConfidence } from '../utils/formatters';
const UsersTab = React.lazy(() => import('./tabs/UsersTab'));
const LogsTab = React.lazy(() => import('./tabs/LogsTab'));

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({
    totalUsers: 0,
    avgConfidence: 0,
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

  const formatConfidencePercent = useCallback((confidence) => {
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
      if (!error && data) {
        console.log('Stats API Response:', data);
        setStats({
          totalUsers: data.totalUsers || 0,
          avgConfidence: data.avgConfidence || 0,
          mostActiveUsers: data.mostActiveUsers || []
        });
        console.log('Stats State Updated:', {
          totalUsers: data.totalUsers || 0,
          avgConfidence: data.avgConfidence || 0
        });
      } else if (error) {
        console.error('Stats API Error:', error);
      }
      loadingStates.stats = false;
      updateLoadingState();
    });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate stats from actual data when users or logs change
  useEffect(() => {
    if (logs.length > 0) {
      const totalConfidence = logs.reduce((sum, log) => sum + (log.confidence || 0), 0);
      const calculatedAvgConfidence = totalConfidence / logs.length;
      
      console.log('Calculated from logs:', {
        totalLogs: logs.length,
        avgConfidence: calculatedAvgConfidence
      });
      
      // Update stats with calculated values
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: users.length || prevStats.totalUsers,
        avgConfidence: calculatedAvgConfidence || prevStats.avgConfidence
      }));
    }
  }, [users, logs]);

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
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0 }}>{users.length || stats.totalUsers || 0}</p>
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

      {activeTab === 'users' && (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Loading users...</div>}>
          <UsersTab users={users} formatDate={formatDate} />
        </Suspense>
      )}

      {activeTab === 'logs' && (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</div>}>
          <LogsTab logs={logs} formatDate={formatDate} formatConfidencePercent={formatConfidencePercent} />
        </Suspense>
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
