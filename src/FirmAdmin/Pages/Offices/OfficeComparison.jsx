import React from 'react';
import { Link, useParams } from 'react-router-dom';
import sampleOffices from './sampleOffices';

const comparisonData = [
    {
        id: '1',
        name: 'Main Office',
        location: 'New York',
        revenue: '$125K',
        clients: 245,
        staff: 12,
        satisfaction: '4.8/5.0',
        growth: '+12.5%',
        utilization: '87%',
        status: 'Active',
        icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4.375H13.75V8.125" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.75 4.375L8.4375 9.6875L5.3125 6.5625L1.25 10.625" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        )
    },
    {
        id: '2',
        name: 'Downtown Branch',
        location: 'New York',
        revenue: '$89K',
        clients: 180,
        staff: 8,
        satisfaction: '4.6/5.0',
        growth: '+15.2%',
        utilization: '92%',
        status: 'Active',
        icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4.375H13.75V8.125" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.75 4.375L8.4375 9.6875L5.3125 6.5625L1.25 10.625" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        )
    },
    {
        id: '3',
        name: 'West Side Office',
        location: 'Buffalo',
        revenue: 'N/A',
        clients: 'N/A',
        staff: 'N/A',
        satisfaction: 'N/A',
        growth: 'N/A',
        utilization: 'N/A',
        status: 'Opening Soon',
        icon:null
    }
];

const rankingMetrics = [
    {
        title: 'Revenue Rank', value: "#1", icon: (

            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2V18M14 6H9.5C8.57174 6 7.6815 6.36875 7.02513 7.02513C6.36875 7.6815 6 8.57174 6 9.5C6 10.4283 6.36875 11.3185 7.02513 11.9749C7.6815 12.6313 8.57174 13 9.5 13H14.5C15.4283 13 16.3185 13.3687 16.9749 14.0251C17.6313 14.6815 18 15.5717 18 16.5C18 17.4283 17.6313 18.3185 16.9749 18.9749C16.3185 19.6313 15.4283 20 14.5 20H5" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        title: 'Client Rank', value: "#1", icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M10.6673 14V12.6667C10.6673 11.9594 10.3864 11.2811 9.88627 10.781C9.38617 10.281 8.70789 10 8.00065 10H4.00065C3.29341 10 2.61513 10.281 2.11503 10.781C1.61494 11.2811 1.33398 11.9594 1.33398 12.6667V14M14.6673 14V12.6667C14.6669 12.0758 14.4702 11.5018 14.1082 11.0349C13.7462 10.5679 13.2394 10.2344 12.6673 10.0867M10.6673 2.08667C11.2409 2.23353 11.7493 2.56713 12.1124 3.03487C12.4755 3.50261 12.6725 4.07789 12.6725 4.67C12.6725 5.26211 12.4755 5.83739 12.1124 6.30513C11.7493 6.77287 11.2409 7.10647 10.6673 7.25333M8.66732 4.66667C8.66732 6.13943 7.47341 7.33333 6.00065 7.33333C4.52789 7.33333 3.33398 6.13943 3.33398 4.66667C3.33398 3.19391 4.52789 2 6.00065 2C7.47341 2 8.66732 3.19391 8.66732 4.66667Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        title: 'Satisfaction Rank', value: "#1", icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9H4.5C3.83696 9 3.20107 8.73661 2.73223 8.26777C2.26339 7.79893 2 7.16304 2 6.5C2 5.83696 2.26339 5.20107 2.73223 4.73223C3.20107 4.26339 3.83696 4 4.5 4H6" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M18 9H19.5C20.163 9 20.7989 8.73661 21.2678 8.26777C21.7366 7.79893 22 7.16304 22 6.5C22 5.83696 21.7366 5.20107 21.2678 4.73223C20.7989 4.26339 20.163 4 19.5 4H18" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M4 22H20" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10 14.6602V17.0002C10 17.5502 9.53 17.9802 9.03 18.2102C7.85 18.7502 7 20.2402 7 22.0002" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M14 14.6602V17.0002C14 17.5502 14.47 17.9802 14.97 18.2102C16.15 18.7502 17 20.2402 17 22.0002" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M18 2H6V9C6 10.5913 6.63214 12.1174 7.75736 13.2426C8.88258 14.3679 10.4087 15 12 15C13.5913 15 15.1174 14.3679 16.2426 13.2426C17.3679 12.1174 18 10.5913 18 9V2Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

        )
    },
    {
        title: 'Growth Rank', value: `#1`, icon: (
            <svg width="21" height="11" viewBox="0 0 21 11" fill="none">
                <path d="M20.5 0.5L12 9L7 4L0.5 10.5" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        title: 'Utilization Rank', value: `#1`, icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        )
    },
];

const performanceSummary = [
    { label: 'Revenue', value: '$125K', average: '$87K' },
    { label: 'Clients', value: 245, average: 150 },
    { label: 'Satisfaction', value: '4.8/5.0', average: '4.5/5.0' },
    { label: 'Growth', value: '+12.5%', average: '+6.0%' },
    { label: 'Utilization', value: '87%', average: '81%' }
];

