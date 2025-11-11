import React from 'react';

const Templates = () => {
    return (
        <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
            {/* Header Section for Templates */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-4">
                <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Workflow Templates</h4>
                    <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro]">Pre-built workflows for common processes</p>
                </div>
                <button className="px-3 sm:px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-[BasisGrotesquePro] w-full sm:w-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New template
                </button>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Template Card 1 */}
                <div className="bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <span className="px-2 sm:px-3 py-1 bg-[#E8F0FF] !border border-[#E8F0FF] text-black rounded-full text-xs font-medium font-[BasisGrotesquePro]">
                            Tax Preparation
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">156 Uses</span>
                    </div>
                    <h5 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Individual Tax Return</h5>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-[BasisGrotesquePro]">Complete workflow for individual tax returns.</p>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 font-[BasisGrotesquePro]">
                        <span>Steps:</span>
                        <span className="font-semibold">10</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                        <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]">
                            Preview
                        </button>
                        <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] whitespace-nowrap">
                            Use Template
                        </button>
                    </div>
                </div>

                {/* Template Card 2 */}
                <div className="bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <span className="px-2 sm:px-3 py-1 bg-[#E8F0FF] !border border-[#E8F0FF] !rounded-full text-xs font-medium font-[BasisGrotesquePro]">
                            Tax Preparation
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">89 Uses</span>
                    </div>
                    <h5 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Business Tax Return</h5>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-[BasisGrotesquePro]">Comprehensive business tax return process.</p>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 font-[BasisGrotesquePro]">
                        <span>Steps:</span>
                        <span className="font-semibold">15</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                        <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]">
                            Preview
                        </button>
                        <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] whitespace-nowrap">
                            Use Template
                        </button>
                    </div>
                </div>

                {/* Template Card 3 */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <span className="px-2 sm:px-3 py-1 bg-[#E8F0FF] !border border-[#E8F0FF] !rounded-full text-xs font-medium font-[BasisGrotesquePro]">
                            Client Management
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">67 Uses</span>
                    </div>
                    <h5 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">Quarterly Review</h5>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-[BasisGrotesquePro]">Quarterly client check-in and review.</p>
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 font-[BasisGrotesquePro]">
                        <span>Steps:</span>
                        <span className="font-semibold">6</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                        <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]">
                            Preview
                        </button>
                        <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] whitespace-nowrap">
                            Use Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Templates;

