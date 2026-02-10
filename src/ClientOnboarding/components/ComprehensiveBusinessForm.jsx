import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import SlideSwitch from '../../components/SlideSwitch';
import BusinessAutocomplete from './BusinessAutocomplete';
import DateInput from '../../components/DateInput';
import { formatDateInput } from '../utils/dateUtils';

export default function ComprehensiveBusinessForm({ onSave, onCancel, onError, externalErrors = {}, initialData = null }) {
  const getFieldError = (field) => {
    const error = errors[field];
    if (Array.isArray(error)) return error[0];
    return error;
  };

  const [formData, setFormData] = useState({
    // 1. About Your Business
    businessType: '', // IRS-recognized business classification
    workDescription: '',
    businessCodeId: null, // Selected business code ID from backend
    businessCodeNaics: '', // NAICS code (read-only from backend)
    businessCodeTitle: '', // Business code title (read-only from backend)
    businessName: '',
    businessNameType: 'same', // 'same' or 'different'
    differentBusinessName: '',
    ein: '', // Employer Identification Number
    startedDuringYear: false,
    businessFormationDate: '', // Date business was formed (if not started during year)
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
  // Handle external API errors
  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...externalErrors }));
    }
  }, [externalErrors]);

  useEffect(() => {
    if (initialData) {
      // Normalize taxFormsReceived - convert string to array if needed
      let taxForms = initialData.taxFormsReceived || [];
      if (typeof taxForms === 'string') {
        // If it's a string, convert to array (handle 'none' or single value)
        if (taxForms.toLowerCase() === 'none') {
          taxForms = ['none'];
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

  // Format EIN as XX-XXXXXXX
  const formatEIN = (value) => {
    if (!value) return '';
    // Remove all non-numeric characters
    const numbers = String(value).replace(/\D/g, '');

    // Limit to 9 digits
    const limited = numbers.slice(0, 9);

    // Format as XX-XXXXXXX
    if (limited.length <= 2) {
      return limited;
    }
    return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  };

  const handleChange = (field, value) => {
    let formattedValue = value;

    // Format EIN field
    if (field === 'ein') {
      formattedValue = formatEIN(value);
    }

    // Format business formation date
    if (field === 'businessFormationDate') {
      formattedValue = formatDateInput(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
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
    if (!String(formData.businessType || '').trim()) {
      newErrors.businessType = 'Please select a business type';
    }

    if (!String(formData.workDescription || '').trim()) {
      newErrors.workDescription = 'Please describe the kind of work you do';
    } else if (String(formData.workDescription || '').trim().length < 3) {
      newErrors.workDescription = 'Please provide a more detailed description (at least 3 characters)';
    }

    // Business name validation - only required if user selected "different"
    if (formData.businessNameType === 'different' && !String(formData.businessName || '').trim()) {
      newErrors.businessName = 'Business name is required';
    }

    // Business address is required when business name is provided (for different business names) OR if business is home-based
    if (formData.homeBased || (formData.businessNameType === 'different' && String(formData.businessName || '').trim())) {
      if (!String(formData.businessAddress || '').trim()) newErrors.businessAddress = 'Business address is required';
      if (!String(formData.businessCity || '').trim()) {
        newErrors.businessCity = 'Business city is required';
      } else if (/\d/.test(formData.businessCity)) {
        newErrors.businessCity = 'City cannot contain numbers';
      }

      if (!String(formData.businessState || '').trim()) {
        newErrors.businessState = 'Business state is required';
      } else if (/\d/.test(formData.businessState)) {
        newErrors.businessState = 'State cannot contain numbers';
      }

      if (!String(formData.businessZip || '').trim()) newErrors.businessZip = 'Business ZIP is required';
    }

    // EIN validation - optional but must be valid if provided
    if (formData.ein && String(formData.ein).trim()) {
      const einDigits = String(formData.ein).replace(/\D/g, '');
      if (einDigits.length !== 9) {
        newErrors.ein = 'EIN must be exactly 9 digits';
      }
    }

    // Business formation date validation - required if business was NOT started during the year
    if (!formData.startedDuringYear) {
      if (!String(formData.businessFormationDate || '').trim()) {
        newErrors.businessFormationDate = 'Business formation date is required';
      } else {
        // Validate date format MM/DD/YYYY
        const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!datePattern.test(formData.businessFormationDate)) {
          newErrors.businessFormationDate = 'Date must be in MM/DD/YYYY format';
        } else {
          // Check if date is not in the future
          const [month, day, year] = formData.businessFormationDate.split('/');
          const formationDate = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (formationDate > today) {
            newErrors.businessFormationDate = 'Business formation date cannot be in the future';
          }
        }
      }
    }

    if (!String(formData.totalIncome || '').trim()) newErrors.totalIncome = 'Total income is required';

    // Conditional validations
    if (formData.issuedRefunds && !String(formData.totalRefunded || '').trim()) {
      newErrors.totalRefunded = 'Refunded amount is required when refunds were issued';
    }
    if (formData.otherBusinessIncome && !String(formData.otherBusinessIncomeAmount || '').trim()) {
      newErrors.otherBusinessIncomeAmount = 'Amount is required for other business income';
    }
    if (formData.usedVehicle && !String(formData.businessMiles || '').trim()) {
      newErrors.businessMiles = 'Business miles is required when vehicle was used';
    }
    if (formData.paidContractors && !String(formData.totalPaidContractors || '').trim()) {
      newErrors.totalPaidContractors = 'Total paid to contractors is required';
    }
    if (formData.selfEmployedRetirement && !String(formData.retirementAmount || '').trim()) {
      newErrors.retirementAmount = 'Retirement amount is required when contributing to plan';
    }

    // Number validation for optional fields
    const numericFields = [
      'totalPaidContractors', 'businessMiles', 'costItemsResold',
      'inventoryLeftEnd', 'retirementAmount'
    ];

    numericFields.forEach(field => {
      if (formData[field] && String(formData[field]).trim() !== '') {
        const numValue = parseFloat(String(formData[field]));
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
    const totalIncome = parseFloat(String(formData.totalIncome || '').replace(/,/g, '')) || 0;

    let totalExpenses = 0;
    // Sum all expense fields
    const expenseFields = [
      'advertising', 'officeSupplies', 'cleaningRepairs', 'insurance',
      'legalProfessional', 'phoneInternetUtilities', 'parkingTollsTravel',
      'businessMeals', 'travelExpenses', 'totalPaidContractors'
    ];

    expenseFields.forEach(field => {
      const value = parseFloat(String(formData[field] || '').replace(/,/g, '')) || 0;
      totalExpenses += value;
    });

    // Add other expenses from array
    if (formData.otherExpenses && Array.isArray(formData.otherExpenses)) {
      formData.otherExpenses.forEach(expense => {
        const amount = parseFloat(String(expense.amount || '').replace(/,/g, '')) || 0;
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
              Business Type <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              className={`form-control ${errors.businessType ? 'is-invalid' : ''}`}
              value={formData.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              style={{
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px"
              }}
            >
              <option value="">Select business type...</option>
              <option value="Single-Member LLC (Disregarded Entity)">Single-Member LLC (Disregarded Entity)</option>
              <option value="S Corporation">S Corporation</option>
              <option value="C Corporation">C Corporation</option>
              <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
              <option value="Professional Corporation (PC)">Professional Corporation (PC)</option>
              <option value="Professional Limited Liability Company (PLLC)">Professional Limited Liability Company (PLLC)</option>
              <option value="Nonprofit Organization">Nonprofit Organization</option>
              <option value="Joint Venture">Joint Venture</option>
              <option value="Qualified Joint Venture (Spouses)">Qualified Joint Venture (Spouses)</option>
              <option value="Trust or Estate">Trust or Estate</option>
              <option value="Cooperative">Cooperative</option>
              <option value="Foreign Entity (Doing Business in the U.S.)">Foreign Entity (Doing Business in the U.S.)</option>
              <option value="Not Sure">Not Sure</option>
            </select>
            <div className="form-text text-muted small" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Select the IRS-recognized classification for your business entity.
            </div>
            {errors.businessType && <div className="invalid-feedback">{errors.businessType}</div>}
          </div>
        </div>
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
          <div className="col-12">
            <label className="form-label" style={labelStyle}>
              Employer Identification Number (EIN)
            </label>
            <input
              type="text"
              className={`form-control ${errors.ein ? 'is-invalid' : ''}`}
              placeholder="XX-XXXXXXX"
              value={formData.ein}
              onChange={(e) => handleChange('ein', e.target.value)}
              maxLength={10}
            />
            <div className="form-text text-muted small" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Optional. Enter your 9-digit EIN if you have one (format: XX-XXXXXXX).
            </div>
            {errors.ein && <div className="invalid-feedback">{errors.ein}</div>}
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Did you start this business during the year?
            </label>
            <SlideSwitch
              value={formData.startedDuringYear}
              onChange={(val) => handleChange('startedDuringYear', val)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={labelStyle}>
              Do you run this business from your home?
            </label>
            <SlideSwitch
              value={formData.homeBased}
              onChange={(val) => handleChange('homeBased', val)}
            />
          </div>
        </div>

        {!formData.startedDuringYear && (
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Date Business Was Formed <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <DateInput
                className={`form-control ${errors.businessFormationDate ? 'is-invalid' : ''}`}
                value={formData.businessFormationDate}
                onChange={(e) => handleChange('businessFormationDate', e.target.value)}
                placeholder="MM/DD/YYYY"
              />
              <div className="form-text text-muted small" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Enter the date your business was originally formed.
              </div>
              {errors.businessFormationDate && <div className="invalid-feedback">{errors.businessFormationDate}</div>}
            </div>
          </div>
        )}

        {(String(formData.businessName || '').trim() || formData.homeBased) && (
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Business address: *
              </label>
              <input
                type="text"
                className={`form-control ${getFieldError('businessAddress') ? 'is-invalid' : ''}`}
                placeholder="Street Address"
                value={formData.businessAddress}
                onChange={(e) => handleChange('businessAddress', e.target.value)}
              />
              {getFieldError('businessAddress') && <div className="invalid-feedback">{getFieldError('businessAddress')}</div>}
            </div>
          </div>
        )}

        {(String(formData.businessName || '').trim() || formData.homeBased) && (
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>
                City: *
              </label>
              <input
                type="text"
                className={`form-control ${getFieldError('businessCity') ? 'is-invalid' : ''}`}
                placeholder="City"
                value={formData.businessCity}
                onChange={(e) => handleChange('businessCity', e.target.value)}
              />
              {getFieldError('businessCity') && <div className="invalid-feedback">{getFieldError('businessCity')}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>
                State: *
              </label>
              <input
                type="text"
                className={`form-control ${getFieldError('businessState') ? 'is-invalid' : ''}`}
                placeholder="State"
                value={formData.businessState}
                onChange={(e) => handleChange('businessState', e.target.value)}
              />
              {getFieldError('businessState') && <div className="invalid-feedback">{getFieldError('businessState')}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>
                ZIP Code: *
              </label>
              <input
                type="text"
                className={`form-control ${getFieldError('businessZip') ? 'is-invalid' : ''}`}
                placeholder="ZIP"
                value={formData.businessZip}
                onChange={(e) => handleChange('businessZip', e.target.value)}
              />
              {getFieldError('businessZip') && <div className="invalid-feedback">{getFieldError('businessZip')}</div>}
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
              <SlideSwitch
                value={formData.issuedRefunds}
                onChange={(val) => handleChange('issuedRefunds', val)}
              />
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
              <SlideSwitch
                value={formData.otherBusinessIncome}
                onChange={(val) => handleChange('otherBusinessIncome', val)}
              />
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
                <SlideSwitch
                  value={formData.usedVehicle}
                  onChange={(val) => handleChange('usedVehicle', val)}
                />
              </div>
              <div className="col-md-6">
                {formData.usedVehicle && (
                  <>
                    <label className="form-label" style={labelStyle}>
                      Business miles driven
                    </label>
                    <input
                      type="number"
                      className={`form-control ${(errors.businessMiles || errors.business_miles) ? 'is-invalid' : ''}`}
                      placeholder="0"
                      value={formData.businessMiles}
                      onChange={(e) => handleChange('businessMiles', e.target.value)}
                    />
                    {(errors.businessMiles || errors.business_miles) && (
                      <div className="invalid-feedback">
                        {errors.businessMiles || errors.business_miles}
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
                <SlideSwitch
                  value={formData.paidContractors}
                  onChange={(val) => handleChange('paidContractors', val)}
                />
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
                        className={`form-control ${(errors.totalPaidContractors || errors.total_paid_contractors) ? 'is-invalid' : ''}`}
                        placeholder="0.00"
                        value={formData.totalPaidContractors}
                        onChange={(e) => handleChange('totalPaidContractors', e.target.value)}
                      />
                    </div>
                    {(errors.totalPaidContractors || errors.total_paid_contractors) && (
                      <div className="invalid-feedback">
                        {errors.totalPaidContractors || errors.total_paid_contractors}
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
              className="btn btn-outline-primary  d-flex align-items-center gap-2"
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
              <SlideSwitch
                value={formData.homeOfficeUse}
                onChange={(val) => handleChange('homeOfficeUse', val)}
              />
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
              <SlideSwitch
                value={formData.sellProducts}
                onChange={(val) => handleChange('sellProducts', val)}
              />
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
                      className={`form-control ${(errors.costItemsResold || errors.cost_items_resold) ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.costItemsResold}
                      onChange={(e) => handleChange('costItemsResold', e.target.value)}
                    />
                    {(errors.costItemsResold || errors.cost_items_resold) && (
                      <div className="invalid-feedback">
                        {errors.costItemsResold || errors.cost_items_resold}
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
                      className={`form-control ${(errors.inventoryLeftEnd || errors.inventory_left_end) ? 'is-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.inventoryLeftEnd}
                      onChange={(e) => handleChange('inventoryLeftEnd', e.target.value)}
                    />
                    {(errors.inventoryLeftEnd || errors.inventory_left_end) && (
                      <div className="invalid-feedback">
                        {errors.inventoryLeftEnd || errors.inventory_left_end}
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
              <SlideSwitch
                value={formData.healthInsuranceBusiness}
                onChange={(val) => handleChange('healthInsuranceBusiness', val)}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label" style={labelStyle}>
                Did you contribute to a self-employed retirement plan?
              </label>
              <SlideSwitch
                value={formData.selfEmployedRetirement}
                onChange={(val) => handleChange('selfEmployedRetirement', val)}
              />
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
                    className={`form-control ${(errors.retirementAmount || errors.retirement_amount) ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    value={formData.retirementAmount}
                    onChange={(e) => handleChange('retirementAmount', e.target.value)}
                  />
                </div>
                {(errors.retirementAmount || errors.retirement_amount) && (
                  <div className="invalid-feedback">
                    {errors.retirementAmount || errors.retirement_amount}
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
              <SlideSwitch
                value={formData.isAccurate}
                onChange={(val) => handleChange('isAccurate', val)}
              />
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
        <div className="d-flex justify-content-end gap-3 pt-3 border-top business-form-actions">
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
              borderColor: "#3B4A66",
            }}
          >
            Save Business Information
          </button>
        </div>
      </div>
    </div>
  );
}
