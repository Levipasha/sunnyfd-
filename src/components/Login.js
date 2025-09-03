import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PASSWORD = 'Vamshi.c2002';
const RESET_PASSKEY = '2002';

const Login = () => {
  const navigate = useNavigate();
  const [storedPassword, setStoredPassword] = useState(DEFAULT_PASSWORD);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isResetAllowed, setIsResetAllowed] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('appPassword');
    if (saved && typeof saved === 'string') {
      setStoredPassword(saved);
    } else {
      localStorage.setItem('appPassword', DEFAULT_PASSWORD);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const currentPassword = localStorage.getItem('appPassword') || storedPassword;
    if (passwordInput === currentPassword) {
      localStorage.setItem('isAuthenticated', 'true');
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/');
    } else {
      setErrorMessage('Incorrect password.');
    }
  };

  const handleCheckPasskey = (e) => {
    e.preventDefault();
    setResetMessage('');
    if (passkeyInput === RESET_PASSKEY) {
      setIsResetAllowed(true);
    } else {
      setIsResetAllowed(false);
      setResetMessage('Invalid passkey.');
    }
  };

  const handleResetPassword = (e) => {
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
    localStorage.setItem('appPassword', newPassword);
    setStoredPassword(newPassword);
    setPasskeyInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsResetAllowed(false);
    setIsForgotOpen(false);
    setResetMessage('Password has been reset. You can login now.');
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
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                className="form-control"
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
              />
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
                <div className="input-group">
                  <input
                    className="form-control"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Enter passkey"
                  />
                  <button type="submit" className="btn btn-secondary">Verify</button>
                </div>
              </form>

              <form onSubmit={handleResetPassword}>
                <fieldset disabled={!isResetAllowed}>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      className="form-control"
                      type="password"
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
                  <button type="submit" className="btn btn-success">Reset Password</button>
                </fieldset>
              </form>
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


