import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

export default function CurrentTasksTab({ staffId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    if (staffId) {
      fetchTasks();
    }
  }, [staffId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm/staff/${staffId}/tasks/`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setTasks(result.data.tasks || []);
        setStatistics(result.data.statistics || null);
        setStaffName(result.data.staff_name || '');
      } else {
        throw new Error(result.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(handleAPIError(err));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Map API data to component format
  const mappedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.task_title || task.task_name || 'Untitled Task',
    description: task.description || '',
    dueDate: task.due_date || task.due_date_iso || 'N/A',
    progress: task.progress || 0,
    priority: task.priority_display || task.priority || 'Medium',
    status: task.status_display || task.status || 'Pending',
    taskType: task.task_type_display || task.task_type || '',
    clients: task.clients || [],
    estimatedHours: task.estimated_hours || null
  }));

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    const priorityLower = (priority || '').toLowerCase();
    if (priorityLower === 'high') {
      return 'bg-[#EF4444] text-white';
    } else if (priorityLower === 'medium') {
      return 'bg-yellow-500 text-white';
    } else if (priorityLower === 'low') {
      return 'bg-green-500 text-white';
    }
    return 'bg-gray-500 text-white';
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'in progress' || statusLower === 'in_progress') {
      return 'bg-[#1E40AF] text-white';
    } else if (statusLower === 'completed' || statusLower === 'done') {
      return 'bg-green-500 text-white';
    } else if (statusLower === 'pending') {
      return 'bg-[#FBBF24] text-white';
    }
    return 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
          Current Tasks ({statistics?.total || mappedTasks.length})
        </h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
          {staffName ? `${staffName}'s active tasks and their progress` : 'Active tasks and their progress'}
        </p>
      </div>

      {mappedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mappedTasks.map((task) => (
            <div key={task.id} className="!border border-[#E8F0FF] rounded-lg p-4">
              {/* Title and Priority/Status Badges - Same Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900 font-[BasisGrotesquePro]">{task.title}</h6>
                  {task.clients && task.clients.length > 0 && (
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                      Client{task.clients.length > 1 ? 's' : ''}: {task.clients.map(c => c.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(task.priority)} font-[BasisGrotesquePro]`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(task.status)} font-[BasisGrotesquePro]`}>
                    {task.status}
                  </span>
                </div>
              </div>
              
              {/* Due Date and Completion Percentage - Same Row */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">Due: {task.dueDate}</p>
                <p className="text-xs text-[#3B4A66] font-bold font-[BasisGrotesquePro]">{task.progress}% complete</p>
              </div>
              
              {/* Progress Bar - Below Due Date/Percentage */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#3AD6F2] h-2 rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

