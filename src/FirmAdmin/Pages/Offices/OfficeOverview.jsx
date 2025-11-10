import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCog, FaEdit } from 'react-icons/fa';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';

// Sample office data - in real app, this would come from an API or context
const sampleOffices = {
    '1': {
        id: '1',
        name: 'Main Office - Manhattan',
        location: 'New York, NY',
        status: 'Active',
        staff: 12,
        clients: 245,
        monthlyRevenue: 125000,
        growthRate: 12.5,
        address: '123 Business Ave',
        city: 'New York, NY 10001',
        email: 'Manhattan@Taxpracticepro.Com',
        phone: '123-456-7890',
        hours: 'Mon-Fri 9:00 AM - 6:00 PM',
        established: '2018-01-15',
        description: 'Our Flagship Location In The Heart Of Manhattan, Serving Individual And Business Clients.',
        clientSatisfaction: 4.9,
        taskCompletionRate: 94,
        avgRevenuePerClient: 510,
        staffUtilization: 87,
        clientRetention: 96,
        monthlyPerformanceData: [
            { month: 'Jan', value: 2.5 },
            { month: 'Feb', value: 3.5 },
            { month: 'Mar', value: 4 },
            { month: 'Apr', value: 6 },
            { month: 'May', value: 8 },
            { month: 'Jun', value: 10.5 },
            { month: 'Jul', value: 11.5 },
            { month: 'Aug', value: 12.5 }
        ],
        resourceManagement: {
            monthlyPerformance: [
                { name: 'Category A', value: 4500, color: '#3B82F6' },
                { name: 'Category B', value: 2100, color: '#10B981' },
                { name: 'Category C', value: 1200, color: '#F59E0B' },
                { name: 'Category D', value: 800, color: '#F97316' }
            ],
            roiComparison: [
                { location: 'New York', revenue: 16000, cost: 8000 },
                { location: 'London', revenue: 12000, cost: 8000 },
                { location: 'Mumbai', revenue: 10000, cost: 6000 }
            ],
            inventory: [
                { id: 1, item: 'Laptops', stock: 25, reorderAlert: 10, status: 'Okay' },
                { id: 2, item: 'Printers', stock: 8, reorderAlert: 5, status: 'Low' },
                { id: 3, item: 'Paper Stock', stock: 200, reorderAlert: 50, status: 'Okay' },
                { id: 4, item: 'Software Licenses', stock: 45, reorderAlert: 15, status: 'Okay' }
            ]
        },
        staffMembers: [
            {
                id: 1,
                name: 'Sarah Martinez',
                role: 'Office Manager',
                email: 'Sarah.Martinez@Firm.Com',
                phone: '(555) 111-1111',
                clients: 32,
                status: 'Active'
            },
            {
                id: 2,
                name: 'Michael Chen',
                role: 'Senior Tax Preparer',
                email: 'Michael.Chen@Firm.Com',
                phone: '(555) 222-2222',
                clients: 45,
                status: 'Active'
            },
            {
                id: 3,
                name: 'Jennifer Wilson',
                role: 'Tax Preparer',
                email: 'Jennifer.Wilson@Firm.Com',
                phone: '(555) 333-3333',
                clients: 38,
                status: 'Active'
            },
            {
                id: 4,
                name: 'Robert Johnson',
                role: 'Administrative Assistant',
                email: 'Robert.Johnson@Firm.Com',
                phone: '(555) 444-4444',
                clients: 0,
                status: 'Active'
            }
        ],
        officeClients: [
            {
                id: 1,
                name: 'ABC Corporation',
                type: 'Business',
                assignedTo: 'Michael Chen',
                lastService: 'Quarterly Filing',
                revenue: 15000,
                status: 'Active'
            },
            {
                id: 2,
                name: 'John Smith',
                type: 'Individual',
                assignedTo: 'Jennifer Wilson',
                lastService: 'Tax Return',
                revenue: 750,
                status: 'Active'
            },
            {
                id: 3,
                name: 'Tech Startup LLC',
                type: 'Business',
                assignedTo: 'Sarah Martinez',
                lastService: 'Business Setup',
                revenue: 8500,
                status: 'Active'
            }
        ]
    }
};

const schedulingOfficeOptions = ['All Offices', 'New York', 'London', 'Mumbai'];

