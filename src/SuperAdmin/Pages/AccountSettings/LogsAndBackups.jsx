import React, { useState, useEffect } from "react";
import { ExportIcon, EyeOffIcon, TrashIcon1} from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import { superToastOptions } from "../../utils/toastConfig";

export default function LogsAndBackups() {
    const [selectedLevel, setSelectedLevel] = useState("All Levels");
    const [selectedUsers, setSelectedUsers] = useState("Active Users");
    const [systemLogs, setSystemLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 20,
        total_count: 0,
        total_pages: 1
    });

    // Fetch audit logs from API
    useEffect(() => {
        fetchAuditLogs();
    }, [selectedLevel, currentPage]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getAuditLogs({
                page: currentPage,
                pageSize: 20,
                level: selectedLevel
            });

            if (response.success && response.data) {
                const logs = response.data.logs || response.data || [];
                // Map API response to UI format
                const mappedLogs = logs.map(log => ({
                    timestamp: log.timestamp || log.created_at || 'N/A',
                    level: log.level || log.log_level || 'Info',
                    service: log.service || log.module || 'System',
                    message: log.message || log.description || 'No message',
                    levelColor: "bg-white",
                    borderColor: getLevelBorderColor(log.level || log.log_level || 'Info'),
                    textColor: getLevelTextColor(log.level || log.log_level || 'Info')
                }));
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

    const handleExportLogs = async () => {
        try {
            const response = await superAdminAPI.exportAuditLogs({
                level: selectedLevel !== 'All Levels' ? selectedLevel : '',
            });
            
            if (response.success && response.data && response.data.download_url) {
                // Open download URL
                window.open(response.data.download_url, '_blank');
                toast.success('Audit logs exported successfully', superToastOptions);
            } else {
                toast.info('Export functionality - implement download', superToastOptions);
            }
        } catch (err) {
            console.error('Error exporting logs:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to export logs', superToastOptions);
        }
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
        <div className="min-h-screen">
            {/* System Logs Section */}
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mb-6">
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
                            <option value="All Levels">All Levels</option>
                            <option value="Info">Info</option>
                            <option value="Warning">Warning</option>
                            <option value="Error">Error</option>
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

                    <button 
                        onClick={handleExportLogs}
                        disabled={loading}
                        className="flex items-center gap-2 text-[#4B5563] px-4 py-2 rounded-lg text-sm font-[BasisGrotesquePro] border border-[#E8F0FF] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                        style={{borderRadius: "7px"}}
                    >
                         <ExportIcon />
                        {loading ? 'Loading...' : 'Export Logs'}
                    </button>
                </div>

                 {/* Error Message */}
                 {error && (
                     <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                         <p className="text-sm text-red-700 font-[BasisGrotesquePro]">{error}</p>
                         <button
                             onClick={fetchAuditLogs}
                             className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                         >
                             Retry
                         </button>
                     </div>
                 )}

                 {/* Logs Table */}
                 <div className="space-y-3">
                     {/* Header */}
                     <div className="grid grid-cols-5 gap-4 py-3 px-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Timestamp</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Level</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Service</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Message</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Actions</div>
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
                         <div key={index} className="grid grid-cols-5 gap-4 py-3 px-4 border border-[#E8F0FF] hover:bg-gray-50 rounded-lg">
                             <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{log.timestamp}</div>
                             <div>
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-2 ${log.borderColor} ${log.textColor}`}>
                                     {log.level}
                                 </span>
                             </div>
                             <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{log.service}</div>
                             <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{log.message}</div>
                             <div>
                                 <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="View details">
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
                                 >
                                     Next
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* Backup Management Section */}
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
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
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All Levels">All Levels</option>
                                    <option value="Info">Info</option>
                                    <option value="Warning">Warning</option>
                                    <option value="Error">Error</option>
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

                            <button className="flex items-center gap-2 px-4 py-2 border border-[#E8F0FF] rounded-lg text-sm font-[BasisGrotesquePro] " style={{borderRadius: "7px"}}>
                                 <ExportIcon />
                                Export Logs
                            </button>
                        </div>
                    </div>
                </div>

                 {/* Backup History Table */}
                 <div className="space-y-3">
                     {/* Header */}
                     <div className="grid grid-cols-5 gap-4 py-3 px-4 bg-gray-50 rounded-lg">
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Date</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Size</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Status</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Duration</div>
                         <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Actions</div>
                     </div>
                     
                     {/* Rows */}
                     {backupHistory.map((backup, index) => (
                         <div key={index} className="grid grid-cols-5 gap-4 py-3 px-4 border border-[#E8F0FF] hover:bg-gray-50 rounded-lg">
                             <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{backup.date}</div>
                             <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{backup.size}</div>
                             <div>
                                 <span 
                                     className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                     style={{
                                         border: "2px solid",
                                         borderColor: backup.status === "Completed" ? "#10B981" : "#EF4444",
                                         color: backup.status === "Completed" ? "#10B981" : "#EF4444",
                                         backgroundColor: "white"
                                     }}
                                 >
                                     {backup.status}
                                 </span>
                             </div>
                             <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{backup.duration}</div>
                             <div>
                                 <div className="flex gap-2">
                                     <button className="w-10 h-10">
                                          <EyeOffIcon />
                                     </button>
                                     <button className="w-10 h-10 ">
                                          <TrashIcon1 />
                                     </button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
}
