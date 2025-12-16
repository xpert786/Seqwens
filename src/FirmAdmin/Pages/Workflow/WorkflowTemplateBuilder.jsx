import React, { useState, useEffect } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import StageActionModal from './StageActionModal';
import TriggerConfigurationModal from './TriggerConfigurationModal';
import ReminderConfigurationModal from './ReminderConfigurationModal';

const WorkflowTemplateBuilder = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tax_form_type: '',
    is_active: true
  });
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [expandedStages, setExpandedStages] = useState(new Set());
  const [formTypes, setFormTypes] = useState([]);
  const [loadingFormTypes, setLoadingFormTypes] = useState(false);

  // Fetch form types on component mount
  useEffect(() => {
    const fetchFormTypes = async () => {
      try {
        setLoadingFormTypes(true);
        const response = await workflowAPI.getFormTypes();
        if (response.success && response.data) {
          setFormTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching form types:', error);
        toast.error('Failed to load tax form types');
      } finally {
        setLoadingFormTypes(false);
      }
    };

    fetchFormTypes();
  }, []);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        tax_form_type: template.tax_form_type || '',
        is_active: template.is_active !== undefined ? template.is_active : true
      });
      setStages(template.stages || []);
      // Expand all stages by default
      if (template.stages) {
        setExpandedStages(new Set(template.stages.map(s => s.id)));
      }
    }
  }, [template]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStage = () => {
    const newStage = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      stage_order: stages.length,
      user_type_group: 'taxpayer',
      estimated_duration_days: 7,
      actions: [],
      triggers: [],
      reminders: []
    };
    setStages([...stages, newStage]);
    setExpandedStages(prev => new Set([...prev, newStage.id]));
  };

  const handleUpdateStage = (stageId, updates) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  };

  const handleDeleteStage = (stageId) => {
    setStages(stages.filter(stage => stage.id !== stageId));
    // Reorder remaining stages
    setStages(prev => prev.map((stage, index) => ({
      ...stage,
      stage_order: index
    })));
  };

  const toggleStageExpanded = (stageId) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  // Helper function to parse workflow validation errors
  const parseWorkflowErrors = (error) => {
    const errorMessages = [];
    
    // Check if error has a response with errors object
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      
      // Handle stages errors
      if (errors.stages && Array.isArray(errors.stages)) {
        errors.stages.forEach((stageError, index) => {
          if (typeof stageError === 'object' && stageError !== null) {
            Object.entries(stageError).forEach(([field, messages]) => {
              const fieldMessages = Array.isArray(messages) ? messages : [messages];
              const stageName = stages[index]?.name || `Stage ${index + 1}`;
              fieldMessages.forEach(msg => {
                errorMessages.push(`${stageName}: ${field} - ${msg}`);
              });
            });
          }
        });
      }
      
      // Handle other field errors
      Object.entries(errors).forEach(([field, messages]) => {
        if (field !== 'stages') {
          const fieldMessages = Array.isArray(messages) ? messages : [messages];
          fieldMessages.forEach(msg => {
            errorMessages.push(`${field}: ${msg}`);
          });
        }
      });
    }
    
    // Check if error has errors property directly (from API response)
    if (error.errors) {
      const errors = error.errors;
      
      if (errors.stages && Array.isArray(errors.stages)) {
        errors.stages.forEach((stageError, index) => {
          if (typeof stageError === 'object' && stageError !== null) {
            Object.entries(stageError).forEach(([field, messages]) => {
              const fieldMessages = Array.isArray(messages) ? messages : [messages];
              const stageName = stages[index]?.name || `Stage ${index + 1}`;
              fieldMessages.forEach(msg => {
                errorMessages.push(`${stageName}: ${field} - ${msg}`);
              });
            });
          }
        });
      }
      
      Object.entries(errors).forEach(([field, messages]) => {
        if (field !== 'stages') {
          const fieldMessages = Array.isArray(messages) ? messages : [messages];
          fieldMessages.forEach(msg => {
            errorMessages.push(`${field}: ${msg}`);
          });
        }
      });
    }
    
    return errorMessages.length > 0 ? errorMessages.join('. ') : null;
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Workflow name is required');
      return;
    }

    if (stages.length === 0) {
      toast.error('At least one stage is required');
      return;
    }

    // Validate stages before sending
    const invalidStages = [];
    stages.forEach((stage, index) => {
      if (!stage.name || !stage.name.trim()) {
        const stageName = stage.name || `Stage ${index + 1}`;
        invalidStages.push(`${stageName}: name is required`);
      }
    });

    if (invalidStages.length > 0) {
      toast.error(invalidStages.join('. '));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        stages: stages.map((stage, index) => ({
          name: stage.name,
          description: stage.description,
          stage_order: index,
          user_type_group: stage.user_type_group,
          estimated_duration_days: stage.estimated_duration_days,
          actions: stage.actions || [],
          triggers: stage.triggers || [],
          reminders: stage.reminders || []
        }))
      };

      let response;
      if (template?.id) {
        response = await workflowAPI.updateTemplate(template.id, payload);
      } else {
        response = await workflowAPI.createTemplate(payload);
      }

      if (response.success) {
        toast.success(template?.id ? 'Workflow template updated successfully' : 'Workflow template created successfully');
        onSave();
      } else {
        // Check if response has errors object
        if (response.errors) {
          const parsedErrors = parseWorkflowErrors({ errors: response.errors });
          if (parsedErrors) {
            throw new Error(parsedErrors);
          }
        }
        throw new Error(response.message || 'Failed to save workflow template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      // Try to parse workflow-specific errors first
      const workflowErrors = parseWorkflowErrors(error);
      if (workflowErrors) {
        toast.error(workflowErrors, {
          autoClose: 5000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        // Fall back to generic error handling
        const errorMessage = error.response?.data?.message || error.message || handleAPIError(error) || 'Failed to save workflow template';
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'preparer':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'taxpayer':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F7FF] p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                {template?.id ? 'Edit Workflow Template' : 'Create Workflow Template'}
              </h3>
              <p className="text-sm text-gray-600 mt-1 font-[BasisGrotesquePro]">
                {template?.id ? 'Update your workflow template' : 'Build an automated workflow for your firm'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50"
                style={{ borderRadius: '8px' }}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">
                Workflow Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Individual Tax Return 1040"
                className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">
                Tax Form Type
              </label>
              <select
                value={formData.tax_form_type}
                onChange={(e) => handleInputChange('tax_form_type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] bg-white"
                disabled={loadingFormTypes}
              >
                <option value="">Select Tax Form Type</option>
                {formTypes.map((formType) => (
                  <option key={formType.value} value={formType.value}>
                    {formType.label}
                  </option>
                ))}
              </select>
              {loadingFormTypes && (
                <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">Loading form types...</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] resize-none"
            />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-[#E8F0FF]"
              />
              <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">Active</span>
            </label>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className="bg-white rounded-lg border border-[#E8F0FF] p-4"
            >
              {/* Stage Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 cursor-move" title="Drag to reorder">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                      placeholder={`Stage ${index + 1} Name`}
                      className="text-lg font-semibold text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] rounded px-2 py-1 font-[BasisGrotesquePro] w-full"
                    />
                    <textarea
                      value={stage.description}
                      onChange={(e) => handleUpdateStage(stage.id, { description: e.target.value })}
                      placeholder="Stage description..."
                      rows={1}
                      className="text-sm text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] rounded px-2 py-1 font-[BasisGrotesquePro] w-full resize-none"
                    />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUserTypeColor(stage.user_type_group)}`}>
                    {stage.user_type_group || 'taxpayer'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStageExpanded(stage.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    style={{ borderRadius: '8px' }}
                  >
                    <svg className={`w-5 h-5 transition-transform ${expandedStages.has(stage.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteStage(stage.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    style={{ borderRadius: '8px' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stage Configuration */}
              {expandedStages.has(stage.id) && (
                <div className="space-y-4 pl-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
                        User Type
                      </label>
                      <select
                        value={stage.user_type_group}
                        onChange={(e) => handleUpdateStage(stage.id, { user_type_group: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                      >
                        <option value="taxpayer">Taxpayer</option>
                        <option value="preparer">Preparer</option>
                        <option value="admin">Admin</option>
                        <option value="all">All Users</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
                        Estimated Duration (days)
                      </label>
                      <input
                        type="number"
                        value={stage.estimated_duration_days}
                        onChange={(e) => handleUpdateStage(stage.id, { estimated_duration_days: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                      />
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="border border-[#E8F0FF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-900 font-[BasisGrotesquePro]">Actions</h5>
                      <button
                        onClick={() => {
                          setSelectedStage(stage);
                          setShowActionModal(true);
                        }}
                        className="px-3 py-1 text-xs font-medium text-[#3AD6F2] bg-[#E8F0FF] rounded-lg hover:bg-[#D1E7FF] transition-colors font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        + Add Action
                      </button>
                    </div>
                    {stage.actions && stage.actions.length > 0 ? (
                      <div className="space-y-2">
                        {stage.actions.map((action, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {action.action_type === 'email' && '📧'}
                                {action.action_type === 'sms' && '📱'}
                                {action.action_type === 'task' && '✅'}
                                {action.action_type === 'document' && '📄'}
                                {action.action_type === 'esign' && '✍️'}
                              </span>
                              <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {action.action_type_display || action.action_type} - {action.configuration?.title || action.configuration?.subject || 'Action'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updatedActions = stage.actions.filter((_, i) => i !== idx);
                                handleUpdateStage(stage.id, { actions: updatedActions });
                              }}
                              className="text-red-400 hover:text-red-600"
                              style={{ borderRadius: '8px' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">No actions configured</p>
                    )}
                  </div>

                  {/* Triggers Section */}
                  <div className="border border-[#E8F0FF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-900 font-[BasisGrotesquePro]">Triggers</h5>
                      <button
                        onClick={() => {
                          setSelectedStage(stage);
                          setShowTriggerModal(true);
                        }}
                        className="px-3 py-1 text-xs font-medium text-[#3AD6F2] bg-[#E8F0FF] rounded-lg hover:bg-[#D1E7FF] transition-colors font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        + Add Trigger
                      </button>
                    </div>
                    {stage.triggers && stage.triggers.length > 0 ? (
                      <div className="space-y-2">
                        {stage.triggers.map((trigger, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⏰</span>
                              <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {trigger.trigger_type_display || trigger.trigger_type}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updatedTriggers = stage.triggers.filter((_, i) => i !== idx);
                                handleUpdateStage(stage.id, { triggers: updatedTriggers });
                              }}
                              className="text-red-400 hover:text-red-600"
                              style={{ borderRadius: '8px' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">No triggers configured</p>
                    )}
                  </div>

                  {/* Reminders Section */}
                  <div className="border border-[#E8F0FF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-900 font-[BasisGrotesquePro]">Reminders</h5>
                      <button
                        onClick={() => {
                          setSelectedStage(stage);
                          setShowReminderModal(true);
                        }}
                        className="px-3 py-1 text-xs font-medium text-[#3AD6F2] bg-[#E8F0FF] rounded-lg hover:bg-[#D1E7FF] transition-colors font-[BasisGrotesquePro]"
                        style={{ borderRadius: '8px' }}
                      >
                        + Add Reminder
                      </button>
                    </div>
                    {stage.reminders && stage.reminders.length > 0 ? (
                      <div className="space-y-2">
                        {stage.reminders.map((reminder, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📧</span>
                              <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {reminder.user_type_group} - {reminder.timing_days} days {reminder.timing_type}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updatedReminders = stage.reminders.filter((_, i) => i !== idx);
                                handleUpdateStage(stage.id, { reminders: updatedReminders });
                              }}
                              className="text-red-400 hover:text-red-600"
                              style={{ borderRadius: '8px' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">No reminders configured</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Stage Button */}
          <button
            onClick={handleAddStage}
            className="w-full py-4 border-2 border-dashed border-[#E8F0FF] rounded-lg text-[#3AD6F2] hover:border-[#3AD6F2] hover:bg-[#F0FDFF] transition-colors font-[BasisGrotesquePro] flex items-center justify-center gap-2"
            style={{ borderRadius: '8px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Stage
          </button>
        </div>
      </div>

      {/* Modals */}
      {showActionModal && selectedStage && (
        <StageActionModal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedStage(null);
          }}
          onSave={(action) => {
            const updatedActions = [...(selectedStage.actions || []), action];
            handleUpdateStage(selectedStage.id, { actions: updatedActions });
            setShowActionModal(false);
            setSelectedStage(null);
          }}
        />
      )}

      {showTriggerModal && selectedStage && (
        <TriggerConfigurationModal
          isOpen={showTriggerModal}
          onClose={() => {
            setShowTriggerModal(false);
            setSelectedStage(null);
          }}
          onSave={(trigger) => {
            const updatedTriggers = [...(selectedStage.triggers || []), trigger];
            handleUpdateStage(selectedStage.id, { triggers: updatedTriggers });
            setShowTriggerModal(false);
            setSelectedStage(null);
          }}
        />
      )}

      {showReminderModal && selectedStage && (
        <ReminderConfigurationModal
          isOpen={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setSelectedStage(null);
          }}
          onSave={(reminder) => {
            const updatedReminders = [...(selectedStage.reminders || []), reminder];
            handleUpdateStage(selectedStage.id, { reminders: updatedReminders });
            setShowReminderModal(false);
            setSelectedStage(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowTemplateBuilder;

