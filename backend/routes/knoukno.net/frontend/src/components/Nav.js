import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Nav() {
  const { isAuthenticated, isAdmin, tier, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const currentParams = new URLSearchParams(location.search);
  const workspaceParams = new URLSearchParams();
  if (currentParams.get('clientTitle')) {
    workspaceParams.set('clientTitle', currentParams.get('clientTitle'));
  } else if (currentParams.get('title')) {
    workspaceParams.set('title', currentParams.get('title'));
  } else {
    const activeBusinessTitle = localStorage.getItem('kk_active_business_title');
    if (activeBusinessTitle) workspaceParams.set('clientTitle', activeBusinessTitle);
  }
  const workspaceLink = (focus = '') => {
    const params = new URLSearchParams(workspaceParams);
    if (focus) params.set('focus', focus);
    return `/questions${params.size ? `?${params.toString()}` : ''}`;
  };
  const hasAdvancedTools = isAdmin || tier === 'members' || tier === 'pro';
  const backendActive = (name) => {
    if (name === 'title') return location.pathname === '/list';
    if (!['/dashboard', '/title', '/questions'].includes(location.pathname)) return false;
    return name === (currentParams.get('focus') || 'questions');
  };
  const backendClass = (name) => backendActive(name) ? 'nav-link active' : 'nav-link';

  return (
    <nav className="nav" aria-label="Main navigation">
      <div className="nav-inner">
        <Link to={isAuthenticated ? '/list' : '/'} className="nav-brand" onClick={() => setMenuOpen(false)} aria-label="Kno U Kno home">
          <img className="nav-logo" src="/img/logo-mark.svg" alt="" width="36" height="36" />
          <span className="nav-wordmark">Kno U <span>Kno</span></span>
        </Link>

        <button type="button" className="nav-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="site-navigation-links" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={25} aria-hidden="true" /> : <Menu size={25} aria-hidden="true" />}
        </button>
        <div id="site-navigation-links" className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link to="/list" className={backendClass('title')} onClick={() => setMenuOpen(false)}>Title</Link>
              <Link to={workspaceLink()} className={backendClass('questions')} onClick={() => setMenuOpen(false)}>Question</Link>
              <Link to={workspaceLink('print')} className={backendClass('print')} onClick={() => setMenuOpen(false)}>Print</Link>
              {hasAdvancedTools ? (
                <>
                  <Link to={workspaceLink('grade')} className={backendClass('grade')} onClick={() => setMenuOpen(false)}>Grade</Link>
                  <Link to={workspaceLink('rate')} className={backendClass('rate')} onClick={() => setMenuOpen(false)}>Rated</Link>
                  <Link to={workspaceLink('average')} className={backendClass('average')} onClick={() => setMenuOpen(false)}>Average</Link>
                </>
              ) : (
                <>
                  <span className="nav-link disabled" aria-disabled="true">Grade</span>
                  <span className="nav-link disabled" aria-disabled="true">Rated</span>
                  <span className="nav-link disabled" aria-disabled="true">Average</span>
                </>
              )}
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
              <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/about" className={isActive('/about')} onClick={() => setMenuOpen(false)}>About</Link>
              <Link to="/price" className={isActive('/price')} onClick={() => setMenuOpen(false)}>Price</Link>
              <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
