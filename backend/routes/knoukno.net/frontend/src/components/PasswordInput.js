import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ label = 'password', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-control">
      <input {...props} type={visible ? 'text' : 'password'} className="form-control" />
      <button
        type="button"
        className="visibility-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
        aria-pressed={visible}
        aria-controls={props.id}
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
