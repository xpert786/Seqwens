import React, { useState, useEffect } from "react";
import { ExportIcon, EyeOffIcon, TrashIcon1 } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import { superToastOptions } from "../../utils/toastConfig";
import { Modal, Button } from "react-bootstrap";
import { getApiBaseUrl } from "../../../ClientOnboarding/utils/corsConfig";
import "../../style/LogAndBackups.css"
export default function LogsAndBackups() {
    const [selectedLevel, setSelectedLevel] = useState("All Levels");
    const [selectedUsers, setSelectedUsers] = useState("Active Users");
    const [systemLogs, setSystemLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [exporting, setExporting] = useState(false);

    // Backup filters
    const [backupsStatus, setBackupsStatus] = useState("All Statuses");
    const [backupsType, setBackupsType] = useState("All Types");
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 20,
        total_count: 0,
        total_pages: 1
    });

    const [activityTypeFilters, setActivityTypeFilters] = useState({});
    const [backups, setBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [submittingBackup, setSubmittingBackup] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [backupToDelete, setBackupToDelete] = useState(null);

    // Fetch audit logs from API
    useEffect(() => {
        fetchAuditLogs();
    }, [selectedLevel, selectedUsers, currentPage]);

    // Fetch backups from API
    useEffect(() => {
        fetchBackups();
    }, [backupsStatus, backupsType]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            // Map "All Levels" to empty string for API
            const activityTypeParam = selectedLevel === 'All Levels' ? '' : selectedLevel;

            const response = await superAdminAPI.getAuditLogs({
                page: currentPage,
                pageSize: 20,
                level: activityTypeParam,
                service: selectedUsers === 'All Users' ? '' : selectedUsers
            });

            if (response.success && response.data) {
                // Backend returns 'audit_logs'
                const logs = response.data.audit_logs || [];

                // Save filters for the dropdown if available
                if (response.data.filters && response.data.filters.activity_type_labels) {
                    setActivityTypeFilters(response.data.filters.activity_type_labels);
                }

                // Map API response to UI format
                const mappedLogs = logs.map(log => {
                    const status = (log.status || '').toLowerCase();
                    let levelColor = "bg-white";
                    let borderColor = "border-[#1E40AF]";
                    let textColor = "text-[#1E40AF]";

                    if (status === 'failed' || status === 'cancelled') {
                        borderColor = "border-[#EF4444]";
                        textColor = "text-[#EF4444]";
                    } else if (status === 'pending' || status === 'in_progress' || status === 'scheduled') {
                        borderColor = "border-[#FBBF24]";
                        textColor = "text-[#FBBF24]";
                    } else if (status === 'completed' || status === 'success') {
                        borderColor = "border-[#10B981]";
                        textColor = "text-[#10B981]";
                    }

                    return {
                        id: log.id,
                        timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
                        level: log.activity_type_display || log.level || 'Info',
                        service: log.title || log.service || 'System',
                        message: log.description || log.message || 'No message',
                        user: log.user,
                        status: log.status_display || log.status,
                        related_object_type: log.related_object_type,
                        related_object_id: log.related_object_id,
                        levelColor: "bg-white",
                        borderColor: borderColor,
                        textColor: textColor,
                        raw: log
                    };
                });
                setSystemLogs(mappedLogs);

                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
            } else {
                // Fallback to sample data if API doesn't return data
                setSystemLogs(getDefaultLogs());
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError(handleAPIError(err));
            // Fallback to sample data on error
            setSystemLogs(getDefaultLogs());
        } finally {
            setLoading(false);
        }
    };

    const getDefaultLogs = () => [
        {
            timestamp: "2024-01-15 14:30:25",
            level: "Info",
            service: "Authentication",
            message: "User login successful",
            levelColor: "bg-white",
            borderColor: "border-[#1E40AF]",
            textColor: "text-[#1E40AF]"
        },
        {
            timestamp: "2024-01-15 14:28:15",
            level: "Warning",
            service: "Payment",
            message: "Payment retry attempt",
            levelColor: "bg-white",
            borderColor: "border-[#FBBF24]",
            textColor: "text-[#FBBF24]"
        },
        {
            timestamp: "2024-01-15 14:25:10",
            level: "Error",
            service: "Database",
            message: "Connection timeout",
            levelColor: "bg-white",
            borderColor: "border-[#EF4444]",
            textColor: "text-[#EF4444]"
        },
        {
            timestamp: "2024-01-15 14:20:05",
            level: "Info",
            service: "Backup",
            message: "Scheduled backup completed",
            levelColor: "bg-white",
            borderColor: "border-[#1E40AF]",
            textColor: "text-[#1E40AF]"
        }
    ];

    const getLevelBorderColor = (level) => {
        const normalized = (level || '').toLowerCase();
        if (normalized.includes('error')) return "border-[#EF4444]";
        if (normalized.includes('warn')) return "border-[#FBBF24]";
        return "border-[#1E40AF]";
    };

    const getLevelTextColor = (level) => {
        const normalized = (level || '').toLowerCase();
        if (normalized.includes('error')) return "text-[#EF4444]";
        if (normalized.includes('warn')) return "text-[#FBBF24]";
        return "text-[#1E40AF]";
    };

    const fetchBackups = async () => {
        try {
            setLoadingBackups(true);
            const statusParam = backupsStatus === 'All Statuses' ? '' : backupsStatus;
            const typeParam = backupsType === 'All Types' ? '' : backupsType;

            const response = await superAdminAPI.getBackups({
                status: statusParam,
                type: typeParam
            });
            if (response.success && response.data) {
                setBackups(response.data);
            }
        } catch (err) {
            console.error('Error fetching backups:', err);
        } finally {
            setLoadingBackups(false);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setSubmittingBackup(true);
            const response = await superAdminAPI.createBackup({
                name: `Manual Backup ${new Date().toLocaleString()}`,
                backup_type: 'system'
            });

            if (response.success) {
                toast.success(response.message || 'Backup started successfully', superToastOptions);
                fetchBackups();
            }
        } catch (err) {
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setSubmittingBackup(false);
        }
    };

    const handleDeleteBackup = async (id) => {
        setBackupToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDeleteBackup = async () => {
        if (!backupToDelete) return;

        try {
            const response = await superAdminAPI.deleteBackup(backupToDelete);
            if (response.success) {
                toast.success('Backup deleted successfully', superToastOptions);
                fetchBackups();
            }
        } catch (err) {
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setShowDeleteModal(false);
            setBackupToDelete(null);
        }
    };

    const handleDownloadBackup = async (backup) => {
        if (backup.file_url) {
            window.open(backup.file_url, '_blank');
        } else {
            try {
                const response = await superAdminAPI.downloadBackup(backup.id);
                if (response.success && response.data && response.data.download_url) {
                    window.open(response.data.download_url, '_blank');
                } else {
                    toast.error('Download URL not available', superToastOptions);
                }
            } catch (err) {
                toast.error(handleAPIError(err), superToastOptions);
            }
        }
    };

    const handleExportLogs = async () => {
        try {
            setExporting(true);
            toast.info('Preparing audit log export...', superToastOptions);

            const level = selectedLevel !== 'All Levels' ? selectedLevel : '';

            // Use the superAdminAPI method
            await superAdminAPI.exportAuditLogs({ level });

            toast.success('Audit logs exported successfully', superToastOptions);
        } catch (err) {
            console.error('Error exporting logs:', err);
            toast.error(err.message || 'Failed to export logs', superToastOptions);
        } finally {
            setExporting(false);
        }
    };

    const handleExportBackups = async () => {
        try {
            setExporting(true);
            toast.info('Preparing backup history export...', superToastOptions);

            const status = backupsStatus !== 'All Statuses' ? backupsStatus : '';
            const type = backupsType !== 'All Types' ? backupsType : '';

            // Use the superAdminAPI method
            await superAdminAPI.exportBackups({ status, type });

            toast.success('Backup history exported successfully', superToastOptions);
        } catch (err) {
            console.error('Error exporting backups:', err);
            toast.error(err.message || 'Failed to export backups', superToastOptions);
        } finally {
            setExporting(false);
        }
    };

    const openLogDetails = (log) => {
        setSelectedLog(log);
        setShowLogModal(true);
    };

    const backupHistory = [
        {
            date: "2024-01-15",
            size: "2.3GB",
            status: "Completed",
            duration: "45s",
            borderColor: "border-[#10B981]",
            textColor: "text-[#10B981]"
        },
        {
            date: "2024-01-14",
            size: "2.1GB",
            status: "Completed",
            duration: "42s",
            borderColor: "border-[#10B981]",
            textColor: "text-[#10B981]"
        },
        {
            date: "2024-01-13",
            size: "2.0GB",
            status: "Completed",
            duration: "38s",
            borderColor: "border-[#10B981]",
            textColor: "text-[#10B981]"
        },
        {
            date: "2024-01-12",
            size: "1.9GB",
            status: "Failed",
            duration: "N/A",
            borderColor: "border-[#EF4444]",
            textColor: "text-[#EF4444]"
        }
    ];

    return (
        <div className="logs-backups-container min-h-screen">
            {/* System Logs Section */}
            <div className="bg-[var(--sa-bg-card)] border border-[var(--sa-border-color)] rounded-lg p-6 mb-6">
                <div className="mb-6">
                    <h3 className="text-gray-800 text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                        System Logs
                    </h3>
                    <p className="text-gray-600 text-sm font-normal font-[BasisGrotesquePro]">
                        Monitor system events and troubleshoot issues
                    </p>
                </div>

                {/* Filter and Action Bar */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative">
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="All Levels">All Activity Types</option>
                            {Object.entries(activityTypeFilters).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedUsers}
                            onChange={(e) => setSelectedUsers(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Active Users">Active Users</option>
                            <option value="All Users">All Users</option>
                            <option value="Inactive Users">Inactive Users</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>


                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-700 font-[BasisGrotesquePro]">{error}</p>
                        <button
                            onClick={fetchAuditLogs}
                            className="mt-2 text-sm text-red-600 underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Logs Table */}
                <div className="space-y-3">
                    {/* Header */}
                    <div className="grid gap-4 py-3 px-4 bg-gray-50 rounded-lg items-center" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 2.5fr 60px' }}>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Timestamp</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Level</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Service</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Message</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Actions</div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading audit logs...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && systemLogs.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No audit logs found</p>
                        </div>
                    )}

                    {/* Rows */}
                    {!loading && systemLogs.map((log, index) => (
                        <div key={index} className="grid gap-4 py-3 px-4 border border-[var(--sa-border-color)] hover:bg-[var(--sa-bg-secondary)] rounded-lg items-center" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 2.5fr 60px' }}>
                            <div className="text-sm text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">{log.timestamp}</div>
                            <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${log.borderColor} ${log.textColor}`}>
                                    {log.level}
                                </span>
                            </div>
                            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{log.service}</div>
                            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{log.message}</div>
                            <div>
                                <button
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
                                    title="View details"
                                    onClick={() => openLogDetails(log)}
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {!loading && pagination.total_pages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count} logs
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                                    style={{ borderRadius: '7px' }}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                    Page {pagination.page} of {pagination.total_pages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                                    disabled={currentPage >= pagination.total_pages}
                                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                                    style={{ borderRadius: '7px' }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backup Management Section */}
            <div className="bg-[var(--sa-bg-card)] border border-[var(--sa-border-color)] rounded-lg p-6">
                <div className="mb-6">
                    <h3 className="text-gray-800 text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                        Backup Management
                    </h3>
                    <p className="text-gray-600 text-sm font-normal font-[BasisGrotesquePro] mb-4">
                        Database backups and recovery options
                    </p>

                    {/* Header with Backup History and Filter Bar */}
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-gray-800 text-lg font-semibold font-[BasisGrotesquePro]">
                            Backup History
                        </h4>

                        {/* Filter and Action Bar */}
                        <div className="flex flex-wrap gap-3">
                            <div className="relative">
                                <select
                                    value={backupsStatus}
                                    onChange={(e) => setBackupsStatus(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All Statuses">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={backupsType}
                                    onChange={(e) => setBackupsType(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All Types">All Types</option>
                                    <option value="system">System</option>
                                    <option value="database">Database</option>
                                    <option value="files">Files</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>


                            <button
                                onClick={handleCreateBackup}
                                disabled={submittingBackup}
                                className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg text-sm font-[BasisGrotesquePro] transition-colors disabled:opacity-50"
                                style={{ borderRadius: "7px" }}
                            >
                                {submittingBackup ? 'Starting...' : 'Create Backup'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Backup History Table */}
                <div className="space-y-3 backup-history">

                    {/* Header */}
                    <div className="grid gap-4 py-3 px-4 bg-gray-50 rounded-lg backup-header items-center" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 80px' }}>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Date</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Size</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Status</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Duration</div>
                        <div className="text-sm font-medium text-[var(--sa-text-primary)] font-[BasisGrotesquePro]">Actions</div>
                    </div>

                    {/* Rows */}
                    {loadingBackups ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Loading backup history...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No backups found</p>
                        </div>
                    ) : backups.map((backup, index) => (
                        <div
                            key={index}
                            className="grid gap-4 py-3 px-4 border border-[var(--sa-border-color)] hover:bg-[var(--sa-bg-secondary)] rounded-lg backup-row items-center"
                            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 80px' }}
                        >
                            <div className="text-sm text-[var(--sa-text-primary)] font-[BasisGrotesquePro] backup-cell">
                                {new Date(backup.created_at).toLocaleString()}
                            </div>

                            <div className="text-sm text-[var(--sa-text-primary)] font-[BasisGrotesquePro] backup-cell">
                                {backup.file_size_human}
                            </div>

                            <div className="backup-cell">
                                <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        border: "2px solid",
                                        borderColor: backup.status === "completed" ? "#10B981" : backup.status === "failed" ? "#EF4444" : "#FBBF24",
                                        color: backup.status === "completed" ? "#10B981" : backup.status === "failed" ? "#EF4444" : "#FBBF24",
                                        backgroundColor: "var(--sa-bg-card)",
                                        textTransform: "capitalize"
                                    }}
                                >
                                    {backup.status}
                                </span>
                            </div>

                            <div className="text-sm text-[var(--sa-text-primary)] font-[BasisGrotesquePro] backup-cell">
                                {backup.duration_human}
                            </div>

                            <div className="backup-cell backup-actions">
                                <div className="flex gap-2">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                                        title="Download"
                                        onClick={() => handleDownloadBackup(backup)}
                                        disabled={backup.status !== 'completed'}
                                    >
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button
                                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                                        title="Delete"
                                        onClick={() => handleDeleteBackup(backup.id)}
                                    >
                                        <TrashIcon1 />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Log Details Modal */}
            <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>Log Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="font-[BasisGrotesquePro]">
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Timestamp</label>
                                    <p className="text-sm text-[var(--sa-text-primary)]">{selectedLog.timestamp}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Level</label>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${selectedLog.borderColor} ${selectedLog.textColor}`}>
                                            {selectedLog.level}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Service</label>
                                    <p className="text-sm text-[var(--sa-text-primary)]">{selectedLog.service}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Status</label>
                                    <p className="text-sm text-[var(--sa-text-primary)] capitalize">{selectedLog.status || 'N/A'}</p>
                                </div>
                            </div>

                            <hr className="border-[var(--sa-border-color)]" />

                            <div>
                                <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Message</label>
                                <p className="text-sm text-[var(--sa-text-primary)] bg-[var(--sa-bg-secondary)] p-3 rounded-lg border border-[var(--sa-border-color)]">{selectedLog.message}</p>
                            </div>

                            {selectedLog.user && (
                                <div>
                                    <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Triggered By</label>
                                    <div className="flex items-center gap-3 mt-1 bg-[var(--sa-bg-secondary)] p-2 rounded-lg border border-[var(--sa-border-color)]">
                                        <div className="w-8 h-8 bg-[var(--sa-bg-active)] rounded-full flex items-center justify-center text-[var(--sa-text-primary)] font-bold text-xs">
                                            {selectedLog.user.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--sa-text-primary)] m-0">{selectedLog.user.name}</p>
                                            <p className="text-xs text-[var(--sa-text-secondary)] m-0">{selectedLog.user.email} · {selectedLog.user.role}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(selectedLog.related_object_type || selectedLog.related_object_id) && (
                                <div>
                                    <label className="text-xs text-[var(--sa-text-secondary)] font-semibold uppercase">Related Object</label>
                                    <p className="text-sm text-[var(--sa-text-primary)]">
                                        {selectedLog.related_object_type} (ID: {selectedLog.related_object_id})
                                    </p>
                                </div>
                            )}

                            {selectedLog.raw && selectedLog.raw.error_message && (
                                <div>
                                    <label className="text-xs text-red-500 font-semibold uppercase">Error Message</label>
                                    <pre className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 overflow-auto max-h-40">
                                        {selectedLog.raw.error_message}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLogModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <Modal.Title className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontSize: "1.25rem", fontWeight: "600" }}>
                                Delete Backup
                            </Modal.Title>
                            <p className="text-sm text-gray-500 m-0" style={{ fontFamily: "BasisGrotesquePro" }}>
                                This action is permanent
                            </p>
                        </div>
                    </div>
                </Modal.Header>
                <Modal.Body className="font-[BasisGrotesquePro] pt-4">
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-amber-800 font-medium mb-1">Important Warning</p>
                                    <p className="text-sm text-amber-700">
                                        Deleting this backup will permanently remove all data and cannot be recovered. 
                                        Make sure you have alternative backups before proceeding.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center py-6">
                            <p className="text-lg text-[var(--sa-text-primary)] mb-2" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                                Are you sure you want to delete this backup?
                            </p>
                            <p className="text-sm text-gray-500">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <div className="flex gap-3 w-full">
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 border-0 rounded-lg hover:bg-gray-200 transition-colors"
                            style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </div>
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={confirmDeleteBackup}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white border-0 rounded-lg hover:bg-red-700 transition-colors"
                            style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Backup
                            </div>
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
