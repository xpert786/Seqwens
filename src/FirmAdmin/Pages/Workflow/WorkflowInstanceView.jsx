import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';

const WorkflowInstanceView = ({ instance: initialInstance, onBack }) => {
  const { instanceId } = useParams();
  const [instance, setInstance] = useState(initialInstance);
  const [loading, setLoading] = useState(!initialInstance);
  const [advancing, setAdvancing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (instanceId && !initialInstance) {
      fetchInstance();
    } else if (initialInstance) {
      setInstance(initialInstance);
      setLoading(false);
    }
  }, [instanceId, initialInstance]);

  const fetchInstance = async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getInstance(instanceId);
      if (response.success) {
        setInstance(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch workflow instance');
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
        if (onBack) {
          onBack();
        }
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
            onClick={onBack}
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

  return (
    <div className="min-h-screen bg-[#F3F7FF] p-3 sm:p-4 lg:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2 font-[BasisGrotesquePro]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Workflows
              </button>
              <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                {instance.tax_case?.name || 'Unknown Client'} - {instance.workflow_template?.name || 'Unknown Workflow'}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Status: <span className="font-medium">{instance.status}</span></span>
                {instance.started_at && (
                  <span>Started: {new Date(instance.started_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="ml-4">
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-[BasisGrotesquePro]"
                style={{ borderRadius: '8px' }}
              >
                Delete
              </button>
            </div>
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
                    className={`border-l-4 pl-4 pb-4 ${
                      isCurrent ? 'border-blue-500 bg-blue-50' :
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
                                  <span className={`font-[BasisGrotesquePro] ${
                                    action.status === 'completed' ? 'text-gray-700' : 'text-gray-500'
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

