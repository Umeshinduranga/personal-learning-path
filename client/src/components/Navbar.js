import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          🎓 Learning Path
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
          <div className="navbar-start">
            <Link to="/" className="navbar-item" onClick={closeMenu}>
              Home
            </Link>
            <Link to="/browse" className="navbar-item" onClick={closeMenu}>
              Browse Paths
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/my-paths" className="navbar-item" onClick={closeMenu}>
                  My Paths
                </Link>
                <Link to="/ai-generator" className="navbar-item" onClick={closeMenu}>
                  AI Generator
                </Link>
              </>
            )}
          </div>

          <div className="navbar-end">
            {isAuthenticated ? (
              <div className="navbar-item has-dropdown is-hoverable">
                <a className="navbar-link">
                  👤 {user?.firstName || user?.username}
                </a>
                <div className="navbar-dropdown">
                  <Link to="/profile" className="navbar-item" onClick={closeMenu}>
                    Profile
                  </Link>
                  <Link to="/dashboard" className="navbar-item" onClick={closeMenu}>
                    Dashboard
                  </Link>
                  <hr className="navbar-divider" />
                  <button className="navbar-item button-link" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="navbar-item">
                <div className="buttons">
                  <Link to="/register" className="button is-primary" onClick={closeMenu}>
                    Sign up
                  </Link>
                  <Link to="/login" className="button is-light" onClick={closeMenu}>
                    Log in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-burger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;