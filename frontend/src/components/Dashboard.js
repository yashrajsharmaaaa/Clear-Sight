import React, { useState, useEffect, useCallback, Suspense } from 'react';
import apiService from '../services/api';
const UsersTab = React.lazy(() => import('./tabs/UsersTab'));
const LogsTab = React.lazy(() => import('./tabs/LogsTab'));

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [stats, setStats] = useState({
    totalUsers: 0,
    avgConfidence: 0,
    mostActiveUsers: []
  });
  const [todayAttendance, setTodayAttendance] = useState({
    present: 0,
    absent: 0,
    total: 0,
    checkIns: []
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
        setStats({
          totalUsers: data.totalUsers || 0,
          avgConfidence: data.avgConfidence || 0,
          mostActiveUsers: data.mostActiveUsers || []
        });
      } else {
        // Stats API failed, but we'll calculate from logs data
        console.log('Stats API unavailable, will calculate from logs');
      }
      loadingStates.stats = false;
      updateLoadingState();
    });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate today's attendance
  useEffect(() => {
    if (logs.length > 0 && users.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter today's logs
      const todayLogs = logs.filter(log => {
        try {
          const logDate = new Date(log.timestamp);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        } catch {
          return false;
        }
      });
      
      // Get unique users who checked in today
      const checkedInUsers = new Set();
      const checkInDetails = [];
      
      todayLogs.forEach(log => {
        if (!checkedInUsers.has(log.user_name)) {
          checkedInUsers.add(log.user_name);
          checkInDetails.push({
            name: log.user_name,
            email: log.user_email,
            time: log.timestamp,
            confidence: log.confidence
          });
        }
      });
      
      setTodayAttendance({
        present: checkedInUsers.size,
        absent: users.length - checkedInUsers.size,
        total: users.length,
        checkIns: checkInDetails.sort((a, b) => new Date(b.time) - new Date(a.time))
      });
      
      // Calculate average confidence
      const totalConfidence = logs.reduce((sum, log) => sum + (log.confidence || 0), 0);
      const calculatedAvgConfidence = totalConfidence / logs.length;
      
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: users.length || prevStats.totalUsers,
        avgConfidence: calculatedAvgConfidence || prevStats.avgConfidence
      }));
    }
  }, [users, logs]);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#1E293B', height: '100vh', overflow: 'hidden', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Attendance Dashboard</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⏳</div>
          <p style={{ fontSize: 15, color: '#64748b' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const attendanceRate = todayAttendance.total > 0 ? Math.round((todayAttendance.present / todayAttendance.total) * 100) : 0;

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#1E293B', height: '100vh', overflow: 'auto', boxSizing: 'border-box', maxWidth: '100vw' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 0 }}>Attendance Dashboard</h2>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Today's Attendance Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ backgroundColor: '#dcfce7', borderRadius: 12, padding: 20, border: '2px solid #86efac' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 8 }}>PRESENT TODAY</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#166534' }}>
              {todayAttendance.present}
              <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 8 }}>/ {todayAttendance.total}</span>
            </div>
            <div style={{ marginTop: 8, height: 6, backgroundColor: '#86efac', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${attendanceRate}%`, backgroundColor: '#22c55e', transition: 'width 0.3s' }}></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 20, border: '2px solid #fca5a5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>ABSENT TODAY</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#991b1b' }}>{todayAttendance.absent}</div>
          </div>

          <div style={{ backgroundColor: '#dbeafe', borderRadius: 12, padding: 20, border: '2px solid #93c5fd' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>ATTENDANCE RATE</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>{attendanceRate}%</div>
          </div>

          <div style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 20, border: '2px solid #fcd34d' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>TOTAL EMPLOYEES</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#92400e' }}>{users.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: activeTab === 'attendance' ? '#3b82f6' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'attendance' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📊 Today's Attendance
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: activeTab === 'users' ? '#3b82f6' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            👥 Employees ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: activeTab === 'logs' ? '#3b82f6' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📋 Activity Logs ({logs.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(15, 23, 42, 0.08)' }}>
          {activeTab === 'attendance' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>Recent Check-ins</h3>
              {todayAttendance.checkIns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                  <p style={{ margin: 0, fontSize: 15 }}>No check-ins recorded today</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {todayAttendance.checkIns.map((checkIn, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', marginRight: 16 }}>
                        👤
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{checkIn.name}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{checkIn.email || 'No email'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                          {new Date(checkIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: 12, color: '#22c55e' }}>
                          {Math.round(checkIn.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Loading employees...</div>}>
              <UsersTab 
                users={users} 
                formatDate={formatDate} 
                onUserDeleted={() => loadDashboardData()} 
              />
            </Suspense>
          )}

          {activeTab === 'logs' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</div>}>
              <LogsTab logs={logs} formatDate={formatDate} formatConfidencePercent={formatConfidencePercent} />
            </Suspense>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button 
            onClick={loadDashboardData}
            disabled={loading}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            🔄 Refresh Data
          </button>
          
          <button 
            onClick={async () => {
              try {
                const response = await apiService.exportLogs();
                const blob = new Blob([response.csv_data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `attendance-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Export failed:', error);
              }
            }}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
          >
            📊 Export Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