const schedulingResources = [
    {
        id: 'conf-room-a',
        name: 'Conf Room A',
        office: 'New York',
        location: 'New York',
        type: 'Conference Room',
        slots: ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
        color: '#3AD6F2'
    },
    {
        id: 'zoom-license-1',
        name: 'Zoom License #1',
        office: 'Remote',
        location: 'Virtual',
        type: 'License',
        slots: ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
        color: '#10B981'
    },
    {
        id: 'printer-3',
        name: 'Printer 3',
        office: 'New York',
        location: 'Operations',
        type: 'Equipment',
        slots: ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
        color: '#F59E0B'
    }
];

const initialSchedulingEvents = [
    {
        id: 'evt-1',
        title: 'NY - Team Sync',
        date: '2025-07-22',
        startTime: '13:00',
        endTime: '14:00',
        resourceId: 'conf-room-a',
        office: 'New York',
        location: 'New York',
        status: 'Confirmed',
        badge: '+2 New'
    },
    {
        id: 'evt-2',
        title: 'NY - Interview',
        date: '2025-07-24',
        startTime: '10:00',
        endTime: '11:00',
        resourceId: 'conf-room-a',
        office: 'New York',
        location: 'New York',
        status: 'Pending',
        badge: 'Internal'
    }
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toISODate = (date) => date.toISOString().split('T')[0];

const isSameDay = (dateA, dateB) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

const normaliseTime = (time = '00:00') => {
    const [hours = '00', minutes = '00'] = time.split(':');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatTimeLabel = (time = '00:00') => {
    const [hours, minutes] = normaliseTime(time).split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const addMinutesToTime = (time = '00:00', minutesToAdd = 30) => {
    const [hours, minutes] = normaliseTime(time).split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + minutesToAdd);
    return normaliseTime(`${date.getHours()}:${date.getMinutes()}`);
};

const generateMonthlyCalendar = (referenceDate, events = []) => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const startDayOfWeek = startOfMonth.getDay();
    const previousMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const calendarDays = [];

    for (let i = startDayOfWeek; i > 0; i -= 1) {
        const date = new Date(year, month - 1, previousMonthDays - i + 1);
        const iso = toISODate(date);
        calendarDays.push({
            date,
            iso,
            isCurrentMonth: false,
            isToday: isSameDay(date, today),
            events: events.filter((event) => event.date === iso)
        });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const iso = toISODate(date);
        calendarDays.push({
            date,
            iso,
            isCurrentMonth: true,
            isToday: isSameDay(date, today),
            events: events.filter((event) => event.date === iso)
        });
    }

    let nextMonthDay = 1;
    while (calendarDays.length < 42) {
        const date = new Date(year, month + 1, nextMonthDay);
        const iso = toISODate(date);
        calendarDays.push({
            date,
            iso,
            isCurrentMonth: false,
            isToday: isSameDay(date, today),
            events: events.filter((event) => event.date === iso)
        });
        nextMonthDay += 1;
    }

    return calendarDays;
};

const formatSlotLabel = (slot) => {
    if (!slot?.date) {
        return 'No slot selected';
    }

    const date = new Date(slot.date);
    const dateLabel = date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
    });

    return `${dateLabel}${slot.time ? `, ${formatTimeLabel(slot.time)}` : ''}`;
};

