import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {
  getSavedCards,
  deleteCard,
  setDefaultCard
} from "../../../utils/paymentMethodsService";
import AddPaymentMethodModalWithStripe from './AddPaymentMethodModalWithStripe';
import {
  BillIcon,
  LockIcon,
  SettingIcon,
  DelIcon,
  CrossIcon,
  CompletedIcon,
  PlusIcon
} from "../../../ClientOnboarding/components/icons";
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

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

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
   * Delete a saved card - Open Modal
   */
  const handleDeleteCard = (cardId) => {
    setCardToDelete(cardId);
    setShowDeleteModal(true);
  };

  /**
   * Confirm and process card deletion
   */
  const confirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      setDeletingId(cardToDelete);
      setError('');

      const response = await deleteCard(cardToDelete);

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
      setShowDeleteModal(false);
      setCardToDelete(null);
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
    // Using BillIcon as a generic credit card icon
    return <BillIcon />;
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
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AD6F2]"></div>
        <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Loading saved cards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E8F0FF] shadow-sm">
        <div>
          <h4 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Saved Payment Methods</h4>
          <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">
            Manage your saved cards for automatic subscription renewals
          </p>
        </div>
        <button
          className="w-full sm:w-auto px-5 py-2.5 !rounded-lg flex items-center justify-center gap-2 text-white font-bold shadow-sm transition-transform active:scale-95 bg-[#F97316] font-[BasisGrotesquePro]"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusIcon /> <span>Add New Card</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <CrossIcon />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-800">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <CrossIcon />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CompletedIcon />
            </div>
            <p className="text-sm font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
            <CrossIcon />
          </button>
        </div>
      )}


      {/* Cards List */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-white border border-[#E8F0FF] rounded-xl p-5 sm:p-6 flex flex-col shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                    <span className="text-2xl">{getCardIcon(card.brand)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 font-[BasisGrotesquePro] uppercase tracking-wider">{card.brand || 'Card'}</p>
                    <p className="text-base font-bold text-gray-400 font-[BasisGrotesquePro]">•••• {card.last4}</p>
                  </div>
                </div>

                {card.is_default && (
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">Default</span>
                )}
              </div>

              <div className="space-y-3 mb-6 flex-1 py-4 border-y border-gray-50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Expires</span>
                  <span className="font-bold text-gray-700 font-[BasisGrotesquePro]">{formatExpiry(card.exp_month, card.exp_year)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Added</span>
                  <span className="font-bold text-gray-700 font-[BasisGrotesquePro]">
                    {new Date(card.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                {!card.is_default && (
                  <button
                    className="flex-1 px-3 py-2 text-xs font-bold text-[#3B82F6] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-[BasisGrotesquePro]"
                    onClick={() => handleSetDefault(card.id)}
                    disabled={settingDefaultId === card.id || deletingId === card.id}
                  >
                    {settingDefaultId === card.id ? 'Setting...' : 'Set Default'}
                  </button>
                )}

                <button
                  className="flex-1 px-3 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-[BasisGrotesquePro]"
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
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 sm:p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BillIcon size={32} />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">No Saved Cards</p>
          <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto font-[BasisGrotesquePro]">
            Add your first card to enable automatic billing for subscription renewals
          </p>
          <button
            className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95 font-[BasisGrotesquePro]"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Your First Card
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-5 rounded-xl border border-[#E8F0FF] shadow-sm">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 font-[BasisGrotesquePro]">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <LockIcon />
            </div>
            Security
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-[BasisGrotesquePro]">
            Your card information is securely processed and stored by Stripe.
            We never store your full card details.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8F0FF] shadow-sm">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 font-[BasisGrotesquePro]">
            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
              <SettingIcon />
            </div>
            Renewal
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-[BasisGrotesquePro]">
            Your default payment method will be used for automatic subscription renewals.
            You can change it anytime.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8F0FF] shadow-sm">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 font-[BasisGrotesquePro]">
            <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <DelIcon />
            </div>
            Deletion
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-[BasisGrotesquePro]">
            Deleted cards are removed from your account and Stripe.
            They cannot be used for future charges.
          </p>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModalWithStripe
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCardAdded}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered contentClassName="!rounded-2xl border-none shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-black text-gray-900 font-[BasisGrotesquePro]">Confirm Deletion</h4>
            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <CrossIcon />
            </button>
          </div>

          <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
            <p className="text-sm text-red-700 font-medium font-[BasisGrotesquePro]">
              Are you sure you want to delete this card? This action cannot be undone and may affect active subscriptions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-100 transition-all font-[BasisGrotesquePro]"
              disabled={deletingId}
            >
              {deletingId ? 'Deleting...' : 'Delete Card'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SavedPaymentMethods;
