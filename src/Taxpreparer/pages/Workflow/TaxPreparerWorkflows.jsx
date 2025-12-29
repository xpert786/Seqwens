import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaPlus } from 'react-icons/fa';
import DocumentRequestCard from '../../../components/Workflow/DocumentRequestCard';
import CreateDocumentRequestModal from './CreateDocumentRequestModal';
import DocumentVerificationComponent from '../../../components/Workflow/DocumentVerificationComponent';

/**
 * TaxPreparerWorkflows Component
 * List and manage workflows for tax preparers
 */
const TaxPreparerWorkflows = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDocuments, setRequestDocuments] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which workflow is updating

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        status: filter !== 'all' ? filter : undefined,
        search: searchTerm || undefined,
      };
      
      const response = await workflowAPI.listTaxPreparerWorkflows(params);
      
      if (response.success && response.data) {
        const workflowsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data.workflows || response.data.results || []);
        setWorkflows(workflowsList);
      } else {
        setWorkflows([]);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(handleAPIError(err) || 'Failed to load workflows');
      toast.error(handleAPIError(err) || 'Failed to load workflows');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [filter, searchTerm]);

  const handleViewWorkflow = (workflow) => {
    navigate(`/taxdashboard/workflows/${workflow.id}`);
  };

  const handleCreateRequest = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowCreateRequestModal(true);
  };

  const handleVerifyRequest = async (request) => {
    setSelectedRequest(request);
    
    // Fetch documents for this request
    try {
      const response = await workflowAPI.getWorkflowInstanceWithDocuments(request.workflow_instance || request.workflow);
      if (response.success && response.data) {
        // Find documents for this request
        const allDocuments = response.data.documents || response.data.tax_documents || [];
        const requestDocs = allDocuments.filter(
          (doc) => doc.document_request === request.id || doc.document_request_id === request.id
        );
        setRequestDocuments(requestDocs);
      } else {
        // Try fetching from document request details
        const requestResponse = await workflowAPI.getDocumentRequest(request.id);
        if (requestResponse.success && requestResponse.data) {
          const docs = requestResponse.data.documents || requestResponse.data.tax_documents || [];
          setRequestDocuments(docs);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      // Still show modal even if documents fetch fails
      setRequestDocuments([]);
    }
    
    setShowVerifyModal(true);
  };

  const handleRequestCreated = () => {
    setShowCreateRequestModal(false);
    setSelectedWorkflow(null);
    fetchWorkflows();
    toast.success('Document request created successfully');
  };

  const handleVerificationComplete = () => {
    setShowVerifyModal(false);
    setSelectedRequest(null);
    setRequestDocuments([]);
    fetchWorkflows();
  };

  // Handle workflow status updates
  const handleStatusUpdate = async (workflowId, newStatus) => {
    try {
      setUpdatingStatus(workflowId);
      let response;
      
      switch (newStatus) {
        case 'paused':
          response = await workflowAPI.pauseWorkflow(workflowId);
          break;
        case 'active':
          response = await workflowAPI.resumeWorkflow(workflowId);
          break;
        case 'completed':
          response = await workflowAPI.completeWorkflow(workflowId);
          break;
        default:
          throw new Error('Invalid status');
      }

      if (response.success) {
        toast.success(`Workflow ${newStatus === 'paused' ? 'paused' : newStatus === 'active' ? 'resumed' : 'completed'} successfully`);
        await fetchWorkflows();
      } else {
        throw new Error(response.message || 'Failed to update workflow status');
      }
    } catch (error) {
      console.error('Error updating workflow status:', error);
      toast.error(handleAPIError(error) || 'Failed to update workflow status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Get available status actions for a workflow
  const getAvailableStatusActions = (workflow) => {
    const actions = [];
    const currentStatus = workflow.status?.toLowerCase();
    
    if (currentStatus === 'active') {
      actions.push({ value: 'paused', label: 'Pause', icon: '⏸️' });
      actions.push({ value: 'completed', label: 'Complete', icon: '✅' });
    } else if (currentStatus === 'paused') {
      actions.push({ value: 'active', label: 'Resume', icon: '▶️' });
      actions.push({ value: 'completed', label: 'Complete', icon: '✅' });
    }
    
    return actions;
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesFilter = filter === 'all' || workflow.status === filter;
    const matchesSearch = !searchTerm || 
      workflow.tax_case_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.template_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
        <span className="ml-3 text-gray-600 font-[BasisGrotesquePro]">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6" style={{ backgroundColor: '#F3F7FF', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                My Workflows
              </h1>
              <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                Manage client workflows and document requests
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients or workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                style={{ borderRadius: '8px' }}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition font-[BasisGrotesquePro] ${
                    filter === status
                      ? 'text-white'
                      : 'bg-white !border border-[#E8F0FF] text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: filter === status ? '#3AD6F2' : undefined,
                    borderRadius: '8px'
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 !border border-red-200 rounded-lg p-4 mb-6" style={{ borderRadius: '8px' }}>
            <p className="text-red-600 font-[BasisGrotesquePro]">{error}</p>
          </div>
        )}

        {/* Workflows List */}
        {filteredWorkflows.length === 0 ? (
          <div className="bg-white !border border-[#E8F0FF] rounded-lg p-12 text-center" style={{ borderRadius: '8px' }}>
            <p className="text-gray-500 font-[BasisGrotesquePro]">
              {searchTerm ? 'No workflows found matching your search' : 'No workflows found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white !border border-[#E8F0FF] rounded-lg p-4 sm:p-6"
                style={{ borderRadius: '8px' }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                        {workflow.template_name || 'Workflow'}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-[BasisGrotesquePro]`}
                        style={{
                          backgroundColor: 
                            workflow.status === 'active' || workflow.status === 'Active'
                              ? '#D1FAE5'
                              : workflow.status === 'completed' || workflow.status === 'Completed'
                              ? '#DBEAFE'
                              : workflow.status === 'paused' || workflow.status === 'Paused'
                              ? '#FEF3C7'
                              : workflow.status === 'cancelled' || workflow.status === 'Cancelled'
                              ? '#FEE2E2'
                              : '#F3F4F6',
                          color:
                            workflow.status === 'active' || workflow.status === 'Active'
                              ? '#065F46'
                              : workflow.status === 'completed' || workflow.status === 'Completed'
                              ? '#1E40AF'
                              : workflow.status === 'paused' || workflow.status === 'Paused'
                              ? '#92400E'
                              : workflow.status === 'cancelled' || workflow.status === 'Cancelled'
                              ? '#991B1B'
                              : '#374151'
                        }}
                      >
                        {workflow.status_display || workflow.status || 'Active'}
                      </span>
                    </div>
                    {workflow.tax_case_name && (
                      <p className="text-sm mb-2 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                        Client: <span className="font-medium" style={{ color: '#1F2937' }}>{workflow.tax_case_name}</span>
                      </p>
                    )}
                    {workflow.current_stage_name && (
                      <p className="text-sm mb-2 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                        Current Stage: <span className="font-medium" style={{ color: '#1F2937' }}>{workflow.current_stage_name}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Progress:</span>
                      <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2" style={{ borderRadius: '9999px' }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(workflow.progress_percentage || 0, 100)}%`,
                            backgroundColor: '#3AD6F2',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                        {Math.round(workflow.progress_percentage || 0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewWorkflow(workflow)}
                      className="px-4 py-2 text-sm bg-white !border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                      style={{ borderRadius: '8px', color: '#374151' }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleCreateRequest(workflow)}
                      className="px-4 py-2 text-sm text-white rounded-lg transition font-[BasisGrotesquePro] flex items-center gap-2"
                      style={{ 
                        backgroundColor: '#3AD6F2',
                        borderRadius: '8px'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#00C0C6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3AD6F2'}
                    >
                      <FaPlus className="w-4 h-4" />
                      Create Request
                    </button>
                    
                    {/* Status Update Dropdown */}
                    {getAvailableStatusActions(workflow).length > 0 && (
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(workflow.id, e.target.value);
                              e.target.value = ''; // Reset dropdown
                            }
                          }}
                          disabled={updatingStatus === workflow.id}
                          className="px-4 py-2 text-sm bg-white !border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            paddingRight: '2rem',
                            borderRadius: '8px',
                            color: '#374151'
                          }}
                        >
                          <option value="">Update Status</option>
                          {getAvailableStatusActions(workflow).map((action) => (
                            <option key={action.value} value={action.value}>
                              {action.icon} {action.label}
                            </option>
                          ))}
                        </select>
                        {updatingStatus === workflow.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg" style={{ borderRadius: '8px' }}>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#3AD6F2' }}></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Requests for this workflow */}
                {workflow.document_requests && workflow.document_requests.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                    <h4 className="text-sm font-semibold mb-3 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                      Document Requests ({workflow.document_requests.length})
                    </h4>
                    <div className="space-y-3">
                      {workflow.document_requests.map((request) => (
                        <DocumentRequestCard
                          key={request.id}
                          request={request}
                          userRole="preparer"
                          onVerify={handleVerifyRequest}
                          onViewDetails={(req) => handleViewWorkflow(workflow)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Document Request Modal */}
      {showCreateRequestModal && selectedWorkflow && (
        <CreateDocumentRequestModal
          workflow={selectedWorkflow}
          onClose={() => {
            setShowCreateRequestModal(false);
            setSelectedWorkflow(null);
          }}
          onSuccess={handleRequestCreated}
        />
      )}

      {/* Verify Documents Modal */}
      {showVerifyModal && selectedRequest && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ borderRadius: '12px' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                Verify Documents
              </h3>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedRequest(null);
                  setRequestDocuments([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DocumentVerificationComponent
              request={selectedRequest}
              documents={requestDocuments}
              onVerify={handleVerificationComplete}
              onCancel={() => {
                setShowVerifyModal(false);
                setSelectedRequest(null);
                setRequestDocuments([]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxPreparerWorkflows;

