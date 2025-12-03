import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../styles/Icon.css";
import { SaveIcon } from "../icons";
import { securityAPI, handleAPIError } from "../../utils/apiUtils";

const Security = () => {
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Initial values to track changes
  const [initialValues, setInitialValues] = useState({
    loginAlerts: true,
  });

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
        const data = await securityAPI.getSecurityPreferences();
        console.log('Fetched security preferences:', data);

        // Map API response to component state
        if (data) {
          // Handle nested response structure
          const securityData = data.data || data;
          console.log('Security data structure:', securityData);
          console.log('Available fields:', Object.keys(securityData));
          console.log('Two factor value:', securityData.two_factor_authentication, securityData.two_factor_enabled);

          const loginAlertsValue = securityData.login_alerts || false;

          setLoginAlerts(loginAlertsValue);

          // Store initial values for comparison
          setInitialValues({
            loginAlerts: loginAlertsValue,
          });
        }
      } catch (err) {
        console.error('Error fetching security preferences:', err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchSecurityPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    // Check if any changes were made
    const hasChanges = 
      loginAlerts !== initialValues.loginAlerts;

    if (!hasChanges) {
      // No changes made, show info message
      toast.info("No changes to save. All settings are up to date.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setSaving(false);
      return;
    }

    try {
      const apiData = {
        login_alerts: loginAlerts,
      };

      console.log('Saving security preferences:', apiData);

      await securityAPI.updateSecurityPreferences(apiData);

      // Update initial values after successful save
      setInitialValues({
        loginAlerts,
      });

      // Show success toast
      toast.success("Security settings saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
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
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      setPasswordSaving(false);
      return;
    }

    try {
      const passwordData = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      };

      console.log('Updating password...');

      await securityAPI.updatePassword(passwordData);

      // Show success toast
      toast.success("Password updated successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
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
    <div

    >
      <div className="align-items-center mb-3 ">
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "20px",
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

      {/* <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <strong style={{ color: "#3B4A66", fontSize: "15px", fontFamily: "BasisGrotesquePro", }}>
            Login Alerts
          </strong>
          <p
            className="mb-0"
            style={{
              color: "#4B5563",
              fontSize: "13px",
              fontWeight: "400",
            }}
          >
            Get notified of new login attempts
          </p>
        </div>
        <div className="custom-toggle">
          <input
            type="checkbox"
            id="loginAlerts"
            checked={loginAlerts}
            onChange={() => setLoginAlerts(!loginAlerts)}
          />
          <label htmlFor="loginAlerts"></label>
        </div>
      </div> */}


      <h6
        className="mb-3"
        style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}
      >
        Password
      </h6>
      <form>
        <div className="mb-3">
          <label className="form-label" style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Current Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
          />
        </div>




        <button
          type="button"
          className="btn mb-4"
          onClick={handlePasswordUpdate}
          disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
          style={{
            color: "#3B4A66",
            fontSize: "16px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
            background: "#E8F0FF",
            opacity: (passwordSaving || !currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
            cursor: (passwordSaving || !currentPassword || !newPassword || !confirmPassword) ? "not-allowed" : "pointer",
            transition: "opacity 0.2s ease",
          }}
        >
          Update Password
        </button>
      </form>



      <button
        className="btn d-flex align-items-center gap-2"
        onClick={handleSave}
        disabled={saving}
        style={{
          backgroundColor: saving ? "#F56D2D" : "#F56D2D",
          opacity: saving ? 0.7 : 1,
          color: "#fff",
          fontWeight: "400",
          fontSize: "15px",
          fontFamily: "BasisGrotesquePro",
          cursor: saving ? "not-allowed" : "pointer",
          transition: "opacity 0.2s ease",
        }}
      >
        <SaveIcon />
        Save Security Settings
      </button>


    </div>
  );
};

export default Security;
