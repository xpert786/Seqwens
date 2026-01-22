import React, { useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import AddPaymentMethodModal from './AddPaymentMethodModal';

/**
 * AddPaymentMethodModalWithStripe
 * 
 * Wrapper component that provides Stripe Elements context to the AddPaymentMethodModal.
 * This ensures the modal has access to Stripe's payment processing capabilities.
 * 
 * Props (same as AddPaymentMethodModal):
 * - isOpen: boolean - whether the modal is open
 * - onClose: function - callback when modal is closed
 * - onSuccess: function - callback when card is successfully added
 * - isLoading: boolean - whether parent is loading (optional)
 */
const AddPaymentMethodModalWithStripe = (props) => {
  // Initialize Stripe once - use test key if not configured
  const stripePromise = useMemo(
    () => {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51NXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      return loadStripe(stripeKey);
    },
    []
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'setup',
        currency: 'usd',
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <AddPaymentMethodModal {...props} />
    </Elements>
  );
};

export default AddPaymentMethodModalWithStripe;
