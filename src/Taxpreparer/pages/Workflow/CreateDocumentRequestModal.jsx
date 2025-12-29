import React, { useState, useEffect } from 'react';
import { workflowAPI, documentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import DateInput from '../../../components/DateInput';
import { formatDateForAPI } from '../../../ClientOnboarding/utils/dateUtils';

/**
 * CreateDocumentRequestModal Component
 * Modal for creating document requests
 */
const CreateDocumentRequestModal = ({ workflow, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_ids: [],
    due_date: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Fetch available document categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await documentsAPI.getDocumentCategories();
        if (response.success && response.data) {
          // Handle both array and object with results/data property
          const categoriesList = Array.isArray(response.data) 
            ? response.data 
            : (response.data.results || response.data.categories || response.data || []);
          setCategories(categoriesList);
        } else {
          throw new Error(response.message || 'Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast.error(handleAPIError(err) || 'Failed to load document categories');
        // Set empty array on error
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (e) => {
    const formattedValue = e.target.value;
    setFormData((prev) => ({ ...prev, due_date: formattedValue }));
    if (errors.due_date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.due_date;
        return newErrors;
      });
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => {
      const newCategoryIds = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return { ...prev, category_ids: newCategoryIds };
    });
  };

  const handleCategorySelect = (categoryId) => {
    handleCategoryToggle(categoryId);
  };

  const getSelectedCategoryNames = () => {
    if (formData.category_ids.length === 0) {
      return 'Select categories...';
    }
    const selectedNames = categories
      .filter(cat => formData.category_ids.includes(cat.id))
      .map(cat => cat.name);
    return selectedNames.join(', ');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.category_ids.length === 0) {
      newErrors.category_ids = 'Please select at least one document category';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else {
      // Validate date format MM/DD/YYYY
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dateRegex.test(formData.due_date)) {
        newErrors.due_date = 'Please enter a valid date in MM/DD/YYYY format';
      } else {
        // Check if date is in the future
        const parts = formData.due_date.split('/');
        const dueDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          newErrors.due_date = 'Due date must be in the future';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!workflow || !workflow.id) {
      toast.error('Invalid workflow');
      return;
    }

    try {
      setLoading(true);

      // Format date for API (MM/DD/YYYY to YYYY-MM-DD)
      const formattedDueDate = formatDateForAPI(formData.due_date);

      const requestData = {
        workflow_instance_id: workflow.id,
        category_ids: formData.category_ids,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        due_date: formattedDueDate,
      };

      const response = await workflowAPI.createDocumentRequest(requestData);

      if (response.success) {
        toast.success('Document request created successfully');
        if (onSuccess) {
          onSuccess(response.data);
        }
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to create document request');
      }
    } catch (error) {
      console.error('Error creating document request:', error);
      const errorMsg = handleAPIError(error) || error.message || 'Failed to create document request';
      toast.error(errorMsg);
      
      // Handle field-specific errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category_ids: [],
      due_date: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ borderRadius: '12px' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 font-[BasisGrotesquePro]">
            Create Document Request
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Workflow Info */}
          {workflow && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                <span className="font-medium">Client:</span> {workflow.tax_case_name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                <span className="font-medium">Workflow:</span> {workflow.template_name || 'N/A'}
              </p>
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., 2024 Tax Documents Request"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-[BasisGrotesquePro] ${
                errors.title
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-[#E8F0FF] focus:ring-blue-500'
              }`}
            />
            {errors.title && (
              <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              placeholder="Please provide the following documents for your tax return preparation..."
              className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
            />
          </div>

          {/* Document Categories Dropdown */}
          <div className="mb-4 category-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Select Document Categories <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">Loading categories...</div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`w-full px-3 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 font-[BasisGrotesquePro] flex items-center justify-between ${
                    errors.category_ids
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-[#E8F0FF] focus:ring-blue-500'
                  }`}
                  style={{ borderRadius: '8px' }}
                >
                  <span className={`${formData.category_ids.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                    {getSelectedCategoryNames()}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showCategoryDropdown && (
                  <div 
                    className="absolute z-50 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{ borderRadius: '8px', zIndex: 100000 }}
                  >
                    {categories.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500 font-[BasisGrotesquePro]">
                        No categories available
                      </div>
                    ) : (
                      categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-3 border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={formData.category_ids.includes(category.id)}
                            onChange={() => handleCategorySelect(category.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 font-[BasisGrotesquePro] flex-1">
                            {category.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.category_ids && (
              <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.category_ids}</p>
            )}
            {formData.category_ids.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                {formData.category_ids.length} categor{formData.category_ids.length === 1 ? 'y' : 'ies'} selected
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Due Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.due_date}
              onChange={handleDateChange}
              placeholder="mm/dd/yyyy"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-[BasisGrotesquePro] ${
                errors.due_date
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-[#E8F0FF] focus:ring-blue-500'
              }`}
            />
            {errors.due_date && (
              <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.due_date}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentRequestModal;

