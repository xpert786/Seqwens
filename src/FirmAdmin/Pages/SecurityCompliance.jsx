import React, { useState } from 'react';

const tabs = [
    'Security Overview',
    'Active Sessions',
    'Audits Logs',
    'Compliance',
    'Security Controls',
    'Security Settings'
];

const metrics = [
    {
        label: 'Security Score',
        value: '94/100',
        subtitle: 'Excellent security posture',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0.4375L22 3.9375V11.9975C22 16.1245 19.467 19.0095 17.104 20.8005C15.6786 21.872 14.1143 22.7449 12.454 23.3955L12.367 23.4285L12.342 23.4375L12.335 23.4395L12.332 23.4405C12.331 23.4405 12.33 23.4405 12 22.4975L11.669 23.4415L11.665 23.4395L11.658 23.4375L11.633 23.4275L11.546 23.3955C11.0744 23.2131 10.6106 23.0109 10.156 22.7895C9.00838 22.232 7.91674 21.566 6.896 20.8005C4.534 19.0095 2 16.1245 2 11.9975V3.9375L12 0.4375ZM12 22.4975L11.669 23.4415L12 23.5575L12.331 23.4415L12 22.4975ZM12 21.4255L12.009 21.4215C13.3927 20.8496 14.6986 20.1054 15.896 19.2065C18.034 17.5875 20 15.2205 20 11.9975V5.3575L12 2.5575L4 5.3575V11.9975C4 15.2205 5.966 17.5855 8.104 19.2075C9.304 20.1081 10.613 20.8533 12 21.4255ZM18.072 8.3405L11.001 15.4115L6.758 11.1695L8.173 9.7545L11 12.5835L16.657 6.9265L18.072 8.3405Z" fill="#3AD6F2" />
            </svg>
        )
    },
    {
        label: 'Active Alerts',
        value: '3',
        subtitle: '1 critical, 2 warnings',
        icon: (
            <svg width="20" height="20" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.433 0.75L20.067 15.704C20.1986 15.932 20.2679 16.1907 20.2679 16.454C20.2679 16.7173 20.1986 16.976 20.067 17.204C19.9353 17.432 19.746 17.6214 19.518 17.753C19.2899 17.8847 19.0313 17.954 18.768 17.954H1.49996C1.23666 17.954 0.977999 17.8847 0.749975 17.753C0.521952 17.6214 0.3326 17.432 0.200952 17.204C0.0693043 16.976 0 16.7173 0 16.454C0 16.1907 0.0693109 15.932 0.200962 15.704L8.83496 0.75C9.41196 -0.25 10.855 -0.25 11.433 0.75ZM10.134 2.5L2.36596 15.954H17.902L10.134 2.5ZM10.134 12.602C10.3992 12.602 10.6535 12.7074 10.8411 12.8949C11.0286 13.0824 11.134 13.3368 11.134 13.602C11.134 13.8672 11.0286 14.1216 10.8411 14.3091C10.6535 14.4966 10.3992 14.602 10.134 14.602C9.86874 14.602 9.61439 14.4966 9.42686 14.3091C9.23932 14.1216 9.13396 13.8672 9.13396 13.602C9.13396 13.3368 9.23932 13.0824 9.42686 12.8949C9.61439 12.7074 9.86874 12.602 10.134 12.602ZM10.134 5.602C10.3992 5.602 10.6535 5.70736 10.8411 5.89489C11.0286 6.08243 11.134 6.33678 11.134 6.602V10.602C11.134 10.8672 11.0286 11.1216 10.8411 11.3091C10.6535 11.4966 10.3992 11.602 10.134 11.602C9.86874 11.602 9.61439 11.4966 9.42686 11.3091C9.23932 11.1216 9.13396 10.8672 9.13396 10.602V6.602C9.13396 6.33678 9.23932 6.08243 9.42686 5.89489C9.61439 5.70736 9.86874 5.602 10.134 5.602Z" fill="#3AD6F2" />
            </svg>
        )
    },
    {
        label: 'Active Sessions',
        value: '12',
        subtitle: 'Across 8 users',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14.1663 16.6667V15.8333C14.1663 14.9493 13.8151 14.1014 13.1909 13.4772C12.5667 12.853 11.7187 12.5017 10.8346 12.5017H4.16634C3.28228 12.5017 2.43443 12.853 1.81026 13.4772C1.18609 14.1014 0.834961 14.9493 0.834961 15.8333V16.6667" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.49932 9.16634C9.34028 9.16634 10.8327 7.67389 10.8327 5.83293C10.8327 3.99197 9.34028 2.49951 7.49932 2.49951C5.65836 2.49951 4.1659 3.99197 4.1659 5.83293C4.1659 7.67389 5.65836 9.16634 7.49932 9.16634Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.1671 16.6685V15.8352C19.1666 15.1127 18.9258 14.4104 18.4846 13.8397C18.0434 13.2691 17.4282 12.8616 16.7329 12.6768" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.3994 2.73911C14.096 2.92261 14.713 3.32993 15.1553 3.90224C15.5977 4.47454 15.8391 5.17825 15.8391 5.90245C15.8391 6.62665 15.5977 7.33036 15.1553 7.90267C14.713 8.47497 14.096 8.88229 13.3994 9.06579" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        label: 'Failed Logins',
        value: '7',
        subtitle: 'Last 24 hours',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM10 0C4.47 0 0 4.47 0 10C0 15.53 4.47 20 10 20C15.53 20 20 15.53 20 10C20 4.47 15.53 0 10 0ZM12.59 6L10 8.59L7.41 6L6 7.41L8.59 10L6 12.59L7.41 14L10 11.41L12.59 14L14 12.59L11.41 10L14 7.41L12.59 6Z" fill="#3AD6F2" />
            </svg>
        )
    }
];

