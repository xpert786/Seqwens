import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { taxPreparerClientAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function ClientESignLogs() {
  const { clientId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchESignLogs();
    }
  }, [clientId]);

  const fetchESignLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taxPreparerClientAPI.getESignLogs(clientId);
      
      if (response.success && response.data) {
        setLogs(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch eSign logs');
      }
    } catch (err) {
      console.error('Error fetching eSign logs:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load eSign activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'esign_request':
        return '📥';
      case 'esign_viewed':
        return '👁️';
      case 'esign_signed':
        return '✍️';
      case 'esign_completed':
        return '✅';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="p-4 font-['BasisGrotesquePro']">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C0C6]"></div>
            <span className="ml-3 text-gray-600">Loading eSign activity logs...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 font-['BasisGrotesquePro']">
        <div className="bg-white rounded-xl p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchESignLogs}
              className="px-4 py-2 bg-[#00C0C6] text-white rounded-lg hover:bg-[#00a8b0] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 font-['BasisGrotesquePro']">
      <div className="bg-white rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold" style={{ color: '#3B4A66' }}>
            E-Signature Activity Logs
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Track all e-signature activities for this client
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">No eSign activity logs found</p>
            <p className="text-gray-400 text-sm mt-2">
              Activity logs will appear here when e-signature requests are made
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border border-[#E8F0FF] rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl">{getActivityIcon(log.activity_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-[#3B4A66]">
                          {log.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
                        >
                          {log.status_display}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {log.time_ago || log.timestamp_formatted}
                        </span>
                        {log.activity_type_display && (
                          <span className="text-[#00C0C6] font-medium">
                            {log.activity_type_display}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {logs.length} activity log{logs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

