import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { addPaymentMethod, getStripeSetupIntent } from "../../../utils/paymentMethodsService";

/**
 * AddPaymentMethodModal
 * 
 * Modal for adding a new payment method (card) for a firm.
 * 
 * Flow:
 * 1. User clicks "Add Card" button
 * 2. Modal opens and requests a Stripe Setup Intent from the backend
 * 3. User enters card details in CardElement (never sent to backend)
 * 4. Stripe creates a Payment Method (pm_...) and returns it to the frontend
 * 5. Frontend sends the pm_... ID to the backend
 * 6. Backend attaches the pm_... to the Stripe customer and saves to database
 * 
 * Props:
 * - isOpen: boolean - whether the modal is open
 * - onClose: function - callback when modal is closed
 * - onSuccess: function - callback when card is successfully added
 * - isLoading: boolean - whether parent is loading (optional)
 */
const AddPaymentMethodModal = ({ isOpen, onClose, onSuccess, isLoading = false }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [setupIntentId, setSetupIntentId] = useState('');

  // Initialize setup intent when modal opens
  useEffect(() => {
    if (isOpen && !clientSecret && stripe) {
      initializeSetupIntent();
    }
  }, [isOpen, stripe]);

  /**
   * Get a Stripe Setup Intent for securely handling card information
   */
  const initializeSetupIntent = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getStripeSetupIntent();

      if (response.success) {
        setClientSecret(response.data.client_secret);
        setSetupIntentId(response.data.setup_intent_id);
      } else {
        setError(response.message || 'Failed to initialize payment setup');
      }
    } catch (err) {
      setError(err.message || 'Error initializing payment setup');
      console.error('Setup intent error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission - create payment method and save to database
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not initialized');
      return;
    }

    if (!clientSecret) {
      setError('Setup not complete. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create the payment method using CardElement
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (error) {
        setError(error.message || 'Failed to create payment method');
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method');
        setLoading(false);
        return;
      }

      // Payment method created successfully (pm_...)
      const paymentMethodId = paymentMethod.id;

      // Now send the pm_... ID to the backend
      const response = await addPaymentMethod(paymentMethodId, setAsDefault);

      if (response.success) {
        setSuccess('Card added successfully!');

        // Clear form
        elements.getElement(CardElement).clear();
        setClientSecret('');
        setSetupIntentId('');

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Close modal after brief delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to save card');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding your card');
      console.error('Error adding payment method:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close modal and reset state
   */
  const handleClose = () => {
    setError('');
    setSuccess('');
    setSetAsDefault(true);
    setClientSecret('');
    setSetupIntentId('');
    if (elements) {
      elements.getElement(CardElement)?.clear();
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1070] p-4"
      onClick={handleClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Add Payment Method</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Add a new card for automatic billing
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 transition"
            onClick={handleClose}
            disabled={loading || isLoading}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          {!stripe && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 text-sm">Loading payment system...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-2">
                Card Details
              </label>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 focus-within:border-blue-500 focus-within:bg-white transition">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#374151',
                        fontFamily: 'BasisGrotesquePro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        '::placeholder': {
                          color: '#9ca3af',
                        },
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                    hidePostalCode: true,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your card information is securely handled by Stripe. We never see your full card details.
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  disabled={loading || isLoading}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                  Set as default payment method for auto-renewals
                </span>
              </label>
            </div>

            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">ℹ️ Why save a card?</p>
              <p className="text-xs text-blue-700">
                Saved cards are used for automatic subscription renewals and invoice payments.
                Your card is securely stored in Stripe and never shared with anyone.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading || isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || isLoading || !stripe || !elements || !clientSecret}
            className="px-6 py-2 bg-[#F56D2D] text-white hover:bg-[#E55A1D] transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] text-sm font-medium"
            style={{ borderRadius: '8px' }}
          >
            {loading || isLoading ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding...
              </>
            ) : (
              'Add Card'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;