export default function OfficeComparison() {
    const { officeId } = useParams();
    const office = sampleOffices[officeId] || sampleOffices['1'];

    return (
        <div className="min-h-screen bg-[#F3F7FF] p-6">
            <div className="mx-auto flex w-full flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h5 className="text-2xl font-semibold text-[#1F2937]">Office Performance Comparison</h5>
                        <p className="text-sm text-[#6B7280]">Compare {office.name} with other office locations</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select className="rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm font-medium text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30">
                            <option>Monthly</option>
                            <option>Quarterly</option>
                            <option>Yearly</option>
                        </select>
                        <select className="rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm font-medium text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30">
                            <option>Revenue</option>
                            <option>Clients</option>
                            <option>Growth</option>
                            <option>Utilization</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    {rankingMetrics.map((metric, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {metric.icon}
                                </div>
                                <div>
                                    <p className="text-xl font-medium text-gray-700 leading-none mb-0">{metric.value}</p>
                                </div>
                            </div>
                            <div className="flex flex-col pl-3">
                                <p className="text-sm text-gray-600 mt-2">{metric.title}</p>
                            </div>
                        </div>
                    ))}
                </div>


                <div className="rounded-xl bg-white p-6">
                    <div className="flex flex-col gap-2">
                        <p className="text-base font-semibold text-[#1F2937]">Performance vs Firm Average</p>
                        <p className="text-sm text-[#6B7280]">How {office.name} compares to other offices</p>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                        {performanceSummary.map((item, index) => (
                            <div key={item.label} className="space-y-3 rounded-xl bg-[#F8FAFF] p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                                    <span>{item.label}</span>
                                    <span className="text-xs font-medium text-[#22C55E]">{item.value}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
                                    <div
                                        className="h-full rounded-full bg-[#3AD6F2]"
                                        style={{ width: `${86 - index * 4}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-[#6B7280]">
                                    <span>Avg: {item.average}</span>
                                    {/* <span className="font-medium text-[#1F2937]">{item.value}</span> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 ">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-base font-semibold text-[#1F2937] mb-0">All Offices Comparison</p>
                            <p className="text-sm text-[#6B7280] mb-0">Side-by-side comparison of all office locations</p>
                        </div>
                        <Link
                            to={`/firmadmin/offices`}
                            className="rounded-lg  bg-white px-4 py-2 text-sm font-medium text-[#3B82F6] transition-colors hover:bg-[#F3F7FF]"
                        >
                            View All Offices
                        </Link>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#E4ECFF] text-left text-sm text-[#4B5563]">
                            <thead className="bg-[#F8FAFF] text-[14px] font-medium tracking-wide text-[#6B7280]">
                                <tr>
                                    <th className="px-4 py-3">Office</th>
                                    <th className="px-4 py-3">Revenue</th>
                                    <th className="px-4 py-3">Clients</th>
                                    <th className="px-4 py-3">Staff</th>
                                    <th className="px-4 py-3">Satisfaction</th>
                                    <th className="px-4 py-3">Growth</th>
                                    <th className="px-4 py-3">Utilization</th>
                                    <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4ECFF] bg-white">
                                {comparisonData.map((officeRow) => (
                                    <tr key={officeRow.id} className="hover:bg-[#F8FAFF]">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FF]">
                                                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect width="22" height="22" rx="11" fill="#E8F0FF" />
                                                        <path d="M7 17.6654V5.66536C7 5.31174 7.14048 4.9726 7.39052 4.72256C7.64057 4.47251 7.97971 4.33203 8.33333 4.33203H13.6667C14.0203 4.33203 14.3594 4.47251 14.6095 4.72256C14.8595 4.9726 15 5.31174 15 5.66536V17.6654H7Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                        <path d="M6.9987 11H5.66536C5.31174 11 4.9726 11.1405 4.72256 11.3905C4.47251 11.6406 4.33203 11.9797 4.33203 12.3333V16.3333C4.33203 16.687 4.47251 17.0261 4.72256 17.2761C4.9726 17.5262 5.31174 17.6667 5.66536 17.6667H6.9987" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                        <path d="M15 9H16.3333C16.687 9 17.0261 9.14048 17.2761 9.39052C17.5262 9.64057 17.6667 9.97971 17.6667 10.3333V16.3333C17.6667 16.687 17.5262 17.0261 17.2761 17.2761C17.0261 17.5262 16.687 17.6667 16.3333 17.6667H15" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                        <path d="M9.66797 7H12.3346" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                        <path d="M9.66797 9.66797H12.3346" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                        <path d="M9.66797 12.332H12.3346" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                        <path d="M9.66797 15H12.3346" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                                    </svg>

                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-500">{officeRow.name}</div>
                                                    <div className="text-xs text-gray-500 font-semibold">{officeRow.location}</div>
                                                </div>
                                                {officeRow.id === office.id && (
                                                    <span className="rounded-full bg-[#3AD6F2]/10 px-2 py-1 text-xs font-semibold text-[#0EA5E9]">Current</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-gray-500">{officeRow.revenue}</td>
                                        <td className="px-4 py-4 text-gray-500 font-semibold">{officeRow.clients}</td>
                                        <td className="px-4 py-4 text-gray-500 font-semibold">{officeRow.staff}</td>
                                        <td className="px-4 py-4 text-gray-500 font-semibold">{officeRow.satisfaction}</td>
                                        <td className="px-4 py-4 text-green-500 font-semibold">
                                            <span className="flex items-center gap-2">{officeRow.icon} {officeRow.growth}</span>
                                                    
                                                </td>
                                        <td className="px-4 py-4 text-gray-500 font-semibold">{officeRow.utilization}</td>
                                        <td className="px-4 py-4 text-right">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${officeRow.status === 'Active' ? 'bg-green-500 text-white' : 'bg-white text-gray-500'}`}>
                                                {officeRow.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link
                        to={`/firmadmin/offices/${officeId}`}
                        className="rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                    >
                        Back to Overview
                    </Link>
                </div>
            </div>
        </div>
    );
}

