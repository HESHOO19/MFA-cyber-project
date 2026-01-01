import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Lock,
  Smartphone,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Clock,
  RefreshCw
} from 'lucide-react';
import './App.css';

const MFAAuthSystem = () => {
  // State Management
  const [currentView, setCurrentView] = useState('login');
  const [username, setUsername] = useState('demo_user');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [user, setUser] = useState(null);
  const [mfaMethod, setMfaMethod] = useState('totp');
  const [backupCodes, setBackupCodes] = useState([]);
  const [qrSecret, setQrSecret] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [logs, setLogs] = useState([]);
  const [adminView, setAdminView] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [smsChallenge, setSmsChallenge] = useState('');
  const [totpPreview, setTotpPreview] = useState('------');
  const [totpAnimationKey, setTotpAnimationKey] = useState(0);
  const [totpCurrentCode, setTotpCurrentCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const lockoutTimer = useRef(null);
  const totpTimer = useRef(null);
  const totpCurrentRef = useRef('');

  // Simulated User Database
  const users = useMemo(() => [
    {
      id: 1,
      username: 'demo_user',
      password: 'Demo@123',
      mfaEnabled: true,
      totpSecret: 'JBSWY3DPEHPK3PXP',
      phone: '+1-234-567-8900',
      trustedDevices: [],
      loginHistory: [],
      email: 'demo@example.com'
    },
    {
      id: 2,
      username: 'admin',
      password: 'Admin@123',
      mfaEnabled: true,
      totpSecret: 'ACDEFGHIJK123456',
      phone: '+1-234-567-8901',
      trustedDevices: [],
      loginHistory: [],
      email: 'admin@example.com'
    }
  ], []);

  // Utility Functions
  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, message, timestamp, id: Date.now() }]);
  }, []);

  const generateBackupCodes = useCallback(() => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = `${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
      codes.push(code);
    }
    return codes;
  }, []);

  const generateTOTPSecret = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }, []);

  const generateDemoTOTP = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  const validateTOTP = useCallback(
    (code) => {
      if (!/^\d{6}$/.test(code)) return false;
      return code === totpCurrentCode;
    },
    [totpCurrentCode]
  );

  const copyToClipboard = useCallback((text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const sendSmsCode = useCallback(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSmsChallenge(code);
    setVerificationError('');
    addLog('info', 'Demo SMS code generated and sent');
  }, [addLog]);

  useEffect(() => {
    if (!user?.totpSecret || currentView !== 'mfa' || mfaMethod !== 'totp') {
      if (totpTimer.current) {
        clearInterval(totpTimer.current);
        totpTimer.current = null;
      }
      totpCurrentRef.current = '';
      setTotpCurrentCode('');
      setTotpPreview('------');
      return;
    }

    const syncTotp = () => {
      const nextCode = generateDemoTOTP();
      totpCurrentRef.current = nextCode;
      setTotpCurrentCode(nextCode);
      setTotpPreview(nextCode);
      setTotpAnimationKey(Date.now());
    };

    // Generate initial code and sync animation
    syncTotp();

    // Calculate ms until next 30-second boundary
    const now = Date.now();
    const msUntilNextCycle = 30000 - (now % 30000);

    // Set timeout to sync at exact boundary, then interval every 30s
    const initialTimeout = setTimeout(() => {
      syncTotp();
      totpTimer.current = setInterval(syncTotp, 30000);
    }, msUntilNextCycle);

    return () => {
      clearTimeout(initialTimeout);
      if (totpTimer.current) {
        clearInterval(totpTimer.current);
        totpTimer.current = null;
      }
    };
  }, [user, currentView, mfaMethod, generateDemoTOTP]);

  useEffect(() => {
    return () => {
      if (lockoutTimer.current) {
        clearInterval(lockoutTimer.current);
      }
    };
  }, []);

  // Authentication Handlers
  const handleLogin = useCallback(() => {
    if (isLocked) {
      setVerificationError(`Account locked. Try again in ${lockoutTime} seconds`);
      addLog('error', 'Login attempt blocked - account locked');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setVerificationError('Please enter both username and password');
      return;
    }

    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      setVerificationError('');
      addLog('success', `Login successful for user: ${username}`);
      setUser(foundUser);
      if (foundUser.mfaEnabled) {
        setCurrentView('mfa');
      } else {
        setCurrentView('dashboard');
      }
      setLoginAttempts(0);
    } else {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      const remainingAttempts = 3 - attempts;

      if (attempts >= 3) {
        setIsLocked(true);
        setLockoutTime(300);
        setVerificationError('Account locked for 5 minutes due to too many failed attempts');
        addLog('error', 'Account locked - 3 failed login attempts');

        if (lockoutTimer.current) {
          clearInterval(lockoutTimer.current);
        }
        const interval = setInterval(() => {
          setLockoutTime(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              lockoutTimer.current = null;
              setIsLocked(false);
              setLoginAttempts(0);
              setVerificationError('');
              addLog('info', 'Account unlocked');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        lockoutTimer.current = interval;
      } else {
        setVerificationError(`Invalid credentials. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`);
        addLog('error', `Failed login attempt ${attempts}/3`);
      }
    }
  }, [username, password, loginAttempts, isLocked, lockoutTime, users, addLog]);

  const handleMFAVerification = useCallback(() => {
    setIsVerifying(true);
    
    setTimeout(() => {
      if (mfaMethod === 'totp') {
        if (validateTOTP(totpCode)) {
          setVerificationError('');
          addLog('success', 'TOTP verification successful');
          setCurrentView('dashboard');
          setTotpCode('');
        } else {
          setVerificationError('Invalid TOTP code. Please enter the 6-digit code shown above');
          addLog('error', 'Invalid TOTP code entered');
        }
      } else if (mfaMethod === 'sms') {
        if (!smsChallenge) {
          setVerificationError('Send the SMS code first.');
          addLog('error', 'SMS verification attempted before sending code');
          setIsVerifying(false);
          return;
        }
        if (smsCode === smsChallenge) {
          setVerificationError('');
          addLog('success', 'SMS verification successful');
          setCurrentView('dashboard');
          setSmsCode('');
          setSmsChallenge('');
        } else {
          setVerificationError('Invalid SMS code. Request a new one and try again.');
          addLog('error', 'Invalid SMS code entered');
        }
      }
      setIsVerifying(false);
    }, 500);
  }, [mfaMethod, totpCode, smsCode, smsChallenge, validateTOTP, addLog]);

  const handleMFASetup = useCallback(() => {
    const secret = generateTOTPSecret();
    setQrSecret(secret);
    const codes = generateBackupCodes();
    setBackupCodes(codes);
    setShowBackupCodes(true);
    addLog('info', 'MFA setup initiated - backup codes generated');
  }, [generateTOTPSecret, generateBackupCodes, addLog]);

  const handleLogout = useCallback(() => {
    addLog('info', `User ${user?.username} logged out`);
    setUser(null);
    setCurrentView('login');
    setUsername('demo_user');
    setPassword('Demo@123');
    setTotpCode('');
    setSmsCode('');
    setShowBackupCodes(false);
    setVerificationError('');
    setAdminView(false);
    setSmsChallenge('');
    setTotpPreview('------');
    setTotpCurrentCode('');
    totpCurrentRef.current = '';
  }, [user, addLog]);

  // View Components
  const LoginView = () => (
    <div className="container">
      <div className="card animate-slide-in">
        <div className="card-header">
          <div className="card-title">
            <Shield className="w-8 h-8 text-blue-600" />
            <span>Secure Login</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="input-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter username"
              disabled={isLocked}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter password"
                disabled={isLocked}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {verificationError && (
            <div className="alert alert-error">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{verificationError}</span>
            </div>
          )}

          {isLocked && (
            <div className="alert alert-warning">
              <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Account Locked</p>
                <p className="text-xs">Try again in {lockoutTime} seconds</p>
              </div>
            </div>
          )}

          {loginAttempts > 0 && !isLocked && (
            <div className="alert alert-warning">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">
                Failed attempts: {loginAttempts}/3 - Be careful!
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked}
            className="btn btn-primary btn-full"
            style={{ marginTop: '0.5rem' }}
          >
            {isLocked ? `Locked (${lockoutTime}s)` : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded text-center border-l-4 border-blue-600">
          <p className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-blue-800 font-mono">
            <p>👤 User: <span className="font-bold">demo_user</span></p>
            <p>🔐 Pass: <span className="font-bold">Demo@123</span></p>
            <p>📱 TOTP: <span className="font-bold">Rotating 6-digit (shown next step)</span></p>
            <p>💬 SMS: <span className="font-bold">Generate via “Send code”</span></p>
          </div>
        </div>
      </div>
    </div>
  );

  const MFAView = () => (
    <div className="container">
      <div className="card animate-slide-in">
        <div className="card-header">
          <div className="card-title">
            <Lock className="icon-lg text-green-600" />
            <span>Verify Identity</span>
          </div>
          <button
            onClick={() => setCurrentView('login')}
            className="icon-btn"
            title="Go back to login"
          >
            <XCircle className="icon-md" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center mb-4">Choose verification method:</p>
          <div className="mfa-method-grid">
            <button
              type="button"
              onClick={() => {
                setMfaMethod('totp');
                setVerificationError('');
                setTotpCode('');
              }}
              className={`mfa-method-btn ${mfaMethod === 'totp' ? 'active' : ''}`}
            >
              <Smartphone className="icon-lg text-blue-600" />
              <p className="text-sm font-semibold">Authenticator App</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaMethod('sms');
                setVerificationError('');
                setSmsCode('');
              }}
              className={`mfa-method-btn ${mfaMethod === 'sms' ? 'active' : ''}`}
            >
              <Key className="icon-lg text-blue-600" />
              <p className="text-sm font-semibold">SMS Code</p>
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMFAVerification();
          }}
          className="form-stack"
        >
          {mfaMethod === 'totp' ? (
            <>
              <div className="totp-panel">
                <div className="totp-header">
                  <span className="pill">Demo Code</span>
                  <span className="totp-timer">
                    <RefreshCw className="icon-sm text-gray-400" />
                    <span>30s cycle</span>
                  </span>
                </div>
                <div className="totp-display">
                  <span className="totp-code">{totpPreview}</span>
                </div>
                <div className="totp-progress">
                  <div 
                    key={totpAnimationKey}
                    className="totp-progress-fill totp-countdown"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the code above or use your authenticator app
                </p>
              </div>
              <div className="form-group">
                <label className="input-label">6-digit verification code</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="input-field input-code"
                  placeholder="● ● ● ● ● ●"
                  autoFocus
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="input-label">Code sent to {user?.phone}</label>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="input-field input-code"
                placeholder="● ● ● ● ● ●"
                autoFocus
              />
              <button
                type="button"
                className="btn btn-outline btn-full mt-3"
                onClick={sendSmsCode}
              >
                {smsChallenge ? 'Resend Code' : 'Send Code'}
              </button>
              {smsChallenge && (
                <div className="sms-hint">
                  <span>Demo code:</span>
                  <code>{smsChallenge}</code>
                </div>
              )}
            </div>
          )}

          {verificationError && (
            <div className="alert alert-error">
              <XCircle className="icon-sm flex-shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success btn-full btn-lg"
            disabled={isVerifying || (mfaMethod === 'totp' ? totpCode.length !== 6 : smsCode.length !== 6)}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="icon-sm spin" />
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('login')}
            className="btn btn-ghost btn-full"
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="container-lg">
      <div className="card mb-6 animate-slide-in">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.username}!</h1>
              <p className="text-sm text-gray-600">Successfully authenticated with MFA</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-800">MFA Status</h3>
          <p className="text-sm text-green-600 font-bold">✓ Enabled</p>
        </div>

        <div className="card text-center">
          <Key className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-800">Methods</h3>
          <p className="text-sm text-gray-600">TOTP + SMS</p>
        </div>

        <div className="card text-center">
          <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-800">Security</h3>
          <p className="text-sm text-green-600 font-bold">High</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">
            <Settings className="w-8 h-8 text-purple-600" />
            <span>MFA Management</span>
          </div>
        </div>

        {!showBackupCodes ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleMFASetup}
              className="btn btn-primary btn-full flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Setup New Authenticator
            </button>

            <button
              onClick={() => setAdminView(!adminView)}
              className="btn btn-secondary btn-full"
            >
              {adminView ? 'Hide' : 'View'} Security Logs
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="font-bold text-gray-800">Save Your Backup Codes</h3>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              Store these codes in a safe place. Each code can only be used once to recover your account.
            </p>

            <div className="bg-white rounded p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm mb-4">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{code}</span>
                    <button
                      onClick={() => copyToClipboard(code, idx)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedCode === idx ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">QR Code for Authenticator App</h4>
                <div className="bg-gray-100 p-4 rounded text-center">
                  <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600">Scan with Google Authenticator, Authy, or Microsoft Authenticator</p>
                  <div className="bg-white p-2 rounded mt-2 border border-gray-300">
                    <p className="text-xs font-mono text-gray-800 break-all">{qrSecret}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowBackupCodes(false)}
                className="btn btn-success btn-full"
              >
                I've Saved My Codes
              </button>
            </div>
          </div>
        )}
      </div>

      {adminView && (
        <div className="card animate-slide-in">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
              <span>Security Activity Log</span>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-gray-600 py-4">No activity logged yet</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg flex items-start gap-2 ${
                    log.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : log.type === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  {log.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : log.type === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{log.message}</p>
                    <p className="text-xs text-gray-500">{log.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      {currentView === 'login' && <LoginView />}
      {currentView === 'mfa' && <MFAView />}
      {currentView === 'dashboard' && <DashboardView />}
    </div>
  );
};

export default MFAAuthSystem;
