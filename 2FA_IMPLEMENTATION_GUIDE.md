# Two-Factor Authentication (2FA) Implementation Guide

This document provides a comprehensive guide to implementing Two-Factor Authentication (2FA) in your application, based on the implementation in the Seqwens project.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Components](#components)
4. [Implementation Flow](#implementation-flow)
5. [Code Examples](#code-examples)
6. [UI/UX Considerations](#uiux-considerations)

---

## Overview

The 2FA implementation supports:
- **Setup**: QR code generation and secret key backup
- **Verification**: During setup and login
- **Disable**: Password-protected deactivation
- **Status Management**: Check if 2FA is enabled

### Technology Stack
- **Backend**: TOTP (Time-based One-Time Password) standard
- **Frontend**: React with Bootstrap
- **Authenticator Apps**: Google Authenticator, Authy, Microsoft Authenticator, etc.

---

## API Endpoints

### 1. Setup 2FA (Get QR Code)
**Endpoint**: `GET /user/two-factor/setup/`  
**Auth Required**: Yes  
**Response**:
```json
{
  "success": true,
  "data": {
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "instructions": "Scan this QR code with your authenticator app...",
    "is_enabled": false
  }
}
```

### 2. Verify 2FA Setup
**Endpoint**: `POST /user/two-factor/verify-setup/`  
**Auth Required**: Yes  
**Request Body**:
```json
{
  "code": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```
**Response**:
```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "data": {
    "is_enabled": true,
    "enabled_at": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Disable 2FA
**Endpoint**: `POST /user/two-factor/disable/`  
**Auth Required**: Yes  
**Request Body**:
```json
{
  "password": "user_password"
}
```
**Response**:
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

### 4. Verify 2FA During Login
**Endpoint**: `POST /user/two-factor/verify-login/`  
**Auth Required**: No (Public endpoint)  
**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```
**Response**:
```json
{
  "success": true,
  "access_token": "...",
  "refresh_token": "...",
  "user": { ... }
}
```

### 5. Check 2FA Status
**Endpoint**: `GET /user/two-factor/setup/`  
**Auth Required**: Yes  
**Response** (if enabled):
```json
{
  "success": true,
  "data": {
    "is_enabled": true,
    "enabled_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Components

### 1. TwoFactorSetupModal

**Location**: `src/Taxpreparer/pages/AccountSettings/TwoFactorSetupModal.jsx`

**Purpose**: Modal component for setting up 2FA with QR code display and verification.

**Features**:
- QR code display
- Secret key backup (show/hide)
- Two-step process: Scan QR → Verify Code
- Auto-verification when 6-digit code is entered
- Error handling and loading states

**Props**:
```javascript
{
  show: boolean,           // Modal visibility
  onClose: function,       // Close handler
  onSuccess: function      // Success callback
}
```

**Key Functions**:
- `handleSetup2FA()`: Fetches QR code and secret
- `handleVerify2FASetup(code)`: Verifies the 6-digit code
- `handleCodeComplete(code)`: Auto-verifies when code is complete

---

### 2. TwoFactorCodeInput

**Location**: `src/ClientOnboarding/components/TwoFactorCodeInput.jsx`

**Purpose**: Reusable 6-digit code input component with auto-advance and paste support.

**Features**:
- 6 individual input fields
- Auto-advance to next field
- Backspace navigation
- Paste support (Ctrl+V / Cmd+V)
- Arrow key navigation
- Visual feedback (focus, error states)
- Customizable styling via `uiHints`

**Props**:
```javascript
{
  value: string,           // Current code value
  onChange: function,      // Change handler
  onComplete: function,    // Called when 6 digits entered
  error: string,           // Error message
  disabled: boolean,       // Disable state
  autoFocus: boolean,      // Auto-focus first input
  uiHints: object          // Custom styling hints
}
```

**UI Hints Structure**:
```javascript
{
  backgroundColor: '#ffffff',
  textColor: '#000000',
  borderColor: '#007bff',
  focusBorderColor: '#0056b3',
  errorColor: '#dc3545',
  successColor: '#28a745',
  inputPlaceholder: 'Enter 6-digit code'
}
```

---

### 3. Security Settings Component

**Location**: `src/FirmAdmin/Pages/AccountSettings/Security.jsx`  
**Also**: `src/Taxpreparer/pages/AccountSettings/Security.jsx`

**Purpose**: Main security settings page with 2FA enable/disable functionality.

**Features**:
- Display 2FA status
- Enable 2FA button (opens setup modal)
- Disable 2FA (password-protected)
- Show enabled date
- Refresh status after setup/disable

**State Management**:
```javascript
const [twoFactor, setTwoFactor] = useState(false);
const [twoFactorEnabledAt, setTwoFactorEnabledAt] = useState(null);
const [show2FASetupModal, setShow2FASetupModal] = useState(false);
const [showDisable2FA, setShowDisable2FA] = useState(false);
const [disablePassword, setDisablePassword] = useState('');
```

---

## Implementation Flow

### Setup Flow

1. **User clicks "Enable 2FA"**
   ```javascript
   const handleSetup2FA = () => {
     setShow2FASetupModal(true);
   };
   ```

2. **Modal opens and fetches QR code**
   ```javascript
   const response = await userAPI.setup2FA();
   // Response contains: qr_code, secret, instructions
   ```

3. **User scans QR code with authenticator app**

4. **User enters 6-digit code**
   ```javascript
   const response = await userAPI.verify2FASetup(code, secret);
   ```

5. **On success, refresh 2FA status**
   ```javascript
   const handle2FASetupSuccess = async () => {
     const response = await userAPI.setup2FA();
     if (response.success && response.data.is_enabled) {
       setTwoFactor(true);
       setTwoFactorEnabledAt(response.data.enabled_at);
     }
   };
   ```

### Login Flow

1. **User enters email and password**
   ```javascript
   const response = await userAPI.login({ email, password });
   ```

2. **Check if 2FA is required**
   ```javascript
   if (response.requires_2fa === true) {
     setRequires2FA(true);
     setTwoFactorMessage(response.message);
     setTwoFactorInstructions(response.instructions);
     setTwoFactorUIHints(response.ui_hints);
     return;
   }
   ```

3. **User enters 6-digit code**
   ```javascript
   const response = await userAPI.verify2FALogin(email, code);
   ```

4. **Complete login on success**
   ```javascript
   if (response.success) {
     await completeLogin(response.data || response);
   }
   ```

### Disable Flow

1. **User clicks "Disable 2FA"**
   ```javascript
   setShowDisable2FA(true);
   ```

2. **User enters password**
   ```javascript
   const response = await userAPI.disable2FA(password);
   ```

3. **On success, update state**
   ```javascript
   if (response.success) {
     setTwoFactor(false);
     setTwoFactorEnabledAt(null);
     setShowDisable2FA(false);
   }
   ```

---

## Code Examples

### API Utils Implementation

```javascript
// src/utils/apiUtils.js

export const userAPI = {
  // Setup 2FA (Get QR code and secret)
  setup2FA: async () => {
    return await apiRequest('/user/two-factor/setup/', 'GET');
  },

  // Verify 2FA Setup
  verify2FASetup: async (code, secret) => {
    const payload = {
      code: code,
      secret: secret,
    };
    return await apiRequest('/user/two-factor/verify-setup/', 'POST', payload);
  },

  // Disable 2FA
  disable2FA: async (password) => {
    const payload = {
      password: password,
    };
    return await apiRequest('/user/two-factor/disable/', 'POST', payload);
  },

  // Verify 2FA during login
  verify2FALogin: async (email, code) => {
    const payload = {
      email: email,
      code: code,
    };
    return await publicApiRequest('/user/two-factor/verify-login/', 'POST', payload);
  },
};
```

### Security Settings Component Example

```javascript
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { userAPI } from "../utils/apiUtils";
import TwoFactorSetupModal from "./TwoFactorSetupModal";

export default function Security() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoFactorEnabledAt, setTwoFactorEnabledAt] = useState(null);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await userAPI.setup2FA();
        if (response.success && response.data.is_enabled) {
          setTwoFactor(true);
          setTwoFactorEnabledAt(response.data.enabled_at);
        }
      } catch (err) {
        console.log('2FA not enabled');
      }
    };
    fetch2FAStatus();
  }, []);

  // Handle 2FA setup success
  const handle2FASetupSuccess = async () => {
    try {
      const response = await userAPI.setup2FA();
      if (response.success && response.data.is_enabled) {
        setTwoFactor(true);
        setTwoFactorEnabledAt(response.data.enabled_at);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    }
  };

  // Handle disable 2FA
  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }

    try {
      const response = await userAPI.disable2FA(disablePassword);
      if (response.success) {
        setTwoFactor(false);
        setTwoFactorEnabledAt(null);
        setShowDisable2FA(false);
        setDisablePassword('');
        toast.success("2FA disabled successfully");
      }
    } catch (err) {
      toast.error("Failed to disable 2FA");
    }
  };

  return (
    <div>
      {/* 2FA Section */}
      <div>
        <h5>Two-Factor Authentication</h5>
        {twoFactor ? (
          <>
            <p>✓ Enabled {twoFactorEnabledAt && `on ${new Date(twoFactorEnabledAt).toLocaleDateString()}`}</p>
            <button onClick={() => setShowDisable2FA(true)}>
              Disable 2FA
            </button>
          </>
        ) : (
          <button onClick={() => setShow2FASetupModal(true)}>
            Enable 2FA
          </button>
        )}
      </div>

      {/* Disable 2FA Form */}
      {showDisable2FA && (
        <div>
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Enter your password"
          />
          <button onClick={handleDisable2FA}>Disable 2FA</button>
          <button onClick={() => setShowDisable2FA(false)}>Cancel</button>
        </div>
      )}

      {/* Setup Modal */}
      <TwoFactorSetupModal
        show={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        onSuccess={handle2FASetupSuccess}
      />
    </div>
  );
}
```

### Login with 2FA Example

```javascript
import { useState } from "react";
import { userAPI } from "../utils/apiUtils";
import TwoFactorCodeInput from "../components/TwoFactorCodeInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await userAPI.login({ email, password });
      
      // Check if 2FA is required
      if (response.requires_2fa === true) {
        setRequires2FA(true);
        return;
      }
      
      // Normal login flow
      await completeLogin(response);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleVerify2FA = async (code) => {
    if (!code || code.length !== 6) {
      setTwoFactorError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const response = await userAPI.verify2FALogin(email, code);
      
      if (response.success) {
        await completeLogin(response.data || response);
      } else {
        setTwoFactorError('Invalid verification code');
      }
    } catch (error) {
      setTwoFactorError('Invalid verification code');
    }
  };

  if (requires2FA) {
    return (
      <div>
        <h2>Enter 2FA Code</h2>
        <TwoFactorCodeInput
          value={twoFactorCode}
          onChange={setTwoFactorCode}
          onComplete={handleVerify2FA}
          error={twoFactorError}
        />
        <button onClick={() => setRequires2FA(false)}>Back to Login</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## UI/UX Considerations

### 1. QR Code Display
- Display QR code in a centered, bordered container
- Recommended size: 280x280px
- Add padding and white background for better scanning
- Include instructions above the QR code

### 2. Secret Key Backup
- Provide a "Show/Hide" toggle for the secret key
- Display in monospace font for readability
- Include warning about keeping it secure
- Allow copying to clipboard

### 3. Code Input
- Use 6 individual input fields for better UX
- Auto-advance between fields
- Support paste functionality
- Show clear error messages
- Disable inputs during verification

### 4. Loading States
- Show spinner during QR code generation
- Disable buttons during API calls
- Prevent modal closure during verification

### 5. Error Handling
- Display user-friendly error messages
- Clear errors when user starts typing
- Provide retry options
- Show validation errors immediately

### 6. Success Feedback
- Show success toast notifications
- Update UI state immediately
- Refresh 2FA status after operations

---

## Security Best Practices

1. **Password Protection**: Always require password to disable 2FA
2. **Secret Key Backup**: Store secret key securely, never log it
3. **Rate Limiting**: Implement rate limiting on verification endpoints
4. **Session Management**: Invalidate sessions on 2FA disable
5. **Error Messages**: Don't reveal if email exists in error messages
6. **Token Expiry**: Set appropriate expiry times for verification tokens

---

## Testing Checklist

- [ ] Setup 2FA flow works correctly
- [ ] QR code displays and is scannable
- [ ] Secret key can be shown/hidden
- [ ] 6-digit code verification works
- [ ] Login with 2FA works
- [ ] Disable 2FA requires password
- [ ] 2FA status updates correctly
- [ ] Error handling works for invalid codes
- [ ] Loading states display correctly
- [ ] Modal can be closed/cancelled appropriately

---

## Dependencies

```json
{
  "react": "^19.1.0",
  "react-bootstrap": "^2.10.10",
  "react-toastify": "^11.0.5"
}
```

---

## File Structure

```
src/
├── components/
│   └── TwoFactorCodeInput.jsx          # Reusable code input component
├── pages/
│   └── AccountSettings/
│       └── Security.jsx                # Security settings page
│   └── AccountSettings/
│       └── TwoFactorSetupModal.jsx      # Setup modal component
├── Login-setup/
│   └── Login.jsx                        # Login with 2FA verification
└── utils/
    └── apiUtils.jsx                     # API functions
```

---

## Notes

- The implementation uses TOTP (RFC 6238) standard
- Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
- QR codes are generated in base64 format
- Secret keys should be stored securely on the backend
- Consider implementing backup codes for account recovery

---

## Support

For questions or issues, refer to:
- TOTP Specification: RFC 6238
- Google Authenticator: https://github.com/google/google-authenticator
- OWASP 2FA Guidelines: https://owasp.org/www-project-authentication-cheat-sheet/

