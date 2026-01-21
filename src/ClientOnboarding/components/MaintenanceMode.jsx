import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { maintenanceModeAPI, handleAPIError } from '../utils/apiUtils';
import { getStorage, clearUserData } from '../utils/userUtils';

const MaintenanceMode = () => {
  const navigate = useNavigate();
  // Check path for subscription bypass
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionTimeoutMessage, setSessionTimeoutMessage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutInitiatedRef = useRef(false);

  // State for subscription expiry
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);

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
        
        // Redirect to login page using React Router (respects basename)
        navigate('/login', { replace: true });
      }
    };

    const checkMaintenanceMode = async () => {
      try {
        setLoading(true);
        const response = await maintenanceModeAPI.getMaintenanceStatus();
        
        if (response.success) {
          setMaintenanceMode(response.maintenance_mode || false);
          setMaintenanceMessage(response.maintenance_message || 'The platform is currently undergoing maintenance. Please try again later.');
          
          // Check for termination - log out immediately if true
          if (response.termination === true) {
            setSessionExpired(true);
            setSessionTimeoutMessage(response.session_timeout_message || 'Your session has been terminated. Please log in again.');
            
            // Call session timeout logout
            await handleSessionTimeoutLogout();
            return; // Exit early to prevent further processing
          }
          
          // Check for session expiration
          if (response.session_expired === true) {
            setSessionExpired(true);
            setSessionTimeoutMessage(response.session_timeout_message || 'Your session has expired. Please log in again.');
            
            // Call session timeout logout
            await handleSessionTimeoutLogout();
            return;
          } else {
            setSessionExpired(false);
          }

          // Check for Subscription Expiration or Missing Subscription (Firm Admin only)
          if ((userType === 'firm' || userType === 'admin') && response.subscription) {
            const subStatus = response.subscription.status;
            if (subStatus === 'expired' || subStatus === 'none') {
               // Allow access to subscription management pages
               const isSubscriptionPage = location.pathname.includes('/firmadmin/subscription') || 
                                          location.pathname.includes('/firmadmin/finalize-subscription') ||
                                          location.pathname.includes('/firmadmin/billing');
               
               if (!isSubscriptionPage) {
                   setSubscriptionExpired(true);
                   setSubscriptionData(response.subscription);
               } else {
                   setSubscriptionExpired(false);
               }
            } else {
                setSubscriptionExpired(false);
            }
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
  }, [navigate, location.pathname]);

  const handleRenewSubscription = () => {
    navigate('/firmadmin/subscription');
    setSubscriptionExpired(false);
  };

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

  // Show Subscription Expired Modal
  if (subscriptionExpired) {
      return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background to hide content behind
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: 'BasisGrotesquePro',
          backdropFilter: 'blur(5px)'
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            border: '1px solid #E5E7EB'
          }}
        >
          <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: '#FEF2F2', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px auto'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V14" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 21.41H5.41C4.52 21.41 4.07 20.33 4.7 19.7L19.7 4.7C20.33 4.07 21.41 4.52 21.41 5.41V12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17.41H12.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px',
              fontFamily: 'BasisGrotesquePro',
            }}
          >
            {subscriptionData?.status === 'none' ? 'No Active Subscription' : 'Subscription Expired'}
          </h2>
          
          <p
            style={{
              fontSize: '16px',
              color: '#6B7280',
              marginBottom: '32px',
              fontFamily: 'BasisGrotesquePro',
              lineHeight: '1.6',
            }}
          >
            {subscriptionData?.status === 'none' ? (
              <>
                Your firm does not have an active subscription plan.
                <br/>
                To start using the platform and manage your clients, please select and purchase a subscription plan.
              </>
            ) : (
              <>
                Your firm's subscription expired on <span style={{ fontWeight: '600', color: '#111827' }}>{subscriptionData?.expires_at ? new Date(subscriptionData.expires_at).toLocaleDateString() : 'Unknown date'}</span>. 
                <br/>
                To continue accessing the platform and managing your clients, please renew your subscription securely.
              </>
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                onClick={handleRenewSubscription}
                style={{
                  backgroundColor: '#F56D2D', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  width: '100%',
                  boxShadow: '0 4px 6px -1px rgba(245, 109, 45, 0.1), 0 2px 4px -1px rgba(245, 109, 45, 0.06)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e05d1f'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#F56D2D'}
              >
                {subscriptionData?.status === 'none' ? 'Purchase Subscription Now' : 'Renew Subscription Now'}
              </button>
              
              <button
                 onClick={() => {
                     clearUserData();
                     navigate('/login', { replace: true });
                 }}
                 style={{
                     backgroundColor: 'transparent',
                     color: '#6B7280',
                     border: 'none',
                     padding: '12px',
                     fontSize: '14px',
                     fontWeight: '500',
                     cursor: 'pointer',
                     textDecoration: 'underline'
                 }}
              >
                  Log out and contact support
              </button>
          </div>
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

