import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { getStorage } from '../../../ClientOnboarding/utils/userUtils';

const WorkflowInstanceView = ({ instance: initialInstance, onBack }) => {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(initialInstance);
  const [loading, setLoading] = useState(!initialInstance);
  const [advancing, setAdvancing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [templateDescription, setTemplateDescription] = useState('');
  const [stageDescription, setStageDescription] = useState('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Determine the correct back path based on current route
      const path = window.location.pathname;
      if (path.includes('/taxdashboard/workflows')) {
        navigate('/taxdashboard/workflows');
      } else if (path.includes('/firmadmin/workflows')) {
        navigate('/firmadmin/workflows');
      } else {
        window.history.back();
      }
    }
  };

  useEffect(() => {
    const instanceIdToFetch = instanceId || initialInstance?.id;
    if (instanceIdToFetch) {
      fetchInstance();
    } else if (initialInstance) {
      setInstance(initialInstance);
      setLoading(false);
    }
  }, [instanceId]);

  const fetchInstance = async () => {
    try {
      setLoading(true);
      const idToFetch = instanceId || instance?.id || initialInstance?.id;
      if (!idToFetch) {
        throw new Error('No instance ID available');
      }

      // Use the description-logs endpoint to get full details
      const response = await workflowAPI.getInstanceDescriptionLogs(idToFetch);
      if (response.success && response.data) {
        setInstance(response.data);
        // Extract execution logs
        setExecutionLogs(response.data.execution_logs || []);
        // Extract descriptions
        setTemplateDescription(response.data.template_description ||
          response.data.workflow_template_details?.description ||
          '');
        setStageDescription(response.data.current_stage_description ||
          response.data.current_stage_details?.description ||
          '');
      } else {
        // Fallback to regular getInstance if description-logs fails
        const fallbackResponse = await workflowAPI.getInstance(idToFetch);
        if (fallbackResponse.success) {
          setInstance(fallbackResponse.data);
          setExecutionLogs([]);
        } else {
          throw new Error(fallbackResponse.message || 'Failed to fetch workflow instance');
        }
      }
    } catch (error) {
      console.error('Error fetching instance:', error);
      toast.error(handleAPIError(error) || 'Failed to load workflow instance');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async (targetStageId) => {
    try {
      setAdvancing(true);
      const response = await workflowAPI.advanceWorkflow(instance.id, targetStageId);
      if (response.success) {
        toast.success('Workflow advanced successfully');
        await fetchInstance();
      } else {
        throw new Error(response.message || 'Failed to advance workflow');
      }
    } catch (error) {
      console.error('Error advancing workflow:', error);
      toast.error(handleAPIError(error) || 'Failed to advance workflow');
    } finally {
      setAdvancing(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!instance) return;

    try {
      setDeleting(true);
      const response = await workflowAPI.deleteWorkflowInstance(instance.id);
      if (response.success) {
        toast.success('Workflow instance deleted successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        setShowDeleteConfirm(false);
        handleBack();
      } else {
        throw new Error(response.message || 'Failed to delete workflow instance');
      }
    } catch (error) {
      console.error('Error deleting workflow instance:', error);
      toast.error(handleAPIError(error) || 'Failed to delete workflow instance', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleting) {
      setShowDeleteConfirm(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'pending':
        return '⏸️';
      case 'skipped':
        return '⏭️';
      default:
        return '⏸️';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-gray-600';
      case 'skipped':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F7FF] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
          <span className="ml-3 text-gray-600">Loading workflow...</span>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="min-h-screen bg-[#F3F7FF] p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Workflow instance not found</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#3AD6F2] rounded-lg hover:bg-[#00C0C6] transition-colors"
            style={{ borderRadius: '8px' }}
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = instance.progress_percentage || 0;
  const currentStageIndex = instance.current_stage_index || 0;

  // Check if user is admin (can delete workflows)
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  const canDelete = userType === 'admin' || userType === 'super_admin';

  return (
    <div className="min-h-screen bg-[#F3F7FF] p-3 sm:p-4 lg:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2 font-[BasisGrotesquePro]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Workflows
              </button>
              <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                {instance.tax_case_name || instance.tax_case?.name || 'Unknown Client'} - {instance.template_name || instance.workflow_template?.name || 'Unknown Workflow'}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Status: <span className="font-medium">{instance.status_display || instance.status || 'Active'}</span></span>
                {instance.started_at && (
                  <span>Started: {new Date(instance.started_at).toLocaleDateString()}</span>
                )}
                {instance.tax_case_email && (
                  <span>Email: {instance.tax_case_email}</span>
                )}
              </div>
            </div>
            {canDelete && (
              <div className="ml-4">
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-[BasisGrotesquePro]"
                  style={{ borderRadius: '8px' }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">Progress</span>
              <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#3AD6F2] h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Template and Stage Descriptions */}
        {(templateDescription || stageDescription) && (
          <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateDescription && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Template Description</p>
                  <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">{templateDescription}</p>
                </div>
              )}
              {stageDescription && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Current Stage Description</p>
                  <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">{stageDescription}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {executionLogs.length > 0 && (
          <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">
              Execution Logs ({executionLogs.length})
            </h4>
            <div className="space-y-3">
              {executionLogs.map((log) => {
                const performedByName = log.performed_by_name ||
                  log.performed_by_details?.name ||
                  (log.performed_by_details?.first_name && log.performed_by_details?.last_name
                    ? `${log.performed_by_details.first_name} ${log.performed_by_details.last_name}`.trim()
                    : 'Unknown');
                const actionType = log.action_type_display || log.action_type || 'Action';
                const stageName = log.details?.stage_name || 'N/A';

                return (
                  <div
                    key={log.id}
                    className="border-l-4 border-[#3AD6F2] pl-4 py-3 bg-gray-50 rounded-r-lg"
                    style={{ borderRadius: '0 8px 8px 0' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                            {actionType}
                          </span>
                          {log.details?.stage_name && (
                            <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                              - {stageName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mb-1 font-[BasisGrotesquePro]">
                          Performed by: <span className="font-medium">{performedByName}</span>
                        </div>
                        {log.created_at && (
                          <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Timeline</h4>
          <div className="space-y-4">
            {instance.stage_instances && instance.stage_instances.length > 0 ? (
              instance.stage_instances.map((stageInstance, index) => {
                const isCurrent = stageInstance.status === 'in_progress';
                const isCompleted = stageInstance.status === 'completed';
                const isPending = stageInstance.status === 'pending';

                return (
                  <div
                    key={stageInstance.id}
                    className={`border-l-4 pl-4 pb-4 ${isCurrent ? 'border-blue-500 bg-blue-50' :
                        isCompleted ? 'border-green-500' :
                          'border-gray-300'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getStatusIcon(stageInstance.status)}</span>
                          <h5 className={`font-semibold ${getStatusColor(stageInstance.status)} font-[BasisGrotesquePro]`}>
                            {stageInstance.stage?.name || `Stage ${index + 1}`}
                          </h5>
                          {isCurrent && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>

                        {stageInstance.started_at && (
                          <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">
                            Started: {new Date(stageInstance.started_at).toLocaleString()}
                          </p>
                        )}
                        {stageInstance.completed_at && (
                          <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">
                            Completed: {new Date(stageInstance.completed_at).toLocaleString()}
                          </p>
                        )}

                        {isCurrent && stageInstance.actions && (
                          <div className="mt-4 p-3 bg-white rounded border border-[#E8F0FF]">
                            <h6 className="text-sm font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">Actions</h6>
                            <div className="space-y-2">
                              {stageInstance.actions.map((action, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {action.status === 'completed' ? (
                                    <span className="text-green-600">✅</span>
                                  ) : (
                                    <span className="text-yellow-600">⏳</span>
                                  )}
                                  <span className={`font-[BasisGrotesquePro] ${action.status === 'completed' ? 'text-gray-700' : 'text-gray-500'
                                    }`}>
                                    {action.action_type_display || action.action_type} - {action.configuration?.title || action.configuration?.subject || 'Action'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isCurrent && instance.stage_instances[index + 1] && (
                          <button
                            onClick={() => handleAdvance(instance.stage_instances[index + 1].stage?.id)}
                            disabled={advancing}
                            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#3AD6F2] rounded-lg hover:bg-[#00C0C6] transition-colors font-[BasisGrotesquePro] disabled:opacity-50"
                            style={{ borderRadius: '8px' }}
                          >
                            {advancing ? 'Advancing...' : 'Advance to Next Stage'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No stages found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Workflow Instance"
        message={`Are you sure you want to delete this workflow instance? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        isDestructive={true}
      />
    </div>
  );
};

export default WorkflowInstanceView;

