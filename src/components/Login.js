import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

const DEFAULT_PASSWORD = 'Vamshi.c2002';
const DEFAULT_PASSKEY = '2002';
const MASTER_KEY_FOR_PASSKEY_RESET = '8341339097';

const Login = () => {
  const navigate = useNavigate();
  const [storedPassword, setStoredPassword] = useState(DEFAULT_PASSWORD);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isResetAllowed, setIsResetAllowed] = useState(false); // for password reset
  const [isPasskeyResetMode, setIsPasskeyResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const newPasswordRef = useRef(null);
  const [storedPasskey, setStoredPasskey] = useState(DEFAULT_PASSKEY);
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmNewPasskey, setConfirmNewPasskey] = useState('');

  const canReset = isResetAllowed && newPassword && confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 4;

  useEffect(() => {
    const saved = localStorage.getItem('appPassword');
    if (saved && typeof saved === 'string') {
      setStoredPassword(saved);
    } else {
      localStorage.setItem('appPassword', DEFAULT_PASSWORD);
    }
    // load or initialize passkey
    const savedPasskey = localStorage.getItem('appPasskey');
    if (savedPasskey && typeof savedPasskey === 'string') {
      setStoredPasskey(savedPasskey);
    } else {
      localStorage.setItem('appPasskey', DEFAULT_PASSKEY);
      setStoredPasskey(DEFAULT_PASSKEY);
    }
    // Ensure reset UI is closed/cleared on entry
    setIsForgotOpen(false);
    setIsResetAllowed(false);
    setIsPasskeyResetMode(false);
    setPasskeyInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasskey('');
    setConfirmNewPasskey('');
    setResetMessage('');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    AuthService.login('Vamshi', passwordInput)
      .then(() => {
        localStorage.setItem('isAuthenticated', 'true');
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/');
      })
      .catch((err) => setErrorMessage(err.message || 'Incorrect password.'));
  };

  const handleCheckPasskey = async (e) => {
    e.preventDefault();
    setResetMessage('');
    // master key unlocks passkey reset mode
    try {
      await AuthService.verifyMaster(passkeyInput);
      setIsPasskeyResetMode(true);
      setIsResetAllowed(false);
      return;
    } catch {}
    // normal passkey unlocks password reset
    try {
      await AuthService.verifyPasskey('Vamshi', passkeyInput);
      setIsPasskeyResetMode(false);
      setIsResetAllowed(true);
      setTimeout(() => {
        try { newPasswordRef.current && newPasswordRef.current.focus(); } catch {}
      }, 0);
      return;
    } catch {}
    setIsResetAllowed(false);
    setIsPasskeyResetMode(false);
    setResetMessage('Invalid passkey.');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    if (!isResetAllowed) {
      setResetMessage('Enter a valid passkey first.');
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setResetMessage('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetMessage('Passwords do not match.');
      return;
    }
    try {
      await AuthService.resetPassword('Vamshi', newPassword, passkeyInput);
    } catch (e) {
      setResetMessage(e.message || 'Reset failed');
      return;
    }
    setPasskeyInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsResetAllowed(false);
    setIsForgotOpen(false);
    setResetMessage('');
    // Force logout and redirect to login
    localStorage.removeItem('isAuthenticated');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login');
  };

  const handleResetPasskey = (e) => {
    e.preventDefault();
    setResetMessage('');
    if (!isPasskeyResetMode) {
      setResetMessage('Enter the special key to reset passkey.');
      return;
    }
    if (!newPasskey || !confirmNewPasskey) {
      setResetMessage('Please fill in both passkey fields.');
      return;
    }
    if (newPasskey !== confirmNewPasskey) {
      setResetMessage('Passkeys do not match.');
      return;
    }
    (async () => {
      try {
        await AuthService.resetPasskey('Vamshi', newPasskey, MASTER_KEY_FOR_PASSKEY_RESET);
        setStoredPasskey(newPasskey);
      } catch (e) {
        setResetMessage(e.message || 'Passkey reset failed');
        return;
      }
      setNewPasskey('');
      setConfirmNewPasskey('');
      setIsPasskeyResetMode(false);
      setPasskeyInput('');
      setResetMessage('Passkey updated successfully.');
    })();
  };

  return (
    <div className="d-flex justify-content-center align-items-start" style={{ minHeight: '60vh' }}>
      <div className="card shadow" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body">
          <h4 className="card-title mb-3">Login</h4>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" value="Vamshi" readOnly />
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-3" style={{ position: 'relative' }}>
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '36px',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer'
                }}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errorMessage && (
              <div className="alert alert-danger py-2" role="alert">{errorMessage}</div>
            )}
            <div className="d-flex justify-content-between align-items-center">
              <button type="submit" className="btn btn-primary">Login</button>
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => { setIsForgotOpen((v) => !v); setResetMessage(''); }}
              >
                Forgot password?
              </button>
            </div>
          </form>

          {isForgotOpen && (
            <div className="mt-4 border-top pt-3">
              <h6>Reset Password</h6>
              <form onSubmit={handleCheckPasskey} className="mb-3">
                <label className="form-label">Passkey</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    className="form-control"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Enter passkey"
                    aria-label="Passkey"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    Verify
                  </button>
                </div>
              </form>

              <form onSubmit={handleResetPassword}>
                <fieldset disabled={!isResetAllowed}>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      className="form-control"
                      type="password"
                      ref={newPasswordRef}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      className="form-control"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button type="submit" className="btn btn-success" disabled={!canReset} title={!isResetAllowed ? 'Verify passkey first' : (!newPassword || !confirmNewPassword) ? 'Enter both password fields' : (newPassword !== confirmNewPassword) ? 'Passwords must match' : (newPassword.length < 4 ? 'Password too short' : 'Save new password')}>
                    Save
                  </button>
                </fieldset>
              </form>

              {/* Reset Passkey Section - only rendered after special key verification */}
              {isPasskeyResetMode && (
                <form onSubmit={handleResetPasskey} className="mt-3">
                  <h6>Reset Passkey</h6>
                  <div className="mb-3">
                    <label className="form-label">New Passkey</label>
                    <input
                      className="form-control"
                      type="password"
                      value={newPasskey}
                      onChange={(e) => setNewPasskey(e.target.value)}
                      placeholder="Enter new passkey"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm New Passkey</label>
                    <input
                      className="form-control"
                      type="password"
                      value={confirmNewPasskey}
                      onChange={(e) => setConfirmNewPasskey(e.target.value)}
                      placeholder="Confirm new passkey"
                    />
                  </div>
                  <button type="submit" className="btn btn-warning" disabled={!newPasskey || !confirmNewPasskey || newPasskey !== confirmNewPasskey}>
                    Save Passkey
                  </button>
                </form>
              )}
              {resetMessage && (
                <div className={`alert ${resetMessage.includes('reset') ? 'alert-success' : 'alert-danger'} mt-3 py-2`} role="alert">
                  {resetMessage}
                </div>
              )}
              <div className="form-text mt-2">Default password: {DEFAULT_PASSWORD}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;


