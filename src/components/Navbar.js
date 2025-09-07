import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const today = new Date();
  const date = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/7084/7084512.png" 
            alt="Sunny Backreys Logo" 
            className="navbar-logo me-2"
          />
          <span>Sunny Backreys</span>
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Inventory</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/orders">Orders</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/inventory-records">Inventory Records</NavLink>
            </li>
          </ul>
          <span className="navbar-text">
            {date}
          </span>
          <div className="ms-3 d-flex align-items-center">
            {isAuthenticated ? (
              <button className="btn btn-outline-danger btn-sm" onClick={() => { onLogout?.(); window.dispatchEvent(new Event('auth-changed')); }}>Logout</button>
            ) : (
              <NavLink className="btn btn-outline-primary btn-sm" to="/login">Login</NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