// Helper function to get initials from name
const getInitials = (name) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export default function OfficeOverview() {
    const { officeId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [calendarView, setCalendarView] = useState('Monthly');
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2025, 6, 1));
    const [events, setEvents] = useState(initialSchedulingEvents);
    const [selectedOfficeFilter, setSelectedOfficeFilter] = useState('All Offices');
    const [searchTerm, setSearchTerm] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        title: '',
        office: 'All Offices',
        resource: ''
    });

    // Get office data - in real app, fetch from API based on officeId
    const office = sampleOffices[officeId] || sampleOffices['1'];

    const formatCurrency = (amount) => {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        }
        return `$${amount}`;
    };

    const tabs = [
        { id: 'Overview', label: 'Overview' },
        { id: 'Staff', label: `Staff (${office.staffMembers?.length || 0})` },
        { id: 'Clients', label: `Clients (${office.officeClients?.length || 0})` },
        { id: 'Performance', label: 'Performance' },
        { id: 'Resource Management', label: 'Resource Management' },
        { id: 'Scheduling & Coordination', label: 'Scheduling & Coordination' },
        { id: 'Compliance & Audit', label: 'Compliance & Audit' },
        { id: 'Settings', label: 'Settings' }
    ];

    const resourceLookup = useMemo(() => {
        return schedulingResources.reduce((accumulator, resource) => {
            accumulator[resource.id] = resource;
            return accumulator;
        }, {});
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const matchOffice =
                selectedOfficeFilter === 'All Offices' || event.office === selectedOfficeFilter;
            const matchSearch =
                !searchTerm ||
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (resourceLookup[event.resourceId]?.name || '')
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            return matchOffice && matchSearch;
        });
    }, [events, selectedOfficeFilter, searchTerm, resourceLookup]);

    const calendarDays = useMemo(
        () => generateMonthlyCalendar(currentCalendarDate, filteredEvents),
        [currentCalendarDate, filteredEvents]
    );

    const monthLabel = useMemo(
        () =>
            currentCalendarDate.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric'
            }),
        [currentCalendarDate]
    );

    const conflictSummary = useMemo(() => {
        return [...filteredEvents]
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
                return dateA - dateB;
            })
            .slice(0, 5);
    }, [filteredEvents]);

    const viewOptions = ['Day', 'Week', 'Monthly', 'Years', 'Agenda'];

    const handleCalendarNavigation = (direction) => {
        setCurrentCalendarDate((previousDate) => {
            return new Date(previousDate.getFullYear(), previousDate.getMonth() + direction, 1);
        });
    };

    const handleResetFilters = () => {
        setSelectedOfficeFilter('All Offices');
        setSearchTerm('');
    };

    const handleDaySelect = (day) => {
        const defaultResource = bookingForm.resource || '';
        setSelectedSlot({
            date: day.iso,
            time: '12:00',
            resourceId: defaultResource
        });
        setBookingForm((previous) => ({
            ...previous,
            office:
                selectedOfficeFilter !== 'All Offices'
                    ? selectedOfficeFilter
                    : previous.office,
            resource: defaultResource
        }));
        setIsBookingModalOpen(true);
    };

    const handleQuickSlotSelect = (resourceId, time) => {
        const normalisedTime = normaliseTime(time);
        const resource = resourceLookup[resourceId];
        setSelectedSlot({
            date: toISODate(new Date()),
            time: normalisedTime,
            resourceId
        });
        setBookingForm((previous) => ({
            ...previous,
            office:
                selectedOfficeFilter !== 'All Offices'
                    ? selectedOfficeFilter
                    : resource?.office || previous.office,
            resource: resourceId
        }));
        setIsBookingModalOpen(true);
    };

    const closeBookingModal = () => {
        setIsBookingModalOpen(false);
        setSelectedSlot(null);
        setBookingForm({
            title: '',
            office: 'All Offices',
            resource: ''
        });
    };

    const handleCreateBooking = () => {
        if (!bookingForm.title.trim() || !selectedSlot?.date) {
            return;
        }

        const resourceId =
            bookingForm.resource || selectedSlot.resourceId || schedulingResources[0]?.id;
        const normalisedStart = normaliseTime(selectedSlot.time || '09:00');
        const derivedOffice =
            bookingForm.office !== 'All Offices'
                ? bookingForm.office
                : resourceLookup[resourceId]?.office || 'All Offices';
        const newEvent = {
            id: `evt-${Date.now()}`,
            title: bookingForm.title.trim(),
            date: selectedSlot.date,
            startTime: normalisedStart,
            endTime: addMinutesToTime(normalisedStart, 60),
            resourceId,
            office: derivedOffice,
            location: resourceLookup[resourceId]?.location || 'New York',
            status: 'Scheduled',
            badge: 'New'
        };

        setEvents((previousEvents) => [...previousEvents, newEvent]);
        closeBookingModal();
    };

    return (
        <>
            <div className="p-6 bg-[rgb(243,247,255)] min-h-full">
            {/* Top Header Bar */}
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

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg p-2 mb-6 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-xs rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-[#3AD6F2] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            style={{ borderRadius: '8px' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area - Conditional Rendering Based on Active Tab */}
            {activeTab === 'Overview' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Office Information */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
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

                            {/* Office Performance - Map */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h6 className="text-base font-semibold text-gray-900 mb-4">Office Performance</h6>
                                <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                                    {/* Placeholder for map - in real app, use a map library like Google Maps or Mapbox */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 text-gray-400">
                                                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#9CA3AF" />
                                            </svg>
                                            <p className="text-sm text-gray-500">Map View</p>
                                            <p className="text-xs text-gray-400 mt-1">New York Area</p>
                                        </div>
                                    </div>
                                    {/* Map legend */}
                                    <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-xs text-gray-700">Offices</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div>
                            {/* Performance Metrics */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h6 className="text-base font-semibold text-gray-900 mb-4">Performance Metrics</h6>
                                <div className="space-y-6">
                                    {/* Client Satisfaction */}
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

                                    {/* Task Completion Rate */}
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

                                    {/* Average Revenue per Client */}
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

                    {/* Office Description Section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h6 className="text-lg font-semibold text-gray-900 mb-3">Office Description</h6>
                        <p className="text-sm text-gray-700">{office.description}</p>
                    </div>
                </>
            )}

            {/* Staff Tab Content */}
            {activeTab === 'Staff' && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="mb-6">
                        <p className="text-lg font-medium text-gray-600 mb-2">Office Staff</p>
                        <p className="text-sm text-gray-600">All staff members assigned to this office location</p>
                    </div>

                    {/* Table Header - Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-4 pb-3 mb-4">
                        <div className="col-span-3">
                            <span className="text-sm font-semibold text-gray-500">Staff Member</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm font-semibold text-gray-500">Role</span>
                        </div>
                        <div className="col-span-3">
                            <span className="text-sm font-semibold text-gray-500">Contact</span>
                        </div>
                        <div className="col-span-1 text-center">
                            <span className="text-sm font-semibold text-gray-500">Clients</span>
                        </div>
                        <div className="col-span-2 text-center">
                            <span className="text-sm font-semibold text-gray-500">Status</span>
                        </div>
                        <div className="col-span-1 text-center">
                            <span className="text-sm font-semibold text-gray-500">Actions</span>
                        </div>
                    </div>

                    {/* Staff Members List */}
                    <div className="space-y-3">
                        {office.staffMembers && office.staffMembers.map((staff) => (
                            <div key={staff.id} className="bg-white border border-gray-100 rounded-lg p-4 ">
                                {/* Mobile Layout */}
                                <div className="md:hidden space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-500">{getInitials(staff.name)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-700">{staff.name}</div>
                                            <div className="text-sm text-gray-600">{staff.role}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                                                {staff.status}
                                            </span>
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M2 12V14C2 14.5304 2.21071 15.0391 2.58579 15.4142C2.96086 15.7893 3.46957 16 4 16H12C12.5304 16 13.0391 15.7893 13.4142 15.4142C13.7893 15.0391 14 14.5304 14 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pl-[52px] space-y-1">
                                        <div className="text-sm text-gray-700">{staff.email}</div>
                                        <div className="text-sm text-gray-700">{staff.phone}</div>
                                        <div className="text-sm font-medium text-gray-700">Clients: {staff.clients}</div>
                                    </div>
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                    {/* Staff Member */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-700">{getInitials(staff.name)}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{staff.name}</span>
                                    </div>

                                    {/* Role */}
                                    <div className="col-span-2">
                                        <span className="text-sm font-medium text-gray-700">{staff.role}</span>
                                    </div>

                                    {/* Contact */}
                                    <div className="col-span-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">{staff.email}</span>
                                            <span className="text-sm text-gray-700">{staff.phone}</span>
                                        </div>
                                    </div>

                                    {/* Clients */}
                                    <div className="col-span-1 text-center">
                                        <span className="text-sm font-medium text-gray-700">{staff.clients}</span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex justify-center">
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                                            {staff.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-center">
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" stroke-width="0.5" />
                                                <path d="M3 12.003V12.75C3 13.3467 3.23705 13.919 3.65901 14.341C4.08097 14.7629 4.65326 15 5.25 15H12.75C13.3467 15 13.919 14.7629 14.341 14.341C14.7629 13.919 15 13.3467 15 12.75V12M9 3.375V11.625M9 11.625L11.625 9M9 11.625L6.375 9" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clients Tab Content */}
            {activeTab === 'Clients' && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="mb-6">
                        <p className="text-lg font-medium text-gray-600 mb-2">Office Clients</p>
                        <p className="text-sm text-gray-600">Clients served by this office location</p>
                    </div>

                    {/* Table Header - Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-4 pb-3 mb-4">
                        <div className="col-span-3">
                            <span className="text-sm font-semibold text-gray-500">Client</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm font-semibold text-gray-500">Type</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm font-semibold text-gray-500">Assigned To</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm font-semibold text-gray-500">Last Service</span>
                        </div>
                        <div className="col-span-1 text-center">
                            <span className="text-sm font-semibold text-gray-500">Revenue</span>
                        </div>
                        <div className="col-span-2 text-center">
                            <span className="text-sm font-semibold text-gray-500">Status</span>
                        </div>
                    </div>

                    {/* Clients List */}
                    <div className="space-y-3">
                        {office.officeClients && office.officeClients.map((client) => (
                            <div key={client.id} className="bg-white border border-gray-100 rounded-lg p-4">
                                {/* Mobile Layout */}
                                <div className="md:hidden space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-700 mb-1">{client.name}</div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                    {client.type}
                                                </span>
                                                <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                                                    {client.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-700">
                                            <span className="font-medium">Assigned To:</span> {client.assignedTo}
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            <span className="font-medium">Last Service:</span> {client.lastService}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">
                                            <span className="font-medium">Revenue:</span> ${client.revenue.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                    {/* Client */}
                                    <div className="col-span-3">
                                        <span className="text-sm font-medium text-gray-700">{client.name}</span>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2">
                                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                            {client.type}
                                        </span>
                                    </div>

                                    {/* Assigned To */}
                                    <div className="col-span-2">
                                        <span className="text-sm font-medium text-gray-700">{client.assignedTo}</span>
                                    </div>

                                    {/* Last Service */}
                                    <div className="col-span-2">
                                        <span className="text-sm text-gray-700">{client.lastService}</span>
                                    </div>

                                    {/* Revenue */}
                                    <div className="col-span-1 text-center">
                                        <span className="text-sm font-medium text-gray-700">${client.revenue.toLocaleString()}</span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex justify-center">
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                                            {client.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Tab Content */}
            {activeTab === 'Performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Performance Chart */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <p className="text-lg font-medium text-gray-600 mb-6">Monthly Performance</p>
                        <div className="relative" style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={office.monthlyPerformanceData}
                                    margin={{ top: 20, right: 80, left: 0, bottom: 20 }}
                                >
                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        stroke="#E5E7EB" 
                                        vertical={false}
                                        horizontal={true}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 400 }}
                                        interval={0}
                                        padding={{ left: 0, right: 0 }}
                                    />
                                    <YAxis
                                        domain={[0, 16]}
                                        ticks={[0, 4, 8, 12, 16]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 400 }}
                                        width={30}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={2.5}
                                        dot={{ 
                                            fill: '#ffffff', 
                                            r: 5, 
                                            strokeWidth: 2, 
                                            stroke: '#3B82F6',
                                            cursor: 'pointer'
                                        }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            {/* Growth Label for August - positioned near the last data point */}
                            <div className="absolute top-16 right-8">
                                <div className="bg-white border border-[#3AD6F2] rounded px-3 py-2 shadow-sm">
                                    <div className="text-xs font-medium text-gray-700">Aug</div>
                                    <div className="text-xs font-semibold text-[#3AD6F2]">Growth: 12.5</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <p className="text-lg font-medium text-gray-600 mb-6">Key Metrics</p>
                        <div className="space-y-6">
                            {/* Average Revenue per Client */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Average Revenue per Client:</span>
                                <span className="text-sm font-semibold text-gray-600">${office.avgRevenuePerClient}</span>
                            </div>

                            {/* Task Completion Rate */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Task Completion Rate:</span>
                                <span className="text-sm font-semibold text-gray-600">{office.taskCompletionRate}%</span>
                            </div>

                            {/* Staff Utilization */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Staff Utilization:</span>
                                <span className="text-sm font-semibold text-gray-600">{office.staffUtilization}%</span>
                            </div>

                            {/* Client Retention */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Client Retention:</span>
                                <span className="text-sm font-semibold text-gray-600">{office.clientRetention}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduling & Coordination Tab Content */}
            {activeTab === 'Scheduling & Coordination' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-[2.5fr_1fr] gap-6">
                        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {viewOptions.map((view) => (
                                            <button
                                                key={view}
                                                type="button"
                                                onClick={() => setCalendarView(view)}
                                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                                                    calendarView === view
                                                        ? 'bg-[#3AD6F2] text-white shadow-sm'
                                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#3AD6F2] hover:text-gray-900'
                                                }`}
                                            >
                                                {view}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleCalendarNavigation(-1)}
                                            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-[#3AD6F2] transition-colors flex items-center justify-center"
                                            aria-label="Previous period"
                                        >
                                            <span className="text-lg leading-none">&lt;</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentCalendarDate(new Date())}
                                            className="px-4 py-2 text-xs font-medium bg-white  rounded-lg hover:bg-[#25c2df] transition-colors"
                                        >
                                            Today
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCalendarNavigation(1)}
                                            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-[#3AD6F2] transition-colors flex items-center justify-center"
                                            aria-label="Next period"
                                        >
                                            <span className="text-lg leading-none">&gt;</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xl font-semibold text-gray-900 leading-none">
                                            {monthLabel}
                                        </p>
                                        {calendarView !== 'Monthly' && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Monthly view currently shown while additional views
                                                are under development.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <div key={day} className="text-center">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2 md:gap-3">
                                    {calendarDays.map((day) => {
                                        const isSelected = selectedSlot?.date === day.iso;
                                        return (
                                            <button
                                                type="button"
                                                key={day.iso + day.isCurrentMonth}
                                                onClick={() => handleDaySelect(day)}
                                                className={`relative h-24 md:h-28 w-full rounded-2xl border p-3 text-left transition-all ${
                                                    day.isCurrentMonth
                                                        ? 'bg-white text-gray-800'
                                                        : 'bg-gray-50 text-gray-400'
                                                } ${day.isToday ? 'border-[#3AD6F2]' : 'border-gray-100'} ${
                                                    isSelected ? 'ring-2 ring-[#3AD6F2]' : ''
                                                } hover:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]`}
                                            >
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        day.isCurrentMonth
                                                            ? 'text-gray-900'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {day.date.getDate()}
                                                </span>
                                                <div className="mt-2 space-y-2">
                                                    {day.events.slice(0, 2).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className="rounded-lg border border-[#E8F0FF] bg-[#F5F9FF] px-2 py-1"
                                                        >
                                                            <p className="text-xs font-semibold text-gray-800 truncate">
                                                                {event.title}
                                                            </p>
                                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                                <span className="truncate">
                                                                    {resourceLookup[event.resourceId]?.name ||
                                                                        'Resource'}
                                                                </span>
                                                                <span>{formatTimeLabel(event.startTime)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {day.events.length > 2 && (
                                                        <p className="text-[11px] font-medium text-[#3AD6F2]">
                                                            +{day.events.length - 2} more
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">
                                            Scheduling Controls
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Manage filters and search across office bookings.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="rounded-lg bg-[#F56D2D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        Reset
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                            Office
                                        </label>
                                        <select
                                            value={selectedOfficeFilter}
                                            onChange={(event) => setSelectedOfficeFilter(event.target.value)}
                                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/40"
                                        >
                                            {schedulingOfficeOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                            Search events
                                        </label>
                                        <input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            placeholder="Search events..."
                                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/40"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                                <div className="mb-4">
                                    <p className="text-base font-semibold text-gray-900">
                                        Resource Quick Timeline
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Quick book 30min slots for today
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    {schedulingResources.map((resource) => (
                                        <div key={resource.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {resource.name}
                                                </p>
                                                <span className="text-[11px] text-gray-500">
                                                    {resource.location}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {resource.slots.map((slot) => (
                                                    <button
                                                        type="button"
                                                        key={`${resource.id}-${slot}`}
                                                        onClick={() => handleQuickSlotSelect(resource.id, slot)}
                                                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-[#3AD6F2] hover:text-white transition-colors"
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                                <p className="text-base font-semibold text-gray-900 mb-4">Conflict Summary</p>
                                <div className="space-y-3">
                                    {conflictSummary.length > 0 ? (
                                        conflictSummary.map((event) => (
                                            <div key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {event.title} (
                                                    {resourceLookup[event.resourceId]?.name || 'Resource'})
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(event.date).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                    {' • '}
                                                    {event.location}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No conflicts detected for the selected filters.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Management Tab Content */}
            {activeTab === 'Resource Management' && (
                <div className="space-y-6">
                    {/* Top Section - Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Performance - Pie Chart */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-lg font-medium text-gray-600">Monthly Performance</p>
                                <div className="relative">
                                    <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent">
                                        <option>All Offices</option>
                                        <option>Office 1</option>
                                        <option>Office 2</option>
                                    </select>
                                    <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="relative" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={office.resourceManagement?.monthlyPerformance}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ value }) => `${value}`}
                                            outerRadius={100}
                                            fill="#F56D2D"
                                            dataKey="value"
                                        >
                                            {office.resourceManagement?.monthlyPerformance.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ROI Comparison - Bar Chart */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <p className="text-lg font-medium text-gray-600 mb-6">ROI Comparison</p>
                            <div className="relative" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={office.resourceManagement?.roiComparison}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                        <XAxis
                                            dataKey="location"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <YAxis
                                            domain={[0, 16000]}
                                            ticks={[0, 4000, 8000, 12000, 16000]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            width={60}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                padding: '8px 12px'
                                            }}
                                            labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                                        />
                                        <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
                                    <span className="text-xs text-gray-600">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
                                    <span className="text-xs text-gray-600">Cost</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Tracking Table */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <p className="text-lg font-medium text-gray-600 mb-6">Inventory Tracking</p>
                        <div className="overflow-x-auto">
                            {/* Table Header - Desktop */}
                            <div className="hidden md:grid grid-cols-12 gap-4 pb-3 mb-4 border-b border-gray-200">
                                <div className="col-span-3">
                                    <span className="text-sm font-semibold text-gray-500">Item</span>
                                </div>
                                <div className="col-span-3 text-center">
                                    <span className="text-sm font-semibold text-gray-500">Stock</span>
                                </div>
                                <div className="col-span-3 text-center">
                                    <span className="text-sm font-semibold text-gray-500">Reorder Alert</span>
                                </div>
                                <div className="col-span-3 text-center">
                                    <span className="text-sm font-semibold text-gray-500">Status</span>
                                </div>
                            </div>

                            {/* Table Rows */}
                            <div className="space-y-3">
                                {office.resourceManagement?.inventory.map((item) => (
                                    <div key={item.id} className="bg-white border border-gray-100 rounded-lg p-4">
                                        {/* Mobile Layout */}
                                        <div className="md:hidden space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm text-gray-700">{item.item}</div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    item.status === 'Okay' 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-red-500 text-white'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-700">
                                                    <span className="font-medium">Stock:</span> {item.stock}
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    <span className="font-medium">Reorder Alert:</span> {item.reorderAlert}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Layout */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-3">
                                                <span className="text-sm font-medium text-gray-700">{item.item}</span>
                                            </div>
                                            <div className="col-span-3 text-center">
                                                <span className="text-sm text-gray-700">{item.stock}</span>
                                            </div>
                                            <div className="col-span-3 text-center">
                                                <span className="text-sm text-gray-700">{item.reorderAlert}</span>
                                            </div>
                                            <div className="col-span-3 flex justify-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    item.status === 'Okay' 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-red-500 text-white'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
            {isBookingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-6">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">Create Booking</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Selected slot: <span className="font-medium text-gray-700">{formatSlotLabel(selectedSlot)}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeBookingModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Close booking modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Title</label>
                                <input
                                    value={bookingForm.title}
                                    onChange={(event) =>
                                        setBookingForm((previous) => ({
                                            ...previous,
                                            title: event.target.value
                                        }))
                                    }
                                    placeholder="Meeting title"
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/40"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Office</label>
                                <select
                                    value={bookingForm.office}
                                    onChange={(event) =>
                                        setBookingForm((previous) => ({
                                            ...previous,
                                            office: event.target.value
                                        }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/40"
                                >
                                    {schedulingOfficeOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Resource</label>
                                <select
                                    value={bookingForm.resource}
                                    onChange={(event) =>
                                        setBookingForm((previous) => ({
                                            ...previous,
                                            resource: event.target.value
                                        }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/40"
                                >
                                    <option value="">Select resource</option>
                                    {schedulingResources.map((resource) => (
                                        <option key={resource.id} value={resource.id}>
                                            {resource.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeBookingModal}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateBooking}
                                className="rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

