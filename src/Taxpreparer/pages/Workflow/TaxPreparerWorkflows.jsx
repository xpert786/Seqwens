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
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-10 font-basis">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 mt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#3AD6F2] flex items-center justify-center text-white shadow-xl shadow-[#3AD6F2]/30">
              <Activity size={32} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-3xl font-black text-gray-900 tracking-tight leading-none mb-0">
                My Workflows
              </h1>
              <span className="text-gray-400 text-sm lg:text-lg font-medium tracking-tight">Monitor progress and manage client requests in real-time.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Possible quick actions here if needed */}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-12">
        {[
          { label: 'Total Workflows', value: stats.total, icon: <FileText size={24} />, color: '#6366F1' },
          { label: 'Active Now', value: stats.active, icon: <Activity size={24} />, color: '#10B981' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={24} />, color: '#8B5CF6' },
          { label: 'Pending Requests', value: stats.pendingRequests, icon: <AlertCircle size={24} />, color: '#F59E0B' }
        ].map((item, i) => (
          <div key={i} className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-default">
            <div className="flex items-center lg:items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-sm" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-2">{item.label}</p>
                <h3 className="text-3xl font-black text-gray-900 leading-none">{item.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 mb-12 bg-white/60 backdrop-blur-md p-5 lg:p-7 rounded-[32px] border border-gray-100 shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full xl:max-w-xl group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3AD6F2] transition-colors">
            <Search size={22} />
          </div>
          <input
            type="text"
            className="w-full h-14 pl-14 pr-6 bg-gray-50/50 border border-transparent rounded-[20px] text-base font-medium focus:ring-4 focus:ring-[#3AD6F2]/10 focus:bg-white focus:border-[#3AD6F2]/30 transition-all outline-none text-gray-700 placeholder:text-gray-400"
            placeholder="Search client account or workflow template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100/50 p-2 rounded-2xl border border-gray-100 w-full xl:w-auto overflow-x-auto hide-scrollbar sm:gap-4 gap-2">
          {['all', 'active', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-1 xl:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${filter === s
                ? 'bg-white text-[#3AD6F2] shadow-xl shadow-[#3AD6F2]/10 ring-1 ring-gray-100/50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-[48px] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm animate-in fade-in duration-700">
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
              <div key={workflow.id} className="group bg-white rounded-[48px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-[#3AD6F2]/30 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                <div className="p-8 lg:p-12">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                    <div className="flex-1 min-w-0 w-full">
                      {/* Workflow Top Meta */}
                      <div className="flex flex-wrap items-center gap-4 mb-8">
                        <div
                          className="flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transform hover:scale-105 transition-transform"
                          style={{ backgroundColor: style.bg, color: style.text }}
                        >
                          {style.icon}
                          {workflow.status_display || workflow.status || 'Active'}
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <span className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em]">
                          Updated 2 days ago
                        </span>
                      </div>

                      <h3 className="text-4xl font-black text-gray-900 mb-10 group-hover:text-[#3AD6F2] transition-colors leading-tight tracking-tight">
                        {workflow.template_name || 'Tax Workflow'}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[32px] border border-gray-50 hover:bg-white hover:shadow-md transition-all group/meta">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm transition-transform group-hover/meta:rotate-6">
                            <LayoutGrid size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1.5 leading-none">Client Account</p>
                            <p className="text-gray-900 text-lg font-bold truncate max-w-[200px]">{workflow.tax_case_name || 'Individual Taxpayer'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[32px] border border-gray-50 hover:bg-white hover:shadow-md transition-all group/stage cursor-default">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#3AD6F2] shadow-sm transition-transform group-hover/stage:rotate-6">
                            <Activity size={24} />
                          </div>
                          <div className="relative flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 leading-none">
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Current Stage</p>
                              {workflow.current_stage_description && (
                                <div className="relative group/info">
                                  <Info size={14} className="text-gray-300 cursor-help hover:text-[#3AD6F2] transition-colors" />
                                  <div className="absolute left-0 bottom-full mb-4 hidden group-hover/info:block w-72 p-4 bg-gray-900 text-white text-[11px] font-medium leading-relaxed rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gray-900 rotate-45" />
                                    {workflow.current_stage_description}
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-900 text-lg font-black flex items-center gap-3">
                              <span className="truncate">{workflow.current_stage_name || 'In Progress'}</span>
                              <ArrowRight size={18} className="text-[#3AD6F2] opacity-0 -translate-x-4 group-hover/stage:opacity-100 group-hover/stage:translate-x-0 transition-all duration-500 shrink-0" />
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-5 bg-gray-50/30 p-8 rounded-[32px] border border-gray-50 shadow-inner">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Overall Progress</p>
                            <p className="text-gray-500 font-medium text-sm">Automated workflow execution</p>
                          </div>
                          <span className="text-4xl font-black text-[#3AD6F2] tracking-tighter leading-none">{Math.round(workflow.progress_percentage || 0)}%</span>
                        </div>
                        <div className="h-5 bg-white rounded-full overflow-hidden p-1.5 shadow-inner border border-gray-100 flex items-center">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#3AD6F2] via-[#2bcada] to-[#3AD6F2] bg-[length:200%_auto] transition-all duration-1000 shadow-[0_0_15px_rgba(58,214,242,0.4)]"
                            style={{ width: `${Math.min(workflow.progress_percentage || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-72 shrink-0">
                      <button
                        onClick={() => handleViewWorkflow(workflow)}
                        className="flex-1 flex items-center justify-center gap-3 px-8 h-16 bg-gray-900 text-white font-black !text-xs[12px] uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] transition-all rounded-[24px] shadow-2xl shadow-gray-900/10 active:scale-95 group/view"
                      >
                        <span>View Activity</span>
                        <ArrowRight size={20} className="group-hover/view:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => handleCreateRequest(workflow)}
                        className="flex-1 flex items-center justify-center gap-3 px-8 h-16 bg-white border border-gray-100 text-[#3AD6F2] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-gray-50 hover:border-[#3AD6F2]/30 transition-all rounded-[24px] shadow-lg shadow-[#3AD6F2]/5 active:scale-95"
                      >
                        <Plus size={22} className="stroke-[3]" />
                        <span>New Request</span>
                      </button>

                      {/* Contextual Actions Menu */}
                      {getAvailableStatusActions(workflow).length > 0 && (
                        <div className="relative flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === workflow.id ? null : workflow.id);
                            }}
                            className="w-full h-16 bg-gray-50 text-gray-500 font-black text-[12px] uppercase tracking-[0.2em] hover:bg-gray-100 hover:text-gray-900 transition-all rounded-[24px] flex items-center justify-center gap-3 active:scale-95 border border-transparent shadow-sm"
                            disabled={updatingStatus === workflow.id}
                          >
                            {updatingStatus === workflow.id ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
                            ) : <MoreVertical size={22} />}
                            <span>Actions</span>
                          </button>

                          {openActionMenuId === workflow.id && (
                            <div className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="p-3 space-y-1.5">
                                {getAvailableStatusActions(workflow).map((action) => (
                                  <button
                                    key={action.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusUpdate(workflow.id, action.value);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-[0.1em] text-gray-700 hover:bg-[#3AD6F2] hover:text-white rounded-2xl flex items-center gap-4 transition-all group/item"
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/item:bg-white/20 transition-colors shadow-sm">
                                      {action.value === 'paused' ? <Pause size={18} /> :
                                        action.value === 'active' ? <Play size={18} /> :
                                          action.value === 'advance' ? <ArrowRight size={18} /> :
                                            <CheckCircle size={18} />}
                                    </div>
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Requests Section */}
                  {workflow.document_requests && workflow.document_requests.length > 0 && (
                    <div className="mt-12 pt-12 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#3AD6F2]/10 flex items-center justify-center text-[#3AD6F2]">
                            <FileText size={20} />
                          </div>
                          <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.3em] leading-none">
                            Recent Document Requests
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{workflow.document_requests.length} Requests</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                className="w-14 h-14 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl shadow-xl shadow-black/5 border border-gray-100 active:scale-90 group"
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

