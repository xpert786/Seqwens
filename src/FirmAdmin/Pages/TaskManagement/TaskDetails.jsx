import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showEditModal, setShowEditModal] = useState(false);

    // Mock task data - in real app, fetch based on id
    const taskData = {
        id: 1,
        task: 'Complete 2023 Tax Return - John Smith',
        description: 'Prepare and file individual tax return for John Smith including Schedule C for business income',
        category: 'Tax Preparation',
        tags: ['Individual', 'Schedule C', 'Business'],
        assignedTo: { initials: 'MC', name: 'Michael Chen' },
        client: 'John Smith',
        priority: 'High',
        status: 'In progress',
        progress: 75,
        dueDate: '2024-03-20',
        hours: '6h / 8h',
        timeSpent: '6h / 8h',
        created: '2024-03-10',
        assignedBy: 'Sarah Martinez',
        relatedItems: [
            { name: '2023 Tax Documents', icon: 'document' },
            { name: 'Client Messages', icon: 'message' },
            { name: 'Review Meeting', icon: 'calendar' }
        ]
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-[#EF4444] text-white';
            case 'Medium': return 'bg-[#FBBF24] text-white';
            case 'Low': return 'bg-[#10B981] text-white';
            default: return 'bg-[#6B7280] text-white';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'In progress': return 'bg-[#1E40AF] text-white';
            case 'Pending': return 'bg-[#FBBF24] text-white';
            case 'Review': return 'bg-[#854D0E] text-white';
            case 'Overdue': return 'bg-[#EF4444] text-white';
            default: return 'bg-[#6B7280] text-white';
        }
    };

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'document':
                return (
                    <svg width="27" height="25" viewBox="0 0 27 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="27" height="25" rx="8" fill="#E8F0FF" />
                        <path d="M14.8337 6.25391V8.75391C14.8337 9.08543 14.9741 9.40337 15.2242 9.63779C15.4742 9.87221 15.8134 10.0039 16.167 10.0039H18.8337M12.167 10.6289H10.8337M16.167 13.1289H10.8337M16.167 15.6289H10.8337M15.5003 6.25391H9.50033C9.1467 6.25391 8.80756 6.3856 8.55752 6.62002C8.30747 6.85444 8.16699 7.17239 8.16699 7.50391V17.5039C8.16699 17.8354 8.30747 18.1534 8.55752 18.3878C8.80756 18.6222 9.1467 18.7539 9.50033 18.7539H17.5003C17.8539 18.7539 18.1931 18.6222 18.4431 18.3878C18.6932 18.1534 18.8337 17.8354 18.8337 17.5039V9.37891L15.5003 6.25391Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                );
            case 'message':
                return (
                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="27" height="27" rx="8" fill="#E8F0FF" />
                        <path d="M19.125 15.375C19.125 15.7065 18.9933 16.0245 18.7589 16.2589C18.5245 16.4933 18.2065 16.625 17.875 16.625H10.375L7.875 19.125V9.125C7.875 8.79348 8.0067 8.47554 8.24112 8.24112C8.47554 8.0067 8.79348 7.875 9.125 7.875H17.875C18.2065 7.875 18.5245 8.0067 18.7589 8.24112C18.9933 8.47554 19.125 8.79348 19.125 9.125V15.375Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                );
            case 'calendar':
                return (
                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="27" height="27" rx="8" fill="#E8F0FF" />
                        <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
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
        <div className="min-h-screen bg-[#F6F7FF] p-6">
            <div className="mx-auto">
                {/* Back Button */}
                <div className="mb-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.25 13.5L6.75 9L11.25 4.5" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back
                    </button>
                </div>

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 space-y-4 lg:space-y-0">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-3 font-[BasisGrotesquePro]">{taskData.task}</h4>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full font-[BasisGrotesquePro] ${getPriorityColor(taskData.priority)}`}>
                                {taskData.priority}
                            </span>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full font-[BasisGrotesquePro] ${getStatusColor(taskData.status)}`}>
                                {taskData.status}
                            </span>
                            <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Due: {taskData.dueDate}</span>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center font-[BasisGrotesquePro]">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            Start Timer
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Task
                        </button>
                    </div>
                </div>

                {/* Top Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Assigned To */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Assigned To</p>
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </div>
                        </div>
                        <p className="text-base font-bold text-gray-900 font-[BasisGrotesquePro]">{taskData.assignedTo.name}</p>
                    </div>
                    {/* Time Spent */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">Time Spent</p>
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M12 6V12L16 14" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </div>
                        </div>
                        <p className="text-base font-bold text-gray-900 font-[BasisGrotesquePro]">{taskData.timeSpent}</p>
                    </div>
                    {/* Progress */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">Progress</p>
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M12 6V12L16 14" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-base font-bold text-gray-900 font-[BasisGrotesquePro]">{taskData.progress}%</p>
                    </div>
                    {/* Client */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">Client</p>
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 2V6" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M16 2V6" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M3 10H21" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </div>
                        </div>
                        <p className="text-base font-bold text-gray-900 font-[BasisGrotesquePro]">{taskData.client}</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Task Details Section */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Task Details</h4>

                            <div className="space-y-4">
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">Description</label>
                                    <p className="text-sm text-gray-900 font-[BasisGrotesquePro]">{taskData.description}</p>
                                </div>

                                {/* Category and Tags - Same Line */}
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">Category</label>
                                        <div>
                                            <span className="inline-flex px-3 py-1 text-xs font-medium bg-[#E8F0FF] !border border-[#E8F0FF] text-[#3B4A66] rounded-full font-[BasisGrotesquePro]">
                                                {taskData.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">Tags</label>
                                        <div className="flex flex-wrap gap-2">
                                            {taskData.tags.map((tag, index) => (
                                                <span key={index} className="inline-flex px-3 py-1 text-xs font-medium bg-[#FFFFFF] text-[#3B4A66] !border border-[#E8F0FF] !rounded-full font-[BasisGrotesquePro]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">Progress</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-[#3AD6F2] h-2 rounded-full"
                                                style={{ width: `${taskData.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm text-gray-600 font-[BasisGrotesquePro] whitespace-nowrap">{taskData.progress}% complete</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task Information Section */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Task Information</h4>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Created:</span>
                                    <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{taskData.created}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Assigned By:</span>
                                    <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{taskData.assignedBy}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Due Date:</span>
                                    <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{taskData.dueDate}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Priority:</span>
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full font-[BasisGrotesquePro] ${getPriorityColor(taskData.priority)}`}>
                                        {taskData.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Quick Actions Section */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Quick Actions</h4>

                            <div className="space-y-4">
                                {/* Status Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">Description</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-4 py-2.5 pr-10 text-[#4B5563] focus:outline-none font-[BasisGrotesquePro] cursor-pointer">
                                            <option>In Progress</option>
                                            <option>Pending</option>
                                            <option>Review</option>
                                            <option>Completed</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Timer Controls */}
                                <div className="space-y-2">
                                    {/* Start and Pause - Same Line */}
                                    <div className="flex gap-2">
                                        <button className="flex-1 px-3 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-[BasisGrotesquePro] text-sm">
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3.5 1.75L11.6667 7L3.5 12.25V1.75Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            Start
                                        </button>
                                        <button className="flex-1 px-3 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-[BasisGrotesquePro] text-sm">
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9.9165 2.33203H8.74984C8.42767 2.33203 8.1665 2.5932 8.1665 2.91536V11.082C8.1665 11.4042 8.42767 11.6654 8.74984 11.6654H9.9165C10.2387 11.6654 10.4998 11.4042 10.4998 11.082V2.91536C10.4998 2.5932 10.2387 2.33203 9.9165 2.33203Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M5.25 2.33203H4.08333C3.76117 2.33203 3.5 2.5932 3.5 2.91536V11.082C3.5 11.4042 3.76117 11.6654 4.08333 11.6654H5.25C5.57217 11.6654 5.83333 11.4042 5.83333 11.082V2.91536C5.83333 2.5932 5.57217 2.33203 5.25 2.33203Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            Pause
                                        </button>
                                    </div>
                                    {/* Reset Timer - New Line */}
                                    <button className="w-full px-3 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-[BasisGrotesquePro] text-sm">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Reset Timer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Related Items Section */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Related Items</h4>

                            <div className="space-y-3">
                                {taskData.relatedItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                        <div className=" flex items-center justify-center flex-shrink-0">
                                            {getIcon(item.icon)}
                                        </div>
                                        <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Task Modal */}
            {showEditModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center  mt-20 ml-[300px]"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="bg-white !rounded-lg shadow-xl w-full max-w-4xl"
                        style={{
                            borderRadius: '12px',
                            maxHeight: '75vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-3 border-b border-[#E8F0FF]">
                            <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Edit Task</h4>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex items-center justify-center  text-blue-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>

                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-3 overflow-y-auto flex-1" style={{ maxHeight: 'calc(75vh - 100px)' }}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left Column - Overview */}
                                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 space-y-3 w-full">
                                    <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">Overview</h6>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Title</label>
                                        <input
                                            type="text"
                                            defaultValue="Client Onboarding"
                                            className="w-full px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Description</label>
                                        <textarea
                                            rows={2}
                                            defaultValue="Onboard a new client with required documents and steps"
                                            className="w-full px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                                        />
                                    </div>

                                    {/* Status and Priority - Same Line */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Status */}
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Status</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                                                    <option>To Do</option>
                                                    <option>In Progress</option>
                                                    <option>Review</option>
                                                    <option>Completed</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Priority</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                                                    <option>High</option>
                                                    <option>Medium</option>
                                                    <option>Low</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assignees */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Assignees</label>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">Alex Rivera</span>
                                            <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-[#F56D2D] text-white rounded-full font-[BasisGrotesquePro]">Jamie Chen</span>
                                            <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">Morgan Patel</span>
                                        </div>
                                    </div>

                                    {/* Client and Office - Same Line */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Client */}
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Client</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                                                    <option>Sunrise LLC</option>
                                                    <option>Client 2</option>
                                                    <option>Client 3</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Office */}
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Office</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                                                    <option>Select Office</option>
                                                    <option>Office 1</option>
                                                    <option>Office 2</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Documents</label>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">W-2: W-2: John Doe</span>
                                            <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">1099: 1099: Contractor Set</span>
                                            <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">K-1: K-1: Partner A</span>
                                        </div>
                                    </div>

                                    {/* Share Status With Client */}
                                    <div className="flex items-center gap-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-10 h-5 bg-[#F56D2D] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E8F0FF] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F56D2D]"></div>
                                        </label>
                                        <span className="text-base text-gray-700 font-[BasisGrotesquePro]">Share Status With Client</span>
                                    </div>

                                    {/* Dependencies */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Dependencies</label>
                                        <p className="text-xs text-gray-500 mb-1.5 font-[BasisGrotesquePro]">Task(s) that must be completed before this one starts.</p>
                                        <div className="bg-white !border border-[#E8F0FF] !rounded-lg p-3 max-h-32 overflow-y-auto">
                                            <div className="flex flex-col gap-2">
                                                <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro] w-fit">W-2: W-2: John Doe</span>
                                                <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro] w-fit">1099: 1099: Contractor Set</span>
                                                <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro] w-fit">K-1: K-1: Partner A</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Checklist & Attachments */}
                                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 space-y-3 w-full">
                                    <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">Checklist & Attachments</h6>

                                    {/* Checklist */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-base font-medium text-gray-700 font-[BasisGrotesquePro]">Checklist</label>
                                            <button className="px-3 py-1.5 bg-white text-[#3B4A66] !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs">Add Item</button>
                                        </div>
                                        <div className="bg-white !border border-[#E8F0FF] !rounded-lg p-3">
                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4 text-[#3AD6F2] border-[#E8F0FF] rounded focus:ring-[#3AD6F2] flex-shrink-0" />
                                                    <div className="flex-1 px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg">
                                                        <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Create Client Record</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4 text-[#3AD6F2] border-[#E8F0FF] rounded focus:ring-[#3AD6F2] flex-shrink-0" />
                                                    <div className="flex-1 px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg">
                                                        <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Assign Preparer</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#3AD6F2] border-[#E8F0FF] rounded focus:ring-[#3AD6F2] flex-shrink-0" />
                                                    <div className="flex-1 px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg">
                                                        <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Send Organizer</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Attachments</label>
                                        <div className="w-full px-3 py-3 bg-white border-1 border-dashed border-[#E8F0FF] rounded-lg flex flex-col items-center justify-center gap-2 font-[BasisGrotesquePro] cursor-pointer hover:bg-gray-50 transition-colors">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M19 13V17C19 17.5304 18.7893 18.0391 18.4142 18.4142C18.0391 18.7893 17.5304 19 17 19H3C2.46957 19 1.96086 18.7893 1.58579 18.4142C1.21071 18.0391 1 17.5304 1 17V13M15 6L10 1M10 1L5 6M10 1V13" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            <span className="text-xs text-gray-700">Choose File</span>
                                        </div>
                                    </div>

                                    {/* Status and Priority - Same Line */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Status */}
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Status</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                                                    <option>To Do</option>
                                                    <option>In Progress</option>
                                                    <option>Review</option>
                                                    <option>Completed</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Priority</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                                                    <option>High</option>
                                                    <option>Medium</option>
                                                    <option>Low</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Tracking */}
                                    <div>
                                        <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Time Tracking</label>
                                        <div className="flex items-center gap-2 mb-2">
                                            <button className="px-4 py-2 bg-white text-[#3B4A66] !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs font-medium">
                                                Start
                                            </button>
                                            <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] text-xs font-medium">
                                                Stop
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">No logs yet</span>
                                    </div>
                                </div>
                            </div>

                            {/* Comments & Mentions Section */}
                            <div className="mt-4">
                                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                                    <h6 className="text-base font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">Comments & Mentions</h6>
                                    <textarea
                                        rows={3}
                                        placeholder="Write a comment. Use @Name to mention staff."
                                        className="w-full px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm mb-3"
                                    />
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs text-gray-700 font-[BasisGrotesquePro]">Client visible: No</p>
                                            <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">No comments yet</p>
                                        </div>
                                        <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] text-xs font-medium">
                                            Add Item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-between items-center gap-2 p-3 border-t border-[#E8F0FF]">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-[#EF4444] text-white !rounded-lg hover:bg-[#DC2626] transition-colors font-[BasisGrotesquePro] text-sm"
                            >
                                Cancel
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskDetails;