const activeSessions = [
    {
        user: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        device: 'Chrome on Windows',
        location: 'Los Angeles, CA',
        lastActivity: '2024-01-15 15:30:00',
        duration: '2h 15m'
    },
    {
        user: 'Jane Doe',
        email: 'jane.doe@example.com',
        device: 'Safari on macOS',
        location: 'New York, NY',
        lastActivity: '2024-01-15 15:25:00',
        duration: '45m'
    },
    {
        user: 'John Smith',
        email: 'john.smith@example.com',
        device: 'Firefox on Linux',
        location: 'Chicago, IL',
        lastActivity: '2024-01-15 12:30:00',
        duration: '1h 30m'
    }
];

const alerts = [
    {
        id: 'ALT-001',
        type: 'Warning',
        title: 'Multiple failed login attempts',
        description: 'User john.smith@example.com - 5 failed attempts',
        timestamp: '2024-01-15 14:30:00',
        status: 'Active'
    },
    {
        id: 'ALT-002',
        type: 'Info',
        title: 'New device login',
        description: 'User jane.doe@example.com logged in from new device',
        timestamp: '2024-01-15 13:45:00',
        status: 'Resolved'
    },
    {
        id: 'ALT-003',
        type: 'Critical',
        title: 'Suspicious IP access attempt',
        description: 'Access attempt from blacklisted IP: 192.168.11.00',
        timestamp: '2024-01-15 12:15:00',
        status: 'Blocked'
    }
];

const typeBadgeStyles = {
    Warning: 'border border-[#FBBF24] text-[#FBBF24]',
    Info: 'border border-[#22C55E] text-[#22C55E]',
    Critical: 'border border-[#EF4444] text-[#EF4444]'
};

const statusBadgeStyles = {
    Active: 'bg-[#FBBF24] text-white',
    Resolved: 'bg-[#22C55E] text-white',
    Blocked: 'bg-[#EF4444] text-white'
};

