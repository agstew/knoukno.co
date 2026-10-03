import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'kk_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const respond = (value) => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="kk-cookie-banner no-print" role="dialog" aria-label="Cookie notice">
      <div className="kk-cookie-inner">
        <p>We use cookies to keep you signed in and remember your preferences. See our <a href="/#cookies">cookie policy</a> for details.</p>
        <div className="kk-cookie-actions">
          <button type="button" className="btn btn-outline-light btn-sm" onClick={() => respond('rejected')}>Decline</button>
          <button type="button" className="btn btn-gold btn-sm" onClick={() => respond('accepted')}>Accept</button>
        </div>
      </div>
    </div>
  );
}
