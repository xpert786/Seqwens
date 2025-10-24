import React, { useState, useEffect } from "react";
import "../../styles/Icon.css";
import { SaveIcon } from "../icons";
import { securityAPI, handleAPIError } from "../../utils/apiUtils";

const Security = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
          
          setTwoFactor(securityData.two_factor_authentication || securityData.two_factor_enabled || false);
          setLoginAlerts(securityData.login_alerts || false);
          setSessionTimeout(securityData.session_timeout || 30);
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
    setSuccess(false);
    
    try {
      const apiData = {
        two_factor_authentication: twoFactor,
        login_alerts: loginAlerts,
        session_timeout: sessionTimeout,
      };

      console.log('Saving security preferences:', apiData);
      
      await securityAPI.updateSecurityPreferences(apiData);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving security preferences:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    
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
      setPasswordSuccess(true);
      
      // Clear form and success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(handleAPIError(err));
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
       
       <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <strong style={{ color: "#3B4A66", fontSize: "15px", fontFamily: "BasisGrotesquePro", fontWeight: "500", }}>
            Two-Factor Authentication
          </strong>
          <p
            className="mb-0"
            style={{
              color: "#4B5563",
              fontSize: "13px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Add an extra layer of security to your account
          </p>
        </div>
        <div className="custom-toggle">
          <input
            type="checkbox"
            id="twoFactor"
            checked={twoFactor}
            onChange={() => setTwoFactor(!twoFactor)}
          />
          <label htmlFor="twoFactor"></label>
        </div>
      </div>


      <div className="mb-4">
        <label
          htmlFor="sessionTimeout"
          style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}
        >
          Session Timeout (minutes)
        </label>
        <select
          id="sessionTimeout"
          className="form-select mt-2"
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
          style={{ maxWidth: "300px", borderRadius: "10px", fontFamily: "BasisGrotesquePro", }}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>60 minutes</option>
        
        </select>
      </div>


      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
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
      </div>


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
        
        {/* Password Error Message */}
        {passwordError && (
          <div className="alert alert-danger mb-3" role="alert">
            {passwordError}
          </div>
        )}

     
        
        <button
          type="button"
          className="btn mb-4"
          onClick={handlePasswordUpdate}
          disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
          style={{ 
            color: passwordSaving ? "#9CA3AF" : "#3B4A66", 
            fontSize: "16px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro", 
            background: passwordSaving ? "#F3F4F6" : "#E8F0FF",
            cursor: passwordSaving ? "not-allowed" : "pointer"
          }}
        >
          {passwordSaving ? "Updating..." : "Update Password"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}


      <button
        className="btn d-flex align-items-center gap-2"
        onClick={handleSave}
        disabled={saving}
        style={{
          backgroundColor: saving ? "#ccc" : "#F56D2D",
          color: "#fff",
          fontWeight: "400",
          fontSize: "15px",
          fontFamily: "BasisGrotesquePro",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        <SaveIcon />
        {saving ? "Saving..." : "Save Security Settings"}
      </button>


    </div>
  );
};

export default Security;
