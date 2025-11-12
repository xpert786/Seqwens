import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

export default function TimelineTab({ client }) {
  const API_BASE_URL = getApiBaseUrl();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Client-side pagination page
  const [pagination, setPagination] = useState({
    total_count: 0,
    page: 1,
    page_size: 50
  });
  const itemsPerPage = 3;

  // Fetch activities from API (always fetch page 1 with 50 items, then paginate client-side)
  const fetchActivities = useCallback(async () => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1'); // Always fetch first page from API
      queryParams.append('page_size', '50'); // Fetch 50 items at once

      const url = `${API_BASE_URL}/user/firm-admin/clients/${client.id}/activities/?${queryParams.toString()}`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setActivities(result.data.activities || []);
        setPagination({
          total_count: result.data.total_count || 0,
          page: result.data.page || 1,
          page_size: result.data.page_size || 50
        });
        // Reset to page 1 when new data is fetched
        setCurrentPage(1);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load activities. Please try again.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [client?.id, API_BASE_URL]);

  // Fetch activities on mount and when client changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Get icon based on activity icon type
  const getIcon = (iconType) => {
    switch (iconType) {
      case 'document':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="27" height="27" rx="8" fill="#E8F0FF" />
            <path d="M14.75 7.25V9.75C14.75 10.0815 14.8817 10.3995 15.1161 10.6339C15.3505 10.8683 15.6685 11 16 11H18.5M12.25 11.625H11M16 14.125H11M16 16.625H11M15.375 7.25H9.75C9.41848 7.25 9.10054 7.3817 8.86612 7.61612C8.6317 7.85054 8.5 8.16848 8.5 8.5V18.5C8.5 18.8315 8.6317 19.1495 8.86612 19.3839C9.10054 19.6183 9.41848 19.75 9.75 19.75H17.25C17.5815 19.75 17.8995 19.6183 18.1339 19.3839C18.3683 19.1495 18.5 18.8315 18.5 18.5V10.375L15.375 7.25Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'message':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="27" height="27" rx="8" fill="#E8F0FF" />
            <path d="M19.75 7.25L15.7916 18.5596C15.642 18.9871 15.0467 19.0113 14.8628 18.5975L12.875 14.125M19.75 7.25L8.44036 11.2084C8.01294 11.358 7.98866 11.9533 8.40247 12.1372L12.875 14.125M19.75 7.25L12.875 14.125" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'calendar':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="27" height="27" rx="8" fill="#E8F0FF" />
            <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="27" height="27" rx="8" fill="#E8F0FF" />
            <path d="M13.5 9V13.5M13.5 16H13.5063M19.75 13.5C19.75 16.9518 16.9518 19.75 13.5 19.75C10.0482 19.75 7.25 16.9518 7.25 13.5C7.25 10.0482 10.0482 7.25 13.5 7.25C16.9518 7.25 19.75 10.0482 19.75 13.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Activity Timeline</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Recent activities and interactions with this client</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No activities found</p>
        </div>
      ) : (
        <>
          {/* Calculate pagination for display */}
          {(() => {
            const totalPages = Math.ceil(activities.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedActivities = activities.slice(startIndex, endIndex);
            const showPagination = activities.length > itemsPerPage;

            return (
              <>
                <div className="space-y-3">
                  {paginatedActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-white !rounded-lg !border border-[#E8F0FF]">
                      <div className="w-10 h-10 !rounded-lg flex items-center justify-center flex-shrink-0 text-[#3B4A66]">
                        {getIcon(activity.icon || activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">
                          {activity.title || activity.description || activity.activity_type_display}
                        </p>
                        {activity.description && activity.description !== activity.title && (
                          <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-1">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                          by {activity.performed_by?.name || 'Unknown'} · {activity.timestamp_formatted || activity.timestamp || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {showPagination && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                      Showing {startIndex + 1} to {Math.min(endIndex, activities.length)} of {activities.length} activities
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] ${currentPage === page
                                  ? 'bg-[#F56D2D] text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                                style={{ borderRadius: '8px' }}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
