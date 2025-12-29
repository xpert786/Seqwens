import React, { useState, useEffect } from 'react';
import { workflowAPI, handleAPIError } from '../../utils/apiUtils';
import { toast } from 'react-toastify';
import WorkflowDashboard from '../../../components/Workflow/WorkflowDashboard';
import DocumentUploadComponent from '../../../components/Workflow/DocumentUploadComponent';
import ConfirmationModal from '../../../components/ConfirmationModal';

/**
 * TaxpayerWorkflow Component
 * Main workflow view for taxpayers/clients
 */
const TaxpayerWorkflow = () => {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch workflow data
  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await workflowAPI.getTaxpayerWorkflow();
      
      if (response.success && response.data) {
        setWorkflow(response.data);
      } else {
        // No active workflow - this is okay for new users
        setWorkflow(null);
      }
    } catch (err) {
      console.error('Error fetching workflow:', err);
      // If 404, user doesn't have a workflow yet - this is okay
      if (err.message?.includes('404') || err.message?.includes('Not Found')) {
        setWorkflow(null);
        setError(null);
      } else {
        setError(handleAPIError(err) || 'Failed to load workflow');
        toast.error(handleAPIError(err) || 'Failed to load workflow');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch storage usage
  const fetchStorageUsage = async () => {
    try {
      // This endpoint should be added to apiUtils if not already present
      const response = await workflowAPI.getStorageUsage?.() || { success: false };
      if (response.success && response.data) {
        setStorageUsage(response.data);
      }
    } catch (err) {
      console.error('Error fetching storage usage:', err);
      // Don't show error for storage - it's not critical
    }
  };

  useEffect(() => {
    fetchWorkflow();
    fetchStorageUsage();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      if (!refreshing) {
        setRefreshing(true);
        fetchWorkflow();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = (action, data) => {
    switch (action) {
      case 'upload':
        setSelectedRequest(data);
        setShowUploadModal(true);
        break;
      case 'view':
        // Navigate to request details or show in modal
        console.log('View request:', data);
        break;
      default:
        console.log('Action:', action, data);
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    setSelectedRequest(null);
    fetchWorkflow(); // Refresh workflow data
    toast.success('Documents uploaded successfully');
  };

  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 font-[BasisGrotesquePro]">Loading workflow...</span>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-[BasisGrotesquePro]">{error}</p>
          <button
            onClick={fetchWorkflow}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-[BasisGrotesquePro]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="bg-white border border-[#E8F0FF] rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">
          No Active Workflow
        </h3>
        <p className="text-gray-600 mb-4 font-[BasisGrotesquePro]">
          Your tax preparer hasn't started a workflow for you yet. Please contact them to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="taxpayer-workflow-page p-4 sm:p-6" style={{ backgroundColor: 'var(--Color-purple-50, #F6F7FF)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
            My Workflow
          </h1>
          <p className="text-gray-600 font-[BasisGrotesquePro]">
            Track your tax preparation workflow progress
          </p>
        </div>

        <WorkflowDashboard
          workflow={workflow}
          userRole="taxpayer"
          onAction={handleAction}
          storageUsage={storageUsage}
          onUpgradeStorage={() => {
            // Navigate to upgrade page or show modal
            toast.info('Redirecting to upgrade page...');
          }}
          onManageFiles={() => {
            // Navigate to documents page
            window.location.href = '/documents';
          }}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 font-[BasisGrotesquePro]">
                Upload Documents
              </h3>
              <button
                onClick={handleUploadCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DocumentUploadComponent
              requestId={selectedRequest.id}
              categories={selectedRequest.requested_categories || []}
              onUploadComplete={handleUploadComplete}
              onError={(error) => toast.error(error)}
              onCancel={handleUploadCancel}
              storageUsage={storageUsage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxpayerWorkflow;

