import React, { useState, useEffect, useCallback } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

/**
 * WorkflowPipelineView - A Kanban-style pipeline view for workflow instances
 * Displays workflow instances grouped by their current stage
 * Allows quick actions and visual progress tracking
 */
const WorkflowPipelineView = ({
    instances,
    templates,
    onViewInstance,
    onRefresh,
    loading,
    selectedTemplate,
    onSelectTemplate
}) => {
    const [advancingInstance, setAdvancingInstance] = useState(null);
    const [completingInstance, setCompletingInstance] = useState(null);

    // Get stages for selected template
    const templateData = templates?.find(t => t.id === selectedTemplate);
    const stages = templateData?.stages || [];

    // Filter instances by template
    const filteredInstances = instances.filter(instance => {
        if (selectedTemplate && instance.workflow_template !== selectedTemplate && instance.workflow_template_id !== selectedTemplate) {
            return false;
        }
        return true;
    });

    // Group instances by current stage
    const instancesByStage = {};
    stages.forEach(stage => {
        instancesByStage[stage.id] = filteredInstances.filter(inst =>
            inst.current_stage === stage.id || inst.current_stage_id === stage.id
        );
    });

    // Instances without a stage (new or completed)
    const unstaged = filteredInstances.filter(inst => {
        const stageId = inst.current_stage || inst.current_stage_id;
        return !stageId || !stages.find(s => s.id === stageId);
    });

    const handleAdvanceStage = async (instance, targetStageId) => {
        try {
            setAdvancingInstance(instance.id);
            const response = await workflowAPI.advanceWorkflow(instance.id, targetStageId);
            if (response.success) {
                toast.success('Workflow advanced successfully', {
                    position: 'top-right',
                    autoClose: 2000,
                });
                if (onRefresh) onRefresh();
            } else {
                throw new Error(response.message || 'Failed to advance workflow');
            }
        } catch (error) {
            console.error('Error advancing workflow:', error);
            toast.error(handleAPIError(error) || 'Failed to advance workflow', {
                position: 'top-right',
            });
        } finally {
            setAdvancingInstance(null);
        }
    };

    const handleCompleteWorkflow = async (instance) => {
        try {
            setCompletingInstance(instance.id);
            const response = await workflowAPI.completeWorkflow(instance.id);
            if (response.success) {
                toast.success('Workflow completed successfully', {
                    position: 'top-right',
                    autoClose: 2000,
                });
                if (onRefresh) onRefresh();
            } else {
                throw new Error(response.message || 'Failed to complete workflow');
            }
        } catch (error) {
            console.error('Error completing workflow:', error);
            toast.error(handleAPIError(error) || 'Failed to complete workflow', {
                position: 'top-right',
            });
        } finally {
            setCompletingInstance(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'paused': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 75) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-blue-500';
        if (percentage >= 25) return 'bg-amber-500';
        return 'bg-gray-400';
    };

    if (loading) {
        return (
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-8">
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AD6F2]"></div>
                    <span className="ml-4 text-gray-600 font-[BasisGrotesquePro]">Loading your workflow pipeline...</span>
                </div>
            </div>
        );
    }

    if (!selectedTemplate) {
        return (
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-8">
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-[#FFF4E6] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#F56D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-2 font-[BasisGrotesquePro]">
                        Select a Workflow Template
                    </h4>
                    <p className="text-gray-500 mb-6 font-[BasisGrotesquePro] max-w-md mx-auto">
                        Choose a workflow template below to see its pipeline stages and track progress of all related workflows.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {templates?.map(template => (
                            <button
                                key={template.id}
                                onClick={() => onSelectTemplate(template.id)}
                                className="px-4 py-3 bg-white !border border-[#E8F0FF] !rounded-lg hover:shadow-md hover:border-[#3AD6F2] transition-all font-[BasisGrotesquePro] text-gray-700"
                            >
                                <div className="font-semibold">{template.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {template.stages?.length || 0} stages
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Template Selector and Filters */}
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedTemplate || ''}
                            onChange={(e) => onSelectTemplate(parseInt(e.target.value))}
                            className="px-4 py-2.5 !border border-[#E8F0FF] !rounded-lg bg-white font-[BasisGrotesquePro] text-gray-700 focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent"
                        >
                            <option value="">Select Template</option>
                            {templates?.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <div className="hidden lg:block h-8 w-px bg-[#E8F0FF]"></div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 font-[BasisGrotesquePro]">
                                {templateData?.name || 'Workflow Pipeline'}
                            </h4>
                            <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                                Track progress of workflows through each stage
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Pipeline Kanban View */}
            <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-max pb-4">
                    {stages.map((stage, index) => {
                        const stageInstances = instancesByStage[stage.id] || [];
                        const nextStage = stages[index + 1];

                        return (
                            <div
                                key={stage.id}
                                className="w-80 bg-white !rounded-lg !border border-[#E8F0FF] flex-shrink-0"
                            >
                                {/* Stage Header */}
                                <div className="p-4 border-b border-[#E8F0FF] bg-gradient-to-r from-[#FFF4E6] to-white rounded-t-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#FFF4E6] text-[#F56D2D] flex items-center justify-center font-bold text-sm border border-[#F56D2D]">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-gray-800 font-[BasisGrotesquePro]">
                                                    {stage.name}
                                                </h5>
                                                <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                                                    {stageInstances.length} workflow{stageInstances.length !== 1 ? 's' : ''} here
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${stage.user_type_group === 'taxpayer' ? 'bg-orange-100 text-orange-700' :
                                            stage.user_type_group === 'preparer' ? 'bg-green-100 text-green-700' :
                                                stage.user_type_group === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {stage.user_type_group || 'all users'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                                    {stageInstances.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 font-[BasisGrotesquePro]">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm">No workflows in this stage</p>
                                        </div>
                                    ) : (
                                        stageInstances.map(instance => {
                                            const progress = Math.round(instance.progress_percentage || 0);
                                            const nextStage = stages[index + 1];
                                            const isAdvancing = advancingInstance === instance.id;
                                            const isCompleting = completingInstance === instance.id;

                                            return (
                                                <div
                                                    key={instance.id}
                                                    className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 hover:shadow-lg hover:border-[#3AD6F2] transition-all cursor-pointer"
                                                    onClick={() => onViewInstance(instance)}
                                                >
                                                    {/* Client Info */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-800 font-[BasisGrotesquePro] text-sm">
                                                                {instance.tax_case_name || instance.tax_case_details?.name || 'Unknown Client'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                                                                {instance.tax_case_email || instance.tax_case_details?.email || ''}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(instance.status)}`}>
                                                            {instance.status || 'active'}
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-3">
                                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                            <span className="font-[BasisGrotesquePro]">Progress</span>
                                                            <span className="font-semibold font-[BasisGrotesquePro]">{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full transition-all ${getProgressColor(progress)}`}
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Assigned Preparer */}
                                                    {(instance.assigned_preparer_name || instance.assigned_preparer_details) && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-semibold">
                                                                {(instance.assigned_preparer_name || instance.assigned_preparer_details?.name || 'U')[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                                                                {instance.assigned_preparer_name || instance.assigned_preparer_details?.name || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Quick Actions */}
                                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewInstance(instance);
                                                            }}
                                                            className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-[BasisGrotesquePro] transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                        {nextStage && instance.status === 'active' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAdvanceStage(instance, nextStage.id);
                                                                }}
                                                                disabled={isAdvancing}
                                                                className="flex-1 text-xs py-1.5 px-2 bg-[#F56D2D] hover:bg-[#E55A1D] text-white rounded font-[BasisGrotesquePro] transition-colors disabled:opacity-50"
                                                                title="Move to the next stage"
                                                            >
                                                                {isAdvancing ? '...' : '→ Next Stage'}
                                                            </button>
                                                        )}
                                                        {!nextStage && instance.status === 'active' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCompleteWorkflow(instance);
                                                                }}
                                                                disabled={isCompleting}
                                                                className="flex-1 text-xs py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-[BasisGrotesquePro] transition-colors disabled:opacity-50"
                                                                title="Complete the workflow"
                                                            >
                                                                {isCompleting ? '...' : '✓ Complete'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Completed Column */}
                    <div className="w-80 bg-gradient-to-b from-emerald-50 to-white rounded-xl border border-emerald-100 flex-shrink-0">
                        <div className="p-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-white rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    ✓
                                </div>
                                <div>
                                    <h5 className="font-semibold text-emerald-800 font-[BasisGrotesquePro]">Completed</h5>
                                    <p className="text-xs text-emerald-600 font-[BasisGrotesquePro]">
                                        {filteredInstances.filter(i => i.status === 'completed').length} workflows
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                            {filteredInstances.filter(i => i.status === 'completed').map(instance => (
                                <div
                                    key={instance.id}
                                    className="bg-white rounded-lg border border-emerald-200 p-4 hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => onViewInstance(instance)}
                                >
                                    <p className="font-semibold text-gray-800 font-[BasisGrotesquePro] text-sm">
                                        {instance.tax_case_name || 'Unknown Client'}
                                    </p>
                                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                                        Completed {instance.completed_at ? new Date(instance.completed_at).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Active Workflows</p>
                    <p className="text-2xl font-bold text-[#3AD6F2] font-[BasisGrotesquePro]">
                        {filteredInstances.filter(i => i.status === 'active').length}
                    </p>
                </div>
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">On Hold</p>
                    <p className="text-2xl font-bold text-amber-600 font-[BasisGrotesquePro]">
                        {filteredInstances.filter(i => i.status === 'paused').length}
                    </p>
                </div>
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Completed</p>
                    <p className="text-2xl font-bold text-green-600 font-[BasisGrotesquePro]">
                        {filteredInstances.filter(i => i.status === 'completed').length}
                    </p>
                </div>
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Average Progress</p>
                    <p className="text-2xl font-bold text-[#F56D2D] font-[BasisGrotesquePro]">
                        {filteredInstances.length > 0
                            ? Math.round(filteredInstances.reduce((acc, i) => acc + (i.progress_percentage || 0), 0) / filteredInstances.length)
                            : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkflowPipelineView;