export default function SecurityCompliance() {
    const [activeTab, setActiveTab] = useState('Security Overview');

    const renderSecurityOverview = () => (
        <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl bg-white p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{metric.label}</span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F9FF] text-[#3AD6F2]">
                                {metric.icon}
                            </span>
                        </div>
                        <p className="mt-4 text-xl font-semibold text-[#1F2937]">{metric.value}</p>
                        <p className="mt-2 text-sm text-[#6B7280]">{metric.subtitle}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-xl bg-white p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h5 className="text-base font-semibold text-[#1F2937]">Security Alerts</h5>
                        <p className="text-sm text-[#6B7280]">Recent security events requiring attention</p>
                    </div>
                    <button className="inline-flex items-center rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#4B5563] transition-colors hover:bg-[#F3F7FF]" style={{ borderRadius: '8px' }}>
                        View Audit Logs
                    </button>
                </div>
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm text-[#4B5563]">
                        <thead className="bg-[#F8FAFF] text-xs font-semibold tracking-wide text-[#6B7280]">
                            <tr>
                                <th className="px-4 py-3">Alert ID</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] bg-white">
                            {alerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-[#F8FAFF]">
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{alert.id}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${typeBadgeStyles[alert.type] || 'border border-gray-300 text-gray-400'}`}>
                                            {alert.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{alert.title}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{alert.description}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{alert.timestamp}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyles[alert.status] || 'bg-gray-300 text-white'}`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#4B5563] transition-colors hover:bg-[#F3F7FF]">
                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5" />
                                                    <path d="M3.1665 8.9974C3.1665 8.9974 4.9165 4.91406 8.99984 4.91406C13.0832 4.91406 14.8332 8.9974 14.8332 8.9974C14.8332 8.9974 13.0832 13.0807 8.99984 13.0807C4.9165 13.0807 3.1665 8.9974 3.1665 8.9974Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M9 10.75C9.9665 10.75 10.75 9.9665 10.75 9C10.75 8.0335 9.9665 7.25 9 7.25C8.0335 7.25 7.25 8.0335 7.25 9C7.25 9.9665 8.0335 10.75 9 10.75Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#4B5563] transition-colors hover:bg-[#F3F7FF]">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M7.57129 10.25C8.81393 10.25 9.82129 9.24264 9.82129 8C9.82129 6.75736 8.81393 5.75 7.57129 5.75C6.32865 5.75 5.32129 6.75736 5.32129 8C5.32129 9.24264 6.32865 10.25 7.57129 10.25Z" stroke="#3B4A66" />
                                                    <path d="M8.89489 0.614C8.61964 0.5 8.27014 0.5 7.57114 0.5C6.87214 0.5 6.52264 0.5 6.24739 0.614C6.06527 0.689385 5.8998 0.799922 5.76043 0.939293C5.62106 1.07866 5.51052 1.24414 5.43514 1.42625C5.36614 1.5935 5.33839 1.78925 5.32789 2.0735C5.32301 2.27895 5.26609 2.4798 5.16247 2.65727C5.05885 2.83473 4.91191 2.98302 4.73539 3.08825C4.55599 3.18858 4.35408 3.24175 4.14854 3.2428C3.943 3.24385 3.74055 3.19274 3.56014 3.09425C3.30814 2.96075 3.12589 2.88725 2.94514 2.86325C2.55088 2.8114 2.15216 2.91823 1.83664 3.16025C1.60114 3.3425 1.42564 3.64475 1.07614 4.25C0.726639 4.85525 0.551139 5.1575 0.512889 5.45375C0.487115 5.64909 0.500079 5.84759 0.551039 6.03792C0.601999 6.22825 0.689957 6.40667 0.809889 6.563C0.920889 6.707 1.07614 6.82775 1.31689 6.97925C1.67164 7.202 1.89964 7.5815 1.89964 8C1.89964 8.4185 1.67164 8.798 1.31689 9.02C1.07614 9.17225 0.920139 9.293 0.809889 9.437C0.689957 9.59333 0.601999 9.77175 0.551039 9.96208C0.500079 10.1524 0.487115 10.3509 0.512889 10.5463C0.551889 10.8418 0.726639 11.1448 1.07539 11.75C1.42564 12.3552 1.60039 12.6575 1.83664 12.8397C1.99297 12.9597 2.17139 13.0476 2.36172 13.0986C2.55205 13.1496 2.75055 13.1625 2.94589 13.1368C3.12589 13.1128 3.30814 13.0393 3.56014 12.9058C3.74055 12.8073 3.943 12.7561 4.14854 12.7572C4.35408 12.7582 4.55599 12.8114 4.73539 12.9117C5.09764 13.1217 5.31289 13.508 5.32789 13.9265C5.33839 14.2115 5.36539 14.4065 5.43514 14.5737C5.51052 14.7559 5.62106 14.9213 5.76043 15.0607C5.8998 15.2001 6.06527 15.3106 6.24739 15.386C6.52264 15.5 6.87214 15.5 7.57114 15.5C8.27014 15.5 8.61964 15.5 8.89489 15.386C9.077 15.3106 9.24247 15.2001 9.38185 15.0607C9.52122 14.9213 9.63175 14.7559 9.70714 14.5737C9.77614 14.4065 9.80389 14.2115 9.81439 13.9265C9.82939 13.508 10.0446 13.121 10.4069 12.9117C10.5863 12.8114 10.7882 12.7582 10.9937 12.7572C11.1993 12.7561 11.4017 12.8073 11.5821 12.9058C11.8341 13.0393 12.0164 13.1128 12.1964 13.1368C12.3917 13.1625 12.5902 13.1496 12.7806 13.0986C12.9709 13.0476 13.1493 12.9597 13.3056 12.8397C13.5419 12.6582 13.7166 12.3552 14.0661 11.75C14.4156 11.1448 14.5911 10.8425 14.6294 10.5463C14.6552 10.3509 14.6422 10.1524 14.5912 9.96208" stroke="#3B4A66" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderActiveSessions = () => (
        <div className="rounded-xl bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h5 className="text-base font-semibold text-[#1F2937]">Active User Sessions</h5>
                    <p className="text-sm text-[#6B7280]">Monitor and manage active user sessions</p>
                </div>
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm text-[#4B5563]">
                    <thead className="bg-[#F8FAFF] text-xs font-semibold tracking-wide text-[#6B7280]">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Device</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Last Activity</th>
                            <th className="px-4 py-3">Duration</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] bg-white">
                        {activeSessions.map((session) => (
                            <tr key={session.user} className="hover:bg-[#F8FAFF]">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-[#1F2937]">{session.user}</span>
                                        <span className="text-xs text-[#6B7280]">{session.email}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#1F2937]">{session.device}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#1F2937]">{session.location}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#1F2937]">{session.lastActivity}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#1F2937]">{session.duration}</td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-sm font-semibold text-[#EF4444] transition-colors hover:text-[#DC2626]" type="button">
                                        Terminate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPlaceholder = () => (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-[#6B7280]">
            Content for <span className="font-semibold">{activeTab}</span> is coming soon.
        </div>
    );

    return (
        <div className="bg-[rgb(243,247,255)] px-4 py-6 md:px-6">
            <div className="mx-auto flex w-full flex-col gap-6">
                <div className="rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h4 className="text-2xl font-semibold text-[#1F2937]">Security &amp; Compliance</h4>
                            <p className="text-sm text-[#6B7280]">Monitor security, manage access, and ensure compliance</p>
                        </div>
                        <button
                            className="inline-flex items-center gap-2 rounded-lg bg-[#F56D2D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                            style={{ borderRadius: '8px' }}
                            type="button"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2h-3m0-4l3 3m-3-3l-3 3" />
                            </svg>
                            Upgrade Plan
                        </button>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 w-fit bg-white rounded-lg p-1 border border-blue-50">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === tab ? 'bg-[#3AD6F2] text-white' : 'text-[#4B5563]'
                                }`}
                                style={{ borderRadius: '8px' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'Security Overview' && renderSecurityOverview()}

                {activeTab === 'Active Sessions' && renderActiveSessions()}

                {activeTab !== 'Security Overview' && activeTab !== 'Active Sessions' && renderPlaceholder()}
            </div>
        </div>
    );
}

