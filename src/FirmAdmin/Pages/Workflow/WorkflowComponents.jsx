import React, { useState, useEffect } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

/**
 * WorkflowStatisticsCards - Dashboard statistics with consistent color scheme
 * Shows key metrics that help users understand workflow performance at a glance
 */
const WorkflowStatisticsCards = ({ statistics, loading, onStatClick }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white !rounded-lg !border border-[#E8F0FF] pt-6 px-4 pb-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                ))}
            </div>
        );
    }

    const stats = [
        {
            key: 'total_templates',
            label: 'Workflow Templates',
            description: 'Reusable workflow blueprints you have created',
            value: statistics?.total_templates || 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            key: 'active_workflows',
            label: 'Active Workflows',
            description: 'Workflows currently in progress',
            value: statistics?.active_workflows || statistics?.active_instances || 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            key: 'completed_workflows',
            label: 'Completed',
            description: 'Successfully finished workflows',
            value: statistics?.completed_workflows || statistics?.completed_instances || 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            key: 'completion_rate',
            label: 'Success Rate',
            description: 'Percentage of workflows completed successfully',
            value: statistics?.completion_rate ? `${Math.round(statistics.completion_rate)}%` : '0%',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8V16M12 11V16M8 14V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
                <div
                    key={stat.key}
                    onClick={() => onStatClick && onStatClick(stat.key)}
                    className="bg-white !rounded-lg !border border-[#E8F0FF] pt-6 px-4 pb-4 hover:shadow-md transition-all cursor-pointer"
                    title={stat.description}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <div className="text-[#3AD6F2] mb-2">{stat.icon}</div>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-4">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] leading-none">
                            {stat.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * WorkflowQuickActions - Quick action buttons (keeping for backwards compatibility)
 */
const WorkflowQuickActions = ({ onCreateTemplate, onStartWorkflow, onViewAllInstances }) => {
    return null; // Actions are now in the header
};

/**
 * WorkflowExecutionLogViewer - Shows execution logs for a workflow instance
 * Helps users track what happened during workflow execution
 */
const WorkflowExecutionLogViewer = ({ instanceId, isOpen, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && instanceId) {
            fetchLogs();
        }
    }, [isOpen, instanceId]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await workflowAPI.getInstanceDescriptionLogs(instanceId);
            if (response.success && response.data) {
                setLogs(response.data.execution_logs || []);
            }
        } catch (error) {
            console.error('Error fetching execution logs:', error);
            toast.error('Failed to fetch execution logs');
        } finally {
            setLoading(false);
        }
    };

    const getLogIcon = (logType) => {
        switch (logType?.toLowerCase()) {
            case 'stage_started': return '🏁';
            case 'stage_completed': return '✅';
            case 'action_executed': return '⚡';
            case 'email_sent': return '📧';
            case 'task_created': return '📋';
            case 'document_requested': return '📄';
            case 'error': return '❌';
            default: return '📝';
        }
    };

    const getLogColor = (logType) => {
        switch (logType?.toLowerCase()) {
            case 'stage_completed': return 'border-l-green-500 bg-green-50';
            case 'action_executed': return 'border-l-[#3AD6F2] bg-cyan-50';
            case 'error': return 'border-l-red-500 bg-red-50';
            case 'stage_started': return 'border-l-[#F56D2D] bg-orange-50';
            default: return 'border-l-gray-300 bg-gray-50';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-6">
            <div className="bg-white !rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#E8F0FF] flex-shrink-0">
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                            Workflow Execution Log
                        </h4>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-0.5">
                            View the history of actions taken in this workflow
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                            <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
                            <span className="ml-3 text-gray-600 font-[BasisGrotesquePro]">Loading logs...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">📜</div>
                            <p className="text-gray-500 font-[BasisGrotesquePro]">No execution logs yet</p>
                            <p className="text-sm text-gray-400 font-[BasisGrotesquePro] mt-1">
                                Logs will appear here as the workflow progresses
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log, index) => (
                                <div
                                    key={log.id || index}
                                    className={`border-l-4 rounded-r-lg p-3 ${getLogColor(log.log_type)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">{getLogIcon(log.log_type)}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-800 font-[BasisGrotesquePro] text-sm">
                                                    {log.log_type_display || log.log_type || 'Log Entry'}
                                                </p>
                                                <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
                                                {log.message || log.description || 'No details'}
                                            </p>
                                            {log.details && (
                                                <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded text-gray-600 overflow-x-auto">
                                                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-[#E8F0FF] flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white !border border-[#E8F0FF] !rounded-lg text-gray-700 hover:bg-gray-50 font-[BasisGrotesquePro] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * WorkflowTemplateCard - Enhanced template card with consistent styling
 * Displays template information in a clear, actionable format
 */
const WorkflowTemplateCard = ({ template, onEdit, onDelete, onClone, onStartWorkflow }) => {
    const [showMenu, setShowMenu] = useState(false);

    const stageCount = template.stages?.length || template.stage_count || 0;
    const instanceCount = template.active_instances || template.instances_count || 0;

    return (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] overflow-hidden hover:shadow-lg transition-all group">
            {/* Header */}
            <div className="relative p-4 border-b border-[#E8F0FF] bg-gradient-to-r from-[#FFF4E6] to-white">
                <div className="absolute top-3 right-3">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors !border border-[#E8F0FF]"
                            title="More options"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white !rounded-lg shadow-xl !border border-[#E8F0FF] py-1 z-10">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onEdit(template);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Template
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onClone(template);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate
                                </button>
                                <div className="border-t border-[#E8F0FF] my-1"></div>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onDelete(template);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-[BasisGrotesquePro] flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Template icon */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center !border border-[#E8F0FF]">
                        <svg className="w-6 h-6 text-[#F56D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-800 font-[BasisGrotesquePro]">
                            {template.name}
                        </h5>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${template.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] line-clamp-2 mb-4">
                    {template.description || 'No description provided. Edit this template to add details.'}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500" title="Number of stages in this workflow">
                        <svg className="w-4 h-4 text-[#3AD6F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span className="font-[BasisGrotesquePro]">{stageCount} stages</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500" title="Active workflows using this template">
                        <svg className="w-4 h-4 text-[#F56D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-[BasisGrotesquePro]">{instanceCount} running</span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => onStartWorkflow(template)}
                    className="w-full py-2.5 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-all font-[BasisGrotesquePro] text-sm font-medium flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Workflow
                </button>
            </div>
        </div>
    );
};

export {
    WorkflowStatisticsCards,
    WorkflowQuickActions,
    WorkflowExecutionLogViewer,
    WorkflowTemplateCard
};
