import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function RentalPropertyForm({ onSave, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    // 1. Property Basics
    isRentalProperty: false,
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    propertyType: 'single', // 'single', 'apartment', 'vacation', 'other'
    ownershipType: '', // 'own_100', 'share', 'no'

    // 2. How the Property Was Used
    rentedOutDuringYear: false,
    daysRentedOut: '',
    familyUse: false,
    familyUseDays: '',

    // 3. Rental Income
    totalRentReceived: '',
    taxFormsReceived: [], // Array of selected forms: ['1099NEC', '1099MISC', '1099K', 'none']

    // 4. Common Rental Expenses
    advertising: '',
    cleaningMaintenance: '',
    repairs: '',
    propertyManagementFees: '',
    insurance: '',
    mortgageInterest: '',
    propertyTaxes: '',
    utilities: '',
    legalProfessional: '',
    supplies: '',

    // 5. Other Rental Expenses
    otherExpenses: [],
    otherExpenseDescription: '',
    otherExpenseAmount: '',

    // 6. Big Changes During the Year
    soldOrStoppedRenting: false,
    boughtMajorItems: false,

    // 7. Prior-Year Information (Optional)
    hasRentalLosses: false,

    // 8. Final Confirmation
    isComplete: false,

    // ID for internal tracking if editing
    id: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // Normalize taxFormsReceived - convert string to array if needed
      let taxForms = initialData.taxFormsReceived || [];
      if (typeof taxForms === 'string') {
        if (taxForms.toLowerCase() === 'none') {
          taxForms = ['none'];
        } else {
          taxForms = [taxForms];
        }
      }

      setFormData({
        ...initialData,
        taxFormsReceived: taxForms,
        // Ensure arrays are properly initialized
        otherExpenses: initialData.otherExpenses || []
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

  const handleAddOtherExpense = () => {
    setFormData(prev => ({
      ...prev,
      otherExpenses: [
        ...prev.otherExpenses,
        { id: Date.now(), description: '', amount: '' }
      ]
    }));
  };

  const handleOtherExpenseChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      otherExpenses: prev.otherExpenses.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleRemoveOtherExpense = (id) => {
    setFormData(prev => ({
      ...prev,
      otherExpenses: prev.otherExpenses.filter(exp => exp.id !== id)
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Required validations
    if (formData.isRentalProperty) {
      if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Property address is required';
      if (!formData.propertyCity.trim()) newErrors.propertyCity = 'Property city is required';
      if (!formData.propertyState.trim()) newErrors.propertyState = 'Property state is required';
      if (!formData.propertyZip.trim()) newErrors.propertyZip = 'Property ZIP is required';
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
      if (formData.ownershipType === 'own_100' && !formData.ownershipType) {
        newErrors.ownershipType = 'Ownership percentage is required when owned 100%';
      }
    }

    if (!formData.totalRentReceived.trim()) newErrors.totalRentReceived = 'Total rent received is required';

    // Conditional validations
    if (formData.rentedOutDuringYear && !formData.daysRentedOut.trim()) {
      newErrors.daysRentedOut = 'Days rented out is required when property was rented during year';
    }
    if (formData.familyUse && !formData.familyUseDays.trim()) {
      newErrors.familyUseDays = 'Family use days is required when family used property';
    }

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
    fontSize: "20px",
    fontWeight: "500",
    fontFamily: "BasisGrotesquePro",
    marginBottom: "16px",
    marginTop: "24px"
  };

  const sectionStyle = {
    color: "#3B4A66",
    fontSize: "18px",
    fontWeight: "600",
    fontFamily: "BasisGrotesquePro",
    marginBottom: "16px"
  };

  return (
    <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
      <h4 style={headerStyle} className="mb-4">
        {initialData ? 'Edit Rental Property Information' : 'Rental Property Information'}
      </h4>
      <p style={{
        color: "#4B5563",
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "BasisGrotesquePro",
        marginBottom: "24px"
      }}>
        Tell us about your rental property in a few simple steps.
      </p>

      {/* 1. Property Basics */}
      <div className="mb-6">
        <h5 style={sectionStyle}>1. Property Basics</h5>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              Is this a rental property?
            </label>
            <select
              className={`form-control ${errors.isRentalProperty ? 'is-invalid' : ''}`}
              value={formData.isRentalProperty ? 'yes' : 'no'}
              onChange={(e) => handleChange('isRentalProperty', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        {formData.isRentalProperty && (
          <>
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>
                  Property address:
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.propertyAddress ? 'is-invalid' : ''}`}
                  placeholder="Street Address"
                  value={formData.propertyAddress}
                  onChange={(e) => handleChange('propertyAddress', e.target.value)}
                />
                {errors.propertyAddress && <div className="invalid-feedback">{errors.propertyAddress}</div>}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className={`form-control ${errors.propertyCity ? 'is-invalid' : ''}`}
                  placeholder="City"
                  value={formData.propertyCity}
                  onChange={(e) => handleChange('propertyCity', e.target.value)}
                />
                {errors.propertyCity && <div className="invalid-feedback">{errors.propertyCity}</div>}
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className={`form-control ${errors.propertyState ? 'is-invalid' : ''}`}
                  placeholder="State"
                  value={formData.propertyState}
                  onChange={(e) => handleChange('propertyState', e.target.value)}
                />
                {errors.propertyState && <div className="invalid-feedback">{errors.propertyState}</div>}
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className={`form-control ${errors.propertyZip ? 'is-invalid' : ''}`}
                  placeholder="ZIP"
                  value={formData.propertyZip}
                  onChange={(e) => handleChange('propertyZip', e.target.value)}
                />
                {errors.propertyZip && <div className="invalid-feedback">{errors.propertyZip}</div>}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>
                  Type of property:
                </label>
                <select
                  className={`form-control ${errors.propertyType ? 'is-invalid' : ''}`}
                  value={formData.propertyType}
                  onChange={(e) => handleChange('propertyType', e.target.value)}
                >
                  <option value="single">Single-family home</option>
                  <option value="apartment">Apartment / Condo</option>
                  <option value="vacation">Vacation rental (Airbnb, VRBO, etc.)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>
                  Do you own this property by yourself?
                </label>
                <select
                  className="form-control"
                  value={formData.ownershipType}
                  onChange={(e) => handleChange('ownershipType', e.target.value)}
                >
                  <option value="">Select ownership type</option>
                  <option value="own_100">Yes, I own 100%</option>
                  <option value="share">No, I share ownership</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. How the Property Was Used */}
      <div className="mb-6">
        <h5 style={sectionStyle}>2. How the Property Was Used</h5>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Was the property rented out during the year?
            </label>
            <select
              className="form-control"
              value={formData.rentedOutDuringYear ? 'yes' : 'no'}
              onChange={(e) => handleChange('rentedOutDuringYear', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="col-md-6">
            {formData.rentedOutDuringYear && (
              <>
                <label className="form-label" style={labelStyle}>
                  If yes, about how many days was it rented out?
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.daysRentedOut ? 'is-invalid' : ''}`}
                  placeholder="0"
                  value={formData.daysRentedOut}
                  onChange={(e) => handleChange('daysRentedOut', e.target.value)}
                />
                {errors.daysRentedOut && <div className="invalid-feedback">{errors.daysRentedOut}</div>}
              </>
            )}
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Did you or your family use the property personally?
            </label>
            <select
              className="form-control"
              value={formData.familyUse ? 'yes' : 'no'}
              onChange={(e) => handleChange('familyUse', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes → About how many days?</option>
            </select>
          </div>
          <div className="col-md-6">
            {formData.familyUse && (
              <>
                <label className="form-label" style={labelStyle}>
                  About how many days?
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.familyUseDays ? 'is-invalid' : ''}`}
                  placeholder="0"
                  value={formData.familyUseDays}
                  onChange={(e) => handleChange('familyUseDays', e.target.value)}
                />
                {errors.familyUseDays && <div className="invalid-feedback">{errors.familyUseDays}</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Rental Income */}
      <div className="mb-6">
        <h5 style={sectionStyle}>3. Rental Income</h5>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              Total rent you received for the year:
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className={`form-control ${errors.totalRentReceived ? 'is-invalid' : ''}`}
                placeholder="0.00"
                value={formData.totalRentReceived}
                onChange={(e) => handleChange('totalRentReceived', e.target.value)}
              />
            </div>
            {errors.totalRentReceived && <div className="invalid-feedback">{errors.totalRentReceived}</div>}
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              Did you receive any tax forms for this rental income? (Optional)
            </label>
            <div className="d-flex flex-column gap-2 mt-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rentalTaxFormNone"
                  checked={formData.taxFormsReceived.includes('none')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange('taxFormsReceived', ['none']);
                    } else {
                      handleChange('taxFormsReceived', formData.taxFormsReceived.filter(f => f !== 'none'));
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="rentalTaxFormNone" style={labelStyle}>
                  None / Not sure
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rentalTaxForm1099NEC"
                  checked={formData.taxFormsReceived.includes('1099NEC')}
                  onChange={(e) => {
                    const current = formData.taxFormsReceived || [];
                    if (e.target.checked) {
                      const newForms = current.filter(f => f !== 'none');
                      handleChange('taxFormsReceived', [...newForms, '1099NEC']);
                    } else {
                      handleChange('taxFormsReceived', current.filter(f => f !== '1099NEC'));
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="rentalTaxForm1099NEC" style={labelStyle}>
                  1099-NEC
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rentalTaxForm1099MISC"
                  checked={formData.taxFormsReceived.includes('1099MISC')}
                  onChange={(e) => {
                    const current = formData.taxFormsReceived || [];
                    if (e.target.checked) {
                      const newForms = current.filter(f => f !== 'none');
                      handleChange('taxFormsReceived', [...newForms, '1099MISC']);
                    } else {
                      handleChange('taxFormsReceived', current.filter(f => f !== '1099MISC'));
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="rentalTaxForm1099MISC" style={labelStyle}>
                  1099-MISC
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rentalTaxForm1099K"
                  checked={formData.taxFormsReceived.includes('1099K')}
                  onChange={(e) => {
                    const current = formData.taxFormsReceived || [];
                    if (e.target.checked) {
                      const newForms = current.filter(f => f !== 'none');
                      handleChange('taxFormsReceived', [...newForms, '1099K']);
                    } else {
                      handleChange('taxFormsReceived', current.filter(f => f !== '1099K'));
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="rentalTaxForm1099K" style={labelStyle}>
                  1099-K
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Common Rental Expenses */}
      <div className="mb-6">
        <h5 style={sectionStyle}>4. Common Rental Expenses</h5>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Advertising (listing fees, online ads)
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.advertising}
                onChange={(e) => handleChange('advertising', e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Cleaning or maintenance
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.cleaningMaintenance}
                onChange={(e) => handleChange('cleaningMaintenance', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Repairs (fixing things, not major upgrades)
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.repairs}
                onChange={(e) => handleChange('repairs', e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Property management fees
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.propertyManagementFees}
                onChange={(e) => handleChange('propertyManagementFees', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Insurance (landlord or rental insurance)
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.insurance}
                onChange={(e) => handleChange('insurance', e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Mortgage interest
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.mortgageInterest}
                onChange={(e) => handleChange('mortgageInterest', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Property taxes
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.propertyTaxes}
                onChange={(e) => handleChange('propertyTaxes', e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Utilities you paid
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.utilities}
                onChange={(e) => handleChange('utilities', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Legal or professional help
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.legalProfessional}
                onChange={(e) => handleChange('legalProfessional', e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Supplies
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={formData.supplies}
                onChange={(e) => handleChange('supplies', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Other Rental Expenses */}
      <div className="mb-6">
        <h5 style={sectionStyle}>5. Other Rental Expenses</h5>

        {formData.otherExpenses.map((expense, index) => (
          <div key={expense.id} className="row g-3 mb-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Description
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter expense description"
                value={expense.description}
                onChange={(e) => handleOtherExpenseChange(expense.id, 'description', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>
                Amount
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={expense.amount}
                  onChange={(e) => handleOtherExpenseChange(expense.id, 'amount', e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-danger w-100"
                onClick={() => handleRemoveOtherExpense(expense.id)}
                title="Remove Expense"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}

        <button
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
          onClick={handleAddOtherExpense}
          style={{ fontFamily: "BasisGrotesquePro" }}
        >
          <FaPlus size={12} /> Add Other Expense
        </button>
      </div>

      {/* 6. Big Changes During the Year */}
      <div className="mb-6">
        <h5 style={sectionStyle}>6. Big Changes During the Year</h5>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Did you sell or completely stop renting this property this year?
            </label>
            <select
              className="form-control"
              value={formData.soldOrStoppedRenting ? 'yes' : 'no'}
              onChange={(e) => handleChange('soldOrStoppedRenting', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Did you buy major items for the property (appliances, roof, HVAC, etc.)?
            </label>
            <select
              className="form-control"
              value={formData.boughtMajorItems ? 'yes' : 'no'}
              onChange={(e) => handleChange('boughtMajorItems', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
              <option value="not_sure">Not sure</option>
            </select>
          </div>
        </div>
      </div>

      {/* 7. Prior-Year Information (Optional) */}
      <div className="mb-6">
        <h5 style={sectionStyle}>7. Prior-Year Information (Optional)</h5>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              Did you have rental losses from previous years that were not used?
            </label>
            <select
              className="form-control"
              value={formData.hasRentalLosses ? 'yes' : 'no'}
              onChange={(e) => handleChange('hasRentalLosses', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
              <option value="not_sure">Not sure</option>
            </select>
          </div>
        </div>
      </div>

      {/* 8. Final Confirmation */}
      <div className="mb-6">
        <h5 style={sectionStyle}>Final Confirmation</h5>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              Is everything above complete to the best of your knowledge?
            </label>
            <select
              className="form-control"
              value={formData.isComplete ? 'yes' : 'no'}
              onChange={(e) => handleChange('isComplete', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontFamily: "BasisGrotesquePro",
          fontStyle: 'italic'
        }}>
          Your tax preparer will handle all calculations, limits, and tax forms. Just answer honestly and approximately if needed.
        </p>

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
              backgroundColor: "#3B4A66",
              borderColor: "#3B4A66"
            }}
          >
            Save Rental Property Information
          </button>
        </div>
      </div>
    </div>
  );
}
