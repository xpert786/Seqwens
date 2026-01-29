import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import WorkflowTemplateList from './WorkflowTemplateList';
import ActiveWorkflowsDashboard from './ActiveWorkflowsDashboard';
import WorkflowTemplateBuilder from './WorkflowTemplateBuilder';
import WorkflowInstanceView from './WorkflowInstanceView';
import WorkflowPipelineView from './WorkflowPipelineView';
import StartWorkflowModal from './StartWorkflowModal';
import {
  WorkflowStatisticsCards,
  WorkflowQuickActions,
  WorkflowExecutionLogViewer,
  WorkflowTemplateCard
} from './WorkflowComponents';

/**
 * WorkflowManagement - Redesigned main workflow management page
 * Features:
 * - Modern dashboard with statistics
 * - Kanban pipeline view
 * - Quick actions bar
 * - Template management
 * - Instance tracking
 */
const WorkflowManagement = () => {
  const navigate = useNavigate();

  // View state
  const [activeTab, setActiveTab] = useState('pipeline');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'template-builder', 'instance-view'

  // Data state
  const [templates, setTemplates] = useState([]);
  // const [instances, setInstances] = useState([]); // Removed unused state
  const [allInstances, setAllInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Selection state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [selectedPipelineTemplate, setSelectedPipelineTemplate] = useState(null);

  // Modal state
  const [showStartWorkflowModal, setShowStartWorkflowModal] = useState(false);
  const [showExecutionLogModal, setShowExecutionLogModal] = useState(false);
  const [executionLogInstanceId, setExecutionLogInstanceId] = useState(null);

  // Statistics
  const [statistics, setStatistics] = useState({
    total_templates: 0,
    active_workflows: 0,
    paused_workflows: 0,
    completed_workflows: 0,
    avg_completion_days: null,
    completion_rate: 0
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await workflowAPI.listTemplates();
      if (response.success) {
        setTemplates(response.data?.results || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error(handleAPIError(error) || 'Failed to load workflow templates');
    }
  }, []);

  const fetchInstances = useCallback(async () => {
    try {
      // Fetch all instances for pipeline view
      const response = await workflowAPI.listInstances({});
      if (response.success) {
        setAllInstances(response.data?.results || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await workflowAPI.getWorkflowStatistics();
      if (response.success && response.data) {
        // Map API response to our statistics format
        const apiStats = response.data;
        setStatistics({
          total_templates: apiStats.total_workflows?.value || apiStats.total_templates || 0,
          active_workflows: apiStats.active_workflows?.value || apiStats.active_instances || 0,
          paused_workflows: apiStats.paused_workflows?.value || apiStats.paused_instances || 0,
          completed_workflows: apiStats.completed_workflows?.value || apiStats.completed_instances || 0,
          avg_completion_days: apiStats.avg_completion_time?.value_days || null,
          completion_rate: apiStats.success_rate?.value_percentage || 0
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);

    try {
      await Promise.all([
        fetchTemplates(),
        fetchInstances(),
        fetchStatistics()
      ]);
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [fetchTemplates, fetchInstances, fetchStatistics]);

  // Fetch data on mount and view changes
  useEffect(() => {
    if (viewMode === 'dashboard') {
      fetchAllData();
    }
  }, [viewMode, fetchAllData]);

  // Auto-select first template for pipeline view if none selected
  useEffect(() => {
    if (!selectedPipelineTemplate && templates.length > 0) {
      setSelectedPipelineTemplate(templates[0].id);
    }
  }, [templates, selectedPipelineTemplate]);

  // Handler for local stats calculation (if needed in fallback cases)
  // Currently unused to avoid dependency loops, relying on API
  /*
  const calculateLocalStats = () => {
    const active = allInstances.filter(i => i.status === 'active').length;
    const paused = allInstances.filter(i => i.status === 'paused').length;
    const completed = allInstances.filter(i => i.status === 'completed').length;
    const total = allInstances.length;

    setStatistics({
      total_templates: templates.length,
      active_workflows: active,
      paused_workflows: paused,
      completed_workflows: completed,
      avg_completion_days: null,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  };
  */

  // Handlers
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setViewMode('template-builder');
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setViewMode('template-builder');
  };

  const handleViewInstance = (instance) => {
    setSelectedInstance(instance);
    setViewMode('instance-view');
  };

  const handleViewExecutionLog = (instance) => {
    setExecutionLogInstanceId(instance.id);
    setShowExecutionLogModal(true);
  };

  const handleBack = () => {
    setViewMode('dashboard');
    setSelectedTemplate(null);
    setSelectedInstance(null);
    fetchAllData();
  };

  const handleTemplateSaved = () => {
    fetchTemplates();
    setViewMode('dashboard');
    setSelectedTemplate(null);
    toast.success('Workflow template saved successfully');
  };

  const handleStartWorkflow = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
    }
    setShowStartWorkflowModal(true);
  };

  const handleWorkflowStarted = () => {
    setShowStartWorkflowModal(false);
    setSelectedTemplate(null);
    fetchInstances();
    fetchStatistics();
    toast.success('Workflow started successfully!');
  };

  const handleCloneTemplate = async (template) => {
    try {
      const response = await workflowAPI.cloneTemplate(template.id, `${template.name} (Copy)`);
      if (response.success) {
        toast.success('Template cloned successfully');
        fetchTemplates();
      } else {
        throw new Error(response.message || 'Failed to clone template');
      }
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error(handleAPIError(error) || 'Failed to clone template');
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await workflowAPI.deleteTemplate(template.id);
      if (response.success) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        throw new Error(response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(handleAPIError(error) || 'Failed to delete template');
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'pipeline', label: 'Pipeline View', icon: '🔄' },
    { id: 'active', label: 'Active Workflows', icon: '▶️' },
    { id: 'templates', label: 'Templates', icon: '📋' },
  ];

  // Render template builder view
  if (viewMode === 'template-builder') {
    return (
      <WorkflowTemplateBuilder
        template={selectedTemplate}
        onSave={handleTemplateSaved}
        onCancel={handleBack}
      />
    );
  }

  // Render instance view
  if (viewMode === 'instance-view') {
    return (
      <WorkflowInstanceView
        instance={selectedInstance}
        onBack={handleBack}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-[#F3F7FF] p-6">
      <div className="max-w-full mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Workflow Management
            </h4>
            <p className="text-gray-600 font-[BasisGrotesquePro]">
              Create, manage, and track standard workflows for your clients
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
            <button
              onClick={() => handleStartWorkflow()}
              className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center font-[BasisGrotesquePro]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Workflow
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <WorkflowStatisticsCards
          statistics={statistics}
          loading={statsLoading}
          onStatClick={(key) => {
            if (key === 'active_workflows') setActiveTab('pipeline');
            else if (key === 'total_templates') setActiveTab('templates');
          }}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2 bg-white !rounded-lg !border border-[#E8F0FF] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-[BasisGrotesquePro] transition-all !rounded-lg ${activeTab === tab.id
                  ? 'bg-[#F56D2D] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[60vh]">
          {/* Pipeline View */}
          {activeTab === 'pipeline' && (
            <WorkflowPipelineView
              instances={allInstances}
              templates={templates}
              onViewInstance={handleViewInstance}
              onRefresh={fetchInstances}
              loading={loading}
              selectedTemplate={selectedPipelineTemplate}
              onSelectTemplate={setSelectedPipelineTemplate}
            />
          )}

          {/* Active Workflows List */}
          {activeTab === 'active' && (
            <ActiveWorkflowsDashboard
              instances={allInstances}
              onViewInstance={handleViewInstance}
              onRefresh={fetchInstances}
              loading={loading}
            />
          )}

          {/* Templates Grid */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 font-[BasisGrotesquePro]">
                      Workflow Templates
                    </h3>
                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">
                      Reusable workflow blueprints to standardize client processes
                    </p>
                  </div>
                  <button
                    onClick={handleCreateTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-all font-[BasisGrotesquePro] text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Template
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white !rounded-lg !border border-[#E8F0FF] h-64 animate-pulse">
                      <div className="h-24 bg-gray-100 rounded-t-lg"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-12 text-center">
                  <div className="w-16 h-16 bg-[#FFF4E6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#F56D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2 font-[BasisGrotesquePro]">
                    No Templates Yet
                  </h4>
                  <p className="text-gray-500 mb-6 font-[BasisGrotesquePro] max-w-md mx-auto">
                    Workflow templates help you automate repetitive tasks. Create your first template to streamline client onboarding, tax filing, and more.
                  </p>
                  <button
                    onClick={handleCreateTemplate}
                    className="px-6 py-3 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-all font-[BasisGrotesquePro]"
                  >
                    Create Your First Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <WorkflowTemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                      onClone={handleCloneTemplate}
                      onStartWorkflow={handleStartWorkflow}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showStartWorkflowModal && (
        <StartWorkflowModal
          isOpen={showStartWorkflowModal}
          onClose={() => {
            setShowStartWorkflowModal(false);
            setSelectedTemplate(null);
          }}
          onSuccess={handleWorkflowStarted}
          templates={templates}
          preselectedTemplate={selectedTemplate}
        />
      )}

      <WorkflowExecutionLogViewer
        instanceId={executionLogInstanceId}
        isOpen={showExecutionLogModal}
        onClose={() => {
          setShowExecutionLogModal(false);
          setExecutionLogInstanceId(null);
        }}
      />
    </div>
  );
};

export default WorkflowManagement;
