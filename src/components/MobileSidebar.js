import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './MobileSidebar.css';

const MobileSidebar = ({ isOpen, onClose, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/', label: 'Inventory', icon: 'fas fa-boxes' },
    { path: '/orders', label: 'Orders', icon: 'fas fa-shopping-cart' },
    { path: '/inventory-records', label: 'Inventory Records', icon: 'fas fa-chart-line' },
  ];

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogout = async () => {
    try {
      if (typeof onLogout === 'function') {
        await onLogout();
      }
    } finally {
      onClose();
      navigate('/login');
    }
  };

  // Close sidebar on escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <aside className={`mobile-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>Sunny Backreys</h2>
            <p>Inventory Management</p>
          </div>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <p className="user-name">Admin User</p>
              <p className="user-role">System Administrator</p>
            </div>
          </div>
          
          {isAuthenticated ? (
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          ) : (
            <Link to="/login" className="logout-btn" onClick={onClose}>
              <i className="fas fa-sign-in-alt"></i>
              <span>Login</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;