import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceModeAPI, handleAPIError } from '../utils/apiUtils';
import { getStorage, clearUserData } from '../utils/userUtils';
import { getLoginUrl } from '../utils/urlUtils';

const MaintenanceMode = () => {
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionTimeoutMessage, setSessionTimeoutMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutInitiatedRef = useRef(false);

  useEffect(() => {
    // Check if user is superadmin - don't show maintenance mode for superadmin
    const storage = getStorage();
    const userType = storage?.getItem("userType");
    
    if (userType === 'super_admin') {
      setLoading(false);
      return;
    }

    const handleSessionTimeoutLogout = async () => {
      // Prevent multiple logout calls
      if (logoutInitiatedRef.current) {
        return;
      }
      logoutInitiatedRef.current = true;

      try {
        setLoggingOut(true);
        // Call session timeout logout endpoint
        await maintenanceModeAPI.sessionTimeoutLogout();
      } catch (error) {
        console.error('Error during session timeout logout:', error);
        // Continue with logout even if API call fails
      } finally {
        // Clear user data
        clearUserData();
        
        // Redirect to login page
        const loginUrl = getLoginUrl();
        if (loginUrl.includes('168.231.121.7')) {
          window.location.href = loginUrl;
        } else {
          navigate('/login', { replace: true });
        }
      }
    };

    const checkMaintenanceMode = async () => {
      try {
        setLoading(true);
        const response = await maintenanceModeAPI.getMaintenanceStatus();
        
        if (response.success) {
          setMaintenanceMode(response.maintenance_mode || false);
          setMaintenanceMessage(response.maintenance_message || 'The platform is currently undergoing maintenance. Please try again later.');
          
          // Check for session expiration
          if (response.session_expired === true) {
            setSessionExpired(true);
            setSessionTimeoutMessage(response.session_timeout_message || 'Your session has expired. Please log in again.');
            
            // Call session timeout logout
            await handleSessionTimeoutLogout();
          } else {
            setSessionExpired(false);
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // If API fails, don't show maintenance mode
        setMaintenanceMode(false);
        setSessionExpired(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
    
    // Check maintenance mode every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // Show session expired modal
  if (sessionExpired) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: 'BasisGrotesquePro',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#DC2626',
              marginBottom: '16px',
              fontFamily: 'BasisGrotesquePro',
            }}
          >
            Session Expired
          </div>
          <p
            style={{
              fontSize: '18px',
              color: '#3B4A66',
              margin: '0 0 16px 0',
              fontFamily: 'BasisGrotesquePro',
              lineHeight: '1.5',
              fontWeight: '500',
            }}
          >
            {sessionTimeoutMessage || 'Your session has expired. Please log in again.'}
          </p>
          {loggingOut && (
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
                fontFamily: 'BasisGrotesquePro',
                lineHeight: '1.5',
              }}
            >
              Logging out...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading || !maintenanceMode) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'BasisGrotesquePro',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#3B4A66',
            marginBottom: '16px',
            fontFamily: 'BasisGrotesquePro',
          }}
        >
          Maintenance Mode
        </div>
        <p
          style={{
            fontSize: '18px',
            color: '#3B4A66',
            margin: '0 0 16px 0',
            fontFamily: 'BasisGrotesquePro',
            lineHeight: '1.5',
            fontWeight: '500',
          }}
        >
          The system is in maintenance mode
        </p>
        {maintenanceMessage && (
          <p
            style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: 0,
              fontFamily: 'BasisGrotesquePro',
              lineHeight: '1.5',
            }}
          >
            {maintenanceMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default MaintenanceMode;

