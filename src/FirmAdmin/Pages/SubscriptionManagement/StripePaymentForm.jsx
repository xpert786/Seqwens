import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';

const API_BASE_URL = getApiBaseUrl();

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1F2937',
      fontFamily: 'BasisGrotesquePro, system-ui, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: false,
};

// Inner component that uses Stripe hooks
const PaymentFormInner = ({ onSubmit, onCancel, processing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe is not loaded. Please refresh the page.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      toast.error('Card element not found. Please refresh the page.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // Validate card element
    const { error: validationError } = await stripe.validateCardElement(cardElement);
    if (validationError) {
      setCardError(validationError.message);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setCardError(pmError.message);
        return;
      }

      if (!paymentMethod) {
        setCardError('Failed to create payment method. Please try again.');
        return;
      }

      // Call the onSubmit callback with the payment method ID
      onSubmit(paymentMethod.id);
    } catch (err) {
      console.error('Error creating payment method:', err);
      setCardError(err.message || 'An error occurred. Please try again.');
    }
  };

  const handleCardChange = (event) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
    setCardComplete(event.complete);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Element */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
          Card Details
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <p className="text-sm text-red-600 font-[BasisGrotesquePro]">{cardError}</p>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs text-blue-700 font-[BasisGrotesquePro]">
          Your card details are securely processed by Stripe. We never store your full card information.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 font-[BasisGrotesquePro]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !cardComplete || processing}
          className="px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
          style={{ backgroundColor: '#F97316' }}
        >
          {processing ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </form>
  );
};

// Main component that wraps with Elements provider
const StripePaymentForm = ({ onSubmit, onCancel, processing, stripePublishableKey }) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (stripePublishableKey) {
      const stripe = loadStripe(stripePublishableKey);
      setStripePromise(stripe);
    }
  }, [stripePublishableKey]);

  if (!stripePublishableKey) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading payment form...</p>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Initializing Stripe...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner onSubmit={onSubmit} onCancel={onCancel} processing={processing} />
    </Elements>
  );
};

export default StripePaymentForm;

