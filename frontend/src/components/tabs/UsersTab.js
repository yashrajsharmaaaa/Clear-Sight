import React from 'react';

const UsersTab = ({ users, formatDate }) => {
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
  );
};

export default UsersTab;

