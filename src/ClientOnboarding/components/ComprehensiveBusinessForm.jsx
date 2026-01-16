import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import BusinessAutocomplete from './BusinessAutocomplete';

export default function ComprehensiveBusinessForm({ onSave, onCancel, onError, externalErrors = {}, initialData = null }) {
  const [formData, setFormData] = useState({
    // 1. About Your Business
    workDescription: '',
    businessCodeId: null, // Selected business code ID from backend
    businessCodeNaics: '', // NAICS code (read-only from backend)
    businessCodeTitle: '', // Business code title (read-only from backend)
    businessName: '',
    businessNameType: 'same', // 'same' or 'different'
    differentBusinessName: '',
    startedDuringYear: false,
    homeBased: false,
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',

    // 2. Money You Made (Income)
    totalIncome: '',
    taxFormsReceived: [], // Array of selected forms: ['1099NEC', '1099MISC', '1099K', 'K1', 'OTHER', 'NONE']
    issuedRefunds: false,
    totalRefunded: '',
    otherBusinessIncome: false,
    otherBusinessIncomeAmount: '',

    // 3. Business Expenses
    advertising: '',
    officeSupplies: '',
    cleaningRepairs: '',
    insurance: '',
    legalProfessional: '',
    phoneInternetUtilities: '',
    paidContractors: false,
    totalPaidContractors: '',
    otherExpenses: [],
    otherExpenseDescription: '',
    otherExpenseAmount: '',

    // 4. Vehicle & Travel
    usedVehicle: false,
    businessMiles: '',
    parkingTollsTravel: '',

    // 5. Food & Travel
    businessMeals: '',
    travelExpenses: '',

    // 6. Home Office (Optional)
    homeOfficeUse: false,
    homeOfficeSize: '',

    // 7. Inventory or Products (Optional)
    sellProducts: false,
    costItemsResold: '',
    inventoryLeftEnd: '',

    // 8. Health Insurance & Retirement (Optional)
    healthInsuranceBusiness: false,
    selfEmployedRetirement: false,
    retirementAmount: '',

    // Final Confirmation
    isAccurate: false,

    // ID for internal tracking if editing
    id: null
  });

  const [errors, setErrors] = useState({});
  const [apiErrors, setApiErrors] = useState({});

  // Handle external API errors
  useEffect(() => {
    if (Object.keys(externalErrors).length > 0) {
      setApiErrors(externalErrors);
    } else {
      setApiErrors({});
    }
  }, [externalErrors]);

  useEffect(() => {
    if (initialData) {
      // Normalize taxFormsReceived - convert string to array if needed
      let taxForms = initialData.taxFormsReceived || [];
      if (typeof taxForms === 'string') {
        // If it's a string, convert to array (handle 'none' or single value)
        if (taxForms.toLowerCase() === 'none') {
          taxForms = ['NONE'];
        } else {
          taxForms = [taxForms];
        }
      }
      
      setFormData({
        ...initialData,
        // Ensure arrays are properly initialized
        otherExpenses: initialData.otherExpenses || [],
        expenses: initialData.expenses || [],
        taxFormsReceived: taxForms,
        // Initialize business code fields
        businessCodeId: initialData.business_code_id || initialData.businessCodeId || null,
        businessCodeNaics: initialData.business_code_naics || initialData.businessCodeNaics || '',
        businessCodeTitle: initialData.business_code_title || initialData.businessCodeTitle || ''
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
    if (!formData.workDescription.trim()) {
      newErrors.workDescription = 'Please describe the kind of work you do';
    } else if (formData.workDescription.trim().length < 3) {
      newErrors.workDescription = 'Please provide a more detailed description (at least 3 characters)';
    }

    // Business name validation - only required if user selected "different"
    if (formData.businessNameType === 'different' && !formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    // Business address is required when business name is provided (for different business names)
    if (formData.businessNameType === 'different' && formData.businessName.trim()) {
      if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required when business name is provided';
      if (!formData.businessCity.trim()) newErrors.businessCity = 'Business city is required when business name is provided';
      if (!formData.businessState.trim()) newErrors.businessState = 'Business state is required when business name is provided';
      if (!formData.businessZip.trim()) newErrors.businessZip = 'Business ZIP is required when business name is provided';
    }
    if (!formData.totalIncome.trim()) newErrors.totalIncome = 'Total income is required';
    
    // Conditional validations
    if (formData.issuedRefunds && !formData.totalRefunded.trim()) {
      newErrors.totalRefunded = 'Refunded amount is required when refunds were issued';
    }
    if (formData.otherBusinessIncome && !formData.otherBusinessIncomeAmount.trim()) {
      newErrors.otherBusinessIncomeAmount = 'Amount is required for other business income';
    }
    if (formData.usedVehicle && !formData.businessMiles.trim()) {
      newErrors.businessMiles = 'Business miles is required when vehicle was used';
    }
    if (formData.paidContractors && !formData.totalPaidContractors.trim()) {
      newErrors.totalPaidContractors = 'Total paid to contractors is required';
    }
    if (formData.selfEmployedRetirement && !formData.retirementAmount.trim()) {
      newErrors.retirementAmount = 'Retirement amount is required when contributing to plan';
    }

    // Number validation for optional fields
    const numericFields = [
      'totalPaidContractors', 'businessMiles', 'costItemsResold',
      'inventoryLeftEnd', 'retirementAmount'
    ];

    numericFields.forEach(field => {
      if (formData[field] && formData[field].trim() !== '') {
        const numValue = parseFloat(formData[field]);
        if (isNaN(numValue) || numValue < 0) {
          const fieldNames = {
            totalPaidContractors: 'Total paid to contractors',
            businessMiles: 'Business miles',
            costItemsResold: 'Cost of items resold',
            inventoryLeftEnd: 'Inventory left at end of year',
            retirementAmount: 'Retirement amount'
          };
          newErrors[field] = `${fieldNames[field]} must be a valid positive number`;
        }
      }
    });

    // Calculate total expenses and compare with income
    const totalIncome = parseFloat(formData.totalIncome.replace(/,/g, '')) || 0;

    let totalExpenses = 0;
    // Sum all expense fields
    const expenseFields = [
      'advertising', 'officeSupplies', 'cleaningRepairs', 'insurance',
      'legalProfessional', 'phoneInternetUtilities', 'parkingTollsTravel',
      'businessMeals', 'travelExpenses', 'totalPaidContractors'
    ];

    expenseFields.forEach(field => {
      const value = parseFloat(formData[field]?.replace(/,/g, '')) || 0;
      totalExpenses += value;
    });

    // Add other expenses from array
    if (formData.otherExpenses && Array.isArray(formData.otherExpenses)) {
      formData.otherExpenses.forEach(expense => {
        const amount = parseFloat(expense.amount?.replace(/,/g, '')) || 0;
        totalExpenses += amount;
      });
    }

    // Check if expenses are unusually high compared to income (more than 3x income)
    if (totalIncome > 0 && totalExpenses > totalIncome * 3) {
      newErrors.totalIncome = 'Total expenses appear to be unusually high compared to income. Please verify your amounts.';
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
        {initialData ? 'Edit Business Income & Expenses' : 'Business Income & Expenses'}
      </h4>
      <p style={{
        color: "#4B5563",
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "BasisGrotesquePro",
        marginBottom: "24px"
      }}>
        Use this form if you earned money on your own, such as freelancing, gig work, self-employment, side hustles, or small businesses.
      </p>

      {/* 1. About Your Business */}
      <div className="mb-6">
        <h5 style={sectionStyle}>1. About Your Business</h5>
        
        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              What kind of work do you do?
            </label>
            <BusinessAutocomplete
              value={formData.workDescription}
              onChange={(value, codeData) => {
                console.log('ComprehensiveBusinessForm: onChange called with:', value, codeData);
                // Handle both free text and code selection
                handleChange('workDescription', value);

                if (codeData) {
                  // If a business code was selected, store the code information
                  console.log('ComprehensiveBusinessForm: Setting code data:', codeData);
                  handleChange('businessCodeId', codeData.codeId);
                  handleChange('businessCodeNaics', codeData.naicsCode);
                  handleChange('businessCodeTitle', codeData.text);
                } else {
                  // If free text was entered, clear code fields
                  console.log('ComprehensiveBusinessForm: Clearing code fields');
                  handleChange('businessCodeId', null);
                  handleChange('businessCodeNaics', '');
                  handleChange('businessCodeTitle', '');
                }
              }}
              placeholder="e.g., Web Development, Consulting, Photography - Start typing for suggestions"
              error={!!errors.workDescription}
              className={errors.workDescription ? 'is-invalid' : ''}
            />
            <div className="form-text text-muted small" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Select from common business types or enter your own description. This helps with accurate tax classification.
            </div>
            {errors.workDescription && <div className="invalid-feedback">{errors.workDescription}</div>}
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              What's your business name?
            </label>
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="businessNameType"
                  id="businessNameSame"
                  value="same"
                  checked={formData.businessNameType === 'same'}
                  onChange={(e) => handleChange('businessNameType', e.target.value)}
                />
                <label className="form-check-label" htmlFor="businessNameSame" style={labelStyle}>
                  Same as my personal name
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="businessNameType"
                  id="businessNameDifferent"
                  value="different"
                  checked={formData.businessNameType === 'different'}
                  onChange={(e) => handleChange('businessNameType', e.target.value)}
                />
                <label className="form-check-label" htmlFor="businessNameDifferent" style={labelStyle}>
                  I have a different business name
                </label>
              </div>
            </div>

            {formData.businessNameType === 'different' && (
              <div className="mt-3">
                <input
                  type="text"
                  className={`form-control ${errors.businessName ? 'is-invalid' : ''}`}
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                />
                {errors.businessName && <div className="invalid-feedback">{errors.businessName}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Did you start this business during the year?
            </label>
            <select
              className="form-control"
              value={formData.startedDuringYear ? 'yes' : 'no'}
              onChange={(e) => handleChange('startedDuringYear', e.target.value === 'yes')}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Do you run this business from your home?
            </label>
            <select
              className="form-control"
              value={formData.homeBased ? 'yes' : 'no'}
              onChange={(e) => handleChange('homeBased', e.target.value === 'yes')}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {formData.businessName.trim() && (
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Business address: *
              </label>
              <input
                type="text"
                className={`form-control ${errors.businessAddress ? 'is-invalid' : ''}`}
                placeholder="Street Address"
                value={formData.businessAddress}
                onChange={(e) => handleChange('businessAddress', e.target.value)}
              />
              {errors.businessAddress && <div className="invalid-feedback">{errors.businessAddress}</div>}
            </div>
          </div>
        )}

        {formData.businessName.trim() && (
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className={`form-control ${errors.businessCity ? 'is-invalid' : ''}`}
                placeholder="City"
                value={formData.businessCity}
                onChange={(e) => handleChange('businessCity', e.target.value)}
              />
              {errors.businessCity && <div className="invalid-feedback">{errors.businessCity}</div>}
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className={`form-control ${errors.businessState ? 'is-invalid' : ''}`}
                placeholder="State"
                value={formData.businessState}
                onChange={(e) => handleChange('businessState', e.target.value)}
              />
              {errors.businessState && <div className="invalid-feedback">{errors.businessState}</div>}
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className={`form-control ${errors.businessZip ? 'is-invalid' : ''}`}
                placeholder="ZIP"
                value={formData.businessZip}
                onChange={(e) => handleChange('businessZip', e.target.value)}
              />
              {errors.businessZip && <div className="invalid-feedback">{errors.businessZip}</div>}
            </div>
          </div>
        )}

        {/* 2. Money You Made (Income) */}
        <div className="mb-6">
          <h5 style={sectionStyle}>2. Money You Made (Income)</h5>
          
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Total money you earned from this business (before expenses):
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className={`form-control ${errors.totalIncome ? 'is-invalid' : ''}`}
                  placeholder="0.00"
                  value={formData.totalIncome}
                  onChange={(e) => handleChange('totalIncome', e.target.value)}
                />
              </div>
              {errors.totalIncome && <div className="invalid-feedback">{errors.totalIncome}</div>}
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Did you receive any tax forms showing this income?
              </label>
              <div className="d-flex flex-column gap-2 mt-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="taxForm1099NEC"
                    checked={formData.taxFormsReceived.includes('1099NEC')}
                    onChange={(e) => {
                      const currentForms = formData.taxFormsReceived || [];
                      if (e.target.checked) {
                        // Remove 'NONE' if it was selected and user is now selecting a form
                        const newForms = currentForms.filter(form => form !== 'NONE');
                        handleChange('taxFormsReceived', [...newForms, '1099NEC']);
                      } else {
                        handleChange('taxFormsReceived', currentForms.filter(form => form !== '1099NEC'));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="taxForm1099NEC" style={labelStyle}>
                    Form 1099-NEC (Nonemployee Compensation)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="taxForm1099MISC"
                    checked={formData.taxFormsReceived.includes('1099MISC')}
                    onChange={(e) => {
                      const currentForms = formData.taxFormsReceived || [];
                      if (e.target.checked) {
                        // Remove 'NONE' if it was selected and user is now selecting a form
                        const newForms = currentForms.filter(form => form !== 'NONE');
                        handleChange('taxFormsReceived', [...newForms, '1099MISC']);
                      } else {
                        handleChange('taxFormsReceived', currentForms.filter(form => form !== '1099MISC'));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="taxForm1099MISC" style={labelStyle}>
                    Form 1099-MISC
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="taxForm1099K"
                    checked={formData.taxFormsReceived.includes('1099K')}
                    onChange={(e) => {
                      const currentForms = formData.taxFormsReceived || [];
                      if (e.target.checked) {
                        // Remove 'NONE' if it was selected and user is now selecting a form
                        const newForms = currentForms.filter(form => form !== 'NONE');
                        handleChange('taxFormsReceived', [...newForms, '1099K']);
                      } else {
                        handleChange('taxFormsReceived', currentForms.filter(form => form !== '1099K'));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="taxForm1099K" style={labelStyle}>
                    Form 1099-K (Payment apps, card processors, platforms)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="taxFormK1"
                    checked={formData.taxFormsReceived.includes('K1')}
                    onChange={(e) => {
                      const currentForms = formData.taxFormsReceived || [];
                      if (e.target.checked) {
                        // Remove 'NONE' if it was selected and user is now selecting a form
                        const newForms = currentForms.filter(form => form !== 'NONE');
                        handleChange('taxFormsReceived', [...newForms, 'K1']);
                      } else {
                        handleChange('taxFormsReceived', currentForms.filter(form => form !== 'K1'));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="taxFormK1" style={labelStyle}>
                    Schedule K-1 (Partnership / S-Corp income)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="taxFormOther"
                    checked={formData.taxFormsReceived.includes('OTHER')}
                    onChange={(e) => {
                      const currentForms = formData.taxFormsReceived || [];
                      if (e.target.checked) {
                        // Remove 'NONE' if it was selected and user is now selecting a form
                        const newForms = currentForms.filter(form => form !== 'NONE');
                        handleChange('taxFormsReceived', [...newForms, 'OTHER']);
                      } else {
                        handleChange('taxFormsReceived', currentForms.filter(form => form !== 'OTHER'));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="taxFormOther" style={labelStyle}>
                    Other tax forms
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="taxFormNone"
                    checked={formData.taxFormsReceived.includes('NONE')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // If "None" is checked, clear all other selections and add NONE
                        handleChange('taxFormsReceived', ['NONE']);
                      } else {
                        // If "None" is unchecked, remove it from the array
                        handleChange('taxFormsReceived', formData.taxFormsReceived.filter(form => form !== 'NONE'));
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="taxFormNone" style={labelStyle}>
                    None / Not sure
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Did you issue refunds to customers?
              </label>
              <select
                className="form-control"
                value={formData.issuedRefunds ? 'yes' : 'no'}
                onChange={(e) => handleChange('issuedRefunds', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes → Total refunded $</option>
              </select>
            </div>
            <div className="col-md-6">
              {formData.issuedRefunds && (
                <>
                  <label className="form-label" style={labelStyle}>
                    Total refunded amount:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${errors.totalRefunded ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.totalRefunded}
                      onChange={(e) => handleChange('totalRefunded', e.target.value)}
                    />
                  </div>
                  {errors.totalRefunded && <div className="invalid-feedback">{errors.totalRefunded}</div>}
                </>
              )}
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Any other business income?
              </label>
              <select
                className="form-control"
                value={formData.otherBusinessIncome ? 'yes' : 'no'}
                onChange={(e) => handleChange('otherBusinessIncome', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes → Amount $</option>
              </select>
            </div>
            <div className="col-md-6">
              {formData.otherBusinessIncome && (
                <>
                  <label className="form-label" style={labelStyle}>
                    Amount:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${errors.otherBusinessIncomeAmount ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.otherBusinessIncomeAmount}
                      onChange={(e) => handleChange('otherBusinessIncomeAmount', e.target.value)}
                    />
                  </div>
                  {errors.otherBusinessIncomeAmount && <div className="invalid-feedback">{errors.otherBusinessIncomeAmount}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Business Expenses */}
        <div className="mb-6">
          <h5 style={sectionStyle}>3. Business Expenses</h5>
          
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Advertising or marketing
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
                Office supplies
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.officeSupplies}
                  onChange={(e) => handleChange('officeSupplies', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Cleaning, repairs, or maintenance
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.cleaningRepairs}
                  onChange={(e) => handleChange('cleaningRepairs', e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Insurance (business only)
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
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>
                Legal or professional services
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
                Phone, internet, or utilities used for business
              </label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.phoneInternetUtilities}
                  onChange={(e) => handleChange('phoneInternetUtilities', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Vehicle & Travel */}
          <div className="mb-6">
            <h5 style={sectionStyle}>4. Vehicle & Travel</h5>
            
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>
                  Did you use a vehicle for business?
                </label>
                <select
                  className="form-control"
                  value={formData.usedVehicle ? 'yes' : 'no'}
                  onChange={(e) => handleChange('usedVehicle', e.target.value === 'yes')}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="col-md-6">
                {formData.usedVehicle && (
                  <>
                    <label className="form-label" style={labelStyle}>
                      Business miles driven
                    </label>
                    <input
                      type="number"
                      className={`form-control ${(errors.businessMiles || apiErrors.business_miles) ? 'is-invalid' : ''}`}
                      placeholder="0"
                      value={formData.businessMiles}
                      onChange={(e) => handleChange('businessMiles', e.target.value)}
                    />
                    {(errors.businessMiles || apiErrors.business_miles) && (
                      <div className="invalid-feedback">
                        {errors.businessMiles || apiErrors.business_miles}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>
                  Parking, tolls, or travel costs
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    value={formData.parkingTollsTravel}
                    onChange={(e) => handleChange('parkingTollsTravel', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Food & Travel */}
          <div className="mb-6">
            <h5 style={sectionStyle}>5. Food & Travel</h5>
            
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>
                  Business meals
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    value={formData.businessMeals}
                    onChange={(e) => handleChange('businessMeals', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>
                  Travel expenses
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    value={formData.travelExpenses}
                    onChange={(e) => handleChange('travelExpenses', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Payments to Others */}
          <div className="mb-6">
            <h5 style={sectionStyle}>6. Payments to Others</h5>
            
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>
                  Did you pay contractors or helpers?
                </label>
                <select
                  className="form-control"
                  value={formData.paidContractors ? 'yes' : 'no'}
                  onChange={(e) => handleChange('paidContractors', e.target.value === 'yes')}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes → Total paid $</option>
                </select>
              </div>
              <div className="col-md-6">
                {formData.paidContractors && (
                  <>
                    <label className="form-label" style={labelStyle}>
                      Total paid to contractors
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className={`form-control ${(errors.totalPaidContractors || apiErrors.total_paid_contractors) ? 'is-invalid' : ''}`}
                        placeholder="0.00"
                        value={formData.totalPaidContractors}
                        onChange={(e) => handleChange('totalPaidContractors', e.target.value)}
                      />
                    </div>
                    {(errors.totalPaidContractors || apiErrors.total_paid_contractors) && (
                      <div className="invalid-feedback">
                        {errors.totalPaidContractors || apiErrors.total_paid_contractors}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 7. Other Expenses */}
          <div className="mb-6">
            <h5 style={sectionStyle}>7. Other Expenses</h5>
            
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
        </div>

        {/* 8. Home Office (Optional) */}
        <div className="mb-6">
          <h5 style={sectionStyle}>8. Home Office (Optional)</h5>
          
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Did you regularly use part of your home only for business?
              </label>
              <select
                className="form-control"
                value={formData.homeOfficeUse ? 'yes' : 'no'}
                onChange={(e) => handleChange('homeOfficeUse', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          {formData.homeOfficeUse && (
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>
                  Approximate size of space
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., 150"
                  value={formData.homeOfficeSize}
                  onChange={(e) => handleChange('homeOfficeSize', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* 9. Inventory or Products (Optional) */}
        <div className="mb-6">
          <h5 style={sectionStyle}>9. Inventory or Products (Optional)</h5>
          
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Do you sell physical products?
              </label>
              <select
                className="form-control"
                value={formData.sellProducts ? 'yes' : 'no'}
                onChange={(e) => handleChange('sellProducts', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          {formData.sellProducts && (
            <>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>
                    Cost of items bought to resell
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${(errors.costItemsResold || apiErrors.cost_items_resold) ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.costItemsResold}
                      onChange={(e) => handleChange('costItemsResold', e.target.value)}
                    />
                    {(errors.costItemsResold || apiErrors.cost_items_resold) && (
                      <div className="invalid-feedback">
                        {errors.costItemsResold || apiErrors.cost_items_resold}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={labelStyle}>
                    Inventory left at end of year (estimate)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${(errors.inventoryLeftEnd || apiErrors.inventory_left_end) ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.inventoryLeftEnd}
                      onChange={(e) => handleChange('inventoryLeftEnd', e.target.value)}
                    />
                    {(errors.inventoryLeftEnd || apiErrors.inventory_left_end) && (
                      <div className="invalid-feedback">
                        {errors.inventoryLeftEnd || apiErrors.inventory_left_end}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 10. Health Insurance & Retirement (Optional) */}
        <div className="mb-6">
          <h5 style={sectionStyle}>10. Health Insurance & Retirement (Optional)</h5>
          
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Did you pay for health insurance through this business?
              </label>
              <select
                className="form-control"
                value={formData.healthInsuranceBusiness ? 'yes' : 'no'}
                onChange={(e) => handleChange('healthInsuranceBusiness', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Did you contribute to a self-employed retirement plan?
              </label>
              <select
                className="form-control"
                value={formData.selfEmployedRetirement ? 'yes' : 'no'}
                onChange={(e) => handleChange('selfEmployedRetirement', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          {formData.selfEmployedRetirement && (
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>
                  If yes, amount
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className={`form-control ${(errors.retirementAmount || apiErrors.retirement_amount) ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    value={formData.retirementAmount}
                    onChange={(e) => handleChange('retirementAmount', e.target.value)}
                  />
                </div>
                {(errors.retirementAmount || apiErrors.retirement_amount) && (
                  <div className="invalid-feedback">
                    {errors.retirementAmount || apiErrors.retirement_amount}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 11. Final Confirmation */}
        <div className="mb-6">
          <h5 style={sectionStyle}>Final Confirmation</h5>
          
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Is this information accurate to the best of your knowledge?
              </label>
              <select
                className="form-control"
                value={formData.isAccurate ? 'yes' : 'no'}
                onChange={(e) => handleChange('isAccurate', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontFamily: "BasisGrotesquePro",
          fontStyle: 'italic'
        }}>
          Your tax preparer will handle all calculations, deductions, and tax forms. This form is only to help them prepare your return accurately.
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
            Save Business Information
          </button>
        </div>
      </div>
    </div>
  );
}
