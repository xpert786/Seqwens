import React, { useState, useEffect } from "react";
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

const DEFAULT_CATEGORY_COLORS = {
    compliance: '#3B82F6',
    technical: '#EF4444',
    billing: '#10B981',
    account: '#8B5CF6',
    general: '#F59E0B',
    support: '#6366F1',
    operations: '#0EA5E9',
};

const FALLBACK_CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#6366F1', '#0EA5E9', '#F97316'];
const PREFERRED_CATEGORY_ORDER = ['compliance', 'technical', 'billing', 'account', 'general', 'support', 'operations'];

const createInitialOverviewData = () => ({
    counters: {
        total_tickets: 0,
        open: 0,
        in_progress: 0,
        closed_today: 0,
        avg_response_hours: 0,
        satisfaction_score: 0,
        resolved: 0,
    },
    charts: {
        avg_resolution_time: [],
        category_distribution: [],
        status_distribution: [],
        priority_distribution: [],
        top_issue_category: null,
    },
    recent_tickets: [],
    filters: {
        statuses: [],
        categories: [],
        priorities: [],
    },
});

const formatCategoryLabel = (category) => {
    if (!category) {
        return 'Unknown';
    }
    return category
        .toString()
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatMonthLabel = (month) => {
    if (!month) {
        return 'Unknown';
    }
    if (/^\d{4}-\d{2}$/.test(month)) {
        const [year, monthPart] = month.split('-');
        const parsedDate = new Date(Number(year), Number(monthPart) - 1);
        return parsedDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
    return month;
};

const getCategoryColor = (categoryKey, index = 0) => {
    const normalizedKey = categoryKey?.toLowerCase();
    if (normalizedKey && DEFAULT_CATEGORY_COLORS[normalizedKey]) {
        return DEFAULT_CATEGORY_COLORS[normalizedKey];
    }
    return FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length];
};

const normalizeOverviewResponse = (data) => {
    const initial = createInitialOverviewData();
    return {
        ...initial,
        ...data,
        counters: {
            ...initial.counters,
            ...(data?.counters || {}),
        },
        charts: {
            ...initial.charts,
            ...(data?.charts || {}),
        },
        filters: {
            ...initial.filters,
            ...(data?.filters || {}),
        },
        recent_tickets: data?.recent_tickets || [],
    };
};

const formatCategoryForAPI = (category) => {
    if (!category || category === 'all') {
        return '';
    }
    return formatCategoryLabel(category);
};

export default function Overview({ showHeader = false, onTicketDetailToggle }) {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [priorityFilter, setPriorityFilter] = useState("All Priority");
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [allTickets, setAllTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMenuTicketId, setActionMenuTicketId] = useState(null);
    const [actionBusyTicketId, setActionBusyTicketId] = useState(null);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignModalTicket, setAssignModalTicket] = useState(null);
    const [assignableAdmins, setAssignableAdmins] = useState([]);
    const [assignListLoading, setAssignListLoading] = useState(false);
    const [assignSubmitLoading, setAssignSubmitLoading] = useState(false);
    const [assignSelectedAdminId, setAssignSelectedAdminId] = useState(null);
    const [assignError, setAssignError] = useState(null);
    const [hasFetchedAssignableAdmins, setHasFetchedAssignableAdmins] = useState(false);

    // Client-side pagination for displaying ticket cards
    const [ticketCardsCurrentPage, setTicketCardsCurrentPage] = useState(1);
    const [showAllTicketCards, setShowAllTicketCards] = useState(false);
    const TICKET_CARDS_PER_PAGE = 3;

    // Overview/analytics data from API
    const [overviewData, setOverviewData] = useState(() => createInitialOverviewData());
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
                    setOverviewData(normalizeOverviewResponse(response.data));
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

    // Ensure the selected category remains valid when overview data updates
    useEffect(() => {
        const distribution = overviewData.charts?.category_distribution || [];
        if (!distribution.length) {
            return;
        }

        const normalizedSelected = selectedCategory?.toLowerCase();
        if (normalizedSelected === 'all') {
            return;
        }

        const availableCategories = distribution.map((item) => (item.category || 'other').toLowerCase());
        if (!availableCategories.includes(normalizedSelected)) {
            setSelectedCategory('all');
        }
    }, [overviewData.charts?.category_distribution, selectedCategory]);

    // Reset pagination when category changes
    useEffect(() => {
        setTicketCardsCurrentPage(1);
        setShowAllTicketCards(false);
    }, [selectedCategory]);

    useEffect(() => {
        const handleDocumentClick = (event) => {
            if (!event.target.closest('[data-ticket-action-menu="true"]')) {
                setActionMenuTicketId(null);
            }
        };

        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    // Fetch support tickets from API - Same pattern as MyTickets.jsx
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                console.log('🔄 Fetching support tickets...');
                setLoading(true);
                setError(null);

                const categoryFilter = formatCategoryForAPI(selectedCategory);

                const normalizedStatusFilter = statusFilter !== "All Status"
                    ? statusFilter.toLowerCase().replace(/\s+/g, "_")
                    : '';

                const normalizedPriorityFilter = priorityFilter !== "All Priority"
                    ? priorityFilter.toLowerCase()
                    : '';

                const response = await superAdminAPI.getSupportTickets(
                    1,
                    100, // Get a large number of tickets
                    searchTerm,
                    normalizedStatusFilter,
                    normalizedPriorityFilter,
                    categoryFilter
                );

                console.log('📋 Support tickets API response:', response);

                if (response.success && response.data) {
                    console.log('✅ Support tickets fetched successfully:', response.data);

                    // Use the same data structure as MyTickets.jsx
                    // Map API response to component format
                    const mappedTickets = response.data.map((ticket, index) => {
                        const categoryKey = (ticket.category || ticket.category_display || '').toLowerCase();
                        const priorityKey = (ticket.priority || ticket.priority_display || '').toLowerCase();
                        const statusKey = (ticket.status || ticket.status_display || '').toLowerCase();

                        const categoryLabel = ticket.category_display || formatCategoryLabel(ticket.category) || 'Other';
                        const priorityLabel = ticket.priority_display || formatCategoryLabel(ticket.priority) || 'Medium';
                        const statusLabel = ticket.status_display || formatCategoryLabel(ticket.status) || 'Open';

                        const updatedDate = ticket.updated_at ? new Date(ticket.updated_at) : null;
                        const fallbackDate = new Date();
                        const updatedDateDisplay = (updatedDate || fallbackDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                        const updatedTimeDisplay = (updatedDate || fallbackDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                        return {
                            id: ticket.id ?? index,
                            ticket_number: ticket.ticket_number || ticket.id?.toString(),
                            subject: ticket.subject || 'No Subject',
                            category: categoryLabel,
                            categoryKey: categoryKey || 'other',
                            firm: ticket.firm_name || ticket.firm || 'N/A',
                            contact: ticket.user_name || ticket.contact_name || ticket.contact || 'N/A',
                            priority: priorityLabel,
                            priorityKey: priorityKey || 'medium',
                            status: statusLabel,
                            statusKey: statusKey || 'open',
                            assignee: ticket.assigned_to_name || ticket.assignee || 'Unassigned',
                            updated: updatedDateDisplay,
                            time: updatedTimeDisplay,
                            created_at: ticket.created_at,
                            updated_at: ticket.updated_at,
                            description: ticket.description,
                            user_name: ticket.user_name || ticket.contact_name || 'N/A',
                            rawData: ticket // Keep raw data for details
                        };
                    });

                    setAllTickets(mappedTickets);
                    // Reset client-side pagination when data changes
                    setTicketCardsCurrentPage(1);
                    setShowAllTicketCards(false);
                } else {
                    console.log('❌ Failed to fetch support tickets:', response.message);
                    setError(response.message || 'Failed to fetch support tickets');
                    setAllTickets([]);
                    // Reset pagination on error
                    setTicketCardsCurrentPage(1);
                    setShowAllTicketCards(false);
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
                // Reset pagination on error
                setTicketCardsCurrentPage(1);
                setShowAllTicketCards(false);
            } finally {
                setLoading(false);
                console.log('🏁 Finished fetching support tickets');
            }
        };

        fetchTickets();
    }, [selectedCategory, statusFilter, priorityFilter, searchTerm, refreshCounter]);

    // Filter tickets based on selected category (already filtered by API, but keep for client-side filtering if needed)
    const normalizedSelectedCategory = selectedCategory?.toLowerCase();
    const tickets = normalizedSelectedCategory === 'all'
        ? allTickets
        : allTickets.filter((ticket) => {
            const ticketCategory = ticket.categoryKey || ticket.rawData?.category?.toLowerCase() || ticket.category?.toLowerCase() || '';
            return ticketCategory === normalizedSelectedCategory;
        });

    // Client-side pagination logic for ticket cards
    const totalTicketCards = tickets.length;
    const totalTicketCardsPages = Math.ceil(totalTicketCards / TICKET_CARDS_PER_PAGE);
    const shouldShowTicketCardsPagination = totalTicketCards > TICKET_CARDS_PER_PAGE && !showAllTicketCards;
    const displayedTicketCards = showAllTicketCards
        ? tickets
        : tickets.slice((ticketCardsCurrentPage - 1) * TICKET_CARDS_PER_PAGE, ticketCardsCurrentPage * TICKET_CARDS_PER_PAGE);

    const handleViewAllTicketCards = (e) => {
        e.preventDefault();
        setShowAllTicketCards(!showAllTicketCards);
        if (showAllTicketCards) {
            setTicketCardsCurrentPage(1);
        }
    };

    const handleTicketCardsPageChange = (newPage) => {
        setTicketCardsCurrentPage(newPage);
    };

    // Categories from API category_distribution
    const categoryDistribution = overviewData.charts?.category_distribution || [];
    const totalTicketsCount = overviewData.counters?.total_tickets
        ?? categoryDistribution.reduce((sum, item) => sum + (item.count || 0), 0);

    const categories = [
        {
            id: "all",
            label: "All",
            count: totalTicketsCount || allTickets.length,
            active: selectedCategory === "all"
        },
        ...categoryDistribution.map((item) => {
            const id = (item.category || 'other').toLowerCase();
            return {
                id,
                label: formatCategoryLabel(item.category),
                count: item.count || 0,
                active: selectedCategory === id
            };
        })
    ].filter((cat, index) => cat.id === 'all' || cat.count > 0 || selectedCategory === cat.id); // Show categories with count > 0 or currently selected

    // KPI data from API overview
    const avgResponseHours = overviewData.counters?.avg_response_hours;
    const satisfactionScore = overviewData.counters?.satisfaction_score;
    const resolvedCount = overviewData.counters?.resolved;
    const closedTodayCount = overviewData.counters?.closed_today;

    const avgResponseDisplay = typeof avgResponseHours === 'number' && !Number.isNaN(avgResponseHours)
        ? `${avgResponseHours.toFixed(1)} hrs`
        : "0 hrs";

    const satisfactionDisplay = typeof satisfactionScore === 'number' && !Number.isNaN(satisfactionScore)
        ? `${satisfactionScore.toFixed(1)}/5`
        : "N/A";

    const kpiData = [
        {
            label: "Total Tickets",
            value: (overviewData.counters?.total_tickets ?? 0).toString()
        },
        {
            label: "Open",
            value: (overviewData.counters?.open ?? 0).toString()
        },
        {
            label: "In Progress",
            value: (overviewData.counters?.in_progress ?? 0).toString()
        },
        {
            label: "Resolved",
            value: (resolvedCount ?? 0).toString()
        },
        {
            label: "Closed Today",
            value: (closedTodayCount ?? 0).toString()
        },
        {
            label: "Avg Response",
            value: avgResponseDisplay
        },
        {
            label: "Satisfaction",
            value: satisfactionDisplay
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
        const avgResolutionTime = overviewData.charts?.avg_resolution_time || [];

        if (!avgResolutionTime.length) {
            // Fallback to default data
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                    {
                        label: 'Compliance',
                        data: [9, 10, 9.5, 12.5, 11],
                        backgroundColor: getCategoryColor('compliance', 0),
                        borderColor: getCategoryColor('compliance', 0),
                        borderWidth: 0,
                    },
                    {
                        label: 'Technical',
                        data: [5, 5, 5, 6, 5.5],
                        backgroundColor: getCategoryColor('technical', 1),
                        borderColor: getCategoryColor('technical', 1),
                        borderWidth: 0,
                    },
                    {
                        label: 'Billing',
                        data: [4, 4.5, 4.5, 5.5, 5],
                        backgroundColor: getCategoryColor('billing', 2),
                        borderColor: getCategoryColor('billing', 2),
                        borderWidth: 0,
                    },
                ],
            };
        }

        const categorySet = new Set();
        avgResolutionTime.forEach((entry) => {
            (entry.categories || []).forEach((categoryItem) => {
                if (categoryItem?.category) {
                    categorySet.add(categoryItem.category.toLowerCase());
                }
            });
        });

        if (!categorySet.size) {
            return {
                labels: avgResolutionTime.map((item) => formatMonthLabel(item.month || item.period || '')),
                datasets: [],
            };
        }

        const sortedCategoryKeys = Array.from(categorySet).sort((a, b) => {
            const indexA = PREFERRED_CATEGORY_ORDER.indexOf(a);
            const indexB = PREFERRED_CATEGORY_ORDER.indexOf(b);
            if (indexA === -1 && indexB === -1) {
                return a.localeCompare(b);
            }
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        const labels = avgResolutionTime.map((item) => formatMonthLabel(item.month || item.period || ''));

        const datasets = sortedCategoryKeys.map((categoryKey, index) => {
            const color = getCategoryColor(categoryKey, index);
            const data = avgResolutionTime.map((entry) => {
                const matchedCategory = (entry.categories || []).find(
                    (categoryItem) => categoryItem?.category?.toLowerCase() === categoryKey
                );
                if (!matchedCategory) {
                    return 0;
                }
                const avgHours = typeof matchedCategory.avg_hours === 'number'
                    ? matchedCategory.avg_hours
                    : Number(matchedCategory.avg_hours);
                return Number.isFinite(avgHours) ? avgHours : 0;
            });

            return {
                label: formatCategoryLabel(categoryKey),
                data,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 0,
            };
        });

        return {
            labels,
            datasets,
        };
    };

    const resolutionTimeData = getResolutionTimeData();
    const resolutionValues = (resolutionTimeData.datasets || []).flatMap((dataset) => dataset.data || []);
    const calculatedMax = resolutionValues.length ? Math.max(...resolutionValues) : 0;
    const yAxisMax = calculatedMax > 0 ? Math.ceil(calculatedMax / 4) * 4 : 16;
    const resolutionLegendItems = (resolutionTimeData.datasets || []).map((dataset, index) => ({
        label: dataset.label,
        color: dataset.backgroundColor,
        key: `${dataset.label}-${index}`,
    }));

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
                max: Math.max(yAxisMax, 16),
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
        const distribution = overviewData.charts?.category_distribution || [];
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
        const labels = distribution.map(item => formatCategoryLabel(item.category));
        const data = distribution.map(item => total > 0 ? Math.round((item.count / total) * 100) : 0);

        const backgroundColor = distribution.map((item, index) =>
            getCategoryColor(item.category, index)
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
        setActionMenuTicketId(null);
        setSelectedTicketId(ticketId);
        if (onTicketDetailToggle) {
            onTicketDetailToggle(true);
        }
    };

    const handleToggleActionMenu = (event, ticketId) => {
        event.stopPropagation();
        setActionMenuTicketId((current) => (current === ticketId ? null : ticketId));
    };

    const extractAssigneeId = (ticket) => {
        return (
            ticket?.rawData?.assigned_to_id ??
            ticket?.rawData?.assignee_id ??
            ticket?.rawData?.assigned_to ??
            ticket?.rawData?.assignee ??
            null
        );
    };

    const openAssignModalForTicket = async (event, ticket) => {
        event.stopPropagation();
        setActionMenuTicketId(null);
        setAssignModalTicket(ticket);
        setAssignError(null);
        const initialAssigneeId = extractAssigneeId(ticket);
        setAssignSelectedAdminId(initialAssigneeId ? Number(initialAssigneeId) : null);
        setAssignModalOpen(true);

        if (!hasFetchedAssignableAdmins) {
            setAssignListLoading(true);
            try {
                const response = await superAdminAPI.getSupportAdmins();
                if (response?.success && Array.isArray(response.data)) {
                    setAssignableAdmins(response.data);
                    setHasFetchedAssignableAdmins(true);
                    if (!initialAssigneeId && response.data.length === 1) {
                        setAssignSelectedAdminId(response.data[0].id);
                    }
                } else {
                    throw new Error(response?.message || "Failed to fetch internal admins.");
                }
            } catch (err) {
                const message = handleAPIError(err);
                setAssignError(message);
                toast.error(message, {
                    position: "top-right",
                    autoClose: 3000,
                });
            } finally {
                setAssignListLoading(false);
            }
        }
    };

    const closeAssignModal = () => {
        if (assignSubmitLoading) {
            return;
        }
        setAssignModalOpen(false);
        setAssignModalTicket(null);
        setAssignSelectedAdminId(null);
        setAssignError(null);
    };

    const handleSubmitAssignTicket = async () => {
        const ticketIdentifier = assignModalTicket?.rawData?.id ?? assignModalTicket?.id;

        if (!ticketIdentifier) {
            toast.error("Ticket information is missing.", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        if (!assignSelectedAdminId) {
            toast.warn("Please select an administrator to assign.", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        setAssignSubmitLoading(true);
        try {
            const response = await superAdminAPI.assignSupportTicket(
                ticketIdentifier,
                assignSelectedAdminId
            );

            if (response?.success) {
                const assignedAdmin = assignableAdmins.find(
                    (admin) => admin.id === Number(assignSelectedAdminId)
                );

                toast.success(response?.message || "Ticket assigned successfully.", {
                    position: "top-right",
                    autoClose: 3000,
                });

                const assignedName =
                    assignedAdmin?.name ||
                    assignedAdmin?.full_name ||
                    assignedAdmin?.email ||
                    "Assigned";

                setAllTickets((previousTickets) =>
                    previousTickets.map((item) =>
                        (item.rawData?.id ?? item.id) === ticketIdentifier
                            ? {
                                ...item,
                                assignee: assignedName,
                                rawData: {
                                    ...item.rawData,
                                    assigned_to_id: Number(assignSelectedAdminId),
                                    assignee: assignedName,
                                },
                            }
                            : item
                    )
                );

                setRefreshCounter((previous) => previous + 1);
                closeAssignModal();
            } else {
                throw new Error(response?.message || "Failed to assign the ticket.");
            }
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setAssignSubmitLoading(false);
        }
    };

    const handleReplyToTicket = (event, ticketId) => {
        event.stopPropagation();
        setActionMenuTicketId(null);
        handleViewDetails(ticketId);
    };

    const handleCloseTicket = async (event, ticketId) => {
        event.stopPropagation();
        setActionMenuTicketId(null);
        setActionBusyTicketId(ticketId);
        try {
            await superAdminAPI.closeSupportTicket(ticketId);
            toast.success("Ticket closed successfully.", {
                position: "top-right",
                autoClose: 3000,
            });
            setRefreshCounter((previous) => previous + 1);
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setActionBusyTicketId(null);
        }
    };

    const handleBackToOverview = () => {
        setSelectedTicketId(null);
        if (onTicketDetailToggle) {
            onTicketDetailToggle(false);
        }
    };

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
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
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                        {resolutionLegendItems.length > 0 ? (
                            resolutionLegendItems.map((item) => (
                                <div key={item.key} className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded mr-2"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {item.label}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <span className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                No resolution data available yet
                            </span>
                        )}
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
                        {overviewData.charts?.category_distribution && overviewData.charts.category_distribution.length > 0 ? (
                            (() => {
                                const total = overviewData.charts.category_distribution.reduce((sum, item) => sum + item.count, 0);
                                return overviewData.charts.category_distribution.map((item, index) => {
                                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                    const categoryName = formatCategoryLabel(item.category);
                                    const color = getCategoryColor(item.category, index);
                                    return (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div
                                                    className="w-3 h-3 rounded mr-2"
                                                    style={{ backgroundColor: color }}
                                                ></div>
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
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                                Support Tickets ({tickets.length})
                            </h4>
                            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                All customer support requests and their current status
                            </p>
                        </div>
                        {totalTicketCards > TICKET_CARDS_PER_PAGE && (
                            <button
                                onClick={handleViewAllTicketCards}
                                className="text-black text-sm font-medium hover:underline cursor-pointer px-3 py-2 transition-colors"
                                style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}
                            >
                                {showAllTicketCards ? 'Show Less' : 'View All'}
                            </button>
                        )}
                    </div>
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
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] text-right">Actions</div>
                        </div>

                        {/* Empty State */}
                        {displayedTicketCards.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 font-[BasisGrotesquePro]">No tickets found</p>
                            </div>
                        )}

                        {/* Ticket Rows */}
                        {displayedTicketCards.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="grid grid-cols-8 gap-4 py-4 px-4 border border-[#E8F0FF] rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-shadow focus-within:ring-2 focus-within:ring-[#3B4A66]/40 focus-within:ring-offset-2"
                                role="button"
                                tabIndex={0}
                                onClick={() => handleViewDetails(ticket.id || ticket.ticket_number)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        handleViewDetails(ticket.id || ticket.ticket_number);
                                    }
                                }}
                            >
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
                                <div
                                    className="relative flex justify-end"
                                    data-ticket-action-menu="true"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={(event) => handleToggleActionMenu(event, ticket.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B4A66]/40"
                                        aria-haspopup="menu"
                                        aria-expanded={actionMenuTicketId === ticket.id}
                                        data-ticket-action-menu="true"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.27539 8.10156C4.57376 8.10156 4.85991 8.22009 5.07089 8.43107C5.28186 8.64205 5.40039 8.92819 5.40039 9.22656C5.40039 9.52493 5.28186 9.81108 5.07089 10.0221C4.85991 10.233 4.57376 10.3516 4.27539 10.3516C3.97702 10.3516 3.69087 10.233 3.47989 10.0221C3.26892 9.81108 3.15039 9.52493 3.15039 9.22656C3.15039 8.92819 3.26892 8.64205 3.47989 8.43107C3.69087 8.22009 3.97702 8.10156 4.27539 8.10156ZM8.77539 8.10156C9.07376 8.10156 9.35991 8.22009 9.57089 8.43107C9.78186 8.64205 9.90039 8.92819 9.90039 9.22656C9.90039 9.52493 9.78186 9.81108 9.57089 10.0221C9.35991 10.233 9.07376 10.3516 8.77539 10.3516C8.47702 10.3516 8.19087 10.233 7.9799 10.0221C7.76892 9.81108 7.65039 9.52493 7.65039 9.22656C7.65039 8.92819 7.76892 8.64205 7.9799 8.43107C8.19087 8.22009 8.47702 8.10156 8.77539 8.10156ZM13.2754 8.10156C13.5738 8.10156 13.8599 8.22009 14.0709 8.43107C14.2819 8.64205 14.4004 8.92819 14.4004 9.22656C14.4004 9.52493 14.2819 9.81108 14.0709 10.0221C13.8599 10.233 13.5738 10.3516 13.2754 10.3516C12.977 10.3516 12.6909 10.233 12.4799 10.0221C12.2689 9.81108 12.1504 9.52493 12.1504 9.22656C12.1504 8.92819 12.2689 8.64205 12.4799 8.43107C12.6909 8.22009 12.977 8.10156 13.2754 8.10156Z" fill="#131323" />
                                        </svg>

                                    </button>
                                    {actionMenuTicketId === ticket.id && (
                                        <div
                                            className="absolute right-0 top-10 z-20 w-44 bg-white border border-[#E8F0FF] rounded-lg shadow-lg py-1"
                                            data-ticket-action-menu="true"
                                        >
                                            <button
                                                type="button"
                                                className="w-full px-4 py-2 text-left text-sm text-[#3B4A66] hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                                                onClick={(event) => openAssignModalForTicket(event, ticket)}
                                                data-ticket-action-menu="true"
                                            >
                                                Assign Ticket
                                            </button>
                                            <button
                                                type="button"
                                                className="w-full px-4 py-2 text-left text-sm text-[#3B4A66] hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                                                onClick={(event) => handleReplyToTicket(event, ticket.id)}
                                                data-ticket-action-menu="true"
                                            >
                                                Reply to Ticket
                                            </button>
                                            <button
                                                type="button"
                                                className="w-full px-4 py-2 text-left text-sm text-[#B91C1C] hover:bg-red-50 transition-colors font-[BasisGrotesquePro] disabled:opacity-60"
                                                onClick={(event) => handleCloseTicket(event, ticket.id)}
                                                disabled={actionBusyTicketId === ticket.id}
                                                data-ticket-action-menu="true"
                                            >
                                                {actionBusyTicketId === ticket.id ? "Closing..." : "Close Ticket"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Client-side Pagination Controls */}
                {shouldShowTicketCardsPagination && (
                    <div className="flex items-center justify-between px-4 py-3 mt-4 border-t border-[#E8F0FF]">
                        <button
                            onClick={() => handleTicketCardsPageChange(ticketCardsCurrentPage - 1)}
                            disabled={ticketCardsCurrentPage === 1}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-[#E8F0FF] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                Page {ticketCardsCurrentPage} of {totalTicketCardsPages}
                            </span>
                        </div>
                        <button
                            onClick={() => handleTicketCardsPageChange(ticketCardsCurrentPage + 1)}
                            disabled={ticketCardsCurrentPage === totalTicketCardsPages}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-[#E8F0FF] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" data-ticket-action-menu="true">
                    <div
                        className="absolute inset-0"
                        style={{ background: 'var(--Color-overlay, #00000099)' }}
                        onClick={closeAssignModal}
                        data-ticket-action-menu="true"
                    ></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto border border-[#E8F0FF]" data-ticket-action-menu="true">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E8F0FF]" data-ticket-action-menu="true">
                            <div>
                                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                    Assign Ticket
                                </h3>
                                {assignModalTicket && (
                                    <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                        {assignModalTicket.ticket_number || assignModalTicket.id} · {assignModalTicket.subject}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={closeAssignModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Close"
                                disabled={assignSubmitLoading}
                                data-ticket-action-menu="true"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M15.7793 8.21899C16.0723 8.51196 16.0723 8.98682 15.7793 9.27979L12.9976 12.0615L15.777 14.8408C16.07 15.1338 16.07 15.6086 15.777 15.9016C15.484 16.1946 15.0092 16.1946 14.7162 15.9016L11.9369 13.1223L9.15759 15.9016C8.86462 16.1946 8.38976 16.1946 8.0968 15.9016C7.80383 15.6086 7.80383 15.1338 8.0968 14.8408L10.8761 12.0615L8.09444 9.27979C7.80147 8.98682 7.80147 8.51196 8.09444 8.21899C8.3874 7.92603 8.86227 7.92603 9.15523 8.21899L11.9369 10.9993L14.7186 8.21899C15.0115 7.92603 15.4864 7.92603 15.7793 8.21899Z" fill="#3B4A66" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-4" data-ticket-action-menu="true">
                            {assignError && (
                                <div className="text-sm text-[#B91C1C] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2 font-[BasisGrotesquePro]">
                                    {assignError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                    Select Administrator<span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg text-sm text-[#3B4A66] font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]"
                                    value={assignSelectedAdminId ?? ""}
                                    onChange={(event) => {
                                        setAssignSelectedAdminId(event.target.value ? Number(event.target.value) : null);
                                        if (assignError) {
                                            setAssignError(null);
                                        }
                                    }}
                                    disabled={assignListLoading || assignSubmitLoading}
                                    data-ticket-action-menu="true"
                                >
                                    <option value="">Choose an administrator</option>
                                    {assignableAdmins.map((admin) => (
                                        <option key={admin.id || admin.user_id} value={admin.id || admin.user_id}>
                                            {admin.name || admin.full_name || admin.email || `Admin ${admin.id}`}
                                        </option>
                                    ))}
                                </select>
                                {assignListLoading && (
                                    <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                        Loading administrators...
                                    </p>
                                )}
                                {!assignListLoading && assignableAdmins.length === 0 && !assignError && (
                                    <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                        No administrators available for assignment.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E8F0FF]" data-ticket-action-menu="true">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-md hover:bg-[#F8FAFC] transition-colors font-[BasisGrotesquePro]"
                                style={{ borderRadius: "7px" }}
                                onClick={closeAssignModal}
                                disabled={assignSubmitLoading}
                                data-ticket-action-menu="true"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-md hover:bg-[#E4561F] transition-colors disabled:opacity-60 font-[BasisGrotesquePro]"
                                style={{ borderRadius: "7px" }}
                                onClick={handleSubmitAssignTicket}
                                disabled={assignSubmitLoading || assignListLoading}
                                data-ticket-action-menu="true"
                            >
                                {assignSubmitLoading ? "Assigning..." : "Assign Ticket"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
