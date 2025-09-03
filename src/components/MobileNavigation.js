import React from 'react';
import './MobileNavigation.css';

const MobileNavigation = ({ activeTab, onTabChange, isAuthenticated, onLogout }) => {
  const tabs = [
    {
      id: 'inventory',
      label: 'Inventory',
      icon: '📦',
      color: '#007bff'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: '📋',
      color: '#28a745'
    },
    {
      id: 'records',
      label: 'Records',
      icon: '📊',
      color: '#17a2b8'
    }
  ];

  return (
    <div className="mobile-navigation">
      <div className="mobile-nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`mobile-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{
              '--tab-color': tab.color
            }}
          >
            <div className="mobile-nav-icon">{tab.icon}</div>
            <div className="mobile-nav-label">{tab.label}</div>
            {activeTab === tab.id && (
              <div className="mobile-nav-indicator"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* User Authentication Section */}
      <div className="mobile-user-section">
        {isAuthenticated ? (
          <div className="mobile-user-info">
            <div className="mobile-user-avatar">
              <span>👤</span>
            </div>
            <div className="mobile-user-details">
              <span className="mobile-user-name">User</span>
              <span className="mobile-user-status">Logged In</span>
            </div>
            <button 
              className="mobile-logout-btn"
              onClick={onLogout}
              title="Logout"
            >
              <span>🚪</span>
            </button>
          </div>
        ) : (
          <div className="mobile-login-prompt">
            <div className="mobile-login-icon">
              <span>🔐</span>
            </div>
            <div className="mobile-login-text">
              <span>Please Login</span>
            </div>
            <button 
              className="mobile-login-btn"
              onClick={() => onTabChange('login')}
              title="Go to Login"
            >
              <span>➡️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNavigation;
