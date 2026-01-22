import React, { useState, useEffect } from 'react';
import { 
  getSavedCards, 
  deleteCard, 
  setDefaultCard 
} from "../../../utils/paymentMethodsService";
import AddPaymentMethodModalWithStripe from './AddPaymentMethodModalWithStripe';
import './styles/SavedPaymentMethods.css';

/**
 * SavedPaymentMethods
 * 
 * Component for managing saved payment methods (cards) for a firm.
 * 
 * Features:
 * - Display all saved cards with masked information (brand, last4, expiry)
 * - Show stripe_customer_id and stripe_payment_method_id for debugging/verification
 * - Add new payment methods using Stripe
 * - Set a card as default for auto-renewals
 * - Delete saved cards
 * - Visual indication of which card is the default
 */
const SavedPaymentMethods = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  // Load saved cards on mount
  useEffect(() => {
    loadSavedCards();
  }, []);

  /**
   * Fetch all saved payment methods
   */
  const loadSavedCards = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getSavedCards();
      
      if (response.success) {
        setCards(response.data.payment_methods || []);
        // Removed stripe_customer_id and default_payment_method_id for security
        setStripeCustomerId('');
        setDefaultPaymentMethodId('');
      } else {
        setError(response.message || 'Failed to load saved cards');
      }
    } catch (err) {
      console.error('Error loading saved cards:', err);
      setError(err.message || 'Error loading saved cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle adding a new card - triggered by modal success
   */
  const handleCardAdded = (newCard) => {
    setSuccess('Card added successfully!');
    loadSavedCards();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  /**
   * Delete a saved card
   */
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      setDeletingId(cardId);
      setError('');

      const response = await deleteCard(cardId);

      if (response.success) {
        setSuccess('Card deleted successfully');
        loadSavedCards();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.message || 'Failed to delete card');
      }
    } catch (err) {
      console.error('Error deleting card:', err);
      setError(err.message || 'Error deleting card. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Set a card as the default payment method
   */
  const handleSetDefault = async (cardId) => {
    try {
      setSettingDefaultId(cardId);
      setError('');

      const response = await setDefaultCard(cardId);

      if (response.success) {
        setSuccess('Default payment method updated');
        loadSavedCards();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.message || 'Failed to set default payment method');
      }
    } catch (err) {
      console.error('Error setting default card:', err);
      setError(err.message || 'Error setting default payment method. Please try again.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  /**
   * Get card brand icon/emoji
   */
  const getCardIcon = (brand) => {
    const brandIcons = {
      'visa': '💳',
      'mastercard': '💳',
      'amex': '💳',
      'discover': '💳',
      'diners': '💳',
      'jcb': '💳',
    };
    return brandIcons[brand?.toLowerCase()] || '💳';
  };

  /**
   * Format expiry date
   */
  const formatExpiry = (expMonth, expYear) => {
    if (!expMonth || !expYear) return 'N/A';
    return `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="saved-payment-methods-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading saved cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-payment-methods-container">
      {/* Header */}
      <div className="spm-header">
        <div>
          <h2 className="spm-title">Saved Payment Methods</h2>
          <p className="spm-subtitle">
            Manage your saved cards for automatic subscription renewals
          </p>
        </div>
        <button
          className="btn btn-primary btn-add-card"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add New Card
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <p className="alert-title">Error</p>
            <p className="alert-message">{error}</p>
          </div>
          <button
            className="alert-close"
            onClick={() => setError('')}
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <div className="alert-content">
            <p className="alert-message">{success}</p>
          </div>
          <button
            className="alert-close"
            onClick={() => setSuccess('')}
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}


      {/* Cards List */}
      {cards.length > 0 ? (
        <div className="cards-grid">
          {cards.map((card) => (
            <div key={card.id} className="card-item">
              <div className="card-header">
                <div className="card-brand-info">
                  <span className="card-icon">{getCardIcon(card.brand)}</span>
                  <div className="card-brand-text">
                    <p className="card-brand">{card.brand?.toUpperCase() || 'Card'}</p>
                    <p className="card-number">•••• {card.last4}</p>
                  </div>
                </div>
                
                {card.is_default && (
                  <span className="badge badge-default">Default</span>
                )}
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <span className="detail-label">Expires:</span>
                  <span className="detail-value">{formatExpiry(card.exp_month, card.exp_year)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Added:</span>
                  <span className="detail-value">
                    {new Date(card.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="card-actions">
                {!card.is_default && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleSetDefault(card.id)}
                    disabled={settingDefaultId === card.id || deletingId === card.id}
                  >
                    {settingDefaultId === card.id ? 'Setting...' : 'Set as Default'}
                  </button>
                )}

                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteCard(card.id)}
                  disabled={deletingId === card.id || settingDefaultId === card.id}
                >
                  {deletingId === card.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p className="empty-title">No Saved Cards</p>
          <p className="empty-description">
            Add your first card to enable automatic billing for subscription renewals
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Your First Card
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="info-section">
        <div className="info-card">
          <h3 className="info-card-title">🔒 Security</h3>
          <p className="info-card-text">
            Your card information is securely processed and stored by Stripe. 
            We never store your full card details.
          </p>
        </div>

        <div className="info-card">
          <h3 className="info-card-title">⚙️ Auto-Renewal</h3>
          <p className="info-card-text">
            Your default payment method will be used for automatic subscription renewals. 
            You can change or update it anytime.
          </p>
        </div>

        <div className="info-card">
          <h3 className="info-card-title">🗑️ Deletion</h3>
          <p className="info-card-text">
            Deleted cards are removed from your account and Stripe. 
            You cannot use them for future charges.
          </p>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModalWithStripe
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCardAdded}
      />
    </div>
  );
};

export default SavedPaymentMethods;
