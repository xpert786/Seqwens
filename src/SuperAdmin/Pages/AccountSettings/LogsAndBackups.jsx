import React, { useState } from "react";
import { ExportIcon, EyeOffIcon, TrashIcon1} from "../../Components/icons";

export default function LogsAndBackups() {
    const [selectedLevel, setSelectedLevel] = useState("All Levels");
    const [selectedUsers, setSelectedUsers] = useState("Active Users");

    const systemLogs = [
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

                    <button className="flex items-center gap-2  text-[#4B5563] px-4 py-2 rounded-lg text-sm font-[BasisGrotesquePro] border border-[#E8F0FF]" style={{borderRadius: "7px"}}>
                         <ExportIcon />
                        Export Logs
                    </button>
                </div>

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
                     
                     {/* Rows */}
                     {systemLogs.map((log, index) => (
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
                                 <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                     <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                     </svg>
                                 </button>
                             </div>
                         </div>
                     ))}
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
