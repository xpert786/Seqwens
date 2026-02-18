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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[99999] p-2 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 40px)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#F1F5F9] bg-white sticky top-0 z-10">
          <div>
            <h5 className="text-xl font-black text-gray-900 font-[BasisGrotesquePro]">Add Payment Method</h5>
            <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
              Securely link a new card to your account
            </p>
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
            onClick={handleClose}
            disabled={loading || isLoading}
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar bg-white">
          {!stripe && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 text-sm font-bold font-[BasisGrotesquePro]">Syncing with Stripe...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-xs">⚠️</span>
                </div>
                <span className="text-red-700 text-sm font-bold font-[BasisGrotesquePro]">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-500 text-xs">✓</span>
                </div>
                <span className="text-green-700 text-sm font-bold font-[BasisGrotesquePro]">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">
                Card Information
              </label>
              <div className="p-4 bg-gray-50 border border-gray-200 !rounded-xl focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50 transition-all">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#111827',
                        fontFamily: 'BasisGrotesquePro, Inter, system-ui, sans-serif',
                        fontWeight: '500',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                      invalid: {
                        color: '#EF4444',
                      },
                    },
                    hidePostalCode: true,
                  }}
                />
              </div>
              <div className="flex items-center gap-2 px-1">
                <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 font-[BasisGrotesquePro]">
                  Your data is encrypted and processed securely by Stripe.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    disabled={loading || isLoading}
                    className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-lg checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer"
                  />
                  {setAsDefault && (
                    <svg className="absolute w-3 h-3 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors font-[BasisGrotesquePro]">
                    Set as primary card
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium">Use this card for future renewals and invoices</p>
                </div>
              </label>
            </div>

            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 border-dashed">
              <p className="text-xs font-bold text-orange-800 mb-1 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Secure Billing
              </p>
              <p className="text-[10px] text-orange-700/80 font-medium leading-relaxed">
                By adding this card, you agree to our terms of service. Seqwens does not store your full card details.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-row justify-end gap-3 p-5 sm:p-6 border-t border-[#F1F5F9] bg-gray-50 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading || isLoading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 !rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all font-[BasisGrotesquePro]"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || isLoading || !stripe || !elements || !clientSecret}
            className="flex-1 sm:flex-none px-8 py-2.5 text-white !rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-100 active:scale-95 disabled:opacity-50 font-[BasisGrotesquePro]"
            style={{ backgroundColor: '#F97316' }}
          >
            {loading || isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Securing...</span>
              </div>
            ) : (
              'Add Payment Card'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;
