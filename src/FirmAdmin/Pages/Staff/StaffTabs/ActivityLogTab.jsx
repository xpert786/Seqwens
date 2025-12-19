import React, { useState, useEffect } from 'react';
import { firmAdminStaffAPI } from '../../../../ClientOnboarding/utils/apiUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import '../../../styles/ActivityLogTab.css';

export default function ActivityLogTab({ staffId, staffMember }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Filters
  const [filters, setFilters] = useState({
    activity_type: '',
    status: '',
    start_date: '',
    end_date: ''
  });

  // Fetch activity logs
  const fetchActivityLogs = async (page = 1) => {
    if (!staffId) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        page_size: pagination.page_size,
        ...filters
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await firmAdminStaffAPI.getStaffActivityLogs(staffId, params);

      if (response.success && response.data) {
        setActivities(response.data.activities || []);
        setStatistics(response.data.statistics || null);
        setPagination(response.data.pagination || pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch activity logs');
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, filters.activity_type, filters.status, filters.start_date, filters.end_date]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchActivityLogs(newPage);
  };

  // Get icon for activity type
  const getActivityIcon = (activityType) => {
    const iconMap = {
      document: 'document',
      task: 'clock',
      invoice: 'document',
      payment: 'clock',
      appointment: 'calendar',
      client: 'clock',
      communication: 'message'
    };
    return iconMap[activityType] || 'clock';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colorMap = {
      completed: '#22C55E',
      in_progress: '#3B82F6',
      pending: '#F59E0B',
      failed: '#EF4444',
      cancelled: '#6B7280'
    };
    return colorMap[status] || '#6B7280';
  };

  return (
    <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6 activity-main-container">
      <div className="mb-6 activity-header">
        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] activity-header-title">
          Activity Log - {staffMember?.name || 'Staff Member'}
        </h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1 activity-header-subtitle">
          Recent activities and actions performed by this staff member
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 activity-statistics-grid">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 activity-stat-card">
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1 activity-stat-label">Total Activities</div>
            <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] activity-stat-value">
              {statistics.total_activities || 0}
            </div>
          </div>
          {statistics.by_type && Object.keys(statistics.by_type).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 activity-stat-card">
              <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 activity-stat-sub-label">By Type</div>
              <div className="space-y-1">
                {Object.entries(statistics.by_type).slice(0, 3).map(([type, data]) => (
                  <div key={type} className="flex justify-between text-xs activity-stat-item">
                    <span className="text-gray-600">{data.display_name}:</span>
                    <span className="font-semibold text-gray-900">{data.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {statistics.by_status && Object.keys(statistics.by_status).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 activity-stat-card">
              <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 activity-stat-sub-label">By Status</div>
              <div className="space-y-1">
                {Object.entries(statistics.by_status).slice(0, 3).map(([status, data]) => (
                  <div key={status} className="flex justify-between text-xs activity-stat-item">
                    <span className="text-gray-600">{data.display_name}:</span>
                    <span className="font-semibold text-gray-900">{data.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 activity-filters-grid">
        <div>
          <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1 activity-filter-label">
            Activity Type
          </label>
          <select
            value={filters.activity_type}
            onChange={(e) => handleFilterChange('activity_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 activity-filter-select"
          >
            <option value="">All Types</option>
            <option value="document">Document</option>
            <option value="task">Task</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
            <option value="appointment">Appointment</option>
            <option value="client">Client</option>
            <option value="communication">Communication</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1 activity-filter-label">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 activity-filter-select"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1 activity-filter-label">
            Start Date
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 activity-filter-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1 activity-filter-label">
            End Date dsfsdf
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 activity-filter-input"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.activity_type || filters.status || filters.start_date || filters.end_date) && (
        <div className="mb-4 activity-clear-filters">
          <button
            onClick={() => setFilters({ activity_type: '', status: '', start_date: '', end_date: '' })}
            className="text-sm text-blue-600 hover:text-blue-700 font-[BasisGrotesquePro] underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 activity-loading">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading activity logs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 activity-error">
          {error}
        </div>
      )}

      {/* Activities List */}
      {!loading && !error && (
        <>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const iconType = getActivityIcon(activity.activity_type);
                const statusColor = getStatusColor(activity.status);

                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors activity-item">
                    <div className="mt-1 flex-shrink-0 activity-item-icon">
                      {iconType === 'clock' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke={statusColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {iconType === 'calendar' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke={statusColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {iconType === 'document' && (
                        <svg className="w-6 h-6" fill="none" stroke={statusColor} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {iconType === 'message' && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.5 8.246C13.5 8.44491 13.421 8.63568 13.2803 8.77633C13.1397 8.91698 12.9489 8.996 12.75 8.996H6.75C6.55109 8.996 6.36032 8.91698 6.21967 8.77633C6.07902 8.63568 6 8.44491 6 8.246C6 8.04709 6.07902 7.85632 6.21967 7.71567C6.36032 7.57502 6.55109 7.496 6.75 7.496H12.75C12.9489 7.496 13.1397 7.57502 13.2803 7.71567C13.421 7.85632 13.5 8.04709 13.5 8.246ZM12.75 10.496H6.75C6.55109 10.496 6.36032 10.575 6.21967 10.7157C6.07902 10.8563 6 11.0471 6 11.246C6 11.4449 6.07902 11.6357 6.21967 11.7763C6.36032 11.917 6.55109 11.996 6.75 11.996H12.75C12.9489 11.996 13.1397 11.917 13.2803 11.7763C13.421 11.6357 13.5 11.4449 13.5 11.246C13.5 11.0471 13.421 10.8563 13.2803 10.7157C13.1397 10.575 12.9489 10.496 12.75 10.496ZM19.5 9.746C19.5004 11.4293 19.0649 13.084 18.236 14.5491C17.4072 16.0142 16.2131 17.2398 14.77 18.1065C13.327 18.9732 11.6841 19.4515 10.0014 19.4949C8.31863 19.5383 6.6533 19.1453 5.1675 18.3541L1.97531 19.4182C1.71102 19.5063 1.4274 19.5191 1.15624 19.4551C0.885089 19.3911 0.637113 19.2529 0.44011 19.0559C0.243108 18.8589 0.104864 18.6109 0.0408727 18.3398C-0.0231183 18.0686 -0.0103272 17.785 0.0778122 17.5207L1.14187 14.3285C0.446389 13.0209 0.0579347 11.5721 0.0059975 10.0919C-0.0459397 8.61177 0.240005 7.13925 0.842128 5.78613C1.44425 4.433 2.34672 3.23482 3.48105 2.28256C4.61537 1.33029 5.95173 0.648948 7.38869 0.290259C8.82565 -0.0684305 10.3254 -0.0950433 11.7742 0.21244C13.223 0.519923 14.5827 1.15342 15.7501 2.06485C16.9175 2.97627 17.8619 4.14168 18.5116 5.47259C19.1614 6.8035 19.4994 8.26495 19.5 9.746ZM18 9.746C17.9996 8.48049 17.7082 7.23203 17.1481 6.0972C16.588 4.96237 15.7744 3.9716 14.7701 3.20153C13.7659 2.43147 12.5979 1.90276 11.3567 1.6563C10.1154 1.40985 8.83405 1.45226 7.61178 1.78025C6.38951 2.10824 5.25909 2.71302 4.30796 3.54781C3.35682 4.38259 2.61049 5.42499 2.12668 6.59437C1.64288 7.76375 1.43458 9.02876 1.5179 10.2915C1.60122 11.5543 1.97393 12.781 2.60719 13.8766C2.66034 13.9686 2.69334 14.0708 2.704 14.1765C2.71467 14.2822 2.70276 14.389 2.66906 14.4898L1.5 17.996L5.00625 16.8269C5.08262 16.8009 5.16275 16.7876 5.24344 16.7876C5.37516 16.7878 5.5045 16.8227 5.61844 16.8888C6.87263 17.6145 8.29581 17.997 9.74479 17.9979C11.1938 17.9988 12.6174 17.6181 13.8725 16.894C15.1276 16.17 16.1699 15.1281 16.8945 13.8733C17.619 12.6185 18.0003 11.195 18 9.746Z" fill={statusColor}/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 activity-item-content">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 font-[BasisGrotesquePro] mb-1 activity-item-title">
                            {activity.title}
                          </div>
                          {activity.description && (
                            <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 activity-item-description">
                              {activity.description}
                            </div>
                          )}
                          <div className="flex items-center gap-3 flex-wrap activity-item-meta">
                            <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                              {activity.activity_type_display || activity.activity_type}
                            </span>
                            {activity.status_display && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-[BasisGrotesquePro]"
                                style={{
                                  backgroundColor: `${statusColor}20`,
                                  color: statusColor
                                }}
                              >
                                {activity.status_display}
                              </span>
                            )}
                            {activity.relative_time && (
                              <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                                {activity.relative_time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-2 activity-item-timestamp">
                        {activity.formatted_timestamp || activity.formatted_date || new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 activity-empty-state">
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No activity logs found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between activity-pagination">
              <div className="text-sm text-gray-600 font-[BasisGrotesquePro] activity-pagination-info">
                Showing page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)
              </div>
              <div className="flex gap-2 activity-pagination-buttons">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.has_previous}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 activity-pagination-button"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 activity-pagination-button"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
