import React from 'react';
import WorkflowTimeline from './WorkflowTimeline';
import DocumentRequestCard from './DocumentRequestCard';
import StorageUsageWarning from './StorageUsageWarning';

/**
 * WorkflowDashboard Component
 * Main dashboard showing workflow status and progress
 */
const WorkflowDashboard = ({
  workflow,
  userRole = 'taxpayer',
  onAction,
  storageUsage = null,
  onUpgradeStorage,
  onManageFiles,
}) => {
  if (!workflow) {
    return (
      <div className="text-center py-12 text-gray-500 font-[BasisGrotesquePro]">
        No active workflow found
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDocumentAction = (action, data) => {
    if (onAction) {
      onAction(action, data);
    }
  };

  return (
    <div className="workflow-dashboard space-y-6">
      {/* Storage Warning */}
      {storageUsage && (
        <StorageUsageWarning
          usage={storageUsage}
          limit={storageUsage.limit_gb || 100}
          showWarning={storageUsage.percentage_used >= 80}
          onUpgrade={onUpgradeStorage}
          onManageFiles={onManageFiles}
        />
      )}

      {/* Workflow Header */}
      <div className="bg-white border border-[#E8F0FF] rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                {workflow.template_name || 'Workflow'}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  workflow.status
                )} font-[BasisGrotesquePro]`}
              >
                {workflow.status || 'Active'}
              </span>
            </div>
            {workflow.tax_case_name && (
              <p className="text-sm text-gray-600 mb-1 font-[BasisGrotesquePro]">
                Tax Case: <span className="font-medium">{workflow.tax_case_name}</span>
              </p>
            )}
            {userRole === 'taxpayer' && workflow.assigned_preparer_name && (
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                Assigned Preparer: <span className="font-medium">{workflow.assigned_preparer_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
              Progress
            </span>
            <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
              {Math.round(workflow.progress_percentage || 0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(workflow.progress_percentage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Current Stage */}
        {workflow.current_stage_name && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 font-[BasisGrotesquePro]">
              Current Stage: <span className="font-semibold">{workflow.current_stage_name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Document Requests */}
      {workflow.document_requests && workflow.document_requests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
            Active Document Requests
          </h3>
          <div className="space-y-4">
            {workflow.document_requests.map((request) => (
              <DocumentRequestCard
                key={request.id}
                request={request}
                userRole={userRole}
                onUpload={(req) => handleDocumentAction('upload', req)}
                onVerify={(req) => handleDocumentAction('verify', req)}
                onViewDetails={(req) => handleDocumentAction('view', req)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Workflow Timeline */}
      {workflow.stages && workflow.stages.length > 0 && (
        <div className="bg-white border border-[#E8F0FF] rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
            Workflow Timeline
          </h3>
          <WorkflowTimeline stages={workflow.stages} currentStage={workflow.current_stage} />
        </div>
      )}
    </div>
  );
};

export default WorkflowDashboard;

