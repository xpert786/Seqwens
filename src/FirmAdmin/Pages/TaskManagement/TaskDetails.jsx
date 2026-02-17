import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskDetailAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { FaCheck, FaRedo, FaFilePdf, FaEye, FaArrowLeft, FaClock, FaCalendarAlt, FaUser, FaPlus, FaChevronRight, FaPaperclip, FaCheckSquare, FaEdit } from 'react-icons/fa';
import EditTaskModal from './EditTaskModal';
import '../../styles/TaskDetails.css';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taskData, setTaskData] = useState(null);
    const [timeTrackingStatus, setTimeTrackingStatus] = useState(null);
    const [relatedItems, setRelatedItems] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [timeTrackingLoading, setTimeTrackingLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(null);
    const [showResetTimerConfirm, setShowResetTimerConfirm] = useState(false);
    const [reRequestComments, setReRequestComments] = useState('');
    const [showReRequestModal, setShowReRequestModal] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);

    // Fetch task details
    const fetchTaskDetails = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await taskDetailAPI.getTaskDetails(id);

            if (response.success && response.data) {
                setTaskData(response.data);
            } else {
                setError(response.message || 'Failed to fetch task details');
            }
        } catch (err) {
            console.error('Error fetching task details:', err);
            const errorMessage = handleAPIError(err);
            setError(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to fetch task details'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Fetch time tracking status
    const fetchTimeTrackingStatus = useCallback(async () => {
        if (!id) return;

        try {
            const response = await taskDetailAPI.getTimeTrackingStatus(id);
            if (response.success && response.data) {
                setTimeTrackingStatus(response.data);
            }
        } catch (err) {
            console.error('Error fetching time tracking status:', err);
        }
    }, [id]);

    // Fetch related items
    const fetchRelatedItems = useCallback(async () => {
        if (!id) return;

        try {
            const response = await taskDetailAPI.getRelatedItems(id);
            if (response.success && response.data) {
                setRelatedItems(response.data);
            }
        } catch (err) {
            console.error('Error fetching related items:', err);
        }
    }, [id]);

    // Update time display for active tracking
    useEffect(() => {
        if (timeTrackingStatus?.is_tracking_active && timeTrackingStatus?.active_tracking) {
            const interval = setInterval(() => {
                const startTime = new Date(timeTrackingStatus.active_tracking.started_at).getTime();
                const now = Date.now();
                const currentSessionSeconds = Math.floor((now - startTime) / 1000);
                const totalSeconds = (timeTrackingStatus.total_time_seconds || 0) + currentSessionSeconds;

                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                setCurrentTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }, 1000);

            return () => clearInterval(interval);
        } else {
            setCurrentTime(null);
        }
    }, [timeTrackingStatus]);

    useEffect(() => {
        if (id) {
            fetchTaskDetails();
            fetchTimeTrackingStatus();
            fetchRelatedItems();
        }
    }, [id, fetchTaskDetails, fetchTimeTrackingStatus, fetchRelatedItems]);

    // Handle status update
    const handleStatusUpdate = async (newStatus) => {
        if (!id) return;

        try {
            setUpdatingStatus(true);
            const response = await taskDetailAPI.updateTaskStatus(id, newStatus);

            if (response.success) {
                toast.success(response.message || 'Task status updated successfully');
                fetchTaskDetails(); // Refresh task data
            } else {
                throw new Error(response.message || 'Failed to update task status');
            }
        } catch (err) {
            console.error('Error updating task status:', err);
            const errorMessage = handleAPIError(err);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to update task status'));
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Handle start timer
    const handleStartTimer = async () => {
        if (!id) return;

        try {
            setTimeTrackingLoading(true);
            const response = await taskDetailAPI.startTimeTracking(id);

            if (response.success) {
                toast.success(response.message || 'Time tracking started');
                fetchTaskDetails(); // Refresh to get updated status
                fetchTimeTrackingStatus(); // Refresh time tracking status
            } else {
                throw new Error(response.message || 'Failed to start time tracking');
            }
        } catch (err) {
            console.error('Error starting time tracking:', err);
            const errorMessage = handleAPIError(err);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to start time tracking'));
        } finally {
            setTimeTrackingLoading(false);
        }
    };

    // Handle pause/stop timer
    const handlePauseTimer = async () => {
        if (!id) return;

        try {
            setTimeTrackingLoading(true);
            const response = await taskDetailAPI.pauseTimeTracking(id);

            if (response.success) {
                toast.success(response.message || 'Time tracking stopped');
                fetchTaskDetails(); // Refresh task data
                fetchTimeTrackingStatus(); // Refresh time tracking status
            } else {
                throw new Error(response.message || 'Failed to stop time tracking');
            }
        } catch (err) {
            console.error('Error stopping time tracking:', err);
            const errorMessage = handleAPIError(err);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to stop time tracking'));
        } finally {
            setTimeTrackingLoading(false);
        }
    };

    // Handle reset timer
    const handleResetTimer = async () => {
        if (!id) return;
        setShowResetTimerConfirm(true);
    };

    const confirmResetTimer = async () => {
        if (!id) return;

        try {
            setTimeTrackingLoading(true);
            const response = await taskDetailAPI.resetTimeTracking(id);

            if (response.success) {
                toast.success(response.message || 'Time tracking reset successfully');
                fetchTaskDetails(); // Refresh task data
                fetchTimeTrackingStatus(); // Refresh time tracking status
                setShowResetTimerConfirm(false);
            } else {
                throw new Error(response.message || 'Failed to reset time tracking');
            }
        } catch (err) {
            console.error('Error resetting timer:', err);
            toast.error(handleAPIError(err));
        } finally {
            setTimeTrackingLoading(false);
        }
    };

    // Handle approve task
    const handleApproveTask = async () => {
        if (!id) return;

        try {
            setProcessingAction(true);
            const response = await taskDetailAPI.updateTaskStatus(id, 'completed');

            if (response.success) {
                toast.success(response.message || 'Task approved successfully!');
                setShowApproveModal(false);
                fetchTaskDetails(); // Refresh data
            } else {
                throw new Error(response.message || 'Failed to approve task');
            }
        } catch (error) {
            console.error('Error approving task:', error);
            toast.error(handleAPIError(error));
        } finally {
            setProcessingAction(false);
        }
    };

    // Handle re-request document
    const handleReRequestDocument = async () => {
        if (!id) return;

        if (!reRequestComments.trim()) {
            toast.error('Please provide comments for the re-request');
            return;
        }

        try {
            setProcessingAction(true);

            // Step 1: Update task status to pending
            const statusResponse = await taskDetailAPI.updateTaskStatus(id, 'pending');

            if (!statusResponse.success) {
                throw new Error(statusResponse.message || 'Failed to update task status');
            }

            // Step 2: Add comment with re-request reason
            try {
                await taskDetailAPI.addTaskComment(id, {
                    content: `Document Re-request: ${reRequestComments}`,
                    mentioned_user_ids: []
                });
            } catch (commentError) {
                console.warn('Status updated but comment failed:', commentError);
                toast.warning('Task status updated but comment may not have been added');
            }

            toast.success('Document re-requested successfully!');
            setShowReRequestModal(false);
            setReRequestComments('');
            fetchTaskDetails(); // Refresh data
        } catch (error) {
            console.error('Error re-requesting document:', error);
            toast.error(handleAPIError(error));
        } finally {
            setProcessingAction(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7FF] p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Loading task details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F6F7FF] p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="text-red-800 font-[BasisGrotesquePro] mb-2">Error</h5>
                    <p className="text-red-600 font-[BasisGrotesquePro]">{error}</p>
                    <button
                        onClick={fetchTaskDetails}
                        className="mt-4 px-4 py-2 bg-red-600 text-white !rounded-[10px] hover:bg-red-700 font-[BasisGrotesquePro]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!taskData) {
        return (
            <div className="min-h-screen bg-[#F6F7FF] p-6">
                <div className="text-center">
                    <p className="font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>No task data available</p>
                </div>
            </div>
        );
    }

    // Transform API data to component format
    const transformedTaskData = {
        id: taskData.id,
        task: taskData.title || '',
        description: taskData.description || '',
        category: taskData.category || taskData.task_type_display || '',
        tags: taskData.tags || [],
        assignedTo: taskData.assigned_to ? {
            id: taskData.assigned_to.id,
            initials: taskData.assigned_to.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '',
            name: taskData.assigned_to.name || ''
        } : { id: null, initials: '', name: '' },
        client: taskData.client?.name || '',
        client_ids: taskData.clients ? taskData.clients.map(c => c.id) : (taskData.client?.id ? [taskData.client.id] : []),
        priority: taskData.priority_display || taskData.priority || 'Medium',
        status: taskData.status_display || taskData.status || 'pending',
        progress: taskData.progress?.percentage || 0,
        dueDate: taskData.due_date_formatted || taskData.due_date || '',
        dueDateRaw: taskData.due_date || '',
        hours: taskData.time_spent?.formatted || taskData.time_tracking?.total_hours_formatted || '0h / 0h',
        timeSpent: taskData.time_spent?.formatted || taskData.time_tracking?.total_hours_formatted || '0h / 0h',
        created: taskData.created_at || '',
        assignedBy: taskData.created_by?.name || '',
        taskType: taskData.task_type || '',
        taskTypeDisplay: taskData.task_type_display || taskData.task_type || '',
        folder: taskData.folder?.title || '',
        folder_id: taskData.folder?.id || null,
        estimatedHours: taskData.estimated_hours || taskData.time_tracking?.estimated_hours || null,
        files: taskData.files || [],
        filesCount: taskData.files_count || (taskData.files ? taskData.files.length : 0),
        checklistItemsCount: taskData.checklist_items_count || 0,
        commentsCount: taskData.comments_count || 0,
        spouse_sign: taskData.spouse_sign || false,
        clients: taskData.clients || []
    };

    // Transform related items
    const transformedRelatedItems = relatedItems ? [
        ...(relatedItems.documents || []).map(doc => ({ name: doc.title, icon: doc.icon || 'document', url: doc.url })),
        ...(relatedItems.messages || []).map(msg => ({ name: msg.title, icon: msg.icon || 'message', url: msg.url })),
        ...(relatedItems.appointments || []).map(apt => ({ name: apt.title, icon: apt.icon || 'calendar', url: apt.url, date: apt.date, time: apt.time }))
    ] : [];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-[#EF4444] text-white';
            case 'Medium': return 'bg-[#FBBF24] text-white';
            case 'Low': return 'bg-[#10B981] text-white';
            default: return 'bg-[#6B7280] text-white';
        }
    };

    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'in progress': return 'bg-[#1E40AF] text-white';
            case 'pending': return 'bg-[#FBBF24] text-white';
            case 'to do': return 'bg-[#6B7280] text-white';
            case 'review': return 'bg-[#854D0E] text-white';
            case 'completed': return 'bg-[#10B981] text-white';
            case 'submitted': return 'bg-[#3B82F6] text-white';
            case 'cancelled': return 'bg-[#EF4444] text-white';
            case 'overdue': return 'bg-[#EF4444] text-white';
            default: return 'bg-[#6B7280] text-white';
        }
    };

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'document':
                return (
                    <svg width="27" height="25" viewBox="0 0 27 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="27" height="25" rx="8" fill="#E8F0FF" />
                        <path d="M14.8337 6.25391V8.75391C14.8337 9.08543 14.9741 9.40337 15.2242 9.63779C15.4742 9.87221 15.8134 10.0039 16.167 10.0039H18.8337M12.167 10.6289H10.8337M16.167 13.1289H10.8337M16.167 15.6289H10.8337M15.5003 6.25391H9.50033C9.1467 6.25391 8.80756 6.3856 8.55752 6.62002C8.30747 6.85444 8.16699 7.17239 8.16699 7.50391V17.5039C8.16699 17.8354 8.30747 18.1534 8.55752 18.3878C8.80756 18.6222 9.1467 18.7539 9.50033 18.7539H17.5003C17.8539 18.7539 18.1931 18.6222 18.4431 18.3878C18.6932 18.1534 18.8337 17.8354 18.8337 17.5039V9.37891L15.5003 6.25391Z" stroke="var(--firm-primary-color)" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                );
            case 'message':
                return (
                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="27" height="27" rx="8" fill="#E8F0FF" />
                        <path d="M19.125 15.375C19.125 15.7065 18.9933 16.0245 18.7589 16.2589C18.5245 16.4933 18.2065 16.625 17.875 16.625H10.375L7.875 19.125V9.125C7.875 8.79348 8.0067 8.47554 8.24112 8.24112C8.47554 8.0067 8.79348 7.875 9.125 7.875H17.875C18.2065 7.875 18.5245 8.0067 18.7589 8.24112C18.9933 8.47554 19.125 8.79348 19.125 9.125V15.375Z" stroke="var(--firm-primary-color)" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                );
            case 'calendar':
                return (
                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="27" height="27" rx="8" fill="#E8F0FF" />
                        <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="var(--firm-primary-color)" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                );
            default:
                return null;
        }
    };

    const handleBack = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <div className="min-h-screen bg-[#F6F7FF] p-3 sm:p-6 taskdetails-main-container">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <div className="mb-6 taskdetails-back-button">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-[#E8F0FF] !rounded-[10px] hover:bg-gray-50 transition-all active:scale-95 font-[BasisGrotesquePro] shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-semibold">Back</span>
                    </button>
                </div>

                {/* Header Section: Improved stacking for mobile */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-6 taskdetails-header">
                    <div className="flex-1 min-w-0 taskdetails-header-content">
                        <h4 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 font-[BasisGrotesquePro] break-words leading-tight taskdetails-header-title">
                            {transformedTaskData.task}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 taskdetails-header-badges">
                            <span className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg font-[BasisGrotesquePro] ${getPriorityColor(transformedTaskData.priority)}`}>
                                {transformedTaskData.priority}
                            </span>
                            <span className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg font-[BasisGrotesquePro] ${getStatusColor(transformedTaskData.status)}`}>
                                {transformedTaskData.status}
                            </span>
                            <span className="text-sm text-gray-500 font-medium font-[BasisGrotesquePro] ml-1">
                                Due: {transformedTaskData.dueDate}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons: Full width on mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-3 taskdetails-action-buttons">
                        <button
                            onClick={timeTrackingStatus?.is_tracking_active ? handlePauseTimer : handleStartTimer}
                            disabled={timeTrackingLoading}
                            className="px-6 py-3 bg-white text-[#3B4A66] border border-[#E8F0FF] !rounded-[10px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-bold shadow-sm disabled:opacity-50 active:scale-95"
                        >
                            {timeTrackingStatus?.is_tracking_active ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    {currentTime ? `Stop (${currentTime})` : 'Stop Timer'}
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" fill="#3B4A66" />
                                    </svg>
                                    Start Timer
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Info Cards: 2 columns on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 taskdetails-info-cards">
                    {[
                        { label: 'Assigned To', value: transformedTaskData.assignedTo.name, icon: 'user' },
                        { label: 'Time Spent', value: transformedTaskData.timeSpent, icon: 'clock' },
                        { label: 'Progress', value: `${transformedTaskData.progress}%`, icon: 'chart' },
                        { label: 'Client', value: transformedTaskData.client, icon: 'briefcase' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-[#E8F0FF] p-4 shadow-sm hover:border-[#F56D2D]/30 transition-colors">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{card.label}</p>
                            <p className="text-sm sm:text-base font-bold text-[#3B4A66] truncate" title={card.value}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Grid: Stacks on Tablet (lg breakpoint) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 taskdetails-main-grid">

                    {/* Left Column (Task Content) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-[#E8F0FF] p-5 sm:p-8 taskdetails-details-section shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 mb-6 font-[BasisGrotesquePro]">Task Details</h4>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-[BasisGrotesquePro] bg-gray-50 p-4 rounded-xl">
                                        {transformedTaskData.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                                        <span className="inline-flex px-4 py-2 text-xs font-bold bg-[#F0F7FF] text-[#007AFF] rounded-xl border border-[#E8F0FF]">
                                            {transformedTaskData.category}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</label>
                                        <div className="flex flex-wrap gap-2">
                                            {transformedTaskData.tags.map((tag, idx) => (
                                                <span key={idx} className="px-3 py-1.5 text-[11px] font-bold bg-white text-gray-600 border border-gray-200 rounded-lg">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-bold text-gray-700">Overall Progress</span>
                                        <span className="text-sm font-black text-[#F56D2D]">{transformedTaskData.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div
                                            className="bg-[#F56D2D] h-3 rounded-full transition-all duration-1000 shadow-inner"
                                            style={{ width: `${transformedTaskData.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Submitted Documents: Adaptive Grid */}
                                {transformedTaskData.taskType === 'document_request' && transformedTaskData.files.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4">Submitted Documents</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {transformedTaskData.files.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <FaFilePdf size={18} className="text-red-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-800 truncate pr-2">{file.file_name || file.name || `Document ${index + 1}`}</p>
                                                            {file.file_size && (
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{(file.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => window.open(file.file_url || file.url, '_blank')} className="p-2 text-gray-400 hover:text-[#F56D2D]">
                                                        <FaEye size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Quick Actions) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-[#E8F0FF] p-6 shadow-sm sticky top-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-6 font-[BasisGrotesquePro]">Quick Actions</h4>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none bg-gray-50 border border-transparent !rounded-[10px] px-4 py-3 text-sm font-bold text-[#3B4A66] focus:bg-white focus:border-[#F56D2D] outline-none transition-all cursor-pointer"
                                            value={taskData.status}
                                            onChange={(e) => handleStatusUpdate(e.target.value)}
                                        >
                                            <option value="to_do">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="completed">Completed</option>
                                            <option value="pending">Pending</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons stack on mobile */}
                                {(transformedTaskData.taskType === 'document_request' || transformedTaskData.taskType === 'signature_request') && taskData.status === 'submitted' && (
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => setShowApproveModal(true)} disabled={processingAction} className="w-full py-3 bg-[#10B981] text-white !rounded-[10px] font-bold hover:bg-[#059669] transition-all active:scale-95 shadow-sm shadow-emerald-100 disabled:opacity-50">
                                            {processingAction ? 'Processing...' : 'Approve & Complete'}
                                        </button>
                                        <button onClick={() => setShowReRequestModal(true)} disabled={processingAction} className="w-full py-3 bg-[#F59E0B] text-white !rounded-[10px] font-bold hover:bg-[#D97706] transition-all active:scale-95 shadow-sm shadow-amber-100 disabled:opacity-50">
                                            Re-request
                                        </button>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="w-full py-3 bg-white text-[#F56D2D] border border-[#F56D2D] !rounded-[10px] font-bold hover:bg-[#F56D2D]/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <FaEdit size={16} />
                                        Edit Task
                                    </button>

                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 mb-3">Timer</label>
                                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-center">
                                        <p className="text-3xl font-black text-[#3B4A66] tracking-tight tabular-nums">
                                            {currentTime || timeTrackingStatus?.total_time_formatted || '0:00:00'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Tracked Time</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleResetTimer}
                                            disabled={timeTrackingLoading || !timeTrackingStatus || timeTrackingStatus.total_sessions === 0}
                                            className="py-2.5 px-4 bg-white border border-gray-200 text-gray-500 font-bold !rounded-[10px] text-xs hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={timeTrackingStatus?.is_tracking_active ? handlePauseTimer : handleStartTimer}
                                            disabled={timeTrackingLoading}
                                            className={`py-2.5 px-4 font-bold !rounded-[10px] text-xs transition-all active:scale-95 disabled:opacity-50 ${timeTrackingStatus?.is_tracking_active ? 'bg-red-50 text-red-600' : 'bg-[#F56D2D] text-white'}`}
                                        >
                                            {timeTrackingStatus?.is_tracking_active ? 'Pause' : 'Start'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reset Timer Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showResetTimerConfirm}
                    onClose={() => {
                        if (!timeTrackingLoading) {
                            setShowResetTimerConfirm(false);
                        }
                    }}
                    onConfirm={confirmResetTimer}
                    title="Reset Time Tracking"
                    message="Are you sure you want to reset all time tracking records? This action cannot be undone."
                    confirmText="Reset"
                    cancelText="Cancel"
                    isLoading={timeTrackingLoading}
                    isDestructive={true}
                />

                {/* Approve Task Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showApproveModal}
                    onClose={() => setShowApproveModal(false)}
                    onConfirm={handleApproveTask}
                    title="Approve Submitted Documents"
                    message={`Are you sure you want to approve the documents for "${transformedTaskData.task}"? This will mark the task as completed.`}
                    confirmText="Approve"
                    cancelText="Cancel"
                    isLoading={processingAction}
                />

                {/* Re-request Document Modal */}
                {showReRequestModal && (
                    <div className="fixed inset-0 z-[1000] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full font-[BasisGrotesquePro]">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <FaRedo className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-bold text-gray-900">Re-request Documents</h3>
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Provide feedback to the client about why the documents were rejected and what is needed.
                                                </p>
                                                <textarea
                                                    value={reRequestComments}
                                                    onChange={(e) => setReRequestComments(e.target.value)}
                                                    placeholder="Enter your reason here... e.g., 'The uploaded W-2 is blurry, please re-upload a clear copy.'"
                                                    className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#EF7A3B] focus:border-transparent outline-none resize-none text-sm transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                                    <button
                                        type="button"
                                        onClick={handleReRequestDocument}
                                        disabled={processingAction || !reRequestComments.trim()}
                                        className="w-full inline-flex justify-center !rounded-[10px] border border-transparent shadow-sm px-4 py-2 bg-[#F59E0B] text-base font-bold text-white hover:bg-[#D97706] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all font-[BasisGrotesquePro]"
                                    >
                                        {processingAction ? 'Sending...' : 'Re-request'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowReRequestModal(false)}
                                        className="mt-3 w-full inline-flex justify-center !rounded-[10px] border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all font-[BasisGrotesquePro]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onTaskUpdated={() => {
                    fetchTaskDetails();
                    setShowEditModal(false);
                }}
                task={transformedTaskData}
            />
        </div>
    );
};

export default TaskDetails;
