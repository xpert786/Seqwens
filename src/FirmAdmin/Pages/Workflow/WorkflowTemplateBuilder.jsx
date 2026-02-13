import React, { useState, useEffect } from 'react';
import {
  Upload, Eye, HelpCircle, FileText, CheckCircle, Search, ThumbsUp, Send, Mail,
  User, Briefcase, ShieldCheck, List
} from 'lucide-react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { USER_TYPE_GROUPS, TAX_FORM_TYPES } from './workflowConstants';

/**
 * WorkflowTemplateBuilder - Simplified workflow creation
 * 
 * A workflow is simply a series of steps (stages) that a client goes through.
 * Each stage has:
 * - A name (e.g., "Upload Documents")
 * - Who does it (Client, Tax Preparer, or Admin)
 * - How long it typically takes
 * 
 * That's it. Keep it simple.
 */
const WorkflowTemplateBuilder = ({ template, onSave, onCancel }) => {
  // Basic workflow info
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [taxFormType, setTaxFormType] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('manual');
  const [isActive, setIsActive] = useState(true);

  const TRIGGER_OPTIONS = [
    { value: 'manual', label: 'Manual Start (Default)' },
    { value: 'client_created', label: 'Start when New Client is Created' },
    { value: 'client_invite_accepted', label: 'Start when Client Accepts Invite' },
    { value: 'intake_completed', label: 'Start when Intake Form is Completed' }
  ];

  // Stages
  const [stages, setStages] = useState([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [formTypes, setFormTypes] = useState([]);
  const [loadingFormTypes, setLoadingFormTypes] = useState(false);

  // Common stage templates with simple, standardized icons
  const COMMON_STAGES = [
    { name: 'Client Uploads Documents', who: 'taxpayer', days: 7, icon: <Upload size={20} />, desc: 'Client uploads W-2s, 1099s, receipts, and other tax documents' },
    { name: 'Review Documents', who: 'preparer', days: 2, icon: <Eye size={20} />, desc: 'Tax preparer checks if all required documents are present' },
    { name: 'Request Missing Info', who: 'preparer', days: 3, icon: <HelpCircle size={20} />, desc: 'Ask client for any missing documents or information' },
    { name: 'Prepare Tax Return', who: 'preparer', days: 5, icon: <FileText size={20} />, desc: 'Tax preparer completes the tax return' },
    { name: 'Internal Review', who: 'admin', days: 2, icon: <CheckCircle size={20} />, desc: 'Senior reviewer checks the return for accuracy' },
    { name: 'Client Reviews Return', who: 'taxpayer', days: 3, icon: <Search size={20} />, desc: 'Client reviews the completed return and asks questions' },
    { name: 'Client Approves', who: 'taxpayer', days: 1, icon: <ThumbsUp size={20} />, desc: 'Client gives final approval to file' },
    { name: 'E-File Return', who: 'preparer', days: 1, icon: <Send size={20} />, desc: 'Submit the return to the IRS electronically' },
    { name: 'Send Confirmation', who: 'preparer', days: 1, icon: <Mail size={20} />, desc: 'Send filing confirmation and copies to client' },
  ];

  // Load existing template data
  useEffect(() => {
    if (template) {
      setWorkflowName(template.name || '');
      setDescription(template.description || '');
      setTaxFormType(template.tax_form_type || '');
      setIsActive(template.is_active !== undefined ? template.is_active : true);
      setTriggerEvent(template.trigger_event || 'manual');
      setStages(template.stages || []);
    }
  }, [template]);

  // Load form types
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
      } finally {
        setLoadingFormTypes(false);
      }
    };
    fetchFormTypes();
  }, []);

  // Add a stage from template
  const addStageFromTemplate = (stageTemplate) => {
    const newStage = {
      id: `temp-${Date.now()}`,
      name: stageTemplate.name,
      description: stageTemplate.desc,
      user_type_group: stageTemplate.who,
      estimated_duration_days: stageTemplate.days,
      stage_order: stages.length,
      actions: [],
      triggers: [],
      reminders: []
    };
    setStages([...stages, newStage]);
  };

  // Add a blank custom stage
  const addBlankStage = () => {
    const newStage = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      user_type_group: 'taxpayer',
      estimated_duration_days: 3,
      stage_order: stages.length,
      actions: [],
      triggers: [],
      reminders: []
    };
    setStages([...stages, newStage]);
  };

  // Update a stage
  const updateStage = (stageId, field, value) => {
    setStages(stages.map(stage =>
      stage.id === stageId ? { ...stage, [field]: value } : stage
    ));
  };

  // Delete a stage
  const deleteStage = (stageId) => {
    const filtered = stages.filter(s => s.id !== stageId);
    // Reorder
    setStages(filtered.map((s, idx) => ({ ...s, stage_order: idx })));
  };

  // Move stage up/down
  const moveStage = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

    // Update order
    setStages(newStages.map((s, idx) => ({ ...s, stage_order: idx })));
  };

  // Save workflow
  const handleSave = async () => {
    // Validation
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    if (stages.length === 0) {
      toast.error('Please add at least one stage');
      return;
    }

    // Check all stages have names
    const emptyStage = stages.find(s => !s.name.trim());
    if (emptyStage) {
      toast.error('All stages must have a name');
      return;
    }

    try {
      setSaving(true);

      const templateData = {
        name: workflowName,
        description: description,
        tax_form_type: taxFormType,
        is_active: isActive,
        trigger_event: triggerEvent,
        stages: stages.map((stage, index) => ({
          ...stage,
          stage_order: index,
          id: String(stage.id).startsWith('temp-') ? undefined : stage.id
        }))
      };

      let response;
      if (template?.id) {
        response = await workflowAPI.updateTemplate(template.id, templateData);
      } else {
        response = await workflowAPI.createTemplate(templateData);
      }

      if (response.success) {
        toast.success(template?.id ? 'Workflow updated!' : 'Workflow created!');
        onSave && onSave(response.data);
      } else {
        throw new Error(response.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = handleAPIError(error) || error.message || 'Failed to save workflow';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
      case 'taxpayer': return { label: 'Client', color: 'bg-blue-50 text-blue-700', icon: <User size={14} /> };
      case 'preparer': return { label: 'Tax Preparer', color: 'bg-green-50 text-green-700', icon: <Briefcase size={14} /> };
      case 'admin': return { label: 'Admin', color: 'bg-purple-50 text-purple-700', icon: <ShieldCheck size={14} /> };
      default: return { label: 'All', color: 'bg-gray-100 text-gray-700', icon: <User size={14} /> };
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F7FF] p-4 lg:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-5 mb-6">
          {/* Back Button */}
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 font-[BasisGrotesquePro]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                {template?.id ? 'Edit Workflow' : 'Create New Workflow'}
              </h4>
              <p className="text-sm text-gray-500 mt-1 font-[BasisGrotesquePro]">
                Build a step-by-step process for your tax preparation services
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] disabled:opacity-50 font-[BasisGrotesquePro] flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Workflow
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Workflow Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Individual Tax Return (Form 1040)"
                className="w-full px-4 py-2.5 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent font-[BasisGrotesquePro]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Tax Form Type (optional)
              </label>
              <select
                value={taxFormType}
                onChange={(e) => setTaxFormType(e.target.value)}
                className="w-full px-4 py-2.5 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent font-[BasisGrotesquePro] bg-white"
                disabled={loadingFormTypes}
              >
                <option value="">Select a form type</option>
                {formTypes.length > 0 ? (
                  formTypes.map((ft) => (
                    <option key={ft.value || ft.id} value={ft.value || ft.id}>
                      {ft.label || ft.name}
                    </option>
                  ))
                ) : (
                  TAX_FORM_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow is for and when to use it..."
                rows={3}
                className="w-full px-4 py-2.5 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent font-[BasisGrotesquePro] resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#F56D2D] focus:ring-[#F56D2D]"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                Active (can be assigned to clients)
              </label>
            </div>

            <div className="pt-2 border-t border-[#E8F0FF]">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Automation Trigger
              </label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full px-4 py-2.5 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent font-[BasisGrotesquePro] bg-white"
              >
                {TRIGGER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                When selected event occurs, this workflow will start automatically for the client.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Stages */}
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
            Quick Add Stages
          </h3>
          <p className="text-sm text-gray-500 mb-4 font-[BasisGrotesquePro]">
            Click any stage below to add it to your workflow
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COMMON_STAGES.map((stage, idx) => {
              const isAdded = stages.some(s => s.name === stage.name);
              const userInfo = getUserTypeLabel(stage.who);

              return (
                <button
                  key={idx}
                  onClick={() => !isAdded && addStageFromTemplate(stage)}
                  disabled={isAdded}
                  className={`p-3 text-left !rounded-lg !border transition-all ${isAdded
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-[#E8F0FF] hover:border-[#3AD6F2] hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 flex-shrink-0">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 font-[BasisGrotesquePro] truncate">
                        {stage.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-7">
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${userInfo.color}`}>
                      {userInfo.icon} {userInfo.label}
                    </span>
                    <span className="text-xs text-gray-500">{stage.days}d</span>
                  </div>
                  {isAdded && (
                    <div className="text-xs text-green-600 font-medium">✓ Added</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[#E8F0FF]">
            <button
              onClick={addBlankStage}
              className="w-full py-3 !border-2 border-dashed border-[#E8F0FF] !rounded-lg text-[#3AD6F2] font-[BasisGrotesquePro] font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Custom Stage
            </button>
          </div>

        </div>

        {/* Current Stages */}
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
            Your Workflow ({stages.length} stages)
          </h3>
          <p className="text-sm text-gray-500 mb-4 font-[BasisGrotesquePro]">
            {stages.length === 0
              ? 'Add stages from the templates above to build your workflow'
              : 'Clients will progress through these stages in order'
            }
          </p>

          {stages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#E8F0FF] !rounded-lg bg-gray-50/50">
              <div className="flex justify-center mb-3 text-gray-400">
                <List size={48} strokeWidth={1} />
              </div>
              <p className="text-gray-500 font-[BasisGrotesquePro]">
                No stages yet. Add some from above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const userInfo = getUserTypeLabel(stage.user_type_group);

                return (
                  <div
                    key={stage.id}
                    className="!border border-[#E8F0FF] !rounded-lg p-4 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      {/* Order controls */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button
                          onClick={() => moveStage(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <div className="w-7 h-7 flex items-center justify-center bg-[#F56D2D] text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => moveStage(index, 'down')}
                          disabled={index === stages.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Stage details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <input
                            type="text"
                            value={stage.name}
                            onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                            placeholder="Stage name"
                            className="w-full text-base font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-[#E8F0FF] focus:border-[#3AD6F2] focus:outline-none px-2 py-1 font-[BasisGrotesquePro]"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">
                              Who does this?
                            </label>
                            <select
                              value={stage.user_type_group}
                              onChange={(e) => updateStage(stage.id, 'user_type_group', e.target.value)}
                              className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] bg-white"
                            >
                              {USER_TYPE_GROUPS.map((group) => (
                                <option key={group.value} value={group.value}>
                                  {group.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1 font-[BasisGrotesquePro]">
                              Estimated time
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={stage.estimated_duration_days}
                                onChange={(e) => updateStage(stage.id, 'estimated_duration_days', parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-20 px-3 py-2 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                              />
                              <span className="text-sm text-gray-500 font-[BasisGrotesquePro]">days</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <textarea
                            value={stage.description}
                            onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                            placeholder="What happens in this stage? (optional)"
                            rows={2}
                            className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] !rounded-lg focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] resize-none"
                          />
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => deleteStage(stage.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 !rounded-lg"
                        title="Delete stage"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplateBuilder;
