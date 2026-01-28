import React, { useState, useEffect } from 'react';
import { firmAdminMessagingAPI, handleAPIError } from '../utils/apiUtils';
import { getStorage } from '../utils/userUtils';
import { toast } from 'react-toastify';

export default function FeedbackModal({ isOpen, onClose, onSubmitted }) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debug: Log when modal receives isOpen prop
  useEffect(() => {
    console.log('FeedbackModal: isOpen prop changed to:', isOpen);
  }, [isOpen]);

  if (!isOpen) {
    console.log('FeedbackModal: isOpen is false, not rendering');
    return null;
  }

  console.log('FeedbackModal: Rendering modal');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (stars === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);

      // Get user role from storage
      const storage = getStorage();
      const userRole = storage?.getItem("userType") || '';

      const response = await firmAdminMessagingAPI.submitFeedback({
        stars: stars.toString(),
        comment: comment.trim(),
        role: userRole
      });

      if (response.success) {
        toast.success('Thank you for your feedback! We appreciate your input.');
        onSubmitted();
        onClose();
        // Reset form
        setStars(0);
        setComment('');
      } else {
        throw new Error(response.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8F0FF]">
          <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Share Your Feedback</h3>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="12" fill="#E8F0FF" />
              <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3 font-[BasisGrotesquePro]">
              How would you rate your experience? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  disabled={submitting}
                >
                  <svg
                    className={`w-10 h-10 transition-colors ${star <= (hoveredStar || stars)
                        ? 'text-[#F56D2D]'
                        : 'text-gray-300'
                      }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="text-xs text-gray-500 mt-2 font-[BasisGrotesquePro]">
                {stars === 1 && 'Poor'}
                {stars === 2 && 'Fair'}
                {stars === 3 && 'Good'}
                {stars === 4 && 'Very Good'}
                {stars === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] resize-none"
              disabled={submitting}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8F0FF]">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 bg-white border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting || stars === 0}
              className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

