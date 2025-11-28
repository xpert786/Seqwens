import React, { useState, useEffect } from 'react';
import { firmAdminEmailTemplatesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const EMAIL_TYPES = [
  { id: 'client_invite', label: 'Client Invitation' },
  { id: 'staff_invite', label: 'Staff Invitation' },
  { id: 'firm_onboarding', label: 'Firm Onboarding' },
  { id: 'account_deletion', label: 'Account Deletion' },
  { id: 'subscription_created', label: 'Subscription Created' },
  { id: 'subscription_ending', label: 'Subscription Ending' },
  { id: 'subscription_expired', label: 'Subscription Expired' },
  { id: 'custom', label: 'Custom' },
];

export default function EmailTemplatesTab() {
  const [templatesByType, setTemplatesByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedType, setExpandedType] = useState(null);

  // Fetch templates organized by type on mount
  useEffect(() => {
    fetchTemplatesByType();
  }, []);

  const fetchTemplatesByType = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await firmAdminEmailTemplatesAPI.listTemplatesByType();
      
      if (response && typeof response === 'object') {
        setTemplatesByType(response);
      } else {
        throw new Error('Failed to load email templates by type');
      }
    } catch (err) {
      console.error('Error fetching templates by type:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load email templates');
      toast.error(errorMsg || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTemplate = async (templateId, emailType) => {
    try {
      setSaving(true);
      setError('');

      const response = await firmAdminEmailTemplatesAPI.assignTemplate(templateId, emailType);
      
      toast.success(`Template assigned to ${emailType} successfully`);
      
      // Refresh templates list
      await fetchTemplatesByType();
    } catch (err) {
      console.error('Error assigning template:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to assign template');
      toast.error(errorMsg || 'Failed to assign template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading email templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Email Templates Management */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Email Template Management
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Manage email templates by type and assign active templates for each email type
          </p>
        </div>

        <div className="space-y-4">
          {EMAIL_TYPES.map((emailType) => {
            const typeData = templatesByType[emailType.id] || { templates: [], active_template: null, label: emailType.label };
            const isExpanded = expandedType === emailType.id;

            return (
              <div key={emailType.id} className="border border-[#E8F0FF] rounded-lg overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedType(isExpanded ? null : emailType.id)}
                  className="group w-full px-4 py-3 bg-[#F9FAFC] hover:bg-[#EFF5FF] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <svg 
                      className={`w-5 h-5 transition-all ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke={isExpanded ? '#000000' : '#3AD6F2'}
                      viewBox="0 0 24 24"
                      style={{stroke: isExpanded ? '#000000' : '#3AD6F2'}}
                      onMouseEnter={(e) => e.currentTarget.style.stroke = '#000000'}
                      onMouseLeave={(e) => e.currentTarget.style.stroke = isExpanded ? '#000000' : '#3AD6F2'}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <div className="text-left">
                      <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                        {typeData.label}
                      </h6>
                      <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                        {typeData.active_template 
                          ? `Active: ${typeData.active_template.name}` 
                          : 'No active template'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2.5 py-1 bg-[#E0F2FE] text-[#0369A1] rounded text-xs font-semibold font-[BasisGrotesquePro]">
                      {typeData.templates?.length || 0} templates
                    </span>
                    {typeData.active_template && (
                      <span className="inline-block px-2.5 py-1 bg-[#DCFCE7] text-[#166534] rounded text-xs font-semibold font-[BasisGrotesquePro]">
                        Active
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 py-4 bg-white border-t border-[#E8F0FF] space-y-3">
                    {typeData.templates && typeData.templates.length > 0 ? (
                      typeData.templates.map((template) => (
                        <div 
                          key={template.id} 
                          className="flex items-center justify-between p-3 bg-[#F9FAFC] rounded-lg border border-[#E8F0FF] hover:border-[#3AD6F2] transition-colors"
                        >
                          <div className="flex-1">
                            <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                              {template.name}
                            </h6>
                            <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-[#4B5563] font-[BasisGrotesquePro]">
                                Used: {template.usage_count || 0} times
                              </span>
                              {template.is_active && (
                                <span className="inline-block px-2 py-1 bg-[#DCFCE7] text-[#166534] rounded text-xs font-semibold font-[BasisGrotesquePro]">
                                  Currently Active
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssignTemplate(template.id, emailType.id)}
                            disabled={saving || template.is_active}
                            className={`px-3 py-2 rounded-lg text-xs font-medium font-[BasisGrotesquePro] transition-colors whitespace-nowrap ml-3 ${
                              template.is_active
                                ? 'bg-[#DCFCE7] text-[#166534] cursor-default'
                                : 'bg-[#F56D2D] text-white hover:bg-[#E55A1D] disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {template.is_active ? 'Active' : 'Assign'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                          No templates available for this email type
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#EFF5FF] border border-[#3AD6F2] rounded-2xl p-6">
        <h6 className="text-sm font-semibold text-[#0369A1] font-[BasisGrotesquePro] mb-2">
          How Email Templates Work
        </h6>
        <ul className="text-sm text-[#0369A1] font-regular font-[BasisGrotesquePro] space-y-1.5">
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Each email type can have multiple templates, but only one can be active at a time</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>When you assign a template to an email type, the previous active template is automatically deactivated</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>The system uses the currently active template whenever it sends emails of that type</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Usage count shows how many times each template has been used</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
