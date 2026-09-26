import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Nav() {
  const { isAuthenticated, isAdmin, user, logout, tier } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'members' ? 'Members' : 'Free';
  const tierClass = tier === 'pro' ? 'pro' : tier === 'members' ? 'members' : '';

  return (
    <nav className="nav" aria-label="Main navigation">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)} aria-label="knoukno.org home">
          <span className="nav-mark" aria-hidden="true">K<span>.</span></span>
          <span className="nav-wordmark">knoukno<span>.org</span></span>
        </Link>

        <button type="button" className="nav-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="site-navigation-links" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={25} aria-hidden="true" /> : <Menu size={25} aria-hidden="true" />}
        </button>
        <div id="site-navigation-links" className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}>
          <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/about" className={isActive('/about')} onClick={() => setMenuOpen(false)}>About</Link>
          <Link to="/price" className={isActive('/price')} onClick={() => setMenuOpen(false)}>Price</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMenuOpen(false)}>
                Dashboard
                {tierClass && (
                  <span className={`nav-tier-badge ${tierClass}`}>{tierLabel}</span>
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin" className={isActive('/admin')} onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              <button
                className="nav-link btn-nav"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="nav-link btn-nav" onClick={() => setMenuOpen(false)}>Start free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
