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
          {filteredInstances.map((instance) => (
            <div
              key={instance.id}
              className="border border-[#E8F0FF] rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                      {instance.tax_case?.name || 'Unknown Client'} - {instance.workflow_template?.name || 'Unknown Workflow'}
                    </h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                      {instance.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Current Stage</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {instance.current_stage?.name || 'N/A'} ({instance.current_stage_index || 0}/{instance.total_stages || 0})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#3AD6F2] h-2 rounded-full transition-all"
                            style={{ width: `${formatProgress(instance.progress_percentage)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                          {formatProgress(instance.progress_percentage)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">Preparer</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {instance.assigned_preparer?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {instance.current_stage?.due_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Due: {new Date(instance.current_stage.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewInstance(instance)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#3AD6F2] rounded-lg hover:bg-[#00C0C6] transition-colors font-[BasisGrotesquePro]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveWorkflowsDashboard;

