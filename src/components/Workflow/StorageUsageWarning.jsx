import React from 'react';
import { toast } from 'react-toastify';

/**
 * StorageUsageWarning Component
 * Displays storage usage and warnings
 */
const StorageUsageWarning = ({ usage = { total_gb: 0, limit_gb: 100, percentage_used: 0, limit_exceeded: false }, onUpgrade, onManageFiles }) => {
  const percentage = usage.percentage_used || (usage.total_gb / usage.limit_gb) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isError = percentage >= 100 || usage.limit_exceeded;

  if (!isWarning && !isError) {
    return null;
  }

  const getProgressColor = () => {
    if (isError) return '#DC3545'; // Red
    if (isWarning) return '#FFC107'; // Orange
    return '#28A745'; // Green
  };

  return (
    <div
      className={`storage-warning p-4 rounded-lg mb-4 ${isError ? 'bg-red-50 border-2 border-red-300' : 'bg-orange-50 border-2 border-orange-300'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg
              className={`w-5 h-5 mr-2 ${isError ? 'text-red-600' : 'text-orange-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h4
              className={`font-semibold text-sm ${isError ? 'text-red-800' : 'text-orange-800'
                } font-[BasisGrotesquePro]`}
            >
              {isError ? 'Storage Limit Exceeded!' : 'Storage Warning'}
            </h4>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>

          <p
            className={`text-sm mb-3 ${isError ? 'text-red-700' : 'text-orange-700'
              } font-[BasisGrotesquePro]`}
          >
            {isError
              ? `Your firm has exceeded its storage limit! (${usage.total_gb?.toFixed(2) || 0} GB / ${usage.limit_gb} GB)`
              : `Storage usage: ${usage.total_gb?.toFixed(2) || 0} GB / ${usage.limit_gb} GB (${percentage.toFixed(0)}%)`}
          </p>

          {isError && (
            <div className="flex flex-wrap gap-2 mt-3">
              {onManageFiles && (
                <button
                  onClick={onManageFiles}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition text-sm font-[BasisGrotesquePro]"
                >
                  Delete Files
                </button>
              )}
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-[BasisGrotesquePro]"

                >
                  Upgrade Plan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageUsageWarning;

