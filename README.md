# MFA Authentication System

A modern, secure Multi-Factor Authentication (MFA) system built with React. This application demonstrates best practices for implementing TOTP (Time-based One-Time Password) and SMS-based authentication with comprehensive security logging.

##  Features

### Dual MFA Methods
- **TOTP (Authenticator App)** - Support for Google Authenticator, Authy, Microsoft Authenticator
- **SMS Code Verification** - Text-based code delivery

### Security Features
- Account lockout after 3 failed login attempts (5-minute cooldown)
- Real-time security activity logging
- Backup code generation and management
- QR code generation for easy authenticator setup
- Password visibility toggle
- Input validation and error handling
- Clear security status indicators


##  Project Structure

```
mfa-auth-system/
├── public/
│   ├── index.html          # Main HTML with improved meta tags
│   ├── manifest.json       # PWA configuration
│   └── favicon.ico         # App icon
├── src/
│   ├── App.js              # 900+ line main component (complete)
│   ├── App.css             # Comprehensive styling system
│   ├── index.js            # React entry point (cleaned up)
│   ├── index.css           # Global styles with animations
│   └── setupTests.js       # Test setup (optional)
├── package.json            # Dependencies and scripts
└── README.md              # Documentation
```


##  Demo Credentials

| Field | Value |
|-------|-------|
| **Username** | `demo_user` |
| **Password** | `Demo@123` |
| **TOTP Code** | Any 6 digits |
| **SMS Code** | `123456` |

**Admin Account**: Username `admin` with password `Admin@123`

##  How to Use

### Login Flow
1. **Enter Credentials**
   - Enter username: `demo_user`
   - Enter password: `Demo@123`
   - Click "Login" or press Enter

2. **MFA Verification**
   - Select verification method (Authenticator App or SMS Code)
   - **TOTP Method**: Enter any 6 digits
   - **SMS Method**: Use code `123456`
   - Click "Verify"

3. **Dashboard**
   - View MFA status and security level
   - Access MFA management features
   - View real-time security logs
   - Click "Logout" to end session

### MFA Setup Wizard
1. Click "Setup New Authenticator" on dashboard
2. Review the 10 generated backup codes
3. Scan QR code with your authenticator app
4. Save backup codes in a secure location
5. Click "I've Saved My Codes" to complete

##  Security Features

### Account Lockout System
- 3 attempts before automatic 5-minute lockout
- Real-time countdown timer displayed
- Secure password reset mechanism
- Prevents brute force attacks

### Security Logging
- All authentication events logged with timestamps
- Color-coded event types (Success/Error/Info)
- Accessible from dashboard admin view
- Shows login attempts and MFA events

### Backup Codes
- 10 unique codes generated per setup
- One-time use only
- Copy-to-clipboard with feedback
- Critical account recovery tool




### Documentation
- ✓ Comprehensive README with examples
- ✓ Clear demo credentials display
- ✓ Helpful tooltips and instructions
- ✓ Intuitive error messages
- ✓ Well-commented code


##  Future Enhancement Ideas

- [ ] Backend API integration with Node.js/Express
- [ ] MongoDB/PostgreSQL database persistence
- [ ] Email verification system
- [ ] Biometric authentication (fingerprint, face ID)
- [ ] Device trust management
- [ ] Session management with JWT
- [ ] Rate limiting and anti-DDoS
- [ ] Security audit logs export (CSV/PDF)
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Two-factor authentication (2FA) option
- [ ] Integration with real TOTP libraries (speakeasy, otplib)



##  License

MIT License - Feel free to use this project for learning, demonstration, and educational purposes.

