import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCog, FaEdit } from 'react-icons/fa';
import sampleOffices from './sampleOffices';
import {
    AreaChart,
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Label,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'trends', label: 'Trends' },
    { id: 'team', label: 'Team Analytics' }
];

const formatCurrency = (amount = 0) => {
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
};

export default function OfficeDashboardView() {
    const { officeId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [trendsView, setTrendsView] = useState('combined');

    const office = sampleOffices[officeId] || sampleOffices['1'];

    const performanceMetrics = useMemo(
        () => [
            {
                id: 'task-completion',
                label: 'Task Completion Rate',
                value: office.taskCompletionRate,
                suffix: '%'
            },
            {
                id: 'staff-utilisation',
                label: 'Staff Utilization',
                value: office.staffUtilization,
                suffix: '%'
            },
            {
                id: 'client-satisfaction',
                label: 'Client Satisfaction',
                value: (office.clientSatisfaction || 0) * 20,
                suffix: '%'
            }
        ],
        [office]
    );

    const topPerformers = office.topPerformers || [];
    const performanceDashboard = office.performanceDashboard || {};
    const revenueVsExpensesData = performanceDashboard.revenueVsExpenses || [];
    const clientGrowthData = performanceDashboard.clientGrowth || [];
    const averageRevenueData = useMemo(() => {
        const avg = office.avgRevenuePerClient || 0;
        const total = performanceDashboard.averageRevenueTarget || Math.max(avg * 1.5, avg + 250);
        return [
            { name: 'Avg Revenue per Client', value: avg },
            { name: 'Remaining', value: Math.max(total - avg, 0) }
        ];
    }, [office.avgRevenuePerClient, performanceDashboard.averageRevenueTarget]);
    const staffUtilizationData = performanceDashboard.staffUtilization || [
        { name: 'Utilized', value: office.staffUtilization || 0 },
        { name: 'Available', value: Math.max(100 - (office.staffUtilization || 0), 0) }
    ];

    const trendsData = performanceDashboard.trends || [];
    const pieColors = ['#6C5DD3', '#E8ECFF'];
    const teamPerformanceData = office.teamAnalytics?.staffPerformance || [];

    return (
        <div className="w-full bg-[#F3F7FF] p-6">
            <div className="mx-auto w-full space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#E8F0FF] flex items-center justify-center flex-shrink-0">
                            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 27.5V5C7.5 4.33696 7.76339 3.70107 8.23223 3.23223C8.70107 2.76339 9.33696 2.5 10 2.5H20C20.663 2.5 21.2989 2.76339 21.7678 3.23223C22.2366 3.70107 22.5 4.33696 22.5 5V27.5H7.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M7.5 15H5C4.33696 15 3.70107 15.2634 3.23223 15.7322C2.76339 16.2011 2.5 16.837 2.5 17.5V25C2.5 25.663 2.76339 26.2989 3.23223 26.7678C3.70107 27.2366 4.33696 27.5 5 27.5H7.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M22.5 11.25H25C25.663 11.25 26.2989 11.5134 26.7678 11.9822C27.2366 12.4511 27.5 13.087 27.5 13.75V25C27.5 25.663 27.2366 26.2989 26.7678 26.7678C26.2989 27.2366 25.663 27.5 25 27.5H22.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 7.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 12.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 17.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 22.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                        </div>
                        <div>
                            <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{office.name}</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600 mb-0">{office.location}</p>
                                <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                                    {office.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-900" style={{ borderRadius: '8px' }}>
                            <FaCog className="w-4 h-4" />
                            <span className="text-sm font-medium">Office Settings</span>
                        </div>
                        <button
                            onClick={() => navigate(`/firmadmin/offices/${officeId}/edit`)}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                            style={{ borderRadius: '8px' }}
                        >
                            <FaEdit className="w-4 h-4" />
                            Edit Office
                        </button>
                    </div>
                </div>


                {/* Summary Metrics Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Staff Members */}
                    <div className="bg-white rounded-lg p-4 gap-3">
                        <div className='flex items-center justify-between gap-3'>
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.6673 14V12.6667C10.6673 11.9594 10.3864 11.2811 9.88627 10.781C9.38617 10.281 8.70789 10 8.00065 10H4.00065C3.29341 10 2.61513 10.281 2.11503 10.781C1.61494 11.2811 1.33398 11.9594 1.33398 12.6667V14M14.6673 14V12.6667C14.6669 12.0758 14.4702 11.5018 14.1082 11.0349C13.7462 10.5679 13.2394 10.2344 12.6673 10.0867M10.6673 2.08667C11.2409 2.23353 11.7493 2.56713 12.1124 3.03487C12.4755 3.50261 12.6725 4.07789 12.6725 4.67C12.6725 5.26211 12.4755 5.83739 12.1124 6.30513C11.7493 6.77287 11.2409 7.10647 10.6673 7.25333M8.66732 4.66667C8.66732 6.13943 7.47341 7.33333 6.00065 7.33333C4.52789 7.33333 3.33398 6.13943 3.33398 4.66667C3.33398 3.19391 4.52789 2 6.00065 2C7.47341 2 8.66732 3.19391 8.66732 4.66667Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>


                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{office.staff}</p>

                            </div>

                        </div>
                        <div className="flex flex-col pl-3">
                            <p className="text-sm text-gray-600 mt-2">Staff Members</p>
                        </div>
                    </div>

                    {/* Active Clients */}
                    <div className="bg-white rounded-lg p-4 gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.6673 14V12.6667C10.6673 11.9594 10.3864 11.2811 9.88627 10.781C9.38617 10.281 8.70789 10 8.00065 10H4.00065C3.29341 10 2.61513 10.281 2.11503 10.781C1.61494 11.2811 1.33398 11.9594 1.33398 12.6667V14M14.6673 14V12.6667C14.6669 12.0758 14.4702 11.5018 14.1082 11.0349C13.7462 10.5679 13.2394 10.2344 12.6673 10.0867M10.6673 2.08667C11.2409 2.23353 11.7493 2.56713 12.1124 3.03487C12.4755 3.50261 12.6725 4.07789 12.6725 4.67C12.6725 5.26211 12.4755 5.83739 12.1124 6.30513C11.7493 6.77287 11.2409 7.10647 10.6673 7.25333M8.66732 4.66667C8.66732 6.13943 7.47341 7.33333 6.00065 7.33333C4.52789 7.33333 3.33398 6.13943 3.33398 4.66667C3.33398 3.19391 4.52789 2 6.00065 2C7.47341 2 8.66732 3.19391 8.66732 4.66667Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{office.clients}</p>

                            </div>

                        </div>
                        <div className="flex flex-col pl-3">
                            <p className="text-sm text-gray-600 mt-2">Active Clients</p>
                        </div>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="bg-white rounded-lg p-4 gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 2V18M14 6H9.5C8.57174 6 7.6815 6.36875 7.02513 7.02513C6.36875 7.6815 6 8.57174 6 9.5C6 10.4283 6.36875 11.3185 7.02513 11.9749C7.6815 12.6313 8.57174 13 9.5 13H14.5C15.4283 13 16.3185 13.3687 16.9749 14.0251C17.6313 14.6815 18 15.5717 18 16.5C18 17.4283 17.6313 18.3185 16.9749 18.9749C16.3185 19.6313 15.4283 20 14.5 20H5" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{formatCurrency(office.monthlyRevenue)}</p>

                            </div>

                        </div>

                        <div className="flex flex-col pl-3">
                            <p className="text-sm text-gray-600 mt-2">Monthly Revenue</p>
                        </div>
                    </div>

                    {/* Growth Rate */}
                    <div className="bg-white rounded-lg p-4 gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg width="21" height="11" viewBox="0 0 21 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.5 0.5L12 9L7 4L0.5 10.5" stroke="#EF4444" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">+{office.growthRate}%</p>

                            </div>

                        </div>

                        <div className="flex flex-col pl-3">
                            <p className="text-sm text-gray-600 mt-2">Growth Rate</p>
                        </div>
                    </div>
                </div>


                <div className="bg-white p-2 mb-6 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-[#3AD6F2] text-white'
                                    : 'bg-white text-[#4B5563] hover:bg-[#F3F7FF]'
                                    }`}
                                style={{ borderRadius: '8px' }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'performance' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl bg-white p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-base font-semibold text-gray-500">Revenue Vs Expenses</p>
                                <span className="text-xs font-medium text-[#94A3B8]">Jan - Apr</span>
                            </div>
                            <div className="mt-4 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueVsExpensesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34D399" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#34D399" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FB7185" stopOpacity={0.7} />
                                                <stop offset="95%" stopColor="#FB7185" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                                        <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(value) => `$${value.toLocaleString()}`}
                                            contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2.5} fill="url(#colorRevenue)" />
                                        <Area type="monotone" dataKey="expenses" stroke="#F87171" strokeWidth={2.5} fill="url(#colorExpenses)" />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h6 className="text-base font-semibold text-gray-500">Client Growth</h6>
                                <span className="text-xs font-medium text-[#94A3B8]">Jan - Apr</span>
                            </div>
                            <div className="mt-4 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={clientGrowthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                                        <YAxis stroke="#94A3B8" fontSize={12} />
                                        <Tooltip
                                            formatter={(value, name) => [`${value}`, name === 'newClients' ? 'New Clients' : 'Total Clients']}
                                            contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                        />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                                        <Bar dataKey="newClients" name="New Clients" radius={[8, 8, 0, 0]} fill="#3B82F6" barSize={24} />
                                        <Bar dataKey="totalClients" name="Total Clients" radius={[8, 8, 0, 0]} fill="#A855F7" barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h6 className="text-base font-semibold text-[#1F2937]">Average Revenue</h6>
                            <div className="mt-6 flex h-64 items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={averageRevenueData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {averageRevenueData.map((entry, index) => (
                                                <Cell key={`avg-${entry.name}`} fill={pieColors[index] || '#CBD5F5'} />
                                            ))}
                                            <Label
                                                position="center"
                                                content={({ cx, cy }) => (
                                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                        <tspan fill="#111827" fontSize="16" fontWeight="600">
                                                            ${office.avgRevenuePerClient}
                                                        </tspan>
                                                        <tspan x={cx} y={cy + 18} fill="#6B7280" fontSize="12">
                                                            Avg / Client
                                                        </tspan>
                                                    </text>
                                                )}
                                            />
                                        </Pie>
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: 12, color: '#64748B' }}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                                            contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h6 className="text-base font-semibold text-[#1F2937]">Staff Utilization & Satisfaction</h6>
                            <div className="mt-6 flex h-64 items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={staffUtilizationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60} // Keeps the empty space in the center
                                            outerRadius={90} // Defines the outer ring
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {staffUtilizationData.map((entry, index) => (
                                                <Cell
                                                    key={`staff-${entry.name}`}
                                                    // Assigns Purple to the first slice and Red to the second slice
                                                    fill={index === 0 ? '#8B5CF6' : '#F87171'}
                                                />
                                            ))}
                                            <Label
                                                position="center"
                                                content={({ cx, cy }) => (
                                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                        <tspan fill="#8B5CF6" fontSize="16" fontWeight="600">
                                                            {office.staffUtilization || 0}%
                                                        </tspan>
                                                        <tspan x={cx} y={cy + 18} fill="#8B5CF6" fontSize="12">
                                                            Utilized
                                                        </tspan>
                                                    </text>
                                                )}
                                            />
                                        </Pie>
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            formatter={(value) => value}
                                            wrapperStyle={{ fontSize: 12, color: '#8B5CF6' }}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [`${value}%`, name]}
                                            labelFormatter={() => ''}
                                            contentStyle={{ borderRadius: 12, borderColor: '#8B5CF6', padding: '8px 12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'trends' && (
                    <div className="space-y-6 rounded-2xl bg-white p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h6 className="text-lg font-semibold text-[#1F2937]">Monthly Trends</h6>
                                <p className="text-sm text-[#6B7280]">
                                    Revenue, clients, and task completion over time
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 rounded-lg border border-[#E4ECFF] bg-white px-3 py-1.5 text-xs text-[#6B7280]">
                                    <span className="text-sm font-medium text-[#6B7280]">Range</span>
                                    <select className="border-none bg-transparent text-xs font-medium text-[#1F2937] focus:outline-none">
                                        <option>Last 12 months</option>
                                        <option>Last 6 months</option>
                                        <option>Year to date</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-[#E4ECFF] bg-white px-3 py-1.5 text-xs text-[#6B7280]">
                                    <span className="text-sm font-medium text-[#6B7280]">View</span>
                                    <div className="flex rounded-lg bg-[#F3F7FF] p-1">
                                        {['combined', 'split', 'table', 'series'].map((view) => (
                                            <button
                                                key={view}
                                                type="button"
                                                onClick={() => setTrendsView(view)}
                                                className={`px-3 py-1 text-xs font-medium transition-colors ${trendsView === view ? 'rounded-md bg-[#3AD6F2] text-white' : 'rounded-md text-[#6B7280] hover:text-[#1F2937]'}`}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                {view.charAt(0).toUpperCase() + view.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" className="rounded-full bg-[#F56D2D] px-3 py-1 text-xs font-semibold text-white">Revenue</button>
                                    <button type="button" className="rounded-full border border-[#F56D2D] px-3 py-1 text-xs font-semibold text-[#F56D2D] bg-white">Clients</button>
                                    <button type="button" className="rounded-full border border-[#F56D2D] px-3 py-1 text-xs font-semibold text-[#F56D2D] bg-white">Tasks</button>
                                </div>
                            </div>
                        </div>
                        {trendsView === 'combined' && (
                        <div className="h-[386px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendsData} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="#94A3B8"
                                        fontSize={12}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#94A3B8"
                                        fontSize={12}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'revenue') {
                                                return [`$${value.toLocaleString()}`, 'Revenue'];
                                            }
                                            if (name === 'clients') {
                                                return [`${value}`, 'Clients'];
                                            }
                                            return [`${value}`, 'Tasks'];
                                        }}
                                        contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                    />
                                    <Legend verticalAlign="top" align="left" iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="revenue"
                                        fill="rgba(59, 130, 246, 0.15)"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        activeDot={{ r: 6, fill: '#3B82F6' }}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="clients"
                                        barSize={28}
                                        radius={[10, 10, 0, 0]}
                                        fill="#60A5FA"
                                        name="Clients"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="tasks"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10B981' }}
                                        name="Tasks"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        )}
                        {trendsView === 'split' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-[#E4ECFF] bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <h6 className="text-sm font-semibold text-[#1F2937]">Revenue</h6>
                                            <span className="text-xs font-medium text-[#94A3B8]">Last 12 months</span>
                                        </div>
                                        <div className="mt-4 h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={trendsData}>
                                                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
                                                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                                                    <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                                    <Tooltip
                                                        formatter={(value) => `$${value.toLocaleString()}`}
                                                        contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="revenue"
                                                        stroke="#22C55E"
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: '#22C55E' }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[#E4ECFF] bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <h6 className="text-sm font-semibold text-[#1F2937]">Clients</h6>
                                            <span className="text-xs font-medium text-[#94A3B8]">Last 12 months</span>
                                        </div>
                                        <div className="mt-4 h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={trendsData}>
                                                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
                                                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                                                    <YAxis stroke="#94A3B8" fontSize={11} />
                                                    <Tooltip
                                                        formatter={(value) => `${value}`}
                                                        contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                                    />
                                                    <Bar dataKey="clients" radius={[12, 12, 0, 0]} fill="#3B82F6" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-[#E4ECFF] bg-white p-4">
                                    <div className="flex items-center justify-between">
                                        <h6 className="text-sm font-semibold text-[#1F2937]">Tasks</h6>
                                        <span className="text-xs font-medium text-[#94A3B8]">Completion trend</span>
                                    </div>
                                    <div className="mt-4 h-60">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
                                                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                                                <YAxis stroke="#94A3B8" fontSize={11} />
                                                <Tooltip
                                                    formatter={(value) => `${value}`}
                                                    contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                                />
                                                <Area type="monotone" dataKey="tasks" stroke="#8B5CF6" strokeWidth={3} fill="url(#tasksGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                        {trendsView === 'table' && (
                            <div className="overflow-x-auto rounded-2xl">
                                 <div className="p-4">
                                    <h6 className="text-sm font-semibold text-[#1F2937]">Office Staff</h6>
                                    <span className="text-xs font-medium text-[#94A3B8]">All staff members assigned to this office location</span>
                                 </div>
                                <table className="min-w-full divide-y divide-[#E4ECFF] text-left text-sm text-[#4B5563]">
                                    <thead className="text-xs font-semibold  tracking-wide text-[#6B7280]">
                                        <tr>
                                            <th className="px-4 py-3">Month</th>
                                            <th className="px-4 py-3">Revenue</th>
                                            <th className="px-4 py-3">Clients</th>
                                            <th className="px-4 py-3">Tasks Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E4ECFF] bg-white">
                                        {trendsData.map((item) => (
                                            <tr key={item.month}>
                                                <td className="px-4 py-3 font-semibold text-gray-500">{item.month}</td>
                                                <td className="px-4 font-semibold py-3 text-gray-500">${item.revenue.toLocaleString()}</td>
                                                <td className="px-4 font-semibold py-3 text-gray-500">{item.clients}</td>
                                                <td className="px-4 font-semibold py-3 text-gray-500">{item.tasks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {trendsView === 'series' && (
                            <div className="rounded-2xl border border-[#E4ECFF] bg-white p-6 text-center text-sm text-[#6B7280]">
                                Detailed series view coming soon.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg p-6">
                                    <h6 className="text-base font-semibold text-gray-900 mb-4">Office Information</h6>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 5C10 8 6 11 6 11C6 11 2 8 2 5C2 3.93913 2.42143 2.92172 3.17157 2.17157C3.92172 1.42143 4.93913 1 6 1C7.06087 1 8.07828 1.42143 8.82843 2.17157C9.57857 2.92172 10 3.93913 10 5Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            <div>
                                                <p className="font-medium text-sm text-gray-700 mb-0">{office.address}</p>
                                                <p className="text-sm text-gray-700 mb-0">{office.city}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.0007 8.46005V9.96005C11.0013 10.0993 10.9727 10.2371 10.917 10.3647C10.8612 10.4923 10.7793 10.6068 10.6767 10.701C10.5741 10.7951 10.453 10.8668 10.3211 10.9114C10.1892 10.956 10.0494 10.9726 9.9107 10.96C8.37212 10.7929 6.8942 10.2671 5.5957 9.42505C4.38761 8.65738 3.36337 7.63313 2.5957 6.42505C1.75069 5.12065 1.22482 3.63555 1.0607 2.09005C1.0482 1.95178 1.06464 1.81243 1.10895 1.68086C1.15326 1.54929 1.22448 1.42839 1.31808 1.32586C1.41168 1.22332 1.5256 1.1414 1.65259 1.08531C1.77959 1.02922 1.91687 1.00018 2.0557 1.00005H3.5557C3.79835 0.99766 4.03359 1.08359 4.21758 1.24181C4.40156 1.40004 4.52174 1.61977 4.5557 1.86005C4.61901 2.34008 4.73642 2.81141 4.9057 3.26505C4.97297 3.44401 4.98753 3.63851 4.94765 3.82549C4.90777 4.01247 4.81513 4.1841 4.6807 4.32005L4.0457 4.95505C4.75748 6.20682 5.79393 7.24327 7.0457 7.95505L7.6807 7.32005C7.81664 7.18562 7.98828 7.09297 8.17526 7.0531C8.36224 7.01322 8.55674 7.02778 8.7357 7.09505C9.18934 7.26432 9.66067 7.38174 10.1407 7.44505C10.3836 7.47931 10.6054 7.60165 10.764 7.7888C10.9225 7.97594 11.0068 8.21484 11.0007 8.46005Z" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            <p className="text-sm text-gray-700 mb-0">{office.phone}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 2H2C1.44772 2 1 2.44772 1 3V9C1 9.55228 1.44772 10 2 10H10C10.5523 10 11 9.55228 11 9V3C11 2.44772 10.5523 2 10 2Z" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M11 3.5L6.515 6.35C6.36064 6.44671 6.18216 6.49801 6 6.49801C5.81784 6.49801 5.63936 6.44671 5.485 6.35L1 3.5" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>


                                            <p className="text-sm text-gray-700 mb-0">{office.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333ZM8 13.3333C5.05933 13.3333 2.66667 10.9407 2.66667 8C2.66667 5.05933 5.05933 2.66667 8 2.66667C10.9407 2.66667 13.3333 5.05933 13.3333 8C13.3333 10.9407 10.9407 13.3333 8 13.3333Z" fill="#6B7280" />
                                                <path d="M8.66667 4.66667V8.66667L11.3333 10.1333" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="text-sm text-gray-700 mb-0">{office.hours}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12.6667 2.66667H3.33333C2.59667 2.66667 2 3.26333 2 4V13.3333C2 14.07 2.59667 14.6667 3.33333 14.6667H12.6667C13.4033 14.6667 14 14.07 14 13.3333V4C14 3.26333 13.4033 2.66667 12.6667 2.66667Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10.6667 1.33333V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M5.33333 1.33333V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M2 6.66667H14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="text-sm text-gray-700 mb-0">Established: {office.established}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="bg-white rounded-lg p-6">
                                    <h6 className="text-base font-semibold text-gray-900 mb-4">Performance Metrics</h6>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Client Satisfaction</span>
                                                <span className="text-sm font-semibold text-gray-900">{office.clientSatisfaction}/5.0</span>
                                            </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#3AD6F2] h-2 rounded-full"
                                                    style={{ width: `${(office.clientSatisfaction / 5.0) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                                                <span className="text-sm font-semibold text-gray-900">{office.taskCompletionRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#3AD6F2] h-2 rounded-full"
                                                    style={{ width: `${office.taskCompletionRate}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Average Revenue per Client</span>
                                                <span className="text-sm font-semibold text-gray-900">${office.avgRevenuePerClient}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#3AD6F2] h-2 rounded-full"
                                                    style={{ width: '85%' }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h6 className="text-base font-semibold text-[#1F2937]">Top Performers</h6>
                                    <p className="text-sm text-[#6B7280]">
                                        Staff members with highest performance this month
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 overflow-hidden rounded-2xl border border-[#E4ECFF]">
                                <div className="hidden bg-[#F8FAFF] px-6 py-3 text-xs font-semibold tracking-wide text-[#6B7280] md:grid md:grid-cols-[2fr_1fr_1fr_1fr]">
                                    <span>Staff Member</span>
                                    <span>Role</span>
                                    <span className="text-center">Clients</span>
                                    <span className="text-right">Revenue Generated</span>
                                </div>

                                <div className="divide-y divide-[#E4ECFF]">
                                    {topPerformers.map((performer) => (
                                        <div
                                            key={performer.id}
                                            className="grid grid-cols-1 gap-4 px-4 py-4 text-sm text-[#4B5563] md:grid-cols-[2fr_1fr_1fr_1fr] md:px-6"
                                        >
                                            <div className="font-semibold text-gray-600">{performer.name}</div>
                                            <div className="font-semibold text-gray-600">{performer.role}</div>
                                            <div className="md:text-center font-semibold text-gray-600">{performer.clients}</div>
                                            <div className="md:text-right font-semibold text-gray-600">
                                                {performer.revenue ? `$${performer.revenue.toLocaleString()}` : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'team' && (
                    <div className="rounded-2xl bg-white p-6">
                        <div className="mb-4">
                            <h6 className="text-base font-semibold text-[#1F2937]">Office Staff</h6>
                            <p className="text-sm text-[#6B7280]">
                                All staff members assigned to this office location
                            </p>
                        </div>
                        <div className="h-[360px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={teamPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '8px 12px' }}
                                        formatter={(value, name) => {
                                            if (name === 'tasksCompleted') {
                                                return [value, 'Tasks Completed'];
                                            }
                                            return [`${value}%`, 'Utilization %'];
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="tasksCompleted"
                                        name="Tasks Completed"
                                        stroke="#4C1D95"
                                        strokeWidth={3}
                                        activeDot={{ r: 6, fill: '#4C1D95' }}
                                        dot={{ r: 4, fill: '#4C1D95' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="utilization"
                                        name="Utilization %"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        activeDot={{ r: 6, fill: '#10B981' }}
                                        dot={{ r: 4, fill: '#10B981' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

