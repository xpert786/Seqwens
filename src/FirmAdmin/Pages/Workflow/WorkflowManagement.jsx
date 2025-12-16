import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import WorkflowTemplateList from './WorkflowTemplateList';
import ActiveWorkflowsDashboard from './ActiveWorkflowsDashboard';
import WorkflowTemplateBuilder from './WorkflowTemplateBuilder';
import WorkflowInstanceView from './WorkflowInstanceView';

const WorkflowManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'template-builder', 'instance-view', 'template-list'
  const [stats, setStats] = useState({
    total_workflows: 0,
    active_workflows: 0,
    avg_completion_time: '0 days',
    success_rate: '0%'
  });

  useEffect(() => {
    if (viewMode === 'dashboard' || viewMode === 'template-list') {
      fetchTemplates();
      fetchInstances();
    }
  }, [viewMode]);

  const fetchTemplates = async () => {
    try {
      const response = await workflowAPI.listTemplates();
      if (response.success) {
        setTemplates(response.data || []);
        calculateStats(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error(handleAPIError(error) || 'Failed to load workflow templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await workflowAPI.listInstances({ status: 'active' });
      if (response.success) {
        setInstances(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  const calculateStats = (templatesData) => {
    const total = templatesData.length;
    const active = templatesData.filter(t => t.is_active).length;
    // Calculate stats from instances if available
    setStats({
      total_workflows: total,
      active_workflows: active,
      avg_completion_time: '3.2 days', // This would come from API
      success_rate: '94.2%' // This would come from API
    });
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setViewMode('template-builder');
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setViewMode('template-builder');
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setViewMode('template-builder');
  };

  const handleViewInstance = (instance) => {
    setSelectedInstance(instance);
    setViewMode('instance-view');
  };

  const handleBack = () => {
    setViewMode('dashboard');
    setSelectedTemplate(null);
    setSelectedInstance(null);
  };

  const handleTemplateSaved = () => {
    fetchTemplates();
    setViewMode('dashboard');
    setSelectedTemplate(null);
  };

  const tabs = [
    { id: 'active', label: 'Active Workflows' },
    { id: 'templates', label: 'Templates' },
    { id: 'analytics', label: 'Analytics' }
  ];

  if (viewMode === 'template-builder') {
    return (
      <WorkflowTemplateBuilder
        template={selectedTemplate}
        onSave={handleTemplateSaved}
        onCancel={handleBack}
      />
    );
  }

  if (viewMode === 'instance-view') {
    return (
      <WorkflowInstanceView
        instance={selectedInstance}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FF] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 sm:mb-6">
            <div>
              <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">
                Workflow Management
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">
                Automate and optimize your firm's processes
              </p>
            </div>
            {viewMode === 'dashboard' && (
              <button
                onClick={handleCreateTemplate}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 text-xs sm:text-sm font-[BasisGrotesquePro] mt-3 sm:mt-4 lg:mt-0"
                style={{ borderRadius: '8px' }}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Workflow
              </button>
            )}
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            {/* Total Workflows Card */}
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
              <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Total Workflows</h6>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3H5C3.89543 3 3 3.89543 3 5V9C3 10.1046 3.89543 11 5 11H9C10.1046 11 11 10.1046 11 9V5C11 3.89543 10.1046 3 9 3Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 11V15C7 15.5304 7.21071 16.0391 7.58579 16.4142C7.96086 16.7893 8.46957 17 9 17H13" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 13H15C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">
                {stats.total_workflows}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">Workflow templates</div>
            </div>

            {/* Active Workflows Card */}
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
              <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Active Workflows</h6>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 3L20 12L6 21V3Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">
                {stats.active_workflows}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">
                {stats.total_workflows > 0 ? Math.round((stats.active_workflows / stats.total_workflows) * 100) : 0}% of total workflows
              </div>
            </div>

            {/* Avg. Completion Time Card */}
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
              <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Avg. Completion Time</h6>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#3AD6F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">
                {stats.avg_completion_time}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">Average across all workflows</div>
            </div>

            {/* Success Rate Card */}
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
              <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Success Rate</h6>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.0818V12.0018C21.9988 14.1582 21.3005 16.2565 20.0093 17.9836C18.7182 19.7108 16.9033 20.9743 14.8354 21.5857C12.7674 22.1971 10.5573 22.1237 8.53447 21.3764C6.51168 20.6291 4.78465 19.2479 3.61096 17.4389C2.43727 15.6299 1.87979 13.4899 2.02168 11.3381C2.16356 9.18638 2.99721 7.13814 4.39828 5.49889C5.79935 3.85964 7.69279 2.7172 9.79619 2.24196C11.8996 1.76673 14.1003 1.98415 16.07 2.86182M9.00001 11.0018L12 14.0018L22 4.00182" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-lg sm:text-lg lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">
                {stats.success_rate}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">Completion success rate</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg border border-[#E8F0FF] p-1.5 sm:p-2 mb-4 sm:mb-6 w-fit">
            <div className="flex gap-3 sm:gap-4 lg:gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'templates') {
                      setViewMode('template-list');
                    } else {
                      setViewMode('dashboard');
                    }
                  }}
                  className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors rounded-lg ${
                    activeTab === tab.id
                      ? 'bg-[#3AD6F2] text-white font-semibold'
                      : 'bg-transparent text-black hover:bg-gray-50'
                  }`}
                  style={{ borderRadius: '8px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === 'dashboard' && activeTab === 'active' && (
          <ActiveWorkflowsDashboard
            instances={instances}
            onViewInstance={handleViewInstance}
            onRefresh={fetchInstances}
            loading={loading}
          />
        )}

        {viewMode === 'template-list' && activeTab === 'templates' && (
          <WorkflowTemplateList
            templates={templates}
            onViewTemplate={handleViewTemplate}
            onEditTemplate={handleEditTemplate}
            onCreateTemplate={handleCreateTemplate}
            onRefresh={fetchTemplates}
            loading={loading}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6">
            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">
                Workflow Analytics
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">
                Performance metrics and insights
              </p>
            </div>
            <div className="text-center py-12 text-gray-500">
              Analytics dashboard coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowManagement;

