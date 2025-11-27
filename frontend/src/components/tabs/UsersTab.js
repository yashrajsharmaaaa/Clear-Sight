import React, { useState } from 'react';
import apiService from '../../services/api';

const UsersTab = ({ users, formatDate, onUserDeleted }) => {
  const [deletingUserId, setDeletingUserId] = useState(null);

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await apiService.deleteUser(userId);
      if (onUserDeleted) {
        onUserDeleted(userId);
      }
    } catch (error) {
      alert(`Failed to delete user: ${error.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="users-section">
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>👥 Registered Users</h3>
      {users.length === 0 ? (
        <div className="status-message status-info" style={{ textAlign: 'center', padding: '20px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '10px' }}>
          <p>No users registered yet. Go to the Registration page to add users.</p>
        </div>
      ) : (
        <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {users.map((user) => (
            <div key={user.id} className="user-card" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'relative' }}>
              <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>👤 {user.name}</h4>
              {user.employee_id && <p>🏢 <strong>Employee ID:</strong> {user.employee_id}</p>}
              {user.department && <p>🏛️ <strong>Department:</strong> {user.department}</p>}
              {user.email && <p>📧 {user.email}</p>}
              <p>🆔 <strong>ID:</strong> {user.id}</p>
              <p>📅 <strong>Registered:</strong> {formatDate(user.created_at)}</p>
              
              <button
                onClick={() => handleDelete(user.id, user.name)}
                disabled={deletingUserId === user.id}
                className="btn"
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '8px',
                  backgroundColor: deletingUserId === user.id ? '#ccc' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deletingUserId === user.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {deletingUserId === user.id ? '🗑️ Deleting...' : '🗑️ Delete User'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersTab;

