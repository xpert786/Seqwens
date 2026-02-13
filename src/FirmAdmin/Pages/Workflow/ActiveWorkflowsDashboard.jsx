import React, { useState } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';

const ActiveWorkflowsDashboard = ({ instances, onViewInstance, onRefresh, loading }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredInstances = instances.filter(instance => {
    const matchesFilter = filter === 'all' || instance.status === filter;
    const matchesSearch = !searchTerm ||
      (instance.tax_case_name || instance.tax_case?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (instance.template_name || instance.workflow_template?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (instance.tax_case_email || instance.tax_case?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatProgress = (percentage) => {
    return Math.round(percentage || 0);
  };

  const handleDeleteClick = (instance) => {
    setInstanceToDelete(instance);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!instanceToDelete) return;

    try {
      setDeleting(true);
      const response = await workflowAPI.deleteWorkflowInstance(instanceToDelete.id);
      if (response.success) {
        toast.success('Workflow instance deleted successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        setShowDeleteConfirm(false);
        setInstanceToDelete(null);
        if (onRefresh) {
          onRefresh();
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
      setInstanceToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
          <span className="ml-3 text-gray-600">Loading workflows...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">
              Active Workflows
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">
              Monitor and manage your automated workflows
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro]"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredInstances.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-gray-500 text-lg">No active workflows found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start a workflow for a tax case to see it here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInstances.map((instance) => {
            // Use flat structure from API response, with fallback to details objects
            const templateName = instance.template_name ||
              instance.workflow_template_details?.name ||
              instance.workflow_template?.name ||
              'Unknown Workflow';
            const taxCaseName = instance.tax_case_name ||
              instance.tax_case_details?.name ||
              (instance.tax_case_details?.first_name && instance.tax_case_details?.last_name
                ? `${instance.tax_case_details.first_name} ${instance.tax_case_details.last_name}`.trim()
                : null) ||
              instance.tax_case?.name ||
              'Unknown Client';
            const taxCaseEmail = instance.tax_case_email ||
              instance.tax_case_details?.email ||
              instance.tax_case?.email ||
              '';
            const currentStageName = instance.current_stage_name ||
              instance.current_stage_details?.name ||
              instance.current_stage?.name ||
              'N/A';
            const assignedPreparer = instance.assigned_preparer_name ||
              instance.assigned_preparer_details?.name ||
              instance.assigned_preparer_details?.full_name ||
              (instance.assigned_preparer_details?.first_name && instance.assigned_preparer_details?.last_name
                ? `${instance.assigned_preparer_details.first_name} ${instance.assigned_preparer_details.last_name}`.trim()
                : null) ||
              null;

            return (
              <div
                key={instance.id}
                className="border border-[#E8F0FF] rounded-lg p-4 bg-white"
                style={{ borderRadius: '8px' }}
              >
                <div className="flex flex-col gap-4">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h5 className="font-semibold text-lg text-[#3B4A66] font-[BasisGrotesquePro]">
                          {templateName}
                        </h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`} style={{ borderRadius: '8px' }}>
                          {instance.status_display || instance.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewInstance(instance)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#3AD6F2] rounded-lg font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteClick(instance)}
                        className="px-4 py-2 text-sm font-medium text-red-500 bg-white border border-red-500 rounded-lg font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    {/* Client/Tax Case */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Client/Tax Case</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {taxCaseName}
                      </p>
                      {taxCaseEmail && (
                        <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                          {taxCaseEmail}
                        </p>
                      )}
                    </div>

                    {/* Current Stage */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Current Stage</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {currentStageName}
                      </p>
                      {instance.current_stage_details?.stage_order !== undefined && (
                        <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                          Stage Order: {instance.current_stage_details.stage_order + 1}
                        </p>
                      )}
                    </div>

                    {/* Assigned Preparer */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Assigned Preparer</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {assignedPreparer || 'Not Assigned'}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#3AD6F2] h-2 rounded-full transition-all"
                            style={{ width: `${formatProgress(instance.progress_percentage || 0)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 font-[BasisGrotesquePro]">
                          {formatProgress(instance.progress_percentage || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {/* Additional Details */}
                  {(instance.workflow_template_details?.description || instance.current_stage_details?.description) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {/* Workflow Template Description */}
                      {instance.workflow_template_details?.description && (
                        <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                          <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Template Description</p>
                          <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                            {instance.workflow_template_details.description}
                          </p>
                        </div>
                      )}

                      {/* Current Stage Description */}
                      {instance.current_stage_details?.description && (
                        <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                          <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Stage Description</p>
                          <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                            {instance.current_stage_details.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="border-t border-[#E8F0FF] pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {instance.created_at && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-[BasisGrotesquePro]">
                            Created: {new Date(instance.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {instance.started_at && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-[BasisGrotesquePro]">
                            Started: {new Date(instance.started_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {instance.completed_at && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-[BasisGrotesquePro]">
                            Completed: {new Date(instance.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

export default ActiveWorkflowsDashboard;

