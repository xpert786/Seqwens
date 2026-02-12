import React, { useState, useEffect } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { toast } from 'react-toastify';

/**
 * StartWorkflowModal - Enhanced modal for starting a workflow
 * Supports:
 * - Starting workflow for a specific client (when clientId is provided)
 * - Selecting a client from a list (when clientId is not provided)
 * - Pre-selecting a template (when preselectedTemplate is provided)
 */
const StartWorkflowModal = ({
  isOpen,
  onClose,
  onSuccess,
  clientId = null,
  clientName = null,
  assignedPreparerId = null,
  templates: externalTemplates = null,
  preselectedTemplate = null
}) => {
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [selectedPreparerId, setSelectedPreparerId] = useState(assignedPreparerId || '');
  const [preparers, setPreparers] = useState([]);
  const [loadingPreparers, setLoadingPreparers] = useState(false);
  const [starting, setStarting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Use external templates if provided, otherwise fetch
      if (externalTemplates && externalTemplates.length > 0) {
        setTemplates(externalTemplates);
      } else {
        fetchTemplates();
      }

      // If no clientId provided, fetch clients list
      if (!clientId) {
        fetchClients();
      }

      fetchPreparers();

      // Pre-select template if provided
      if (preselectedTemplate) {
        setSelectedTemplateId(preselectedTemplate.id?.toString() || '');
      }
    }
  }, [isOpen, clientId, externalTemplates, preselectedTemplate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId('');
      setSelectedClientId(clientId || '');
      setSelectedPreparerId(assignedPreparerId || '');
      setSearchTerm('');
    }
  }, [isOpen, clientId, assignedPreparerId]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await workflowAPI.listTemplates({ is_active: true });
      if (response.success && response.data) {
        setTemplates(response.data.results || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load workflow templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      const response = await fetchWithCors(
        `${API_BASE_URL}/firm/clients/list/?page_size=1000`, // Get more clients, don't restrict to 'active' status logic for selection
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Flatten clients from different possible response structures
          const clientsData = result.data.clients || (Array.isArray(result.data) ? result.data : []);
          setClients(clientsData);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchPreparers = async () => {
    try {
      setLoadingPreparers(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetchWithCors(
        `${API_BASE_URL}/user/firm-admin/staff/tax-preparers/?status=active&role=all`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          const staffMembers = result.data.staff_members || (Array.isArray(result.data) ? result.data : []);

          // Simplified filtering: only filter for active status, backend already filtered roles
          const filteredPreparers = staffMembers.filter((staff) => {
            const isActive = staff.status?.value === 'active' ||
              staff.status === 'active' ||
              staff.is_active === true;
            return isActive;
          });
          setPreparers(filteredPreparers);
        }
      }
    } catch (error) {
      console.error('Error fetching preparers:', error);
      setPreparers([]);
    } finally {
      setLoadingPreparers(false);
    }
  };

  const handleStartWorkflow = async () => {
    const targetClientId = clientId || selectedClientId;

    if (!selectedTemplateId) {
      toast.error('Please select a workflow template');
      return;
    }

    if (!targetClientId) {
      toast.error('Please select a client');
      return;
    }

    try {
      setStarting(true);
      const workflowData = {
        template_id: parseInt(selectedTemplateId),
        tax_case_id: parseInt(targetClientId),
        ...(selectedPreparerId ? { assigned_preparer_id: parseInt(selectedPreparerId) } : {})
      };

      const response = await workflowAPI.startWorkflow(workflowData);

      if (response.success) {
        toast.success('Workflow started successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        onSuccess && onSuccess(response.data);
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to start workflow');
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      toast.error(handleAPIError(error) || 'Failed to start workflow', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setStarting(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplateId('');
    setSelectedClientId(clientId || '');
    setSelectedPreparerId(assignedPreparerId || '');
    setSearchTerm('');
    onClose();
  };

  // Filter clients by search term
  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const name = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  // Get selected template details
  const selectedTemplate = templates.find(t => t.id?.toString() === selectedTemplateId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 1070 }}>
      <div className="bg-white !rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8F0FF] flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
              Start Workflow
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-[BasisGrotesquePro]">
              Start a tracking workflow for a client
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={starting}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="12" fill="#E8F0FF" />
              <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Client Selection or Display */}
          {clientId && clientName ? (
            <div className="bg-[#FFF4E6] !border border-[#F56D2D] border-opacity-30 !rounded-lg p-4">
              <p className="text-xs text-[#F56D2D] mb-1 font-[BasisGrotesquePro] uppercase tracking-wide">Client</p>
              <p className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">{clientName}</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">
                Select Client <span className="text-red-500">*</span>
              </label>
              {loadingClients ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3AD6F2] mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2 font-[BasisGrotesquePro]">Loading clients...</p>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] mb-2"
                  />
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] bg-white"
                    disabled={starting}
                  >
                    <option value="">Select a client</option>
                    {filteredClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} - {client.email}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}

          {/* Workflow Template Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">
              Workflow Template <span className="text-red-500">*</span>
            </label>
            {loadingTemplates ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2 font-[BasisGrotesquePro]">Loading templates...</p>
              </div>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-[BasisGrotesquePro] bg-white"
                disabled={starting}
              >
                <option value="">Select a workflow template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.tax_form_type ? `(${template.tax_form_type})` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Template preview */}
            {selectedTemplate && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{selectedTemplate.description || 'No description'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                    📊 {selectedTemplate.stages?.length || 0} stages
                  </span>
                  {selectedTemplate.tax_form_type && (
                    <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                      📋 {selectedTemplate.tax_form_type}
                    </span>
                  )}
                </div>
              </div>
            )}

            {templates.length === 0 && !loadingTemplates && (
              <p className="text-xs text-amber-600 mt-2 font-[BasisGrotesquePro]">
                ⚠️ No active workflow templates available. Please create a template first.
              </p>
            )}
          </div>

          {/* Assigned Preparer (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">
              Assigned Tax Preparer <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            {loadingPreparers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
              </div>
            ) : (
              <select
                value={selectedPreparerId}
                onChange={(e) => setSelectedPreparerId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-[BasisGrotesquePro] bg-white"
                disabled={starting}
              >
                <option value="">Auto-assign based on rules</option>
                {preparers.map((preparer) => (
                  <option key={preparer.id} value={preparer.id}>
                    {preparer.staff_member?.name ||
                      preparer.full_name ||
                      `${preparer.first_name || ''} ${preparer.last_name || ''}`.trim() ||
                      preparer.contact?.email ||
                      preparer.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-blue-800 font-[BasisGrotesquePro]">What happens next?</p>
                <p className="text-xs text-blue-700 mt-1 font-[BasisGrotesquePro]">
                  The workflow will begin with the first stage. You can then track progress, assign tasks, and manage document requests for this client.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#E8F0FF] flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            disabled={starting}
          >
            Cancel
          </button>
          <button
            onClick={handleStartWorkflow}
            className="px-4 py-2 text-xs font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] transition-all font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={starting || !selectedTemplateId || (!clientId && !selectedClientId) || loadingTemplates}
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Workflow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartWorkflowModal;
