import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { BillIcon, DelIcon, CrossIcon } from "../icons";
import "../../styles/Icon.css";
import { Modal, Button, Form } from "react-bootstrap";
import { billingAPI, handleAPIError } from "../../utils/apiUtils";

const Billing = () => {
  const [billingInformation, setBillingInformation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await billingAPI.getPaymentMethods();
        console.log('Payment methods API response:', response);

        // Handle the API response structure
        if (response.success && response.data && response.data.payment_methods) {
          const methods = response.data.payment_methods.map(method => ({
            id: method.id,
            last4: method.card_number.slice(-4),
            brand: method.card_number.startsWith('4') ? 'VISA' :
              method.card_number.startsWith('5') ? 'MASTERCARD' :
                method.card_number.startsWith('3') ? 'AMEX' : 'UNKNOWN',
            expiry: method.expiry_date ? new Date(method.expiry_date).toLocaleDateString('en-US', {
              month: 'numeric',
              year: 'numeric'
            }) : 'N/A',
            isPrimary: method.is_primary,
            cardholder_name: method.cardholder_name,
            card_number: method.card_number,
            expiry_date: method.expiry_date
          }));
          setPaymentMethods(methods);
          console.log('Processed payment methods:', methods);
        } else {
          setPaymentMethods([]);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        const errorMessage = handleAPIError(err);
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-error",
          bodyClassName: "custom-toast-body",
        });
        setPaymentMethods([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchBillingAddress = async () => {
      try {
        const response = await billingAPI.getBillingInformation();
        console.log('Billing address API response:', response);

        if (response.success && response.data) {
          setBillingAddress({
            id: response.data.id,
            name: response.data.name || "",
            street_address: response.data.street_address || "",
            city: response.data.city || "",
            state: response.data.state || "",
            zip_code: response.data.zip_code || "",
            country: response.data.country || "",
            is_primary: response.data.is_primary,
            full_address: response.data.full_address,
          });
        } else {
          // No billing address found
          setBillingAddress(null);
        }
      } catch (err) {
        console.error('Error fetching billing address:', err);
        // If error, assume no billing address exists
        setBillingAddress(null);
      }
    };

    fetchPaymentMethods();
    fetchBillingAddress();
  }, []);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [editMonth, setEditMonth] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editDefault, setEditDefault] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [billingAddress, setBillingAddress] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({
    name: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
  });

  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state for adding payment method
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    isDefault: false
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });

  // Validation functions
  const validateCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (!cleanNumber) return 'Card number is required';
    if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits';
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return 'Card number must be between 13 and 19 digits';
    }
    return '';
  };

  const validateExpiryDate = (expiryDate) => {
    if (!expiryDate) return 'Expiry date is required';
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) {
      return 'Invalid date format. Use MM/YY format (e.g., 12/25)';
    }

    // Check if the date is not in the past
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expiryYear = parseInt(year) + 2000;
    const expiryMonth = parseInt(month);

    if (expiryYear < currentDate.getFullYear() ||
      (expiryYear === currentDate.getFullYear() && expiryMonth < currentMonth)) {
      return 'Card has expired';
    }

    return '';
  };

  const validateCardholderName = (name) => {
    if (!name.trim()) return 'Cardholder name is required';
    if (name.trim().length < 2) return 'Cardholder name must be at least 2 characters';
    return '';
  };

  const validateCVV = (cvv) => {
    if (!cvv) return 'CVV is required';
    if (!/^\d+$/.test(cvv)) return 'CVV must contain only digits';
    if (cvv.length < 3 || cvv.length > 4) return 'CVV must be 3 or 4 digits';
    return '';
  };

  const validateForm = () => {
    const errors = {
      cardNumber: validateCardNumber(newPaymentMethod.cardNumber),
      cardholderName: validateCardholderName(newPaymentMethod.cardholderName),
      expiryDate: validateExpiryDate(newPaymentMethod.expiryDate),
      cvv: validateCVV(newPaymentMethod.cvv)
    };

    setFormErrors(errors);
    return Object.values(errors).every(error => error === '');
  };

  const setAsPrimary = async (id) => {
    try {
      setSaving(true);
      // Find the method to set as primary
      const methodToUpdate = paymentMethods.find(method => method.id === id);
      if (methodToUpdate) {
        // Update the payment method to be primary
        await billingAPI.updatePaymentMethod(id, { is_primary: true });

        // Update local state
        const updatedMethods = paymentMethods.map((method) => ({
          ...method,
          isPrimary: method.id === id,
        }));
        setPaymentMethods(updatedMethods);

        // Show success toast
        toast.success('Payment method set as primary successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      }
    } catch (err) {
      console.error('Error setting payment method as primary:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // Reset form and errors when opening modal
    setNewPaymentMethod({
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: '',
      isDefault: false
    });
    setFormErrors({
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: ''
    });
    setShowModal(true);
  };

  const handleModalSave = async (formData) => {
    try {
      setSaving(true);
      setError(null);

      // Validate form before submitting
      if (!validateForm()) {
        setSaving(false);
        return;
      }

      // Prepare the payment method data for the API (matching your API structure)
      const paymentMethodData = {
        card_number: formData.cardNumber,
        cardholder_name: formData.cardholderName,
        expiry_date: formData.expiryDate, // Format: MM/YY
        cvv: formData.cvv
      };

      console.log('Sending payment method data:', paymentMethodData);
      const response = await billingAPI.addPaymentMethod(paymentMethodData);
      console.log('Add payment method response:', response);

      // Handle the response structure from your API
      if (response.success && response.data) {
        // Refresh the payment methods list
        const updatedResponse = await billingAPI.getPaymentMethods();
        console.log('Updated payment methods response:', updatedResponse);

        if (updatedResponse.success && updatedResponse.data && updatedResponse.data.payment_methods) {
          const methods = updatedResponse.data.payment_methods.map(method => ({
            id: method.id,
            last4: method.card_number.slice(-4),
            brand: method.card_number.startsWith('4') ? 'VISA' :
              method.card_number.startsWith('5') ? 'MASTERCARD' :
                method.card_number.startsWith('3') ? 'AMEX' : 'UNKNOWN',
            expiry: method.expiry_date ? new Date(method.expiry_date).toLocaleDateString('en-US', {
              month: 'numeric',
              year: 'numeric'
            }) : 'N/A',
            isPrimary: method.is_primary,
            cardholder_name: method.cardholder_name,
            card_number: method.card_number,
            expiry_date: method.expiry_date
          }));
          setPaymentMethods(methods);
        }

        // Reset form
        setNewPaymentMethod({
          cardNumber: '',
          cardholderName: '',
          expiryDate: '',
          cvv: '',
          isDefault: false
        });

        setShowModal(false);

        // Show success toast
        toast.success('Payment method added successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        setError('Failed to add payment method');
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    try {
      setSaving(true);
      setError(null);

      console.log('Deleting payment method with ID:', paymentMethodId);
      const response = await billingAPI.deletePaymentMethod(paymentMethodId);
      console.log('Delete payment method response:', response);

      // Handle the response structure from your API
      if (response.success) {
        // Remove the deleted payment method from local state
        const updatedMethods = paymentMethods.filter(method => method.id !== paymentMethodId);
        setPaymentMethods(updatedMethods);

        // Close the edit modal
        setShowEditModal(false);
        setEditCard(null);

        // Show success toast
        toast.success('Payment method deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        setError('Failed to delete payment method');
      }
    } catch (err) {
      console.error('Error deleting payment method:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEditPaymentMethod = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare the payment method data for the API (matching your API structure)
      const paymentMethodData = {
        expiry_month: parseInt(editMonth),
        expiry_year: parseInt(editYear),
        set_as_primary: editDefault
      };

      console.log('Updating payment method with ID:', editCard?.id);
      console.log('Update payment method data:', paymentMethodData);
      const response = await billingAPI.updatePaymentMethod(editCard?.id, paymentMethodData);
      console.log('Update payment method response:', response);

      // Handle the response structure from your API
      if (response.success) {
        // Update local state
        const updatedMethods = paymentMethods.map((method) => {
          if (method.id === editCard?.id) {
            return {
              ...method,
              expiry: `${editMonth}/${editYear.slice(-2)}`,
              isPrimary: editDefault
            };
          }
          // If setting as primary, make sure other methods are not primary
          return editDefault ? { ...method, isPrimary: false } : method;
        });
        setPaymentMethods(updatedMethods);

        // Close the edit modal
        setShowEditModal(false);
        setEditCard(null);

        // Show success toast
        toast.success('Payment method updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        setError(response.message || 'Failed to update payment method');
      }
    } catch (err) {
      console.error('Error updating payment method:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCardClick = (id) => setSelectedId(id);

  const handleAddAddress = () => {
    setEditAddress({
      name: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
    });
    setIsEditingAddress(true);
  };

  const handleEditAddress = () => {
    setEditAddress({
      name: billingAddress.name,
      street_address: billingAddress.street_address,
      city: billingAddress.city,
      state: billingAddress.state,
      zip_code: billingAddress.zip_code,
      country: billingAddress.country,
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare the billing address data for the API
      const addressData = {
        name: editAddress.name,
        street_address: editAddress.street_address,
        city: editAddress.city,
        state: editAddress.state,
        zip_code: editAddress.zip_code,
        country: editAddress.country,
      };

      console.log('Saving billing address:', addressData);

      let response;
      if (billingAddress) {
        // Update existing address
        response = await billingAPI.updateBillingInformation(addressData);
        console.log('Update billing address response:', response);
      } else {
        // Create new address
        response = await billingAPI.addBillingInformation(addressData);
        console.log('Add billing address response:', response);
      }

      if (response.success) {
        setBillingAddress({
          id: response.data.id,
          ...addressData,
          is_primary: response.data.is_primary,
          full_address: response.data.full_address,
        });
        setIsEditingAddress(false);
        // Show success toast
        toast.success(billingAddress ? 'Billing address updated successfully!' : 'Billing address added successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        setError(response.message || 'Failed to save billing address');
      }
    } catch (err) {
      console.error('Error saving billing address:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditAddress = () => {
    setIsEditingAddress(false);
    setEditAddress({
      name: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
    });
  };

  return (
    <div>
      <div className="align-items-center mb-3 ">
        <h3 className="mb-0 me-3" style={{ color: "#3B4A66", fontSize: "20px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Billing Information</h3>
        <p className="mb-0" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
          View your billing details and payment methods
        </p>
      </div>




      <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Payment Methods</h5>

      {/* Loading State */}
      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
              Loading payment methods...
            </p>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      {!loading && paymentMethods.length > 0 && (
        paymentMethods.map((method) => (
          <div
            key={method.id}
            className="mb-3 rounded p-3"
            style={{
              border: "1px solid #F49C2D",
              backgroundColor: selectedId === method.id ? "#FFF4E6" : "#FFFFFF",
              cursor: "pointer",
            }}
            onClick={() => handleCardClick(method.id)}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <span className="bill">
                  <BillIcon />
                </span>
                <div className="d-flex flex-column">
                  <div>
                    <span className="fw-bold">•••• •••• •••• {method.last4}</span>
                    {method.isPrimary && (
                      <span
                        className="ms-2"
                        style={{
                          backgroundColor: "#22C55E",
                          borderRadius: "1rem",
                          padding: "0.35em 0.65em",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          lineHeight: "1",
                          color: "white",
                          fontFamily: "BasisGrotesquePro",
                        }}
                      >
                        Primary
                      </span>
                    )}
                  </div>
                  <small className="text-muted mt-2" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontWeight: "400", fontSize: "12px" }}>
                    {method.brand} - Expires {method.expiry}
                  </small>
                </div>
              </div>
              <div className="d-flex gap-2">
                {!method.isPrimary && (
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid #22C55E", color: "#22C55E", fontFamily: "BasisGrotesquePro", fontSize: "16px", fontWeight: "400" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsPrimary(method.id);
                    }}
                  >
                    Set as Primary
                  </button>
                )}
                <button
                  className="btn btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditCard(method);
                    const [month, year] = method.expiry.split("/");
                    setEditMonth(month);
                    setEditYear(year);
                    setEditDefault(method.isPrimary);
                    setShowEditModal(true);
                  }}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8F0FF",
                    color: "#3B4A66",
                    fontFamily: "BasisGrotesquePro",
                    fontSize: "16px",
                    fontWeight: "400"
                  }}
                >
                  Edit
                </button>

              </div>
            </div>
          </div>
        ))
      )}

      {/* No Payment Methods Message */}
      {!loading && paymentMethods.length === 0 && (
        <div className="text-center py-4">
          <p style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
            No payment methods found. Add your first payment method below.
          </p>
        </div>
      )}

      <button
        className="btn mb-4"
        style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8F0FF", color: "#3B4A66", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
        onClick={handleAddPaymentMethod}
      >
        <i className="bi bi-plus-lg me-2"></i> Add Payment Method
      </button>

      <h5 className="mb-3" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "18px", fontWeight: "500" }}>Billing Address</h5>

      {!isEditingAddress ? (
        billingAddress ? (
          <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8F0FF' }}>
            <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.name}</p>
            <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.street_address}</p>
            <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.city}, {billingAddress.state} {billingAddress.zip_code}</p>
            <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.country}</p>
          </div>
        ) : (
          <div className="text-center py-4 mb-3">
            <p style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
              No billing address found. Add your billing address below.
            </p>
          </div>
        )
      ) : (
        <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8F0FF' }}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={editAddress.name}
              onChange={(e) => setEditAddress({ ...editAddress, name: e.target.value })}
              style={{
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "400",
                border: "1px solid #E8F0FF",
                borderRadius: "6px"
              }}
              placeholder="Full Name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={editAddress.street_address}
              onChange={(e) => setEditAddress({ ...editAddress, street_address: e.target.value })}
              style={{
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "400",
                border: "1px solid #E8F0FF",
                borderRadius: "6px"
              }}
              placeholder="Street Address"
            />
          </Form.Group>
          <div className="d-flex gap-2">
            <Form.Group className="mb-3 flex-fill">
              <Form.Control
                type="text"
                value={editAddress.city}
                onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                style={{
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  fontWeight: "400",
                  border: "1px solid #E8F0FF",
                  borderRadius: "6px"
                }}
                placeholder="City"
              />
            </Form.Group>
            <Form.Group className="mb-3" style={{ width: "120px" }}>
              <Form.Control
                type="text"
                value={editAddress.state}
                onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value })}
                style={{
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  fontWeight: "400",
                  border: "1px solid #E8F0FF",
                  borderRadius: "6px"
                }}
                placeholder="State"
              />
            </Form.Group>
            <Form.Group className="mb-3" style={{ width: "120px" }}>
              <Form.Control
                type="text"
                value={editAddress.zip_code}
                onChange={(e) => setEditAddress({ ...editAddress, zip_code: e.target.value })}
                style={{
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  fontWeight: "400",
                  border: "1px solid #E8F0FF",
                  borderRadius: "6px"
                }}
                placeholder="ZIP Code"
              />
            </Form.Group>
          </div>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={editAddress.country}
              onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
              style={{
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "400",
                border: "1px solid #E8F0FF",
                borderRadius: "6px"
              }}
              placeholder="Country"
            />
          </Form.Group>
        </div>
      )}

      <div className="d-flex gap-2">
        {!isEditingAddress ? (
          billingAddress ? (
            <button
              className="btn"
              style={{ backgroundColor: "#F3F7FF", border: "1px solid #E8F0FF", color: "#3B4A66", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
              onClick={handleEditAddress}
            >
              Edit Billing Address
            </button>
          ) : (
            <button
              className="btn"
              style={{ backgroundColor: "#F56D2D", border: "1px solid #F56D2D", color: "#FFFFFF", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
              onClick={handleAddAddress}
            >
              Add Billing Address
            </button>
          )
        ) : (
          <>
            <button
              className="btn"
              style={{ backgroundColor: "#F56D2D", border: "1px solid #F56D2D", color: "#FFFFFF", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
              onClick={handleSaveAddress}
              disabled={saving}
            >
              {saving ? 'Saving...' : (billingAddress ? 'Update Address' : 'Add Address')}
            </button>
            <button
              className="btn"
              style={{ backgroundColor: "#F3F7FF", border: "1px solid #E8F0FF", color: "#3B4A66", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
              onClick={handleCancelEditAddress}
            >
              Cancel
            </button>
          </>
        )}
      </div>



      {/* Edit popup pages */}

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        dialogClassName="custom-modal-width"
        contentClassName="rounded-4"
      >
        <Modal.Header className="border-0 pb-0">
          <div className="d-flex justify-content-between align-items-start w-100">
            <div>
              <Modal.Title style={{
                fontFamily: "BasisGrotesquePro",
                fontWeight: 500,
                color: "#3B4A66",
                fontSize: "22px",
                marginLeft: "8px"
              }}>
                Edit Payment Method
              </Modal.Title>
              <p style={{
                color: "#4B5563",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "400",
                marginLeft: "8px",
                marginBottom: "0",
              }}>
                Update your payment method details
              </p>
            </div>
            <Button
              variant="light"
              onClick={() => setShowEditModal(false)}
              style={{
                backgroundColor: "#F0F4FF",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CrossIcon size={18} color="#1F2937" />
            </Button>
          </div>
        </Modal.Header>

        <hr style={{ borderColor: "#c9ccd1ff", margin: "0" }} />

        <Modal.Body style={{ padding: "1rem 1.5rem" }}>
          <Form>
            <div className="d-flex gap-2 mb-3">
              <Form.Group className="w-50">
                <Form.Label style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}>Month</Form.Label>
                <Form.Select value={editMonth} onChange={(e) => setEditMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="w-50">
                <Form.Label style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}>Year</Form.Label>
                <Form.Select value={editYear} onChange={(e) => setEditYear(e.target.value)}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={2025 + i}>{2025 + i}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <Form.Check
              type="switch"
              id="set-default"
              label="Set as default payment method"
              className="custom-switch"
            />
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 justify-content-between">
          <div className="d-flex align-items-center">
            <Button
              onClick={() => handleDeletePaymentMethod(editCard?.id)}
              disabled={saving}
              style={{
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro",
                backgroundColor: "#EF4444",
                border: "1px solid #EF4444",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <DelIcon /> {saving ? 'Deleting...' : 'Delete'}
            </Button>

            <Button
              variant="light"
              onClick={() => setShowEditModal(false)}
              style={{
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro",
                marginLeft: "12px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8F0FF"
              }}
            >
              Cancel
            </Button>
          </div>


          <div className="d-flex gap-">

            <Button
              style={{
                backgroundColor: "#F56D2D",
                border: "none",
                color: "#FFFFFF",
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro"
              }}
              onClick={handleEditPaymentMethod}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Payment Method'}
            </Button>
          </div>
        </Modal.Footer>

      </Modal>






      {/* Add payment popup pages */}

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        dialogClassName="custom-modal-width"
        contentClassName="rounded-4"
      >
        <Modal.Header className="border-0 pb-0">
          <div className="d-flex justify-content-between align-items-start w-100">
            <div>
              <Modal.Title
                style={{
                  fontFamily: "BasisGrotesquePro",
                  fontWeight: 500,
                  color: "#3B4A66",
                  fontSize: "22px",
                  marginLeft: "8px"
                }}
              >
                Add Payment Method
              </Modal.Title>
              <p
                style={{
                  color: "#6B7280",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  fontWeight: "400",

                  marginLeft: "8px",
                  marginBottom: "0",
                }}
              >
                Add a new payment method to your account
              </p>
            </div>
            <Button
              variant="light"
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: "#F0F4FF",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CrossIcon size={18} color="#1F2937" />
            </Button>
          </div>
        </Modal.Header>

        <hr style={{ borderColor: "#c9ccd1ff", margin: "0" }} />

        <Modal.Body style={{ padding: "1rem 1.5rem" }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Card Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="1234 5678 9012 3456"
                value={newPaymentMethod.cardNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                  value = value.replace(/(.{4})/g, '$1 ').trim(); // Add spaces every 4 digits
                  setNewPaymentMethod({ ...newPaymentMethod, cardNumber: value });
                  // Clear error when user starts typing
                  if (formErrors.cardNumber) {
                    setFormErrors({ ...formErrors, cardNumber: '' });
                  }
                }}
                isInvalid={!!formErrors.cardNumber}
              />
              {formErrors.cardNumber && (
                <Form.Control.Feedback type="invalid">
                  {formErrors.cardNumber}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Cardholder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="John Doe"
                value={newPaymentMethod.cardholderName}
                onChange={(e) => {
                  setNewPaymentMethod({ ...newPaymentMethod, cardholderName: e.target.value });
                  // Clear error when user starts typing
                  if (formErrors.cardholderName) {
                    setFormErrors({ ...formErrors, cardholderName: '' });
                  }
                }}
                isInvalid={!!formErrors.cardholderName}
              />
              {formErrors.cardholderName && (
                <Form.Control.Feedback type="invalid">
                  {formErrors.cardholderName}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-flex gap-2">
              <Form.Group className="mb-3 w-50">
                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Expiry Date</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="MM/YY"
                  value={newPaymentMethod.expiryDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    setNewPaymentMethod({ ...newPaymentMethod, expiryDate: value });
                    // Clear error when user starts typing
                    if (formErrors.expiryDate) {
                      setFormErrors({ ...formErrors, expiryDate: '' });
                    }
                  }}
                  isInvalid={!!formErrors.expiryDate}
                />
                {formErrors.expiryDate && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.expiryDate}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3 w-50">
                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>CVV</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="123"
                  value={newPaymentMethod.cvv}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    value = value.substring(0, 4); // Limit to 4 digits
                    setNewPaymentMethod({ ...newPaymentMethod, cvv: value });
                    // Clear error when user starts typing
                    if (formErrors.cvv) {
                      setFormErrors({ ...formErrors, cvv: '' });
                    }
                  }}
                  isInvalid={!!formErrors.cvv}
                />
                {formErrors.cvv && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.cvv}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </div>

            <Form.Check
              type="switch"
              id="set-default"
              label="Set as default payment method"
              checked={newPaymentMethod.isDefault}
              onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, isDefault: e.target.checked })}
              style={{
                color: "#3B4A66",
                fontSize: "12px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
              className="custom-switch"
            />

          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowModal(false)} style={{ color: "#131323", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: "#F56D2D", border: "none", color: "#FFFFFF", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
            onClick={() => handleModalSave(newPaymentMethod)}
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add Payment Method'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Billing;