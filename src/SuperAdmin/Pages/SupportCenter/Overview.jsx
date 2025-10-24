import React, { useState } from "react";
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

export default function Overview() {
    const [selectedCategory, setSelectedCategory] = useState("compliance");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [priorityFilter, setPriorityFilter] = useState("All Priority");

    const kpiData = [
        { label: "Total Tickets", value: "247" },
        { label: "Open", value: "23" },
        { label: "In Progress", value: "15" },
        { label: "Closed Today", value: "8" },
        { label: "Avg Response", value: "2.4 hours" },
        { label: "Satisfaction", value: "543" }
    ];

    const allTickets = [
        // Compliance Tickets
        {
            id: "TICK-001",
            subject: "Unable to process payments",
            category: "Compliance",
            firm: "Johnson & Associates",
            contact: "Michael Johnson",
            priority: "High",
            status: "Open",
            assignee: "Sarah Wilson",
            updated: "2024-01-15",
            time: "14:20"
        },
        {
            id: "TICK-002",
            subject: "Document upload not working",
            category: "Compliance",
            firm: "Metro Tax Services",
            contact: "Sarah Martinez",
            priority: "Medium",
            status: "In Progress",
            assignee: "John Davis",
            updated: "2024-01-15",
            time: "10:15"
        },
        {
            id: "TICK-003",
            subject: "Tax form validation error",
            category: "Compliance",
            firm: "ABC Tax Group",
            contact: "Robert Smith",
            priority: "High",
            status: "Open",
            assignee: "Sarah Wilson",
            updated: "2024-01-14",
            time: "16:30"
        },
        {
            id: "TICK-004",
            subject: "Audit trail missing",
            category: "Compliance",
            firm: "Tax Solutions Inc",
            contact: "Emily Brown",
            priority: "Low",
            status: "Closed",
            assignee: "John Davis",
            updated: "2024-01-13",
            time: "09:45"
        },
        // Billing Tickets
        {
            id: "TICK-005",
            subject: "Invoice generation failed",
            category: "Billing",
            firm: "Premium Tax Services",
            contact: "David Lee",
            priority: "High",
            status: "Open",
            assignee: "Mike Johnson",
            updated: "2024-01-15",
            time: "13:20"
        },
        {
            id: "TICK-006",
            subject: "Payment processing delay",
            category: "Billing",
            firm: "Elite Accounting",
            contact: "Lisa Wang",
            priority: "Medium",
            status: "In Progress",
            assignee: "Mike Johnson",
            updated: "2024-01-14",
            time: "11:30"
        },
        // Technical Tickets
        {
            id: "TICK-007",
            subject: "System login issues",
            category: "Technical",
            firm: "Quick Tax Pro",
            contact: "James Wilson",
            priority: "High",
            status: "Open",
            assignee: "Alex Chen",
            updated: "2024-01-15",
            time: "15:45"
        },
        {
            id: "TICK-008",
            subject: "Database connection timeout",
            category: "Technical",
            firm: "Tax Masters",
            contact: "Jennifer Taylor",
            priority: "Medium",
            status: "In Progress",
            assignee: "Alex Chen",
            updated: "2024-01-14",
            time: "12:15"
        },
        {
            id: "TICK-009",
            subject: "API integration error",
            category: "Technical",
            firm: "Smart Tax Solutions",
            contact: "Mark Anderson",
            priority: "Low",
            status: "Closed",
            assignee: "Alex Chen",
            updated: "2024-01-13",
            time: "14:20"
        }
    ];

    // Filter tickets based on selected category
    const tickets = allTickets.filter(ticket => 
        ticket.category.toLowerCase() === selectedCategory
    );

    const categories = [
        { id: "compliance", label: "Compliance", count: allTickets.filter(t => t.category === "Compliance").length, active: true },
        { id: "billing", label: "Billing", count: allTickets.filter(t => t.category === "Billing").length, active: false },
        { id: "technical", label: "Technical", count: allTickets.filter(t => t.category === "Technical").length, active: false }
    ];

    // Update KPI data based on filtered tickets
    const filteredKpiData = [
        { label: "Total Tickets", value: tickets.length.toString() },
        { label: "Open", value: tickets.filter(t => t.status === "Open").length.toString() },
        { label: "In Progress", value: tickets.filter(t => t.status === "In Progress").length.toString() },
        { label: "Closed Today", value: tickets.filter(t => t.status === "Closed").length.toString() },
        { label: "Avg Response", value: "2.4 hours" },
        { label: "Satisfaction", value: "543" }
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

    // Chart data for Average Resolution Time
    const resolutionTimeData = {
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
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
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
                    callback: function(value) {
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

    // Chart data for Top Issue Category
    const issueCategoryData = {
        labels: ['Compliance', 'Billing', 'Technical'],
        datasets: [
            {
                data: [60, 25, 15],
                backgroundColor: ['#10B981', '#3B82F6', '#F97316'],
                borderColor: ['#10B981', '#3B82F6', '#F97316'],
                borderWidth: 0,
            },
        ],
    };

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
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
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

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {filteredKpiData.map((kpi, index) => (
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
                    
                    {/* Legend */}
                    <div className="space-y-2 mt-4">
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
                            className={`px-3 py-1 rounded-lg text-sm font-medium font-[BasisGrotesquePro] transition-colors ${
                                selectedCategory === category.id
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

                {/* Tickets Table */}
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

                    {/* Ticket Rows */}
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="grid grid-cols-8 gap-4 py-4 px-4 border border-[#E8F0FF] rounded-lg bg-white hover:bg-gray-50">
                            {/* Ticket ID */}
                            <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                {ticket.id}
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
                            <div>
                                <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
