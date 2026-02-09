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
    due_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch available document categories


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



  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
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
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ borderRadius: '8px' }}>
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-[BasisGrotesquePro] ${errors.title
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



          {/* Due Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Due Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.due_date}
              onChange={handleDateChange}
              placeholder="mm/dd/yyyy"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-[BasisGrotesquePro] ${errors.due_date
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
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              style={{ borderRadius: '8px' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
              style={{ borderRadius: '8px' }}
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

