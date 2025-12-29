import React, { useState, useEffect } from 'react';
import { isLoggedIn, getStorage } from '../utils/userUtils';
import { firmAdminMessagingAPI, maintenanceModeAPI } from '../utils/apiUtils';
import FeedbackModal from './FeedbackModal';

export default function FeedbackWrapper({ children }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [checkedFeedback, setCheckedFeedback] = useState(false);

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
        // First, check account age from maintenance mode API
        console.log('FeedbackWrapper: Checking account age...');
        const maintenanceResponse = await maintenanceModeAPI.getMaintenanceStatus();
        
        if (maintenanceResponse.success) {
          const accountAgeDays = maintenanceResponse.account_age_days || 0;
          console.log('FeedbackWrapper: Account age (days):', accountAgeDays);
          
          // Only proceed if account is older than 5 days
          if (accountAgeDays <= 5) {
            console.log('FeedbackWrapper: Account age is', accountAgeDays, 'days (must be > 5), skipping feedback check');
            setCheckedFeedback(true);
            return;
          }
          
          console.log('FeedbackWrapper: Account age is', accountAgeDays, 'days (> 5), proceeding with feedback check');
        } else {
          console.log('FeedbackWrapper: Could not get account age, skipping feedback check');
          setCheckedFeedback(true);
          return;
        }

        // Now check feedback status
        console.log('FeedbackWrapper: Calling feedback status API...');
        const response = await firmAdminMessagingAPI.getFeedbackStatus();
        console.log('FeedbackWrapper: API response:', response);
        
        if (response.success) {
          // Check if feedback has been submitted (API is the source of truth)
          // The API might return has_feedback, submitted, or feedback_submitted
          const hasFeedback = response.has_feedback || response.submitted || response.feedback_submitted || false;
          
          console.log('FeedbackWrapper: Has feedback:', hasFeedback);
          
          // If feedback is already submitted, never show the modal
          if (hasFeedback) {
            console.log('FeedbackWrapper: ❌ User has already submitted feedback, not showing modal');
            setCheckedFeedback(true);
            return;
          }
          
          // Feedback not submitted - check localStorage to see if we've shown it before
          const feedbackShownKey = 'feedback_modal_shown';
          const hasShownBefore = storage?.getItem(feedbackShownKey) === 'true';
          
          if (hasShownBefore) {
            console.log('FeedbackWrapper: Modal already shown before, skipping');
            setCheckedFeedback(true);
            return;
          }
          
          // Show modal only if feedback has NOT been submitted AND we haven't shown it before
          console.log('FeedbackWrapper: ✅ User has not submitted feedback and modal not shown before, showing modal in 1 second');
          // Mark as shown in localStorage to prevent showing again
          storage?.setItem(feedbackShownKey, 'true');
            // Small delay to ensure page is loaded
            setTimeout(() => {
              console.log('FeedbackWrapper: ✅ Setting showFeedbackModal to true');
              setShowFeedbackModal(true);
            }, 1000);
        } else {
          console.log('FeedbackWrapper: API response was not successful:', response);
        }
      } catch (err) {
        console.error('FeedbackWrapper: Error checking feedback status:', err);
        // Don't show modal on error
      } finally {
        setCheckedFeedback(true);
      }
    };

    checkFeedbackStatus();
  }, []);

  const handleFeedbackSubmitted = () => {
    // Mark feedback as submitted in localStorage to prevent showing again
    const storage = getStorage();
    storage?.setItem('feedback_modal_shown', 'true');
    setShowFeedbackModal(false);
  };

  const handleCloseModal = () => {
    // Mark as shown in localStorage to prevent showing again even if closed without submitting
    const storage = getStorage();
    storage?.setItem('feedback_modal_shown', 'true');
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

