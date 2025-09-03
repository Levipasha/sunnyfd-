import React from 'react';
import './MobileHeader.css';

const MobileHeader = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <header className="mobile-header">
      <div className="header-content">
        <button 
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <div className={`hamburger-icon ${isSidebarOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        
        <div className="app-title">
          <h1>Sunny Backreys</h1>
        </div>
        
        <div className="header-spacer"></div>
      </div>
    </header>
  );
};

export default MobileHeader;