import React from 'react';

const enterpriseStats = [
    {
        label: 'Total Offices',
        value: '3',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M14 22V8M14 22H8C5.172 22 3.757 22 2.879 21.121C2 20.243 2 18.828 2 16V8C2 5.172 2 3.757 2.879 2.879C3.757 2 5.172 2 8 2C10.828 2 12.243 2 13.121 2.879C14 3.757 14 5.172 14 8M14 22H18C19.886 22 20.828 22 21.414 21.414C22 20.828 22 19.886 22 18V12C22 10.114 22 9.172 21.414 8.586C20.828 8 19.886 8 18 8H14M6.5 11H5.5M10.5 11H9.5M6.5 7H5.5M6.5 15H5.5M10.5 7H9.5M10.5 15H9.5M18.5 15H17.5M18.5 11H17.5"
                    stroke="#3AD6F2"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        ),
    },
    {
        label: 'Total Staff',
        value: '26',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M22.5 22.5H21V18.75C20.9988 17.7558 20.6033 16.8027 19.9003 16.0997C19.1973 15.3967 18.2442 15.0012 17.25 15V13.5C18.6418 13.502 19.976 14.0557 20.9601 15.0399C21.9443 16.024 22.498 17.3582 22.5 18.75V22.5ZM16.5 22.5H15V18.75C14.9988 17.7558 14.6033 16.8027 13.9003 16.0997C13.1973 15.3967 12.2442 15.0012 11.25 15H6.75C5.7558 15.0012 4.80267 15.3967 4.09966 16.0997C3.39666 16.8027 3.00119 17.7558 3 18.75V22.5H1.5V18.75C1.50198 17.3582 2.05574 16.024 3.03988 15.0399C4.02402 14.0557 5.35822 13.502 6.75 13.5H11.25C12.6418 13.502 13.976 14.0557 14.9601 15.0399C15.9443 16.024 16.498 17.3582 16.5 18.75V22.5ZM15 1.5V3C15.9946 3 16.9484 3.39509 17.6516 4.09835C18.3549 4.80161 18.75 5.75544 18.75 6.75C18.75 7.74456 18.3549 8.69839 17.6516 9.40165C16.9484 10.1049 15.9946 10.5 15 10.5V12C16.3924 12 17.7277 11.4469 18.7123 10.4623C19.6969 9.47774 20.25 8.14239 20.25 6.75C20.25 5.35761 19.6969 4.02226 18.7123 3.03769C17.7277 2.05312 16.3924 1.5 15 1.5ZM9 3C9.74168 3 10.4667 3.21993 11.0834 3.63199C11.7001 4.04404 12.1807 4.62971 12.4645 5.31494C12.7484 6.00016 12.8226 6.75416 12.6779 7.48159C12.5333 8.20902 12.1761 8.8772 11.6517 9.40165C11.1272 9.9261 10.459 10.2833 9.73159 10.4279C9.00416 10.5726 8.25016 10.4984 7.56494 10.2145C6.87971 9.93072 6.29404 9.45007 5.88199 8.83339C5.46993 8.2167 5.25 7.49168 5.25 6.75C5.25 5.75544 5.64509 4.80161 6.34835 4.09835C7.05161 3.39509 8.00544 3 9 3ZM9 1.5C7.96165 1.5 6.94661 1.80791 6.08326 2.38478C5.2199 2.96166 4.54699 3.7816 4.14963 4.74091C3.75227 5.70022 3.6483 6.75582 3.85088 7.77422C4.05345 8.79262 4.55346 9.72808 5.28769 10.4623C6.02191 11.1965 6.95738 11.6966 7.97578 11.8991C8.99418 12.1017 10.0498 11.9977 11.0091 11.6004C11.9684 11.203 12.7883 10.5301 13.3652 9.66674C13.9421 8.80339 14.25 7.78835 14.25 6.75C14.25 5.35761 13.6969 4.02226 12.7123 3.03769C11.7277 2.05312 10.3924 1.5 9 1.5Z"
                    fill="#3AD6F2"
                />
            </svg>
        ),
    },
    {
        label: 'Monthly Revenue',
        value: '$95,000',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M12 2.25C12.1989 2.25 12.3897 2.32902 12.5303 2.46967C12.671 2.61032 12.75 2.80109 12.75 3V4.25H17C17.1989 4.25 17.3897 4.32902 17.5303 4.46967C17.671 4.61032 17.75 4.80109 17.75 5C17.75 5.19891 17.671 5.38968 17.5303 5.53033C17.3897 5.67098 17.1989 5.75 17 5.75H12.75V11.25H14.5C15.6272 11.25 16.7082 11.6978 17.5052 12.4948C18.3022 13.2918 18.75 14.3728 18.75 15.5C18.75 16.6272 18.3022 17.7082 17.5052 18.5052C16.7082 19.3022 15.6272 19.75 14.5 19.75H12.75V21C12.75 21.1989 12.671 21.3897 12.5303 21.5303C12.3897 21.671 12.1989 21.75 12 21.75C11.8011 21.75 11.6103 21.671 11.4697 21.5303C11.329 21.3897 11.25 21.1989 11.25 21V19.75H6C5.80109 19.75 5.61032 19.671 5.46967 19.5303C5.32902 19.3897 5.25 19.1989 5.25 19C5.25 18.8011 5.32902 18.6103 5.46967 18.4697C5.61032 18.329 5.80109 18.25 6 18.25H11.25V12.75H9.5C8.37283 12.75 7.29183 12.3022 6.4948 11.5052C5.69777 10.7082 5.25 9.62717 5.25 8.5C5.25 7.37283 5.69777 6.29183 6.4948 5.4948C7.29183 4.69777 8.37283 4.25 9.5 4.25H11.25V3C11.25 2.80109 11.329 2.61032 11.4697 2.46967C11.6103 2.32902 11.8011 2.25 12 2.25ZM11.25 5.75H9.5C8.77065 5.75 8.07118 6.03973 7.55546 6.55546C7.03973 7.07118 6.75 7.77065 6.75 8.5C6.75 9.22935 7.03973 9.92882 7.55546 10.4445C8.07118 10.9603 8.77065 11.25 9.5 11.25H11.25V5.75ZM12.75 12.75V18.25H14.5C15.2293 18.25 15.9288 17.9603 16.4445 17.4445C16.9603 16.9288 17.25 16.2293 17.25 15.5C17.25 14.7707 16.9603 14.0712 16.4445 13.5555C15.9288 13.0397 15.2293 12.75 14.5 12.75H12.75Z"
                    fill="#3AD6F2"
                />
            </svg>
        ),
    },
    {
        label: 'Total Clients',
        value: '950',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M22.5 22.5H21V18.75C20.9988 17.7558 20.6033 16.8027 19.9003 16.0997C19.1973 15.3967 18.2442 15.0012 17.25 15V13.5C18.6418 13.502 19.976 14.0557 20.9601 15.0399C21.9443 16.024 22.498 17.3582 22.5 18.75V22.5ZM16.5 22.5H15V18.75C14.9988 17.7558 14.6033 16.8027 13.9003 16.0997C13.1973 15.3967 12.2442 15.0012 11.25 15H6.75C5.7558 15.0012 4.80267 15.3967 4.09966 16.0997C3.39666 16.8027 3.00119 17.7558 3 18.75V22.5H1.5V18.75C1.50198 17.3582 2.05574 16.024 3.03988 15.0399C4.02402 14.0557 5.35822 13.502 6.75 13.5H11.25C12.6418 13.502 13.976 14.0557 14.9601 15.0399C15.9443 16.024 16.498 17.3582 16.5 18.75V22.5ZM15 1.5V3C15.9946 3 16.9484 3.39509 17.6516 4.09835C18.3549 4.80161 18.75 5.75544 18.75 6.75C18.75 7.74456 18.3549 8.69839 17.6516 9.40165C16.9484 10.1049 15.9946 10.5 15 10.5V12C16.3924 12 17.7277 11.4469 18.7123 10.4623C19.6969 9.47774 20.25 8.14239 20.25 6.75C20.25 5.35761 19.6969 4.02226 18.7123 3.03769C17.7277 2.05312 16.3924 1.5 15 1.5ZM9 3C9.74168 3 10.4667 3.21993 11.0834 3.63199C11.7001 4.04404 12.1807 4.62971 12.4645 5.31494C12.7484 6.00016 12.8226 6.75416 12.6779 7.48159C12.5333 8.20902 12.1761 8.8772 11.6517 9.40165C11.1272 9.9261 10.459 10.2833 9.73159 10.4279C9.00416 10.5726 8.25016 10.4984 7.56494 10.2145C6.87971 9.93072 6.29404 9.45007 5.88199 8.83339C5.46993 8.2167 5.25 7.49168 5.25 6.75C5.25 5.75544 5.64509 4.80161 6.34835 4.09835C7.05161 3.39509 8.00544 3 9 3ZM9 1.5C7.96165 1.5 6.94661 1.80791 6.08326 2.38478C5.2199 2.96166 4.54699 3.7816 4.14963 4.74091C3.75227 5.70022 3.6483 6.75582 3.85088 7.77422C4.05345 8.79262 4.55346 9.72808 5.28769 10.4623C6.02191 11.1965 6.95738 11.6966 7.97578 11.8991C8.99418 12.1017 10.0498 11.9977 11.0091 11.6004C11.9684 11.203 12.7883 10.5301 13.3652 9.66674C13.9421 8.80339 14.25 7.78835 14.25 6.75C14.25 5.35761 13.6969 4.02226 12.7123 3.03769C11.7277 2.05312 10.3924 1.5 9 1.5Z"
                    fill="#3AD6F2"
                />
            </svg>
        ),
    },
];

