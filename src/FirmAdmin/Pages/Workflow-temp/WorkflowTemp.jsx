import React, { useState } from 'react';
import Templates from './Templates';

const WorkflowTemp = () => {
    const [activeTab, setActiveTab] = useState('Active Workflows');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const tabs = ['Active Workflows', 'Templates', 'Analytics'];

    const workflows = [
        {
            id: 1,
            name: 'Client Onboarding',
            description: 'Complete Client Intake And Setup Process',
            status: 'Active',
            statusColor: 'green',
            triggers: 15,
            completions: 12,
            avgTime: '2.5 days',
            lastRun: '2024-01-15'
        },
        {
            id: 2,
            name: 'Tax Return Preparation',
            description: 'Standard Individual Tax Return Workflow',
            status: 'Active',
            statusColor: 'green',
            triggers: 45,
            completions: 38,
            avgTime: '5.2 days',
            lastRun: '2024-01-15'
        },
        {
            id: 3,
            name: 'Document Review & Approval',
            description: 'Multi-Stage Document Review Process',
            status: 'Paused',
            statusColor: 'orange',
            triggers: 8,
            completions: 6,
            avgTime: '1.8 days',
            lastRun: '2024-01-12'
        }
    ];

    return (
        <div className="min-h-screen bg-[bg-[#F3F7FF]] p-3 sm:p-4 lg:p-6">
            <div className="mx-auto">
                {/* Header Section */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 sm:mb-6">
                        <div>
                            <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Workflow Management</h4>
                            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Automate and optimize your firm's processes</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 text-xs sm:text-sm font-[BasisGrotesquePro] mt-3 sm:mt-4 lg:mt-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Workflow
                        </button>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                        {/* Total Workflows Card */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Total Workflows</h6>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 3H5C3.89543 3 3 3.89543 3 5V9C3 10.1046 3.89543 11 5 11H9C10.1046 11 11 10.1046 11 9V5C11 3.89543 10.1046 3 9 3Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 11V15C7 15.5304 7.21071 16.0391 7.58579 16.4142C7.96086 16.7893 8.46957 17 9 17H13" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 13H15C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">24</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">+3 from last month</div>
                        </div>

                        {/* Active Workflows Card */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Active Workflows</h6>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 3L20 12L6 21V3Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">18</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">75% of total workflows</div>
                        </div>

                        {/* Avg. Completion Time Card */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Avg. Completion Time</h6>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#3AD6F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">3.2 days</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">-0.5 days from last month</div>
                        </div>

                        {/* Success Rate Card */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6 relative">
                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                <h6 className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro]">Success Rate</h6>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 11.0818V12.0018C21.9988 14.1582 21.3005 16.2565 20.0093 17.9836C18.7182 19.7108 16.9033 20.9743 14.8354 21.5857C12.7674 22.1971 10.5573 22.1237 8.53447 21.3764C6.51168 20.6291 4.78465 19.2479 3.61096 17.4389C2.43727 15.6299 1.87979 13.4899 2.02168 11.3381C2.16356 9.18638 2.99721 7.13814 4.39828 5.49889C5.79935 3.85964 7.69279 2.7172 9.79619 2.24196C11.8996 1.76673 14.1003 1.98415 16.07 2.86182M9.00001 11.0018L12 14.0018L22 4.00182" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-lg sm:text-lg lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 font-[BasisGrotesquePro]">94.2%</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">+2.1% from last month</div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 mb-4 sm:mb-6 w-fit">
                        <div className="flex gap-3 sm:gap-4 lg:gap-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg ${activeTab === tab
                                        ? 'bg-[#3AD6F2] !text-white font-semibold'
                                        : 'bg-transparent !text-black hover:bg-gray-50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {activeTab === 'Active Workflows' && (
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6">
                        <div className="mb-4 sm:mb-6">
                            <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Active Workflows</h4>
                            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Monitor and manage your automated workflows</p>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 !border-b border-[#E8F0FF]">
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro]">Workflow</div>
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro] ml-3">Status</div>
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro]">Triggers</div>
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro]">Completions</div>
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro]">Avg. Time</div>
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro]">Last Run</div>
                            <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro]">Actions</div>
                        </div>

                        {/* Workflow Rows */}
                        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                            {workflows.map((workflow) => (
                                <div key={workflow.id} className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors">
                                    {/* Workflow Column */}
                                    <div>
                                        <div className="font-semibold text-gray-900 text-[10px] sm:text-xs lg:text-sm font-[BasisGrotesquePro] mb-0.5 sm:mb-1">
                                            {workflow.name}
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] lg:text-xs text-gray-500 font-[BasisGrotesquePro]">
                                            {workflow.description}
                                        </div>
                                    </div>

                                    {/* Status Column */}
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        {workflow.statusColor === 'green' ? (
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3L20 12L6 21V3Z" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9.91675 2.33203H8.75008C8.42792 2.33203 8.16675 2.5932 8.16675 2.91536V11.082C8.16675 11.4042 8.42792 11.6654 8.75008 11.6654H9.91675C10.2389 11.6654 10.5001 11.4042 10.5001 11.082V2.91536C10.5001 2.5932 10.2389 2.33203 9.91675 2.33203Z" stroke="#FBBF24" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M5.25 2.33203H4.08333C3.76117 2.33203 3.5 2.5932 3.5 2.91536V11.082C3.5 11.4042 3.76117 11.6654 4.08333 11.6654H5.25C5.57217 11.6654 5.83333 11.4042 5.83333 11.082V2.91536C5.83333 2.5932 5.57217 2.33203 5.25 2.33203Z" stroke="#FBBF24" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        )}
                                        <span className={`inline-flex items-center px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-medium font-[BasisGrotesquePro] ${workflow.statusColor === 'green'
                                            ? 'bg-[#22C55E] text-[#FFFFFF]'
                                            : 'bg-[#FBBF24] text-[#FFFFFF] !border border-[#FBBF24]'
                                            }`}>
                                            {workflow.status}
                                        </span>
                                    </div>

                                    {/* Triggers Column */}
                                    <div className="text-[10px] sm:text-xs lg:text-sm text-gray-900 font-[BasisGrotesquePro]">
                                        {workflow.triggers}
                                    </div>

                                    {/* Completions Column */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs lg:text-sm text-gray-900 font-[BasisGrotesquePro]">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.8334 6.46407V7.00073C12.8327 8.25865 12.4254 9.48263 11.6722 10.4901C10.919 11.4976 9.86033 12.2347 8.65404 12.5913C7.44775 12.948 6.15848 12.9052 4.97852 12.4692C3.79856 12.0333 2.79113 11.2276 2.10647 10.1724C1.42182 9.11709 1.09663 7.86877 1.17939 6.61358C1.26216 5.3584 1.74845 4.16359 2.56574 3.20736C3.38304 2.25113 4.48754 1.58471 5.71452 1.30749C6.94151 1.03027 8.22524 1.1571 9.37425 1.66907M5.25008 6.4174L7.00008 8.1674L12.8334 2.33407" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>

                                        {workflow.completions}
                                    </div>

                                    {/* Avg. Time Column */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs lg:text-sm text-gray-900 font-[BasisGrotesquePro]">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {workflow.avgTime}
                                    </div>

                                    {/* Last Run Column */}
                                    <div className="text-[10px] sm:text-xs lg:text-sm text-gray-900 font-[BasisGrotesquePro]">
                                        {workflow.lastRun}
                                    </div>

                                    {/* Actions Column */}
                                    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 ml-3">
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" stroke-width="0.5" />
                                                <path d="M9.12833 3.16797H8.87167C8.56225 3.16797 8.2655 3.29089 8.04671 3.50968C7.82792 3.72847 7.705 4.02522 7.705 4.33464V4.43964C7.70479 4.64423 7.65078 4.84516 7.5484 5.02229C7.44601 5.19942 7.29885 5.34651 7.12167 5.4488L6.87083 5.59464C6.69348 5.69703 6.49229 5.75094 6.2875 5.75094C6.08271 5.75094 5.88152 5.69703 5.70417 5.59464L5.61667 5.54797C5.34896 5.39354 5.03091 5.35164 4.73234 5.43148C4.43377 5.51132 4.17907 5.70636 4.02417 5.9738L3.89583 6.19547C3.7414 6.46318 3.69951 6.78123 3.77935 7.0798C3.85918 7.37837 4.05423 7.63306 4.32167 7.78797L4.40917 7.8463C4.5855 7.9481 4.73211 8.09427 4.83445 8.27029C4.93678 8.4463 4.99127 8.64604 4.9925 8.84964V9.14714C4.99332 9.35271 4.9398 9.55486 4.83736 9.7331C4.73492 9.91134 4.58721 10.0593 4.40917 10.1621L4.32167 10.2146C4.05423 10.3695 3.85918 10.6242 3.77935 10.9228C3.69951 11.2214 3.7414 11.5394 3.89583 11.8071L4.02417 12.0288C4.17907 12.2962 4.43377 12.4913 4.73234 12.5711C5.03091 12.651 5.34896 12.6091 5.61667 12.4546L5.70417 12.408C5.88152 12.3056 6.08271 12.2517 6.2875 12.2517C6.49229 12.2517 6.69348 12.3056 6.87083 12.408L7.12167 12.5538C7.29885 12.6561 7.44601 12.8032 7.5484 12.9803C7.65078 13.1574 7.70479 13.3584 7.705 13.563V13.668C7.705 13.9774 7.82792 14.2741 8.04671 14.4929C8.2655 14.7117 8.56225 14.8346 8.87167 14.8346H9.12833C9.43775 14.8346 9.7345 14.7117 9.95329 14.4929C10.1721 14.2741 10.295 13.9774 10.295 13.668V13.563C10.2952 13.3584 10.3492 13.1574 10.4516 12.9803C10.554 12.8032 10.7012 12.6561 10.8783 12.5538L11.1292 12.408C11.3065 12.3056 11.5077 12.2517 11.7125 12.2517C11.9173 12.2517 12.1185 12.3056 12.2958 12.408L12.3833 12.4546C12.651 12.6091 12.9691 12.651 13.2677 12.5711C13.5662 12.4913 13.8209 12.2962 13.9758 12.0288L14.1042 11.8013C14.2586 11.5336 14.3005 11.2155 14.2207 10.917C14.1408 10.6184 13.9458 10.3637 13.6783 10.2088L13.5908 10.1621C13.4128 10.0593 13.2651 9.91134 13.1626 9.7331C13.0602 9.55486 13.0067 9.35271 13.0075 9.14714V8.85547C13.0067 8.64989 13.0602 8.44775 13.1626 8.26951C13.2651 8.09127 13.4128 7.94326 13.5908 7.84047L13.6783 7.78797C13.9458 7.63306 14.1408 7.37837 14.2207 7.0798C14.3005 6.78123 14.2586 6.46318 14.1042 6.19547L13.9758 5.9738C13.8209 5.70636 13.5662 5.51132 13.2677 5.43148C12.9691 5.35164 12.651 5.39354 12.3833 5.54797L12.2958 5.59464C12.1185 5.69703 11.9173 5.75094 11.7125 5.75094C11.5077 5.75094 11.3065 5.69703 11.1292 5.59464L10.8783 5.4488C10.7012 5.34651 10.554 5.19942 10.4516 5.02229C10.3492 4.84516 10.2952 4.64423 10.295 4.43964V4.33464C10.295 4.02522 10.1721 3.72847 9.95329 3.50968C9.7345 3.29089 9.43775 3.16797 9.12833 3.16797Z" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M9 10.75C9.9665 10.75 10.75 9.9665 10.75 9C10.75 8.0335 9.9665 7.25 9 7.25C8.0335 7.25 7.25 8.0335 7.25 9C7.25 9.9665 8.0335 10.75 9 10.75Z" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" stroke-width="0.5" />
                                                <path d="M3.75 3.75V14.25H14.25" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M12.5 11.9167V7.25" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M9.5835 11.918V4.91797" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M6.6665 11.918V10.168" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'Templates' && (
                    <Templates />
                )}

                {activeTab === 'Analytics' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Workflow Performance Card */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6">
                            <div className="mb-4 sm:mb-6">
                                <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Workflow Performance</h4>
                                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Top performing workflows by completion rate</p>
                            </div>

                            <div className="space-y-4 sm:space-y-5">
                                {/* Client Onboarding */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm sm:text-base font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Client Onboarding</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">12 completions</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-base sm:text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">80%</div>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">success rate</p>
                                    </div>
                                </div>

                                {/* Tax Return Preparation */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm sm:text-base font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Tax Return Preparation</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">38 completions</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-base sm:text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">84%</div>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">success rate</p>
                                    </div>
                                </div>

                                {/* Document Review & Approval */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm sm:text-base font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Document Review & Approval</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">6 completions</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-base sm:text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">75%</div>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">success rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-3 sm:p-4 lg:p-6">
                            <div className="mb-4 sm:mb-6">
                                <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Recent Activity</h4>
                                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Latest workflow executions and events</p>
                            </div>

                            <div className="space-y-4 sm:space-y-5">
                                {/* Client Onboarding completed */}
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm sm:text-base font-medium text-gray-900 font-[BasisGrotesquePro]">Client Onboarding completed</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">John Smith - 2 minutes ago</p>
                                    </div>
                                </div>

                                {/* Tax Return Preparation started */}
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm sm:text-base font-medium text-gray-900 font-[BasisGrotesquePro]">Tax Return Preparation started</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">ABC Corporation - 15 minutes ago</p>
                                    </div>
                                </div>

                                {/* Document Review pending */}
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm sm:text-base font-medium text-gray-900 font-[BasisGrotesquePro]">Document Review pending</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">Jane Doe - 1 hour ago</p>
                                    </div>
                                </div>

                                {/* Quarterly Review completed */}
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="text-sm sm:text-base font-medium text-gray-900 font-[BasisGrotesquePro]">Quarterly Review completed</p>
                                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">XYZ LLC - 2 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create New Workflow Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 mt-20">
                    <div className="bg-white rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-3 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h5 className="text-lg sm:text-lg font-bold text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Create New Workflow</h5>
                                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Build an automated workflow for your firm</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>

                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-3 space-y-3 overflow-y-auto hide-scrollbar flex-1">
                            {/* Workflow Name and Category - Same Line */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Workflow Name */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Workflow Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter workflow name"
                                        className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro]"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Category</label>
                                    <select className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro]">
                                        <option value="">Select category</option>
                                        <option value="tax">Tax Preparation</option>
                                        <option value="client">Client Management</option>
                                        <option value="document">Document Review</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Event details..."
                                    className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] resize-none"
                                ></textarea>
                            </div>

                            {/* Trigger Event */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Trigger Event</label>
                                <select className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro]">
                                    <option value="">Select trigger</option>
                                    <option value="new-client">New Client Added</option>
                                    <option value="document-upload">Document Uploaded</option>
                                    <option value="date-based">Date Based</option>
                                </select>
                            </div>

                            {/* Add Files */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Add Files</label>
                                <div className="!border-2 border-dashed !border-[#E8F0FF] rounded-lg p-4 sm:p-5 text-center cursor-pointer hover:border-[#3AD6F2] transition-colors">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="#00C0C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro] mb-0.5">Drop files here or click to browse</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro]">Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Max 10MB per file)</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end items-center p-3 border-t border-gray-200 gap-2 flex-shrink-0">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-3 sm:px-4 py-1.5 bg-white border border-gray-300 text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm"
                            >
                                Save as Draft
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-3 sm:px-4 py-1.5 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm"
                            >
                                Create & Configure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowTemp;

