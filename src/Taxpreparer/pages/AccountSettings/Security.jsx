import { useState, useEffect } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons";
import { toast } from "react-toastify";
import { taxPreparerSecurityAPI, userAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import TwoFactorSetupModal from "./TwoFactorSetupModal";

const Security = ({ security, onUpdate }) => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoFactorEnabledAt, setTwoFactorEnabledAt] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 2FA Setup Modal state
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);

  // 2FA Disable states
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState(null);

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Password visibility states
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpError, setEmailOtpError] = useState(null);
  const [emailVerifying, setEmailVerifying] = useState(false);

  // Phone verification states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState(null);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  useEffect(() => {
    const fetchSecurityPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await taxPreparerSecurityAPI.getSecurityPreferences();
        console.log('Fetched security preferences:', data);

        // Map API response to component state
        if (data) {
          // Handle nested response structure
          const securityData = data.data || data;
          console.log('Security data structure:', securityData);

          setTwoFactor(securityData.two_factor_authentication || securityData.two_factor_enabled || false);
          setTwoFactorEnabledAt(securityData.two_factor_enabled_at || securityData.enabled_at || null);
          setSessionTimeout(securityData.session_timeout || 30);
          setIsEmailVerified(securityData.is_email_verified || false);
          setIsPhoneVerified(securityData.is_phone_verified || false);
        } else if (security) {
          // Fallback to props if API doesn't return data
          setTwoFactor(security.two_factor_authentication ?? false);
          setSessionTimeout(security.session_timeout ?? 30);
          setIsEmailVerified(security.is_email_verified ?? false);
          setIsPhoneVerified(security.is_phone_verified ?? false);
        }
      } catch (err) {
        console.error('Error fetching security preferences:', err);
        setError(handleAPIError(err));
        // If API fails, use props as fallback
        if (security) {
          setTwoFactor(security.two_factor_authentication ?? false);
          setSessionTimeout(security.session_timeout ?? 30);
          setIsEmailVerified(security.is_email_verified ?? false);
          setIsPhoneVerified(security.is_phone_verified ?? false);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSecurityPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const apiData = {
        session_timeout: sessionTimeout,
      };

      console.log('Saving security preferences:', apiData);

      await taxPreparerSecurityAPI.updateSecurityPreferences(apiData);

      // Show success toast
      toast.success("Security settings saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving security preferences:', err);
      const errorMessage = handleAPIError(err);
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage || "Failed to save security settings", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // 2FA Setup Functions
  const handleSetup2FA = () => {
    setShow2FASetupModal(true);
  };

  const handle2FASetupSuccess = async () => {
    // Refresh security preferences to get updated 2FA status
    try {
      const data = await taxPreparerSecurityAPI.getSecurityPreferences();
      if (data) {
        const securityData = data.data || data;
        setTwoFactor(securityData.two_factor_authentication || securityData.two_factor_enabled || false);
        setTwoFactorEnabledAt(securityData.two_factor_enabled_at || securityData.enabled_at || null);
      }
    } catch (err) {
      console.error('Error fetching updated security preferences:', err);
    }

    if (onUpdate) {
      onUpdate();
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setDisableError('Please enter your password');
      return;
    }

    setDisabling(true);
    setDisableError(null);

    try {
      const response = await userAPI.disable2FA(disablePassword);

      if (response.success) {
        setTwoFactor(false);
        setTwoFactorEnabledAt(null);
        setShowDisable2FA(false);
        setDisablePassword('');

        toast.success("2FA disabled successfully", {
          position: "top-right",
          autoClose: 3000,
        });

        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(response.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      const errorMessage = handleAPIError(err);
      setDisableError(errorMessage);
      toast.error(errorMessage || "Failed to disable 2FA", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDisabling(false);
    }
  };


  const cancelDisable2FA = () => {
    setShowDisable2FA(false);
    setDisablePassword('');
    setDisableError(null);
  };

  const handlePasswordUpdate = async () => {
    setPasswordSaving(true);
    setPasswordError(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordSaving(false);
      toast.error('New passwords do not match', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      setPasswordSaving(false);
      toast.error('Password must be at least 8 characters long', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const passwordData = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      };

      console.log('Updating password...');

      await taxPreparerSecurityAPI.updatePassword(passwordData);

      // Show success toast
      toast.success("Password updated successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      const errorMessage = handleAPIError(err);
      setPasswordError(errorMessage);

      // Show error toast
      toast.error(errorMessage || "Failed to update password", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Email Verification Handlers
  const handleSendEmailOtp = async () => {
    setEmailVerifying(true);
    setEmailOtpError(null);
    try {
      const response = await taxPreparerSecurityAPI.sendEmailVerificationOtp();
      if (response?.success !== false) {
        setEmailOtpSent(true);
        setEmailOtp('');
        toast.success('OTP sent to your email address!', { position: 'top-right', autoClose: 3000 });
      } else {
        throw new Error(response?.message || 'Failed to send OTP');
      }
    } catch (err) {
      const msg = handleAPIError(err);
      setEmailOtpError(msg);
      toast.error(msg || 'Failed to send email OTP', { position: 'top-right', autoClose: 3000 });
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) return;
    setEmailVerifying(true);
    setEmailOtpError(null);
    try {
      const response = await taxPreparerSecurityAPI.verifyEmailOtp(emailOtp);
      if (response?.success !== false) {
        setIsEmailVerified(true);
        setEmailOtpSent(false);
        setEmailOtp('');
        toast.success('Email verified successfully!', { position: 'top-right', autoClose: 3000 });
        if (onUpdate) onUpdate();
      } else {
        throw new Error(response?.message || 'Invalid OTP');
      }
    } catch (err) {
      const msg = handleAPIError(err);
      setEmailOtpError(msg || 'Invalid or expired OTP. Please try again.');
    } finally {
      setEmailVerifying(false);
    }
  };

  // Phone Verification Handlers
  const handleSendPhoneOtp = async () => {
    setPhoneVerifying(true);
    setPhoneOtpError(null);
    try {
      const response = await taxPreparerSecurityAPI.sendPhoneVerificationOtp();
      if (response?.success !== false) {
        setPhoneOtpSent(true);
        setPhoneOtp('');
        toast.success('OTP sent to your phone number!', { position: 'top-right', autoClose: 3000 });
      } else {
        throw new Error(response?.message || 'Failed to send OTP');
      }
    } catch (err) {
      const msg = handleAPIError(err);
      setPhoneOtpError(msg);
      toast.error(msg || 'Failed to send phone OTP', { position: 'top-right', autoClose: 3000 });
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) return;
    setPhoneVerifying(true);
    setPhoneOtpError(null);
    try {
      const response = await taxPreparerSecurityAPI.verifyPhoneOtp(phoneOtp);
      if (response?.success !== false) {
        setIsPhoneVerified(true);
        setPhoneOtpSent(false);
        setPhoneOtp('');
        toast.success('Phone number verified successfully!', { position: 'top-right', autoClose: 3000 });
        if (onUpdate) onUpdate();
      } else {
        throw new Error(response?.message || 'Invalid OTP');
      }
    } catch (err) {
      const msg = handleAPIError(err);
      setPhoneOtpError(msg || 'Invalid or expired OTP. Please try again.');
    } finally {
      setPhoneVerifying(false);
    }
  };

  // Show loading state while fetching preferences
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading security settings...</span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "#F3F7FF",
      padding: "10px",
      borderRadius: "12px",
      border: "none"
    }}>
      <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
        {/* Header */}
        <div className="align-items-center mb-3">
          <h5
            className="mb-0 me-3"
            style={{
              color: "#3B4A66",
              fontSize: "24px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Security Settings
          </h5>
          <p
            className="mb-0"
            style={{
              color: "#4B5563",
              fontSize: "14px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Manage your account security and privacy
          </p>
        </div>

        {/* Two-Factor Authentication */}
        <div className="py-3 border-bottom" style={{ borderColor: "#E8F0FF" }}>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-1">
              <div
                style={{
                  color: "#3B4A66",
                  fontSize: "16px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro",
                  marginBottom: "4px"
                }}
              >
                Two-Factor Authentication
              </div>
              <p
                className="mb-0"
                style={{
                  color: "#4B5563",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                Add an extra layer of security to your account
              </p>
              {twoFactor && twoFactorEnabledAt && (
                <p
                  className="mb-0 mt-2"
                  style={{
                    color: "#10B981",
                    fontSize: "12px",
                    fontWeight: "400",
                    fontFamily: "BasisGrotesquePro",
                  }}
                >
                  ✓ Enabled {twoFactorEnabledAt ? `on ${new Date(twoFactorEnabledAt).toLocaleDateString()}` : ''}
                </p>
              )}
            </div>
            <div>
              {!twoFactor ? (
                <button
                  type="button"
                  onClick={handleSetup2FA}
                  className="btn "
                  style={{
                    backgroundColor: "#F56D2D",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "400",
                    fontFamily: "BasisGrotesquePro",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                  }}
                >
                  Enable 2FA
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDisable2FA(true)}
                  className="btn "
                  style={{
                    backgroundColor: "#dc3545",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "400",
                    fontFamily: "BasisGrotesquePro",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                  }}
                >
                  Disable 2FA
                </button>
              )}
            </div>
          </div>


          {/* 2FA Disable Modal */}
          {showDisable2FA && (
            <div className="mt-4 p-4 border rounded" style={{ borderColor: "#E8F0FF", backgroundColor: "#F9FAFB" }}>
              <h6 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro", marginBottom: "8px" }}>
                Disable Two-Factor Authentication
              </h6>
              <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro", marginBottom: "16px" }}>
                For security reasons, please enter your current password to disable 2FA.
              </p>

              <div className="mb-3">
                <label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro", marginBottom: "8px", display: "block" }}>
                  Current Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showDisablePassword ? "text" : "password"}
                    className="form-control"
                    value={disablePassword}
                    onChange={(e) => {
                      setDisablePassword(e.target.value);
                      setDisableError(null);
                    }}
                    placeholder="Enter your password"
                    style={{
                      color: "#3B4A66",
                      fontSize: "14px",
                      fontFamily: "BasisGrotesquePro",
                      border: disableError ? "1px solid #dc3545" : "1px solid #E8F0FF",
                      borderRadius: "8px",
                      padding: "8px 40px 8px 12px"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#4B5563",
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      zIndex: 10
                    }}
                  >
                    <i className={`bi ${showDisablePassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                {disableError && (
                  <div className="text-danger mt-1" style={{ fontSize: "12px", fontFamily: "BasisGrotesquePro" }}>
                    {disableError}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  onClick={cancelDisable2FA}
                  className="btn "
                  style={{
                    backgroundColor: "transparent",
                    color: "#3B4A66",
                    fontSize: "14px",
                    fontFamily: "BasisGrotesquePro",
                    border: "1px solid #E8F0FF",
                    padding: "6px 16px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={disabling || !disablePassword}
                  className="btn "
                  style={{
                    backgroundColor: "#dc3545",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontFamily: "BasisGrotesquePro",
                    border: "none",
                    padding: "6px 16px",
                    opacity: (disabling || !disablePassword) ? 0.6 : 1,
                    cursor: (disabling || !disablePassword) ? "not-allowed" : "pointer",
                  }}
                >
                  {disabling ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Session Timeout */}
        <div className="py-3 ">
          <label
            htmlFor="sessionTimeout"
            style={{
              color: "#3B4A66",
              fontSize: "16px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro",
              marginBottom: "8px",
              display: "block"
            }}
          >
            Session Timeout
            {security?.session_timeout_display && (
              <span className="text-muted ms-2" style={{ fontSize: "14px", fontWeight: "400" }}>
                (Current: {security.session_timeout_display})
              </span>
            )}
          </label>
          <select
            id="sessionTimeout"
            className="form-select"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(Number(e.target.value))}
            style={{
              maxWidth: "300px",
              borderRadius: "8px",
              fontFamily: "BasisGrotesquePro",
              border: "1px solid #E8F0FF",
              padding: "8px 12px"
            }}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        {/* Verification Status */}
        <div className="py-3 border-top border-bottom" style={{ borderColor: "#E8F0FF" }}>
          <div className="mb-3">
            <label
              style={{
                color: "#3B4A66",
                fontSize: "16px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
                marginBottom: "4px",
                display: "block"
              }}
            >
              Account Verification Status
            </label>
            <p style={{ color: "#4B5563", fontSize: "13px", fontFamily: "BasisGrotesquePro", marginBottom: "0" }}>
              Verify your email and phone number to secure your account.
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            {/* Email Verification Row */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E8F0FF" }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-envelope" style={{ color: "#3B4A66", fontSize: "16px" }}></i>
                  <span style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                    Email Verification
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge ${isEmailVerified ? 'bg-success' : 'bg-warning text-dark'}`}
                    style={{ fontSize: "11px", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                  >
                    {isEmailVerified ? '✓ Verified' : 'Not Verified'}
                  </span>
                  {!isEmailVerified && !emailOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={emailVerifying}
                      style={{
                        backgroundColor: "#F56D2D",
                        color: "#fff",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "none",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        cursor: emailVerifying ? "not-allowed" : "pointer",
                        opacity: emailVerifying ? 0.6 : 1,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {emailVerifying ? 'Sending...' : 'Verify Now'}
                    </button>
                  )}
                  {!isEmailVerified && emailOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={emailVerifying}
                      style={{
                        backgroundColor: "transparent",
                        color: "#F56D2D",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "1px solid #F56D2D",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        cursor: emailVerifying ? "not-allowed" : "pointer",
                        opacity: emailVerifying ? 0.6 : 1,
                        whiteSpace: "nowrap"
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Email OTP Input */}
              {!isEmailVerified && emailOtpSent && (
                <div className="mt-2">
                  <p style={{ color: "#4B5563", fontSize: "12px", fontFamily: "BasisGrotesquePro", marginBottom: "8px" }}>
                    An OTP has been sent to your email. Enter it below to verify.
                  </p>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      value={emailOtp}
                      onChange={(e) => { setEmailOtp(e.target.value); setEmailOtpError(null); }}
                      placeholder="Enter 4-digit OTP"
                      maxLength={4}
                      style={{
                        width: "140px",
                        border: emailOtpError ? "1px solid #dc3545" : "1px solid #E8F0FF",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "14px",
                        fontFamily: "BasisGrotesquePro",
                        color: "#3B4A66",
                        letterSpacing: "4px",
                        textAlign: "center"
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailOtp}
                      disabled={emailVerifying || emailOtp.length < 4}
                      style={{
                        backgroundColor: "#3B4A66",
                        color: "#fff",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        cursor: (emailVerifying || emailOtp.length < 4) ? "not-allowed" : "pointer",
                        opacity: (emailVerifying || emailOtp.length < 4) ? 0.6 : 1,
                      }}
                    >
                      {emailVerifying ? 'Verifying...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setEmailOtpError(null); }}
                      style={{
                        backgroundColor: "transparent",
                        color: "#6B7280",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "none",
                        padding: "6px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {emailOtpError && (
                    <div style={{ color: "#dc3545", fontSize: "12px", fontFamily: "BasisGrotesquePro", marginTop: "4px" }}>
                      {emailOtpError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone Verification Row */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E8F0FF" }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-phone" style={{ color: "#3B4A66", fontSize: "16px" }}></i>
                  <span style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                    Phone Verification
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge ${isPhoneVerified ? 'bg-success' : 'bg-warning text-dark'}`}
                    style={{ fontSize: "11px", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                  >
                    {isPhoneVerified ? '✓ Verified' : 'Not Verified'}
                  </span>
                  {!isPhoneVerified && !phoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={phoneVerifying}
                      style={{
                        backgroundColor: "#F56D2D",
                        color: "#fff",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "none",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        cursor: phoneVerifying ? "not-allowed" : "pointer",
                        opacity: phoneVerifying ? 0.6 : 1,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {phoneVerifying ? 'Sending...' : 'Verify Now'}
                    </button>
                  )}
                  {!isPhoneVerified && phoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={phoneVerifying}
                      style={{
                        backgroundColor: "transparent",
                        color: "#F56D2D",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "1px solid #F56D2D",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        cursor: phoneVerifying ? "not-allowed" : "pointer",
                        opacity: phoneVerifying ? 0.6 : 1,
                        whiteSpace: "nowrap"
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Phone OTP Input */}
              {!isPhoneVerified && phoneOtpSent && (
                <div className="mt-2">
                  <p style={{ color: "#4B5563", fontSize: "12px", fontFamily: "BasisGrotesquePro", marginBottom: "8px" }}>
                    An OTP has been sent to your phone number. Enter it below to verify.
                  </p>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      value={phoneOtp}
                      onChange={(e) => { setPhoneOtp(e.target.value); setPhoneOtpError(null); }}
                      placeholder="Enter 4-digit OTP"
                      maxLength={4}
                      style={{
                        width: "140px",
                        border: phoneOtpError ? "1px solid #dc3545" : "1px solid #E8F0FF",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "14px",
                        fontFamily: "BasisGrotesquePro",
                        color: "#3B4A66",
                        letterSpacing: "4px",
                        textAlign: "center"
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneVerifying || phoneOtp.length < 4}
                      style={{
                        backgroundColor: "#3B4A66",
                        color: "#fff",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        cursor: (phoneVerifying || phoneOtp.length < 4) ? "not-allowed" : "pointer",
                        opacity: (phoneVerifying || phoneOtp.length < 4) ? 0.6 : 1,
                      }}
                    >
                      {phoneVerifying ? 'Verifying...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); setPhoneOtpError(null); }}
                      style={{
                        backgroundColor: "transparent",
                        color: "#6B7280",
                        fontSize: "12px",
                        fontFamily: "BasisGrotesquePro",
                        border: "none",
                        padding: "6px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {phoneOtpError && (
                    <div style={{ color: "#dc3545", fontSize: "12px", fontFamily: "BasisGrotesquePro", marginTop: "4px" }}>
                      {phoneOtpError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="mt-6">
          <h6
            className="mb-3"
            style={{
              color: "#3B4A66",
              fontSize: "18px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro"
            }}
          >
            Password
          </h6>
          <form>
            <div className="mb-3">
              <label
                className="form-label"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                Current Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control w-full"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    color: "#3B4A66",
                    fontSize: "14px",
                    fontWeight: "400",
                    fontFamily: "BasisGrotesquePro",
                    border: "1px solid #E8F0FF",
                    borderRadius: "8px",
                    padding: "8px 40px 8px 12px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#4B5563",
                    cursor: "pointer",
                    fontSize: "18px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    zIndex: 10
                  }}
                >
                  <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label
                className="form-label"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control w-full"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    color: "#3B4A66",
                    fontSize: "14px",
                    fontWeight: "400",
                    fontFamily: "BasisGrotesquePro",
                    border: "1px solid #E8F0FF",
                    borderRadius: "8px",
                    padding: "8px 40px 8px 12px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#4B5563",
                    cursor: "pointer",
                    fontSize: "18px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    zIndex: 10
                  }}
                >
                  <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label
                className="form-label"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control w-full"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    color: "#3B4A66",
                    fontSize: "14px",
                    fontWeight: "400",
                    fontFamily: "BasisGrotesquePro",
                    border: "1px solid #E8F0FF",
                    borderRadius: "8px",
                    padding: "8px 40px 8px 12px"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#4B5563",
                    cursor: "pointer",
                    fontSize: "18px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    zIndex: 10
                  }}
                >
                  <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>
            {passwordError && (
              <div className="alert alert-danger" role="alert" style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                {passwordError}
              </div>
            )}
            <button
              type="button"
              className="btn px-4 py-2 rounded-lg"
              onClick={handlePasswordUpdate}
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              style={{
                color: "#3B4A66",
                fontSize: "15px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
                background: "#F3F7FF",
                border: "1px solid #E8F0FF",
                opacity: (passwordSaving || !currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
                cursor: (passwordSaving || !currentPassword || !newPassword || !confirmPassword) ? "not-allowed" : "pointer",
              }}
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Save Button */}
        <div className="mt-1">
          <button
            className="btn d-flex align-items-center gap-2 px-6 py-2 rounded-lg"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              backgroundColor: "#F56D2D",
              opacity: (saving || loading) ? 0.7 : 1,
              color: "#fff",
              fontWeight: "400",
              fontSize: "15px",
              fontFamily: "BasisGrotesquePro",
              border: "none",
              cursor: (saving || loading) ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Saving...</span>
                </div>
                Saving...
              </>
            ) : (
              <>
                <SaveIcon />
                Save Security Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <TwoFactorSetupModal
        show={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        onSuccess={handle2FASetupSuccess}
      />
    </div>
  );
};

export default Security;
