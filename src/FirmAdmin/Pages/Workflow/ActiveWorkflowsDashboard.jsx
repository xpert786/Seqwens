import React, { useState } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const ActiveWorkflowsDashboard = ({ instances, onViewInstance, onRefresh, loading }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInstances = instances.filter(instance => {
    const matchesFilter = filter === 'all' || instance.status === filter;
    const matchesSearch = !searchTerm || 
      instance.tax_case?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.workflow_template?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
              className="px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
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
            const template = instance.workflow_template || {};
            const currentStage = instance.current_stage || {};
            const taxCase = instance.tax_case || {};
            
            return (
              <div
                key={instance.id}
                className="border border-[#E8F0FF] rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                style={{ borderRadius: '8px' }}
              >
                <div className="flex flex-col gap-4">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h5 className="font-semibold text-lg text-[#3B4A66] font-[BasisGrotesquePro]">
                          {template.name || 'Unknown Workflow'}
                        </h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`} style={{ borderRadius: '8px' }}>
                          {instance.status_display || instance.status || 'Active'}
                        </span>
                        {template.is_active !== undefined && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`} style={{ borderRadius: '8px' }}>
                            {template.is_active ? 'Active Template' : 'Inactive Template'}
                          </span>
                        )}
                        {template.is_default && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700" style={{ borderRadius: '8px' }}>
                            Default
                          </span>
                        )}
                      </div>
                      
                      {/* Description */}
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3 font-[BasisGrotesquePro]">
                          {template.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewInstance(instance)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#3AD6F2] rounded-lg hover:bg-[#00C0C6] transition-colors font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    {/* Tax Form Type */}
                    {template.tax_form_type && (
                      <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                        <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Tax Form Type</p>
                        <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                          {template.tax_form_type_display || template.tax_form_type}
                        </p>
                      </div>
                    )}

                    {/* Client/Tax Case */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Client/Tax Case</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {taxCase.name || instance.client_name || 'N/A'}
                      </p>
                    </div>

                    {/* Current Stage */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Current Stage</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {currentStage.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                        Stage {instance.current_stage_index || 0} of {template.stage_count || instance.total_stages || 0}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="bg-gray-50 rounded-lg p-3" style={{ borderRadius: '8px' }}>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#3AD6F2] h-2 rounded-full transition-all"
                            style={{ width: `${formatProgress(instance.progress_percentage)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 font-[BasisGrotesquePro]">
                          {formatProgress(instance.progress_percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Details */}
                  {currentStage && (
                    <div className="border-t border-[#E8F0FF] pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {currentStage.description && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Stage Description</p>
                            <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                              {currentStage.description}
                            </p>
                          </div>
                        )}
                        
                        {currentStage.user_type_group && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">User Type</p>
                            <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                              {currentStage.user_type_group_display || currentStage.user_type_group}
                            </p>
                          </div>
                        )}

                        {currentStage.estimated_duration_days !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Est. Duration</p>
                            <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                              {currentStage.estimated_duration_days} day{currentStage.estimated_duration_days !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}

                        {currentStage.is_required !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Required</p>
                            <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                              {currentStage.is_required ? 'Yes' : 'No'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions, Triggers, Reminders Count */}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {currentStage.actions && currentStage.actions.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                              {currentStage.actions.length} Action{currentStage.actions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {currentStage.triggers && currentStage.triggers.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                              {currentStage.triggers.length} Trigger{currentStage.triggers.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {currentStage.reminders && currentStage.reminders.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                              {currentStage.reminders.length} Reminder{currentStage.reminders.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="border-t border-[#E8F0FF] pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {template.created_by_name && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-[BasisGrotesquePro]">Created by: {template.created_by_name}</span>
                        </div>
                      )}
                      {template.created_at && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-[BasisGrotesquePro]">
                            Created: {new Date(template.created_at).toLocaleDateString()}
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
                    </div>

                    {currentStage.due_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-yellow-50 px-3 py-1.5 rounded-lg" style={{ borderRadius: '8px' }}>
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-yellow-700 font-[BasisGrotesquePro]">
                          Due: {new Date(currentStage.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveWorkflowsDashboard;

