import React, { useState, useEffect, useRef } from "react";
import TicketDetail from "./TicketDetail";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Pie } from 'react-chartjs-2';
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    ChartDataLabels
);

export default function Overview({ showHeader = false, onTicketDetailToggle }) {
    const [selectedCategory, setSelectedCategory] = useState("compliance");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [priorityFilter, setPriorityFilter] = useState("All Priority");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [allTickets, setAllTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Overview/analytics data from API
    const [overviewData, setOverviewData] = useState({
        counters: {
            total_tickets: 0,
            open: 0,
            in_progress: 0,
            closed_today: 0,
            avg_response_hours: 0
        },
        category_distribution: [],
        avg_resolution_by_month: []
    });
    const [overviewLoading, setOverviewLoading] = useState(true);

    // Fetch overview/analytics data from API
    useEffect(() => {
        const fetchOverview = async () => {
            try {
                console.log('🔄 Fetching support overview data...');
                setOverviewLoading(true);

                const response = await superAdminAPI.getSupportOverview();
                console.log('📋 Support overview API response:', response);

                if (response.success && response.data) {
                    console.log('✅ Support overview fetched successfully:', response.data);
                    setOverviewData(response.data);
                } else {
                    console.log('❌ Failed to fetch support overview:', response.message);
                }
            } catch (err) {
                console.error('💥 Error fetching support overview:', err);
                // Don't show error toast for overview, just log it
            } finally {
                setOverviewLoading(false);
                console.log('🏁 Finished fetching support overview');
            }
        };

        fetchOverview();
    }, []);

    // Fetch support tickets from API - Same pattern as MyTickets.jsx
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                console.log('🔄 Fetching support tickets...');
                setLoading(true);
                setError(null);

                const categoryMapForAPI = {
                    "compliance": "Compliance",
                    "account": "Account",
                    "billing": "Billing",
                    "technical": "Technical"
                };

                const categoryFilter = categoryMapForAPI[selectedCategory] || selectedCategory || '';

                const response = await superAdminAPI.getSupportTickets(
                    1,
                    100, // Get a large number of tickets
                    searchTerm,
                    statusFilter !== "All Status" ? statusFilter : '',
                    priorityFilter !== "All Priority" ? priorityFilter : '',
                    categoryFilter
                );

                console.log('📋 Support tickets API response:', response);

                if (response.success && response.data) {
                    console.log('✅ Support tickets fetched successfully:', response.data);

                    // Use the same data structure as MyTickets.jsx
                    // Map API response to component format
                    const mappedTickets = response.data.map(ticket => ({
                        id: ticket.id,
                        ticket_number: ticket.ticket_number || ticket.id?.toString(),
                        subject: ticket.subject || 'No Subject',
                        category: ticket.category || 'Other',
                        firm: ticket.firm_name || ticket.firm || 'N/A',
                        contact: ticket.contact_name || ticket.user_name || ticket.contact || 'N/A',
                        priority: ticket.priority || 'Medium',
                        status: ticket.status || 'Open',
                        assignee: ticket.assigned_to_name || ticket.assignee || 'Unassigned',
                        updated: ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : new Date().toLocaleDateString(),
                        time: ticket.updated_at ? new Date(ticket.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString(),
                        created_at: ticket.created_at,
                        updated_at: ticket.updated_at,
                        description: ticket.description,
                        user_name: ticket.user_name || ticket.contact_name || 'N/A',
                        rawData: ticket // Keep raw data for details
                    }));

                    setAllTickets(mappedTickets);
                } else {
                    console.log('❌ Failed to fetch support tickets:', response.message);
                    setError(response.message || 'Failed to fetch support tickets');
                    setAllTickets([]);
                }
            } catch (err) {
                console.error('💥 Error fetching support tickets:', err);
                const errorMessage = handleAPIError(err);
                setError(errorMessage);
                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    icon: false,
                    className: "custom-toast-error",
                    bodyClassName: "custom-toast-body",
                });
                setAllTickets([]);
            } finally {
                setLoading(false);
                console.log('🏁 Finished fetching support tickets');
            }
        };

        fetchTickets();
    }, [selectedCategory, statusFilter, priorityFilter, searchTerm]);

    // Filter tickets based on selected category (already filtered by API, but keep for client-side filtering if needed)
    const tickets = allTickets.filter(ticket => {
        const categoryMapForFilter = {
            "compliance": "Compliance",
            "account": "Account",
            "billing": "Billing",
            "technical": "Technical"
        };
        const categoryLower = ticket.category?.toLowerCase() || '';
        const selectedCategoryValue = categoryMapForFilter[selectedCategory]?.toLowerCase() || selectedCategory?.toLowerCase() || '';
        return categoryLower === selectedCategoryValue || categoryLower === selectedCategory?.toLowerCase();
    });

    // Categories from API category_distribution
    const categoryMap = {
        "compliance": "Compliance",
        "account": "Account",
        "billing": "Billing",
        "technical": "Technical"
    };

    // Get category counts from API overview data
    const getCategoryCount = (categoryName) => {
        const categoryItem = overviewData.category_distribution?.find(
            item => item.category.toLowerCase() === categoryName.toLowerCase()
        );
        return categoryItem ? categoryItem.count : 0;
    };

    const categories = [
        {
            id: "compliance",
            label: "Compliance",
            count: getCategoryCount("compliance"),
            active: selectedCategory === "compliance"
        },
        {
            id: "account",
            label: "Account",
            count: getCategoryCount("account"),
            active: selectedCategory === "account"
        },
        {
            id: "billing",
            label: "Billing",
            count: getCategoryCount("billing"),
            active: selectedCategory === "billing"
        },
        {
            id: "technical",
            label: "Technical",
            count: getCategoryCount("technical"),
            active: selectedCategory === "technical"
        }
    ].filter(cat => cat.count > 0 || selectedCategory === cat.id); // Show categories with count > 0 or currently selected

    // KPI data from API overview
    const kpiData = [
        {
            label: "Total Tickets",
            value: overviewData.counters?.total_tickets?.toString() || "0"
        },
        {
            label: "Open",
            value: overviewData.counters?.open?.toString() || "0"
        },
        {
            label: "In Progress",
            value: overviewData.counters?.in_progress?.toString() || "0"
        },
        {
            label: "Closed Today",
            value: overviewData.counters?.closed_today?.toString() || "0"
        },
        {
            label: "Avg Response",
            value: overviewData.counters?.avg_response_hours
                ? `${overviewData.counters.avg_response_hours.toFixed(1)} hours`
                : "0 hours"
        },
        {
            label: "Satisfaction",
            value: "N/A" // Not in API response
        }
    ];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "High": return "bg-red-500 text-white";
            case "Medium": return "bg-yellow-500 text-white";
            case "Low": return "bg-green-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Open": return "bg-blue-500 text-white";
            case "In Progress": return "bg-yellow-500 text-white";
            case "Closed": return "bg-green-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    // Chart data for Average Resolution Time - from API (fallback to default if no data)
    const getResolutionTimeData = () => {
        const avgResolutionByMonth = overviewData.avg_resolution_by_month || [];

        if (avgResolutionByMonth.length === 0) {
            // Fallback to default data
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                    {
                        label: 'Compliance',
                        data: [9, 10, 9.5, 12.5, 11],
                        backgroundColor: '#3B82F6',
                        borderColor: '#3B82F6',
                        borderWidth: 0,
                    },
                    {
                        label: 'Technical',
                        data: [5, 5, 5, 6, 5.5],
                        backgroundColor: '#EF4444',
                        borderColor: '#EF4444',
                        borderWidth: 0,
                    },
                    {
                        label: 'Billing',
                        data: [4, 4.5, 4.5, 5.5, 5],
                        backgroundColor: '#10B981',
                        borderColor: '#10B981',
                        borderWidth: 0,
                    },
                ],
            };
        }

        // Process API data for resolution time chart
        // Assuming avg_resolution_by_month has format like:
        // [{ month: 'Jan', compliance: 9, technical: 5, billing: 4 }, ...]
        const labels = avgResolutionByMonth.map(item => item.month || item.period);
        const complianceData = avgResolutionByMonth.map(item => item.compliance || 0);
        const technicalData = avgResolutionByMonth.map(item => item.technical || 0);
        const billingData = avgResolutionByMonth.map(item => item.billing || 0);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Compliance',
                    data: complianceData,
                    backgroundColor: '#3B82F6',
                    borderColor: '#3B82F6',
                    borderWidth: 0,
                },
                {
                    label: 'Technical',
                    data: technicalData,
                    backgroundColor: '#EF4444',
                    borderColor: '#EF4444',
                    borderWidth: 0,
                },
                {
                    label: 'Billing',
                    data: billingData,
                    backgroundColor: '#10B981',
                    borderColor: '#10B981',
                    borderWidth: 0,
                },
            ],
        };
    };

    const resolutionTimeData = getResolutionTimeData();

    const resolutionTimeOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'white',
                titleColor: '#3B4A66',
                bodyColor: '#3B4A66',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const datasetLabel = context.dataset.label;
                        const value = context.parsed.y;
                        return `${datasetLabel}: ${value} Hrs`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 16,
                ticks: {
                    stepSize: 4,
                    callback: function (value) {
                        return value + ' Hrs';
                    }
                },
                grid: {
                    color: '#E5E7EB',
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
        interaction: {
            intersect: false,
        },
    };

    // Chart data for Top Issue Category - from API
    const getCategoryChartData = () => {
        const distribution = overviewData.category_distribution || [];
        if (distribution.length === 0) {
            // Fallback to default data
            return {
                labels: ['Compliance', 'Billing', 'Technical'],
                datasets: [{
                    data: [60, 25, 15],
                    backgroundColor: ['#10B981', '#3B82F6', '#F97316'],
                    borderColor: ['#10B981', '#3B82F6', '#F97316'],
                    borderWidth: 0,
                }]
            };
        }

        // Calculate percentages
        const total = distribution.reduce((sum, item) => sum + item.count, 0);
        const labels = distribution.map(item => {
            const catName = item.category.charAt(0).toUpperCase() + item.category.slice(1);
            return categoryMap[item.category.toLowerCase()] || catName;
        });
        const data = distribution.map(item => total > 0 ? Math.round((item.count / total) * 100) : 0);

        // Color mapping
        const colorMap = {
            'compliance': '#10B981',
            'account': '#8B5CF6',
            'billing': '#3B82F6',
            'technical': '#F97316'
        };

        const backgroundColor = distribution.map(item =>
            colorMap[item.category.toLowerCase()] || '#6B7280'
        );

        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 0,
            }],
        };
    };

    const issueCategoryData = getCategoryChartData();

    const issueCategoryOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            datalabels: {
                display: true,
                color: '#3B4A66',
                font: {
                    weight: 'bold',
                    size: 12
                },
                formatter: (value, context) => {
                    return `${context.chart.data.labels[context.dataIndex]}: ${value}%`;
                },
                anchor: 'end',
                align: 'end',
                offset: 20
            },
            tooltip: {
                backgroundColor: 'white',
                titleColor: '#3B4A66',
                bodyColor: '#3B4A66',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const value = context.parsed;
                        return `${context.label}: ${value}%`;
                    }
                }
            }
        },
        layout: {
            padding: {
                right: 100
            }
        }
    };

    // Action handlers - Same pattern as MyTickets.jsx
    const handleViewDetails = async (ticketId) => {
        console.log('🔄 View Details for ticket:', ticketId);
        setSelectedTicketId(ticketId);
        setActiveDropdown(null);
        if (onTicketDetailToggle) {
            onTicketDetailToggle(true);
        }
    };

    const handleAssign = (ticketId) => {
        console.log('Assign ticket:', ticketId);
        setActiveDropdown(null);
    };

    const handleReply = (ticketId) => {
        console.log('Reply to ticket:', ticketId);
        setActiveDropdown(null);
    };

    const handleCloseTicket = (ticketId) => {
        console.log('Close ticket:', ticketId);
        setActiveDropdown(null);
    };

    const handleBackToOverview = () => {
        setSelectedTicketId(null);
        if (onTicketDetailToggle) {
            onTicketDetailToggle(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    // If a ticket is selected, show the ticket detail within the same layout
    if (selectedTicketId) {
        return (
            <div className="space-y-4">
                <TicketDetail ticketId={selectedTicketId} onBack={handleBackToOverview} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {kpiData.map((kpi, index) => (
                    <div key={index} className="bg-white border border-[#E8F0FF] rounded-lg p-3">
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                            {kpi.label}
                        </div>
                        <div className="text-2xl font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                            {kpi.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average Resolution Time Chart */}
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                            Avg Resolution Time
                        </h4>
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            Resolution speed you can measure
                        </p>
                    </div>

                    {/* Chart */}
                    <div className="h-64">
                        <Bar data={resolutionTimeData} options={resolutionTimeOptions} />
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center space-x-4 mt-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                            <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">Compliance</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                            <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">Technical</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                            <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">Billing</span>
                        </div>
                    </div>
                </div>

                {/* Top Issue Category Chart */}
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                            Top Issue Category
                        </h4>
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            Where most tickets begin.
                        </p>
                    </div>

                    {/* Chart */}
                    <div className="h-64">
                        <Pie data={issueCategoryData} options={issueCategoryOptions} />
                    </div>

                    {/* Legend - Dynamic from API */}
                    <div className="space-y-2 mt-4">
                        {overviewData.category_distribution && overviewData.category_distribution.length > 0 ? (
                            (() => {
                                const total = overviewData.category_distribution.reduce((sum, item) => sum + item.count, 0);
                                const colorMap = {
                                    'compliance': 'bg-green-500',
                                    'account': 'bg-purple-500',
                                    'billing': 'bg-blue-500',
                                    'technical': 'bg-orange-500'
                                };
                                return overviewData.category_distribution.map((item, index) => {
                                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                    const categoryName = categoryMap[item.category.toLowerCase()] ||
                                        (item.category.charAt(0).toUpperCase() + item.category.slice(1));
                                    const colorClass = colorMap[item.category.toLowerCase()] || 'bg-gray-500';
                                    return (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 ${colorClass} rounded mr-2`}></div>
                                                <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">
                                                    {categoryName}: {percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            // Fallback legend
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                                        <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">Compliance: 60%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                                        <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">Billing: 25%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                                        <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">Technical: 15%</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Support Tickets Section */}
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                {/* Header */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                        Support Tickets ({tickets.length})
                    </h4>
                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                        All customer support requests and their current status
                    </p>
                </div>

                {/* Category Filters */}
                <div className="flex space-x-2 mb-4 border border-[#E8F0FF] rounded-lg p-2 w-fit">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium font-[BasisGrotesquePro] transition-colors ${selectedCategory === category.id
                                ? "bg-[#3B4A66] text-white"
                                : "bg-transparent text-[#3B4A66] hover:bg-[#F3F7FF]"
                                }`} style={{
                                    borderRadius: "8px",
                                }}
                        >
                            {category.label} ({category.count})
                        </button>
                    ))}
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1 w-[10%]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                            placeholder="Search, Tickets or Users.."
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                        >
                            <option value="All Status">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                        >
                            <option value="All Priority">All Priority</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 font-[BasisGrotesquePro]">Loading tickets...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="text-center py-8">
                        <p className="text-red-500 font-[BasisGrotesquePro]">{error}</p>
                    </div>
                )}

                {/* Tickets Table */}
                {!loading && !error && (
                    <div className="space-y-3">
                        {/* Header Row */}
                        <div className="grid grid-cols-8 gap-4 py-3 px-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Ticket ID</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Subject</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Firm</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Priority</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Status</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Assignee</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Updated</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Actions</div>
                        </div>

                        {/* Empty State */}
                        {tickets.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 font-[BasisGrotesquePro]">No tickets found</p>
                            </div>
                        )}

                        {/* Ticket Rows */}
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="grid grid-cols-8 gap-4 py-4 px-4 border border-[#E8F0FF] rounded-lg bg-white hover:bg-gray-50">
                                {/* Ticket ID */}
                                <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {ticket.ticket_number || ticket.id}
                                </div>

                                {/* Subject */}
                                <div className="col-span-1">
                                    <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {ticket.subject}
                                    </div>
                                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                        {ticket.category}
                                    </div>
                                </div>

                                {/* Firm */}
                                <div className="col-span-1">
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {ticket.firm}
                                    </div>
                                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                        {ticket.contact}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </div>

                                {/* Status */}
                                <div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>

                                {/* Assignee */}
                                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {ticket.assignee}
                                </div>

                                {/* Updated */}
                                <div>
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {ticket.updated}
                                    </div>
                                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                        {ticket.time}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="relative dropdown-container">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                                        onClick={() => setActiveDropdown(activeDropdown === ticket.id ? null : ticket.id)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeDropdown === ticket.id && (
                                        <div className="absolute right-0 top-8 bg-white border border-[#E8F0FF] rounded-lg z-10 min-w-[160px]">
                                            <div className="py-1">
                                                <button
                                                    onClick={() => handleViewDetails(ticket.id || ticket.ticket_number)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleAssign(ticket.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]"
                                                >
                                                    Assign
                                                </button>
                                                <button
                                                    onClick={() => handleReply(ticket.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]"
                                                >
                                                    Reply
                                                </button>
                                                <button
                                                    onClick={() => handleCloseTicket(ticket.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-[BasisGrotesquePro]"
                                                >
                                                    Close Ticket
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
