import React from 'react';

const AllPlans = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
            {/* Solo Plan */}
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-5 lg:p-6 relative shadow-sm">
                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Solo</h5>
                <div className="mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">$49</span>
                    <span className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] ml-1">per month</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-4 sm:mb-6">Perfect for individual practitioners</p>

                <div className="mb-4 sm:mb-6">
                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">Features</h6>
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">Up to 50 clients</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">1 staff user</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">10GB storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Basic workflows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Email support</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Standard templates</span>
                        </div>
                    </div>
                </div>

                <div className="mb-4 sm:mb-6">
                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">Limitations</h6>
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">No custom branding</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">No API access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Limited integrations</span>
                        </div>
                    </div>
                </div>

                <button className="w-full px-3 sm:px-4 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm font-medium">
                    Upgrade
                </button>
            </div>

            {/* Team Plan */}
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-5 lg:p-6 relative shadow-sm">
                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Team</h5>
                <div className="mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">$149</span>
                    <span className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] ml-1">per month</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-4 sm:mb-6">Great for small to medium firms</p>

                <div className="mb-4 sm:mb-6">
                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">Features</h6>
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">Up to 200 clients</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Up to 5 staff users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">50GB storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Advanced workflows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Priority email support</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Custom templates</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Basic integrations</span>
                        </div>
                    </div>
                </div>

                <div className="mb-4 sm:mb-6">
                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">Limitations</h6>
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">Limited custom branding</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">No API access</span>
                        </div>
                    </div>
                </div>

                <button className="w-full px-3 sm:px-4 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm font-medium">
                    Upgrade
                </button>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="bg-white !rounded-lg !border-2 border-[#F56D2D] p-4 sm:p-5 lg:p-6 relative shadow-sm">
                <span className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#F56D2D] text-white !rounded-full text-[10px] sm:text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                    Most Popular
                </span>
                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro] mt-2">Professional</h5>
                <div className="mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">$299</span>
                    <span className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] ml-1">per month</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-4 sm:mb-6">Ideal for growing practices</p>

                <div className="mb-4 sm:mb-6">
                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">Features</h6>
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">Up to 500 clients</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Unlimited staff users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">100GB storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Advanced workflows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Priority support</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Custom branding</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">API access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">All integrations</span>
                        </div>
                    </div>
                </div>

                <button className="w-full px-3 sm:px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm font-medium">
                    Current Plan
                </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-5 lg:p-6 relative shadow-sm">
                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Enterprise</h5>
                <div className="mb-2">
                    <span className="text-base sm:text-lg font-semibold text-gray-600 font-[BasisGrotesquePro]">Custom pricing</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-4 sm:mb-6">For large firms with custom needs</p>

                <div className="mb-4 sm:mb-6">
                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">Features</h6>
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">Unlimited clients</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Unlimited staff users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Unlimited storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Custom workflows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Dedicated support</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">White-label solution</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Full API access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Custom integrations</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">SLA guarantee</span>
                        </div>
                    </div>
                </div>

                <button className="w-full px-3 sm:px-4 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm font-medium">
                    Contact Sales
                </button>
            </div>
        </div>
    );
};

export default AllPlans;

