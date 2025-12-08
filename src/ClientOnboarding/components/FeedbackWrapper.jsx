import React, { useState, useEffect } from 'react';
import { isLoggedIn, getStorage } from '../utils/userUtils';
import { maintenanceModeAPI, firmAdminMessagingAPI } from '../utils/apiUtils';
import FeedbackModal from './FeedbackModal';

export default function FeedbackWrapper({ children }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [checkedFeedback, setCheckedFeedback] = useState(false);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('FeedbackWrapper: Component mounted');
  }, []);

  useEffect(() => {
    const checkFeedbackStatus = async () => {
      console.log('FeedbackWrapper: Starting feedback check...');
      
      // Only check if user is logged in
      if (!isLoggedIn()) {
        console.log('FeedbackWrapper: User not logged in, skipping feedback check');
        setCheckedFeedback(true);
        return;
      }

      // Get user type from storage
      const storage = getStorage();
      const userType = storage?.getItem("userType");
      console.log('FeedbackWrapper: User type:', userType);

      // Skip feedback check for superadmin
      if (userType === 'super_admin' || userType === 'support_admin' || userType === 'billing_admin') {
        console.log('FeedbackWrapper: Superadmin user, skipping feedback check');
        setCheckedFeedback(true);
        return;
      }

      try {
        console.log('FeedbackWrapper: Calling maintenance mode status API...');
        const response = await maintenanceModeAPI.getMaintenanceStatus();
        console.log('FeedbackWrapper: API response:', response);
        
        if (response.success) {
          const accountAgeDays = response.account_age_days || 0;
          const hasFeedback = response.has_feedback || false;
          
          console.log('FeedbackWrapper: Account age (days):', accountAgeDays);
          console.log('FeedbackWrapper: Has feedback:', hasFeedback);
          
          // Show modal if:
          // 1. Account age >= 4 days
          // 2. User has not submitted feedback
          console.log('FeedbackWrapper: Checking conditions - accountAgeDays:', accountAgeDays, 'hasFeedback:', hasFeedback);
          console.log('FeedbackWrapper: accountAgeDays >= 4?', accountAgeDays >= 4);
          console.log('FeedbackWrapper: !hasFeedback?', !hasFeedback);
          console.log('FeedbackWrapper: Combined condition?', accountAgeDays >= 4 && !hasFeedback);
          
          if (accountAgeDays >= 4 && !hasFeedback) {
            console.log('FeedbackWrapper: ✅ User meets criteria (age >= 4 days, no feedback), showing modal in 1 second');
            // Small delay to ensure page is loaded
            setTimeout(() => {
              console.log('FeedbackWrapper: ✅ Setting showFeedbackModal to true');
              setShowFeedbackModal(true);
              console.log('FeedbackWrapper: showFeedbackModal state after set:', true);
            }, 1000);
          } else {
            if (accountAgeDays < 4) {
              console.log('FeedbackWrapper: ❌ Account age is less than 4 days, not showing modal');
            } else if (hasFeedback) {
              console.log('FeedbackWrapper: ❌ User has already submitted feedback, not showing modal');
            } else {
              console.log('FeedbackWrapper: ❌ Condition not met for unknown reason');
            }
          }
        } else {
          console.log('FeedbackWrapper: API response was not successful:', response);
        }
      } catch (err) {
        console.error('FeedbackWrapper: Error checking maintenance status:', err);
        // Don't show modal on error
      } finally {
        setCheckedFeedback(true);
      }
    };

    checkFeedbackStatus();
  }, []);

  const handleFeedbackSubmitted = () => {
    setShowFeedbackModal(false);
  };

  const handleCloseModal = () => {
    setShowFeedbackModal(false);
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('FeedbackWrapper: State update - showFeedbackModal:', showFeedbackModal, 'checkedFeedback:', checkedFeedback);
  }, [showFeedbackModal, checkedFeedback]);

  return (
    <>
      {children}
      {checkedFeedback && (
        <>
          {console.log('FeedbackWrapper: Rendering FeedbackModal with isOpen:', showFeedbackModal)}
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={handleCloseModal}
            onSubmitted={handleFeedbackSubmitted}
          />
        </>
      )}
    </>
  );
}