const officePerformance = [
    {
        name: 'Task Completion Rate',
        status: 'Active',
        staff: '12 staff · 450 clients',
        progress: 78,
        revenue: '$45,000',
        margin: '81% margin',
        cost: 'Cost: $8,000',
    },
    {
        name: 'Uptown Branch',
        status: 'Active',
        staff: '8 staff · 320 clients',
        progress: 67,
        revenue: '$32,000',
        margin: '82% margin',
        cost: 'Cost: $6,200',
    },
    {
        name: 'Task Completion Rate',
        status: 'Active',
        staff: '12 staff · 450 clients',
        progress: 74,
        revenue: '$46,000',
        margin: '81% margin',
        cost: 'Cost: $5,600',
    },
];

const EnterpriseOverview = () => {
    // Define background colors for each stat card
    const cardColors = [
        'bg-gradient-to-br from-blue-50 to-blue-100', // Total Offices
        'bg-gradient-to-br from-green-50 to-green-100', // Total Staff
        'bg-gradient-to-br from-purple-50 to-purple-100', // Monthly Revenue
        'bg-gradient-to-br from-orange-50 to-orange-100', // Total Clients
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {enterpriseStats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`flex h-full flex-col justify-between rounded-lg border-2 border-[#E8F0FF] px-3 py-4 shadow-md ${cardColors[index]}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-gray-500 font-[BasisGrotesquePro] whitespace-nowrap">{stat.label}</p>
                            <span className="flex min-h-[24px] min-w-[24px] items-center justify-center text-xl text-[#3AD6F2]">
                                {typeof stat.icon === 'string' ? stat.icon : stat.icon}
                            </span>
                        </div>
                        <p className="mt-4 text-2xl font-semibold text-[#1E293B] font-[BasisGrotesquePro]">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E8F0FF] bg-white">
                <div className="border-b border-[#E8F0FF] px-4 py-3">
                    <h4 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
                        Office Performance Comparison
                    </h4>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                        Revenue and cost analysis across all offices
                    </p>
                </div>
                <div>
                    {officePerformance.map((office) => (
                        <div key={`${office.name}-${office.revenue}`} className="flex flex-col gap-1.5 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-regular text-[#1E293B] font-[BasisGrotesquePro]">{office.name}</p>
                                    <span className="rounded-full bg-[#22C55E] px-3 py-0.5 text-xs font-[BasisGrotesquePro] uppercase tracking-wide text-white">
                                        {office.status}
                                    </span>
                                </div>
                                <div className="text-right font-[BasisGrotesquePro] text-sm font-semibold leading-tight text-[#1E293B]">
                                    {office.revenue}
                                    <p className="text-[12px] font-medium text-[#3B4A66]">{office.margin}</p>
                                </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#ECF3FF]">
                                <div
                                    className="h-full rounded-full bg-[#20D3D3]"
                                    style={{ width: `${office.progress}%` }}
                                />
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-[11px] font-[BasisGrotesquePro] text-[#3B4A66]">
                                <span className="font-medium">{office.staff}</span>
                                <span className="font-medium">{office.cost}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <button className="!rounded-lg bg-[#F56D2D] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#EA580C] font-[BasisGrotesquePro]">
                    Save Notification Settings
                </button>
            </div>
        </div>
    );
};

export default EnterpriseOverview;

