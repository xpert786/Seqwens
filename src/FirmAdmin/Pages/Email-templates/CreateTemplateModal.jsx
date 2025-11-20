import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { firmAdminEmailTemplatesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

const CreateTemplateModal = ({ isOpen, onClose, onTemplateCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'onboarding',
    subject: '',
    body_html: '',
    body_text: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return false;
    }
    if (!formData.category.trim()) {
      setError('Category is required');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Email subject is required');
      return false;
    }
    if (!formData.body_html.trim()) {
      setError('Email body (HTML) is required');
      return false;
    }
    if (formData.category !== 'onboarding') {
      setError('Category must be "onboarding" for invite templates');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        subject: formData.subject.trim(),
        body_html: formData.body_html.trim(),
        status: formData.status
      };

      // Add optional fields only if provided
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.body_text.trim()) {
        payload.body_text = formData.body_text.trim();
      }

      console.log('Creating template with payload:', payload);

      const response = await firmAdminEmailTemplatesAPI.createTemplate(payload);

      if (response.success) {
        toast.success('Template created successfully!', {
          position: 'top-right',
          autoClose: 3000
        });

        // Reset form
        setFormData({
          name: '',
          description: '',
          category: 'onboarding',
          subject: '',
          body_html: '',
          body_text: '',
          status: 'active'
        });

        // Close modal and refresh templates
        onClose();
        if (onTemplateCreated) {
          onTemplateCreated();
        }
      } else {
        throw new Error(response.message || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to create template. Please try again.');
      toast.error(errorMsg || 'Failed to create template', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Create Email Template</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Create a new email template for client invitations
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center !rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Client Invitation"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the template"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm"
              required
            >
              <option value="onboarding">Onboarding</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
              Templates with category "onboarding" are used for client and staff invitations
            </p>
          </div>

          {/* Email Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Invitation to Join [Firm Name] on Seqwens"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
              Available variables: [Firm Name], [Client Name], [First Name], [Last Name], [Invite Link], [Expiry Date], [Role]
            </p>
          </div>

          {/* Email Body (HTML) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Email Body (HTML) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.body_html}
              onChange={(e) => handleInputChange('body_html', e.target.value)}
              placeholder="<html><body>Hello [First Name] [Last Name], Welcome to [Firm Name]! <a href='[Invite Link]'>Accept Invitation</a></body></html>"
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm resize-none font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
              HTML content with variables: [Firm Name], [Client Name], [First Name], [Last Name], [Invite Link], [Expiry Date], [Role]
            </p>
          </div>

          {/* Email Body (Text) - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Email Body (Plain Text) - Optional
            </label>
            <textarea
              value={formData.body_text}
              onChange={(e) => handleInputChange('body_text', e.target.value)}
              placeholder="Plain text version of the email"
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm"
              required
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
              Only "active" templates will be used for sending invitations
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition font-[BasisGrotesquePro] text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] text-sm font-medium"
            >
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;

