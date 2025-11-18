import React from 'react';

const costAllocations = [
    {
        office: 'Downtown Office',
        category: 'Base Subscription',
        percentage: '50%',
        fixedAmount: '-',
        monthlyTotal: '$0',
    },
    {
        office: 'Uptown Studio',
        category: 'Base Subscription',
        percentage: '75%',
        fixedAmount: '-',
        monthlyTotal: '$25',
    },
    {
        office: 'Suburban Workspace',
        category: 'Base Subscription',
        percentage: '60%',
        fixedAmount: '-',
        monthlyTotal: '$100',
    },
    {
        office: 'Coastal Cabin',
        category: "Add on's",
        percentage: '30%',
        fixedAmount: '-',
        monthlyTotal: '$10',
    },
    {
        office: 'Mountain Retreat',
        category: "Add on's",
        percentage: '90%',
        fixedAmount: '-',
        monthlyTotal: '$200',
    },
];

const EnterpriseCostAllocation = () => (
    <div className="space-y-6">
        

        <div className=" bg-white">
            <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4  px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#3B4A66] font-[BasisGrotesquePro] lg:grid">
                <span>Office</span>
                <span>Category</span>
                <span>Percentage</span>
                <span>Fixed Amount</span>
                <span>Monthly Total</span>
                <span>Actions</span>
            </div>

            <div className="space-y-3 p-3 sm:p-4">
                {costAllocations.map((allocation) => (
                    <div
                        key={allocation.office}
                        className="grid grid-cols-1 items-center gap-4 rounded-lg !border border-[#E8F0FF] px-4 py-3 font-[BasisGrotesquePro] text-sm text-[#1E293B] sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto]"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[#1E293B]">{allocation.office}</span>
                        </div>
                        <div>
                            <span className="inline-flex items-center rounded-full border border-[#CBD5F5] bg-white px-3 py-1 text-xs font-medium text-[#3B4A66]">
                                {allocation.category}
                            </span>
                        </div>
                        <div className="font-semibold text-[#1E293B] ml-3">{allocation.percentage}</div>
                        <div className="text-[#3B4A66] ml-6">{allocation.fixedAmount}</div>
                        <div className="font-semibold text-[#1E293B] ml-8">{allocation.monthlyTotal}</div>
                        <div className="flex items-center justify-start gap-3 text-[#3B4A66] sm:justify-end">
                            <button className="rounded-lg p-1.5" aria-label="View allocation">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5" />
                                    <path d="M3.16602 9.0013C3.16602 9.0013 4.91602 4.91797 8.99935 4.91797C13.0827 4.91797 14.8327 9.0013 14.8327 9.0013C14.8327 9.0013 13.0827 13.0846 8.99935 13.0846C4.91602 13.0846 3.16602 9.0013 3.16602 9.0013Z" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 10.75C9.9665 10.75 10.75 9.9665 10.75 9C10.75 8.0335 9.9665 7.25 9 7.25C8.0335 7.25 7.25 8.0335 7.25 9C7.25 9.9665 8.0335 10.75 9 10.75Z" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className="rounded-lg p-1.5" aria-label="Download allocation">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5" />
                                    <path d="M14.25 10.75V13.0833C14.25 13.3928 14.1271 13.6895 13.9083 13.9083C13.6895 14.1271 13.3928 14.25 13.0833 14.25H4.91667C4.60725 14.25 4.3105 14.1271 4.09171 13.9083C3.87292 13.6895 3.75 13.3928 3.75 13.0833V10.75M6.08333 7.83333L9 10.75M9 10.75L11.9167 7.83333M9 10.75V3.75" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default EnterpriseCostAllocation;
