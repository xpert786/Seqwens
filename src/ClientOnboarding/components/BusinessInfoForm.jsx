import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function BusinessInfoForm({ onSave, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    isHomeBased: false,
    address: '',
    city: '',
    state: '',
    zip: '',
    income: '',
    expenses: [],
    vehicleUse: false,
    homeOffice: false,
    inventory: false,
    healthInsurance: false,
    // ID for internal tracking if editing
    id: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure expenses is an array even if not provided
        expenses: initialData.expenses || []
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        { id: Date.now(), category: '', amount: '' }
      ]
    }));
  };

  const handleExpenseChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleRemoveExpense = (id) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== id)
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.isHomeBased) {
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
    }
    if (!formData.income) newErrors.income = 'Total annual income is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  // Styles consistent with DataIntake.jsx
  const labelStyle = {
    fontFamily: "BasisGrotesquePro",
    fontWeight: 400,
    fontSize: "16px",
    color: "#3B4A66"
  };

  const headerStyle = {
    color: "#3B4A66",
    fontSize: "18px",
    fontWeight: "500",
    fontFamily: "BasisGrotesquePro",
    marginBottom: "16px",
    marginTop: "24px"
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-3">
      <h4 style={{
        color: "#3B4A66",
        fontSize: "20px",
        fontWeight: "600",
        fontFamily: "BasisGrotesquePro",
        marginBottom: "20px"
      }}>
        {initialData ? 'Edit Business Details' : 'Add New Business'}
      </h4>

      {/* Basic Business Details */}
      <h5 style={headerStyle} className="mt-0">General Information</h5>
      
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label" style={labelStyle}>
            Business Name
          </label>
          <input
            type="text"
            className={`form-control ${errors.businessName ? 'is-invalid' : ''}`}
            placeholder="e.g., Smith Consulting"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
          />
          {errors.businessName && <div className="invalid-feedback">{errors.businessName}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label" style={labelStyle}>
            Type of Work / Profession
          </label>
          <input
            type="text"
            className={`form-control ${errors.businessType ? 'is-invalid' : ''}`}
            placeholder="e.g., Graphic Design, Landscaping, Online Sales"
            value={formData.businessType}
            onChange={(e) => handleChange('businessType', e.target.value)}
          />
          {errors.businessType && <div className="invalid-feedback">{errors.businessType}</div>}
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isHomeBased"
              checked={formData.isHomeBased}
              onChange={(e) => handleChange('isHomeBased', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isHomeBased" style={labelStyle}>
              This is a home-based business (uses my home address)
            </label>
          </div>
        </div>

        {!formData.isHomeBased && (
          <>
            <div className="col-12">
              <label className="form-label" style={labelStyle}>Business Address</label>
              <input
                type="text"
                className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
            </div>
            <div className="col-md-5">
              <label className="form-label" style={labelStyle}>City</label>
              <input
                type="text"
                className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
              {errors.city && <div className="invalid-feedback">{errors.city}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>State</label>
              <input
                type="text"
                className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
              {errors.state && <div className="invalid-feedback">{errors.state}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label" style={labelStyle}>ZIP Code</label>
              <input
                type="text"
                className={`form-control ${errors.zip ? 'is-invalid' : ''}`}
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
              />
              {errors.zip && <div className="invalid-feedback">{errors.zip}</div>}
            </div>
          </>
        )}
      </div>

      {/* Income */}
      <h5 style={headerStyle}>Income</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label" style={labelStyle}>
            Total Annual Income (Gross Receipts)
          </label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              type="number"
              className={`form-control ${errors.income ? 'is-invalid' : ''}`}
              placeholder="0.00"
              value={formData.income}
              onChange={(e) => handleChange('income', e.target.value)}
            />
            {errors.income && <div className="invalid-feedback">{errors.income}</div>}
          </div>
          <div className="form-text">Total money earned before any expenses are taken out.</div>
        </div>
      </div>

      {/* Expenses */}
      <h5 style={headerStyle}>Expenses</h5>
      <p style={{ fontSize: '14px', color: '#6B7280', fontFamily: "BasisGrotesquePro" }}>
        List your major business expenses below (e.g., Advertising, Supplies, Legal fees).
      </p>
      
      <div className="mb-4">
        {formData.expenses.map((expense, index) => (
          <div key={expense.id} className="row g-3 mb-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label small text-muted">Category</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Office Supplies"
                value={expense.category}
                onChange={(e) => handleExpenseChange(expense.id, 'category', e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label small text-muted">Amount</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={expense.amount}
                  onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-danger w-100"
                onClick={() => handleRemoveExpense(expense.id)}
                title="Remove Expense"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
        
        <button
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
          onClick={handleAddExpense}
          style={{ fontFamily: "BasisGrotesquePro" }}
        >
          <FaPlus size={12} /> Add Expense Category
        </button>
      </div>

      {/* Optional Sections */}
      <h5 style={headerStyle}>Additional Details</h5>
      <div className="row g-3 mb-4">
        <div className="col-12">
            <p className="mb-2" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>Check all that apply to this business:</p>
            
            <div className="form-check mb-2">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="vehicleUse"
                    checked={formData.vehicleUse}
                    onChange={(e) => handleChange('vehicleUse', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="vehicleUse" style={labelStyle}>
                    I used a personal vehicle for business purposes (mileage, etc.)
                </label>
            </div>

            <div className="form-check mb-2">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="homeOffice"
                    checked={formData.homeOffice}
                    onChange={(e) => handleChange('homeOffice', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="homeOffice" style={labelStyle}>
                    I used a dedicated space in my home exclusively for business
                </label>
            </div>

            <div className="form-check mb-2">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="inventory"
                    checked={formData.inventory}
                    onChange={(e) => handleChange('inventory', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="inventory" style={labelStyle}>
                    I carry inventory (products held for sale)
                </label>
            </div>

            <div className="form-check mb-2">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="healthInsurance"
                    checked={formData.healthInsurance}
                    onChange={(e) => handleChange('healthInsurance', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="healthInsurance" style={labelStyle}>
                    I paid for self-employed health insurance
                </label>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-end gap-3 pt-3 border-top">
        <button 
          className="btn btn-light"
          onClick={onCancel}
          style={{ fontFamily: "BasisGrotesquePro", fontWeight: 500 }}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleSubmit}
          style={{ 
            fontFamily: "BasisGrotesquePro", 
            fontWeight: 500,
            background: "#3B4A66",
            borderColor: "#3B4A66"
          }}
        >
          Save Business
        </button>
      </div>
    </div>
  );
}
