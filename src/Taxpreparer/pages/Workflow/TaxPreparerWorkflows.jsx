import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  FileText,
  Activity,
  Pause,
  Play,
  CheckCircle
} from 'lucide-react';
import DocumentRequestCard from '../../../components/Workflow/DocumentRequestCard';
import CreateDocumentRequestModal from './CreateDocumentRequestModal';
import DocumentVerificationComponent from '../../../components/Workflow/DocumentVerificationComponent';
import './TaxPreparerWorkflows.css';

/**
 * TaxPreparerWorkflows Component
 * List and manage workflows for tax preparers with a premium redesign
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
  const [updatingStatus, setUpdatingStatus] = useState(null);

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

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: workflows.length,
      active: workflows.filter(w => w.status?.toLowerCase() === 'active').length,
      completed: workflows.filter(w => w.status?.toLowerCase() === 'completed').length,
      pendingRequests: workflows.reduce((acc, w) =>
        acc + (w.document_requests?.filter(r => r.status?.toLowerCase() === 'pending').length || 0), 0
      )
    };
  }, [workflows]);

  const handleViewWorkflow = (workflow) => {
    navigate(`/taxdashboard/workflows/${workflow.id}`);
  };

  const handleCreateRequest = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowCreateRequestModal(true);
  };

  const handleVerifyRequest = async (request) => {
    setSelectedRequest(request);

    try {
      const response = await workflowAPI.getWorkflowInstanceWithDocuments(request.workflow_instance || request.workflow);
      if (response.success && response.data) {
        const allDocuments = response.data.documents || response.data.tax_documents || [];
        const requestDocs = allDocuments.filter(
          (doc) => doc.document_request === request.id || doc.document_request_id === request.id
        );
        setRequestDocuments(requestDocs);
      } else {
        const requestResponse = await workflowAPI.getDocumentRequest(request.id);
        if (requestResponse.success && requestResponse.data) {
          const docs = requestResponse.data.documents || requestResponse.data.tax_documents || [];
          setRequestDocuments(docs);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
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

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesFilter = filter === 'all' || workflow.status === filter;
    const matchesSearch = !searchTerm ||
      workflow.tax_case_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.template_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'active':
        return { bg: '#D1FAE5', text: '#065F46', icon: <Activity size={14} className="mr-1" /> };
      case 'completed':
        return { bg: '#DBEAFE', text: '#1E40AF', icon: <CheckCircle size={14} className="mr-1" /> };
      case 'paused':
        return { bg: '#FEF3C7', text: '#92400E', icon: <Pause size={14} className="mr-1" /> };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B', icon: <AlertCircle size={14} className="mr-1" /> };
      default:
        return { bg: '#F3F4F6', text: '#374151', icon: <Clock size={14} className="mr-1" /> };
    }
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AD6F2]"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading your workflows...</p>
      </div>
    );
  }

  return (
    <div className="lg:px-4 md:px-2 px-1 workflow-container" style={{ backgroundColor: '#F3F7FF', minHeight: '100vh', paddingTop: '24px' }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1F2937] tracking-tight mb-2">
            My Workflows
          </h1>
          <p className="text-gray-500 text-lg">
            Monitor progress and manage client requests in real-time.
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Workflows', value: stats.total, icon: <FileText size={20} className="text-[#6366F1]" />, bg: 'bg-[#F0F2FF]' },
          { label: 'Active Now', value: stats.active, icon: <Activity size={20} className="text-[#10B981]" />, bg: 'bg-[#ECFDF5]' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={20} className="text-[#8B5CF6]" />, bg: 'bg-[#F5F3FF]' },
          { label: 'Pending Requests', value: stats.pendingRequests, icon: <AlertCircle size={20} className="text-[#F59E0B]" />, bg: 'bg-[#FFFBEB]' }
        ].map((item, i) => (
          <div key={i} className="stat-card p-8 rounded-2xl bg-white flex flex-col items-center text-center shadow-sm">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-4">{item.label}</p>
            <h3 className="text-4xl font-bold text-gray-900 mb-8">{item.value}</h3>
            <div className={`${item.bg} w-14 h-14 rounded-2xl flex items-center justify-center`}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="glass-effect p-4 rounded-2xl mb-8 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by client name or workflow template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {['all', 'active', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === s
                ? 'bg-[#3AD6F2] text-white shadow-lg shadow-blue-100'
                : 'bg-white text-gray-600 border border-[#E8F0FF] hover:bg-gray-50'
                }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-[#E8F0FF] empty-state">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-[#3AD6F2]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchTerm ? "We couldn't find anything matching your search. Try different keywords." : "You don't have any workflows yet. Get started by assigning one to a client."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredWorkflows.map((workflow) => {
            const style = getStatusStyle(workflow.status);
            return (
              <div key={workflow.id} className="workflow-card rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span
                          className="status-badge flex items-center"
                          style={{ backgroundColor: style.bg, color: style.text }}
                        >
                          {style.icon}
                          {workflow.status_display || workflow.status || 'Active'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-sm font-medium">Last updated 2 days ago</span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#3AD6F2] transition-colors">
                        {workflow.template_name || 'Workflow'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                            <LayoutGrid size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0">Client Account</p>
                            <p className="text-gray-700 font-semibold">{workflow.tax_case_name || 'Individual'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                            <Activity size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0">Current Stage</p>
                            <p className="text-[#3AD6F2] font-semibold">{workflow.current_stage_name || 'In Progress'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-gray-900">Workflow Progress</span>
                          <span className="text-sm font-extrabold text-[#3AD6F2]">{Math.round(workflow.progress_percentage || 0)}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill bg-gradient-to-r from-[#3AD6F2] to-[#3AD6F2]"
                            style={{ width: `${Math.min(workflow.progress_percentage || 0, 100)}%`, backgroundColor: '#3AD6F2' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleViewWorkflow(workflow)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1F2937] text-white rounded-xl font-bold hover:bg-gray-800 transition-all action-button"
                      >
                        View Activity
                        <ArrowRight size={18} />
                      </button>
                      <button
                        onClick={() => handleCreateRequest(workflow)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E8F0FF] text-[#3AD6F2] rounded-xl font-bold hover:bg-gray-50 transition-all"
                      >
                        <Plus size={18} />
                        New Request
                      </button>

                      {/* Status Actions */}
                      {getAvailableStatusActions(workflow).length > 0 && (
                        <div className="relative group/actions">
                          <button
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all border border-transparent"
                            disabled={updatingStatus === workflow.id}
                          >
                            {updatingStatus === workflow.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            ) : <MoreVertical size={18} />}
                            Actions
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E8F0FF] opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-20 overflow-hidden">
                            {getAvailableStatusActions(workflow).map((action) => (
                              <button
                                key={action.value}
                                onClick={() => handleStatusUpdate(workflow.id, action.value)}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                {action.value === 'paused' ? <Pause size={16} /> :
                                  action.value === 'active' ? <Play size={16} /> :
                                    <CheckCircle size={16} />}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Requests Accordion/List */}
                  {workflow.document_requests && workflow.document_requests.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-50">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-extrabold text-gray-400 uppercase tracking-[0.2em]">
                          Recent Document Requests
                        </h4>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">
                          {workflow.document_requests.length} Total
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workflow.document_requests.slice(0, 4).map((request) => (
                          <DocumentRequestCard
                            key={request.id}
                            request={request}
                            userRole="preparer"
                            onVerify={handleVerifyRequest}
                            onViewDetails={() => handleViewWorkflow(workflow)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
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

      {showVerifyModal && selectedRequest && (
        <div className="fixed inset-0 glass-effect bg-black/60 flex items-center justify-center p-4 z-[100000] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Verify Documents</h3>
                <p className="text-gray-500 font-medium">{selectedRequest.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedRequest(null);
                  setRequestDocuments([]);
                }}
                className="bg-white p-2 rounded-xl text-gray-400 hover:text-gray-600 transition-all border border-gray-100 shadow-sm"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
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
        </div>
      )}
    </div>
  );

  // Helper for available status actions
  function getAvailableStatusActions(workflow) {
    const actions = [];
    const currentStatus = workflow.status?.toLowerCase();

    if (currentStatus === 'active') {
      actions.push({ value: 'paused', label: 'Pause Workflow' });
      actions.push({ value: 'completed', label: 'Mark as Completed' });
    } else if (currentStatus === 'paused') {
      actions.push({ value: 'active', label: 'Resume Workflow' });
      actions.push({ value: 'completed', label: 'Mark as Completed' });
    }

    return actions;
  }
};

export default TaxPreparerWorkflows;

