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
  CheckCircle,
  Info
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
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

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
    const delayDebounceFn = setTimeout(() => {
      fetchWorkflows();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
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
        case 'advance':
          response = await workflowAPI.advanceWorkflow(workflowId);
          break;
        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        const actionMsg =
          newStatus === 'paused' ? 'paused' :
            newStatus === 'active' ? 'resumed' :
              newStatus === 'advance' ? 'advanced to next stage' :
                'completed';
        toast.success(`Workflow ${actionMsg} successfully`);
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
        return { bg: '#10B981', text: '#FFFFFF', icon: <Activity size={14} className="mr-1" /> };
      case 'completed':
        return { bg: '#3B82F6', text: '#FFFFFF', icon: <CheckCircle size={14} className="mr-1" /> };
      case 'paused':
        return { bg: '#F59E0B', text: '#FFFFFF', icon: <Pause size={14} className="mr-1" /> };
      case 'cancelled':
        return { bg: '#EF4444', text: '#FFFFFF', icon: <AlertCircle size={14} className="mr-1" /> };
      default:
        return { bg: '#6B7280', text: '#FFFFFF', icon: <Clock size={14} className="mr-1" /> };
    }
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-16 h-16 rounded-3xl bg-[#3AD6F2]/10 flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
        </div>
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Initializing Workflows...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 font-basis">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 mt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-14 py-2 rounded-2xl bg-[#3AD6F2] flex items-center justify-center text-white shadow-xl shadow-[#3AD6F2]/30">
              <Activity size={32} />
            </div>
            <div>
              <h3 className="mb-0 font-bold text-gray-900 tracking-tight leading-none text-2xl">
                My Workflows
              </h3>
              <span className="text-gray-500 text-sm font-medium">Monitor progress and manage client requests in real-time.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Possible quick actions here if needed */}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Workflows', value: stats.total, icon: <FileText size={18} />, color: '#F56D2D' },
          { label: 'Active Now', value: stats.active, icon: <Activity size={18} />, color: '#3AD6F2' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={18} />, color: '#22C55E' },
          { label: 'Pending Requests', value: stats.pendingRequests, icon: <AlertCircle size={18} />, color: '#EF4444' }
        ].map((item, i) => (
          <div key={i} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 mb-2">{item.icon}</div>
              <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] leading-none mb-0">{item.value}</p>
            </div>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-0">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative w-full lg:max-w-xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="w-full py-2.5 pl-12 pr-6 bg-white !border border-[#E8F0FF] !rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-[BasisGrotesquePro]"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 flex gap-2 w-full lg:w-auto">
          {['all', 'active', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 !rounded-lg text-sm font-medium transition-all capitalize font-[BasisGrotesquePro] ${filter === s
                ? 'bg-[#3AD6F2] text-white'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-28 h-28 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-[#3AD6F2]/40 shadow-inner">
            <Search size={48} />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No workflows found</h3>
          <p className="text-gray-500 max-w-sm mx-auto font-medium text-lg leading-relaxed">
            {searchTerm ? "We couldn't find anything matching your search. Try different keywords." : "You don't have any workflows yet. Access will appear here as accounts are assigned."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredWorkflows.map((workflow) => {
            const style = getStatusStyle(workflow.status);
            return (
              <div key={workflow.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2 py-1 !rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${style.bg}20`, color: style.bg }}
                      >
                        {workflow.status_display || workflow.status || 'Active'}
                      </span>
                      <span className="text-gray-400 text-xs">Updated recently</span>
                    </div>

                    <h5 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">
                      {workflow.template_name || 'Tax Workflow'}
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 !rounded-lg border border-gray-100">
                        <LayoutGrid size={16} className="text-gray-400" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-0">Client</p>
                          <p className="text-sm font-semibold text-gray-900 mb-0 truncate">{workflow.tax_case_name || 'Individual Taxpayer'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 !rounded-lg border border-gray-100">
                        <Activity size={16} className="text-[#3AD6F2]" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-0">Stage</p>
                          <p className="text-sm font-semibold text-gray-900 mb-0 truncate">{workflow.current_stage_name || 'In Progress'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0">Progress</p>
                        <span className="text-xs font-bold text-[#3AD6F2]">{Math.round(workflow.progress_percentage || 0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3AD6F2] transition-all duration-500"
                          style={{ width: `${Math.min(workflow.progress_percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-column gap-2 w-full lg:w-48 shrink-0">
                    <button
                      onClick={() => handleViewWorkflow(workflow)}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-all !rounded-lg"
                    >
                      View Activity
                    </button>
                    <button
                      onClick={() => handleCreateRequest(workflow)}
                      className="flex-1 px-4 py-2 bg-white !border border-[#E8F0FF] text-[#3AD6F2] font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all !rounded-lg"
                    >
                      New Request
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Modals Implementation */}
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
        <div className="fixed inset-0 backdrop-blur-xl bg-black/50 flex items-center justify-center p-4 z-[100000] animate-in fade-in duration-500">
          <div className="bg-white rounded-[60px] max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 border border-white/50">
            <div className="p-10 lg:p-14 border-b border-gray-100 flex justify-between items-center bg-gray-50/40 relative">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#3AD6F2] to-[#2bcada] flex items-center justify-center text-white shadow-2xl shadow-[#3AD6F2]/30">
                  <FileText size={40} />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-3 uppercase">Verify Documents</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[#3AD6F2] font-black text-xs uppercase tracking-[0.2em]">{selectedRequest.title}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">Request ID: #{selectedRequest.id?.slice(-6)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedRequest(null);
                  setRequestDocuments([]);
                }}
                className="w-14 py-2 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl shadow-xl shadow-black/5 border border-gray-100 active:scale-90 group"
              >
                <Plus size={32} className="rotate-45 group-hover:rotate-[135deg] transition-transform duration-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 lg:p-14 bg-white">
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
      actions.push({ value: 'advance', label: 'Complete Current Stage' });
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

