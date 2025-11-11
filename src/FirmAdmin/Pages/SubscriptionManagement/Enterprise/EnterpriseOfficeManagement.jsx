import React from 'react';

const offices = [
    {
        name: 'Downtown Office',
        address: '123 Main St, New York, NY 10001',
        manager: 'John Smith',
        contactPhone: '(555) 123-4567',
        contactEmail: 'Downtown@Taxfirm.com',
        staff: 12,
        clients: 450,
        plan: 'Professional',
        revenue: '$45,000',
        status: 'Active',
    },
    {
        name: 'Uptown Branch',
        address: '456 Oak Ave, New York, NY 10002',
        manager: 'Sarah Johnson',
        contactPhone: '(555) 123-4567',
        contactEmail: 'Uptown@Taxfirm.com',
        staff: 8,
        clients: 320,
        plan: 'Professional',
        revenue: '$32,000',
        status: 'Active',
    },
    {
        name: 'Brooklyn Office',
        address: '123 Main St, New York, NY 10001',
        manager: 'Mike',
        contactPhone: '(555) 123-4567',
        contactEmail: 'Brooklyn@Taxfirm.com',
        staff: 6,
        clients: 180,
        plan: 'Basic',
        revenue: '$18,000',
        status: 'Active',
    },
];

const EnterpriseOfficeManagement = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Office Management</h3>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                Manage office locations, staffing, and client distribution.
            </p>
        </div>

        <div className="overflow-hidden bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E8F0FF] text-sm font-[BasisGrotesquePro]">
                    <thead className="text-xs uppercase tracking-wide text-[#3B4A66]">
                        <tr>
                            <th className="py-3 pr-6 text-left font-medium">Office</th>
                            <th className="py-3 pr-6 text-left font-medium">Manager</th>
                            <th className="py-3 pr-6 text-left font-medium">Contact</th>
                            <th className="py-3 pr-6 text-left font-medium">Staff</th>
                            <th className="py-3 pr-6 text-left font-medium">Clients</th>
                            <th className="py-3 pr-6 text-left font-medium">Plan</th>
                            <th className="py-3 pr-6 text-left font-medium">Revenue</th>
                            <th className="py-3 pr-6 text-left font-medium">Status</th>
                            <th className="py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8F0FF] text-[#1F2937]">
                        {offices.map((office) => (
                            <tr key={office.name} className="bg-white">
                                <td className="py-5 pr-6 align-top">
                                    <p className="font-semibold text-[#1E293B]">{office.name}</p>
                                    <p className="mt-1 text-xs text-gray-500">{office.address}</p>
                                </td>
                                <td className="py-5 pr-6 align-top">
                                    <p className="font-semibold text-[#1E293B]">{office.manager}</p>
                                </td>
                                <td className="py-5 pr-6 align-top text-[#3B4A66]">
                                    <p>{office.contactPhone}</p>
                                    <p className="mt-1 text-xs text-[#3B4A66] break-all">{office.contactEmail}</p>
                                </td>
                                <td className="py-5 pr-6 align-top text-[#1E293B]">{office.staff}</td>
                                <td className="py-5 pr-6 align-top text-[#1E293B]">{office.clients}</td>
                                <td className="py-5 pr-6 align-top">
                                    <span className="inline-flex items-center rounded-full border border-[#CBD5F5] bg-white px-3 py-1 text-xs text-[#3B4A66]">
                                        {office.plan}
                                    </span>
                                </td>
                                <td className="py-5 pr-6 align-top font-semibold text-[#1E293B]">{office.revenue}</td>
                                <td className="py-5 pr-6 align-top">
                                    <span className="inline-flex items-center rounded-full bg-[#22C55E] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                                        {office.status}
                                    </span>
                                </td>
                                <td className="py-5 align-top">
                                    <div className="inline-flex items-center gap-2 text-[#3B4A66]">
                                        <button className="rounded-lg p-1.5" aria-label="View details">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5" />
                                                <path d="M3.16602 9.0013C3.16602 9.0013 4.91602 4.91797 8.99935 4.91797C13.0827 4.91797 14.8327 9.0013 14.8327 9.0013C14.8327 9.0013 13.0827 13.0846 8.99935 13.0846C4.91602 13.0846 3.16602 9.0013 3.16602 9.0013Z" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9 10.75C9.9665 10.75 10.75 9.9665 10.75 9C10.75 8.0335 9.9665 7.25 9 7.25C8.0335 7.25 7.25 8.0335 7.25 9C7.25 9.9665 8.0335 10.75 9 10.75Z" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        <button className="rounded-lg p-1.5" aria-label="Download report">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5" />
                                                <path d="M14.25 10.75V13.0833C14.25 13.3928 14.1271 13.6895 13.9083 13.9083C13.6895 14.1271 13.3928 14.25 13.0833 14.25H4.91667C4.60725 14.25 4.3105 14.1271 4.09171 13.9083C3.87292 13.6895 3.75 13.3928 3.75 13.0833V10.75M6.08333 7.83333L9 10.75M9 10.75L11.9167 7.83333M9 10.75V3.75" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
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
    </div>
);

export default EnterpriseOfficeManagement;

