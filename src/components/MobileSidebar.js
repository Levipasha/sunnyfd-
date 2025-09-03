import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MobileSidebar.css';

const MobileSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Inventory', icon: 'fas fa-boxes' },
    { path: '/orders', label: 'Orders', icon: 'fas fa-shopping-cart' },
    { path: '/recipes', label: 'Recipes', icon: 'fas fa-book' },
    { path: '/inventory-records', label: 'Inventory Records', icon: 'fas fa-chart-line' },
  ];

  const handleLinkClick = () => {
    onClose();
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
          
          <button className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;