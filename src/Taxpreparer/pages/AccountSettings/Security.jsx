import { useState, useEffect } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons";
import { toast } from "react-toastify";
import { taxPreparerSecurityAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

const Security = ({ security, onUpdate }) => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

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
        two_factor_authentication: twoFactor,
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
        <div className="flex justify-between items-center py-3 ">
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
          </div>
          <div className="custom-toggle ml-4">
            <input
              type="checkbox"
              id="twoFactor"
              checked={twoFactor}
              onChange={() => setTwoFactor(!twoFactor)}
            />
            <label htmlFor="twoFactor"></label>
          </div>
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
          <div className="mb-2">
            <label
              style={{
                color: "#3B4A66",
                fontSize: "16px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
                marginBottom: "12px",
                display: "block"
              }}
            >
              Account Verification Status
            </label>
          </div>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center justify-content-between">
              <span style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}>
                Email Verification
              </span>
              <span className={`badge ${isEmailVerified ? 'bg-success' : 'bg-warning'}`} style={{
                fontSize: "12px",
                fontFamily: "BasisGrotesquePro",
                padding: "4px 8px"
              }}>
                {isEmailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <span style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}>
                Phone Verification
              </span>
              <span className={`badge ${isPhoneVerified ? 'bg-success' : 'bg-warning'}`} style={{
                fontSize: "12px",
                fontFamily: "BasisGrotesquePro",
                padding: "4px 8px"
              }}>
                {isPhoneVerified ? 'Verified' : 'Not Verified'}
              </span>
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
              <input
                type="password"
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
                  padding: "8px 12px"
                }}
              />
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
              <input
                type="password"
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
                  padding: "8px 12px"
                }}
              />
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
              <input
                type="password"
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
                  padding: "8px 12px"
                }}
              />
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
    </div>
  );
};

export default Security;
