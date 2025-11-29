import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCog, FaEdit, FaArrowLeft } from 'react-icons/fa';
import { firmOfficeAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
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
import sampleOffices from './sampleOffices';
import { Link } from 'react-router-dom';

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
    const [taxPrepUrl, setTaxPrepUrl] = useState('https://www.grammarly.com/');
    const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
    const [branding, setBranding] = useState({
        loginUrl: 'https://www.logo.com/',
        faviconUrl: 'https://www.favicon.com/',
        primaryColor: '#3AD6F2',
        secondaryColor: '#F56D2D',
        customDomain: 'sub.myfirm.com'
    });

    // Office data state
    const [office, setOffice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Staff members state
    const [staffMembers, setStaffMembers] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState('');
    const [staffCount, setStaffCount] = useState(0);

    // Clients state
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientsError, setClientsError] = useState('');
    const [clientsCount, setClientsCount] = useState(0);

    // Performance state
    const [performanceData, setPerformanceData] = useState(null);
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [performanceError, setPerformanceError] = useState('');

    // Fetch office details from API
    useEffect(() => {
        const fetchOfficeDetails = async () => {
            if (!officeId) {
                setError('Office ID is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const response = await firmOfficeAPI.getOffice(officeId);

                if (response.success && response.data) {
                    setOffice(response.data);
                } else {
                    throw new Error(response.message || 'Failed to load office details');
                }
            } catch (err) {
                console.error('Error fetching office details:', err);
                const errorMsg = handleAPIError(err);
                setError(errorMsg || 'Failed to load office details. Please try again.');
                toast.error(errorMsg || 'Failed to load office details', {
                    position: 'top-right',
                    autoClose: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOfficeDetails();
    }, [officeId]);

    // Fetch staff members when Staff tab is active
    useEffect(() => {
        const fetchStaffMembers = async () => {
            if (activeTab !== 'Staff' || !officeId) {
                return;
            }

            try {
                setStaffLoading(true);
                setStaffError('');

                const response = await firmOfficeAPI.getOfficeStaff(officeId);

                if (response.success && response.data) {
                    setStaffMembers(response.data.staff_members || []);
                    setStaffCount(response.data.staff_count || response.data.staff_members?.length || 0);
                } else {
                    throw new Error(response.message || 'Failed to load staff members');
                }
            } catch (err) {
                console.error('Error fetching staff members:', err);
                const errorMsg = handleAPIError(err);
                setStaffError(errorMsg || 'Failed to load staff members');
                setStaffMembers([]);
            } finally {
                setStaffLoading(false);
            }
        };

        fetchStaffMembers();
    }, [activeTab, officeId]);

    // Fetch clients when Clients tab is active
    useEffect(() => {
        const fetchClients = async () => {
            if (activeTab !== 'Clients' || !officeId) {
                return;
            }

            try {
                setClientsLoading(true);
                setClientsError('');

                const response = await firmOfficeAPI.getOfficeClients(officeId);

                if (response.success && response.data) {
                    setClients(response.data.clients || []);
                    setClientsCount(response.data.clients_count || response.data.clients?.length || 0);
                } else {
                    throw new Error(response.message || 'Failed to load clients');
                }
            } catch (err) {
                console.error('Error fetching clients:', err);
                const errorMsg = handleAPIError(err);
                setClientsError(errorMsg || 'Failed to load clients');
                setClients([]);
            } finally {
                setClientsLoading(false);
            }
        };

        fetchClients();
    }, [activeTab, officeId]);

    // Fetch performance data when Performance tab is active
    useEffect(() => {
        const fetchPerformance = async () => {
            if (activeTab !== 'Performance' || !officeId) {
                return;
            }

            try {
                setPerformanceLoading(true);
                setPerformanceError('');

                const response = await firmOfficeAPI.getOfficePerformance(officeId);

                if (response.success && response.data) {
                    setPerformanceData(response.data);
                } else {
                    throw new Error(response.message || 'Failed to load performance data');
                }
            } catch (err) {
                console.error('Error fetching performance data:', err);
                const errorMsg = handleAPIError(err);
                setPerformanceError(errorMsg || 'Failed to load performance data');
                setPerformanceData(null);
            } finally {
                setPerformanceLoading(false);
            }
        };

        fetchPerformance();
    }, [activeTab, officeId]);

    // Fallback to sample data if API fails (for development)
    const officeData = office || sampleOffices[officeId] || sampleOffices['1'] || {};

    const formatCurrency = (amount) => {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        }
        return `$${amount}`;
    };

    const tabs = [
        { id: 'Overview', label: 'Overview' },
        { id: 'Staff', label: `Staff (${staffCount || officeData?.staff_count || officeData?.staffMembers?.length || 0})` },
        { id: 'Clients', label: `Clients (${clientsCount || officeData?.clients_count || officeData?.officeClients?.length || 0})` },
        { id: 'Performance', label: 'Performance' },
        { id: 'Resource Management', label: 'Resource Management' },
        { id: 'Scheduling & Coordination', label: 'Scheduling & Coordination' },
        { id: 'Compliance & Audit', label: 'Compliance & Audit' },
        { id: 'Settings', label: 'Settings' }
    ];

    const efinStatusData = useMemo(() => {
        const status = officeData?.efinStatus || { active: 0, pending: 0, revoked: 0 };
        const definitions = [
            { key: 'active', label: 'Active', color: '#10B981' },
            { key: 'pending', label: 'Pending', color: '#FACC15' },
            { key: 'revoked', label: 'Revoked', color: '#EF4444' }
        ];

        return definitions.map((definition) => ({
            ...definition,
            value: status[definition.key] ?? 0
        }));
    }, [officeData]);

    const totalEfin = useMemo(
        () => efinStatusData.reduce((total, status) => total + status.value, 0),
        [efinStatusData]
    );

    const bankPartners = useMemo(() => {
        return officeData?.bankPartners || officeData?.bank_partners || [
            { id: 'default-1', name: 'Chase Bank', status: 'Active' },
            { id: 'default-2', name: 'Wells Fargo', status: 'Pending' },
            { id: 'default-3', name: 'Bank of America', status: 'Rejected' }
        ];
    }, [officeData]);

    const auditTrail = useMemo(() => {
        return officeData?.auditTrail || officeData?.audit_trail || [
            { id: 'default-log-1', user: 'John D.', office: 'NYC', action: 'Filed Return', ip: '192.168.1.12', timestamp: '2025-07-21 14:32' },
            { id: 'default-log-2', user: 'Maria P.', office: 'LA', action: 'Bank Enrollment', ip: '192.168.2.45', timestamp: '2025-07-21 13:10' },
            { id: 'default-log-3', user: 'Alex K.', office: 'Chicago', action: 'Filed Return', ip: '10.0.0.22', timestamp: '2025-07-20 18:55' }
        ];
    }, [officeData]);

    const partnerStatusStyles = {
        Active: 'bg-[#22C55E] text-[#FFFFFF]',
        Pending: 'bg-[#FBBF24] text-[#FFFFFF]',
        Rejected: 'bg-[#EF4444] text-[#FFFFFF]'
    };

    const timezone = officeData?.timezone || 'America/New_York';
    const officeManager = officeData?.manager_name || officeData?.officeManager || officeData?.staffMembers?.[0]?.name || 'N/A';

    const defaultBranding = useMemo(
        () => ({
            loginUrl: officeData?.branding?.loginUrl || 'https://www.logo.com/',
            faviconUrl: officeData?.branding?.faviconUrl || 'https://www.favicon.com/',
            primaryColor: officeData?.primary_color || officeData?.branding?.primaryColor || '#3AD6F2',
            secondaryColor: officeData?.secondary_color || officeData?.branding?.secondaryColor || '#F56D2D',
            customDomain: officeData?.custom_domain || officeData?.branding?.customDomain || 'sub.myfirm.com'
        }),
        [officeData]
    );

    useEffect(() => {
        setBranding(defaultBranding);
        setWhiteLabelEnabled(Boolean(officeData?.branding?.whiteLabelEnabled));
        setTaxPrepUrl(officeData?.taxPrepUrl || 'https://www.grammarly.com/');
    }, [defaultBranding, officeData]);

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

    const handleBrandingChange = (field) => (event) => {
        const value = event.target.value;
        setBranding((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleToggleWhiteLabel = () => {
        setWhiteLabelEnabled((previous) => !previous);
    };

    const handleResetBranding = () => {
        setBranding(defaultBranding);
        setWhiteLabelEnabled(Boolean(officeData?.branding?.whiteLabelEnabled));
    };

    const handleSaveBranding = () => {
        console.log('Branding settings saved', { branding, whiteLabelEnabled });
    };

    const handleSaveTaxPrep = () => {
        console.log('Tax prep URL saved', taxPrepUrl);
    };

    const handleTestTaxPrep = () => {
        if (taxPrepUrl) {
            window.open(taxPrepUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-sm text-gray-600">Loading office details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !officeData) {
        return (
            <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
                <button
                    onClick={() => navigate('/firmadmin/offices')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Offices</span>
                </button>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 bg-[rgb(243,247,255)]">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/firmadmin/offices')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Offices</span>
                </button>

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
                            <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{officeData.name || 'Office Details'}</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600 mb-0">{officeData.full_address || officeData.location || 'N/A'}</p>
                                <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${(officeData.status || '').toLowerCase() === 'active' ? 'bg-green-500' :
                                    (officeData.status || '').toLowerCase().includes('opening') ? 'bg-blue-500' :
                                        'bg-gray-500'
                                    }`}>
                                    {officeData.status_display || officeData.status || 'N/A'}
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
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{officeData.staff_count || officeData.staff || 0}</p>

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
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{officeData.clients_count || officeData.clients || 0}</p>

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
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">
                                    {officeData.monthly_revenue?.formatted || formatCurrency(officeData.monthly_revenue?.value || officeData.monthlyRevenue || 0)}
                                </p>

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
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">
                                    {officeData.growth_rate?.display || (officeData.growth_rate?.percentage ? `+${officeData.growth_rate.percentage}%` : officeData.growthRate ? `+${officeData.growthRate}%` : 'N/A')}
                                </p>

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
                                                <p className="font-medium text-sm text-gray-700 mb-0">{officeData?.street_address || officeData?.address || 'N/A'}</p>
                                                <p className="text-sm text-gray-700 mb-0">{officeData?.city || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.0007 8.46005V9.96005C11.0013 10.0993 10.9727 10.2371 10.917 10.3647C10.8612 10.4923 10.7793 10.6068 10.6767 10.701C10.5741 10.7951 10.453 10.8668 10.3211 10.9114C10.1892 10.956 10.0494 10.9726 9.9107 10.96C8.37212 10.7929 6.8942 10.2671 5.5957 9.42505C4.38761 8.65738 3.36337 7.63313 2.5957 6.42505C1.75069 5.12065 1.22482 3.63555 1.0607 2.09005C1.0482 1.95178 1.06464 1.81243 1.10895 1.68086C1.15326 1.54929 1.22448 1.42839 1.31808 1.32586C1.41168 1.22332 1.5256 1.1414 1.65259 1.08531C1.77959 1.02922 1.91687 1.00018 2.0557 1.00005H3.5557C3.79835 0.99766 4.03359 1.08359 4.21758 1.24181C4.40156 1.40004 4.52174 1.61977 4.5557 1.86005C4.61901 2.34008 4.73642 2.81141 4.9057 3.26505C4.97297 3.44401 4.98753 3.63851 4.94765 3.82549C4.90777 4.01247 4.81513 4.1841 4.6807 4.32005L4.0457 4.95505C4.75748 6.20682 5.79393 7.24327 7.0457 7.95505L7.6807 7.32005C7.81664 7.18562 7.98828 7.09297 8.17526 7.0531C8.36224 7.01322 8.55674 7.02778 8.7357 7.09505C9.18934 7.26432 9.66067 7.38174 10.1407 7.44505C10.3836 7.47931 10.6054 7.60165 10.764 7.7888C10.9225 7.97594 11.0068 8.21484 11.0007 8.46005Z" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>

                                            <p className="text-sm text-gray-700 mb-0">{officeData?.phone_number || officeData?.phone || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 2H2C1.44772 2 1 2.44772 1 3V9C1 9.55228 1.44772 10 2 10H10C10.5523 10 11 9.55228 11 9V3C11 2.44772 10.5523 2 10 2Z" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M11 3.5L6.515 6.35C6.36064 6.44671 6.18216 6.49801 6 6.49801C5.81784 6.49801 5.63936 6.44671 5.485 6.35L1 3.5" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>


                                            <p className="text-sm text-gray-700 mb-0">{officeData?.email || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333ZM8 13.3333C5.05933 13.3333 2.66667 10.9407 2.66667 8C2.66667 5.05933 5.05933 2.66667 8 2.66667C10.9407 2.66667 13.3333 5.05933 13.3333 8C13.3333 10.9407 10.9407 13.3333 8 13.3333Z" fill="#6B7280" />
                                                <path d="M8.66667 4.66667V8.66667L11.3333 10.1333" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {/* <p className="text-sm text-gray-700 mb-0">{officeData?.operation_hours_display || officeData?.hours || 'N/A'}</p> */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12.6667 2.66667H3.33333C2.59667 2.66667 2 3.26333 2 4V13.3333C2 14.07 2.59667 14.6667 3.33333 14.6667H12.6667C13.4033 14.6667 14 14.07 14 13.3333V4C14 3.26333 13.4033 2.66667 12.6667 2.66667Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10.6667 1.33333V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M5.33333 1.33333V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M2 6.66667H14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="text-sm text-gray-700 mb-0">Established: {officeData?.established_date || officeData?.established || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Office Performance - Map */}
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h6 className="text-base font-semibold text-gray-900 mb-4">Office Performance Map</h6>
                                    <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                                        {(() => {
                                            const address = officeData?.full_address || 
                                                (officeData?.street_address || officeData?.city || officeData?.state || officeData?.zip_code
                                                    ? `${officeData.street_address || ''}, ${officeData.city || ''}, ${officeData.state || ''} ${officeData.zip_code || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                                                    : null);
                                            
                                            if (address) {
                                                // Construct Google Maps embed URL
                                                // Note: For production, add VITE_GOOGLE_MAPS_API_KEY to your .env file
                                                const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
                                                const mapsUrl = googleMapsApiKey
                                                    ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address)}`
                                                    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
                                                
                                                return (
                                                    <>
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            style={{ border: 0 }}
                                                            loading="lazy"
                                                            allowFullScreen
                                                            referrerPolicy="no-referrer-when-downgrade"
                                                            src={mapsUrl}
                                                            title="Office Location Map"
                                                        />
                                                        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-[#3AD6F2]"></div>
                                                            <span className="text-xs text-gray-700 font-medium">
                                                                {officeData.name || 'Office Location'}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md text-xs text-[#3AD6F2] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#3AD6F2" />
                                                            </svg>
                                                            Open in Maps
                                                        </a>
                                                    </>
                                                );
                                            }
                                            
                                            return (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 text-gray-400">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#9CA3AF" />
                                                        </svg>
                                                        <p className="text-sm text-gray-500">Map View</p>
                                                        <p className="text-xs text-gray-400 mt-1">Address not available</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
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
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {officeData?.client_satisfaction?.display || officeData?.client_satisfaction?.rating || officeData?.clientSatisfaction || '0'}/5.0
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#3AD6F2] h-2 rounded-full"
                                                    style={{ width: `${((officeData?.client_satisfaction?.rating || officeData?.clientSatisfaction || 0) / 5.0) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Task Completion Rate */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {officeData?.task_completion_rate?.display || officeData?.task_completion_rate?.rate || officeData?.taskCompletionRate || '0'}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#3AD6F2] h-2 rounded-full"
                                                    style={{ width: `${parseFloat(officeData?.task_completion_rate?.rate || officeData?.taskCompletionRate || 0)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Average Revenue per Client */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Average Revenue per Client</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {officeData?.average_revenue_per_client?.display ||
                                                        (officeData?.average_revenue_per_client?.value ? `$${officeData.average_revenue_per_client.value}` : '') ||
                                                        (officeData?.avgRevenuePerClient ? `$${officeData.avgRevenuePerClient}` : '$0')}
                                                </span>
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
                            <p className="text-sm text-gray-700">{officeData?.description || 'No description available'}</p>
                        </div>
                    </>
                )}

                {/* Staff Tab Content */}
                {activeTab === 'Staff' && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-lg font-medium text-gray-600">Office Staff</p>
                                    <p className="text-sm text-gray-600">All staff members assigned to this office location</p>
                                </div>
                                {!staffLoading && !staffError && (
                                    <div className="bg-[#F3F7FF] px-4 py-2 rounded-lg">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Total: {staffCount} {staffCount === 1 ? 'Staff Member' : 'Staff Members'}
                                        </span>
                                    </div>
                                )}
                            </div>
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
                            {staffLoading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                    <p className="text-sm text-gray-600">Loading staff members...</p>
                                </div>
                            ) : staffError ? (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {staffError}
                                </div>
                            ) : staffMembers.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-gray-600">No staff members found</p>
                                </div>
                            ) : (
                                staffMembers.map((staff) => (
                                    <div key={staff.id} className="bg-white border border-gray-100 rounded-lg p-4 ">
                                        {/* Mobile Layout */}
                                        <div className="md:hidden space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {staff.profile_picture_url ? (
                                                        <img src={staff.profile_picture_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-500">{staff.initials || getInitials(staff.full_name || staff.name)}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-gray-700">{staff.full_name || staff.name}</div>
                                                    <div className="text-sm text-gray-600">{staff.role_display || staff.role}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${(staff.status || '').toLowerCase() === 'active' ? 'bg-green-500' : 'bg-gray-500'
                                                        }`}>
                                                        {staff.status || 'N/A'}
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
                                                <div className="text-sm text-gray-700">{staff.phone_number || staff.phone}</div>
                                                <div className="text-sm font-medium text-gray-700">Clients: {staff.client_count || staff.clients || 0}</div>
                                            </div>
                                        </div>

                                        {/* Desktop Layout */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                            {/* Staff Member */}
                                            <div className="col-span-3 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {staff.profile_picture_url ? (
                                                        <img src={staff.profile_picture_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-700">{staff.initials || getInitials(staff.full_name || staff.name)}</span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{staff.full_name || staff.name}</span>
                                            </div>

                                            {/* Role */}
                                            <div className="col-span-2">
                                                <span className="text-sm font-medium text-gray-700">{staff.role_display || staff.role}</span>
                                            </div>

                                            {/* Contact */}
                                            <div className="col-span-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">{staff.email}</span>
                                                    <span className="text-sm text-gray-700">{staff.phone_number || staff.phone}</span>
                                                </div>
                                            </div>

                                            {/* Clients */}
                                            <div className="col-span-1 text-center">
                                                <span className="text-sm font-medium text-gray-700">{staff.client_count || staff.clients || 0}</span>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2 flex justify-center">
                                                <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${(staff.status || '').toLowerCase() === 'active' ? 'bg-green-500' : 'bg-gray-500'
                                                    }`}>
                                                    {staff.status || 'N/A'}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1 flex justify-center">
                                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
                                                        <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" strokeWidth="0.5" />
                                                        <path d="M3 12.003V12.75C3 13.3467 3.23705 13.919 3.65901 14.341C4.08097 14.7629 4.65326 15 5.25 15H12.75C13.3467 15 13.919 14.7629 14.341 14.341C14.7629 13.919 15 13.3467 15 12.75V12M9 3.375V11.625M9 11.625L11.625 9M9 11.625L6.375 9" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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

                        {/* Loading State */}
                        {clientsLoading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="text-gray-500">Loading clients...</div>
                            </div>
                        )}

                        {/* Error State */}
                        {clientsError && !clientsLoading && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-600">{clientsError}</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!clientsLoading && !clientsError && clients.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-gray-500 text-sm mb-2">No clients found</p>
                                <p className="text-gray-400 text-xs">This office location has no active clients assigned.</p>
                            </div>
                        )}

                        {/* Clients List */}
                        {!clientsLoading && clients.length > 0 && (
                            <>
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

                                <div className="space-y-3">
                                    {clients.map((client) => (
                                        <div key={client.id} className="bg-white border border-gray-100 rounded-lg p-4">
                                            {/* Mobile Layout */}
                                            <div className="md:hidden space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm text-gray-700 mb-1">{client.client_name}</div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                                {client.client_type}
                                                            </span>
                                                            <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                                                                }`}>
                                                                {client.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-700">
                                                        <span className="font-medium">Assigned To:</span> {client.assigned_to || 'Unassigned'}
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        <span className="font-medium">Last Service:</span> {client.last_service || 'N/A'}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700">
                                                        <span className="font-medium">Revenue:</span> {client.revenue?.formatted || `$${client.revenue?.value?.toLocaleString() || '0'}`}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop Layout */}
                                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                                {/* Client */}
                                                <div className="col-span-3">
                                                    <span className="text-sm font-medium text-gray-700">{client.client_name}</span>
                                                </div>

                                                {/* Type */}
                                                <div className="col-span-2">
                                                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                        {client.client_type}
                                                    </span>
                                                </div>

                                                {/* Assigned To */}
                                                <div className="col-span-2">
                                                    <span className="text-sm font-medium text-gray-700">{client.assigned_to || 'Unassigned'}</span>
                                                </div>

                                                {/* Last Service */}
                                                <div className="col-span-2">
                                                    <span className="text-sm text-gray-700">{client.last_service || 'N/A'}</span>
                                                </div>

                                                {/* Revenue */}
                                                <div className="col-span-1 text-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {client.revenue?.formatted || `$${client.revenue?.value?.toLocaleString() || '0'}`}
                                                    </span>
                                                </div>

                                                {/* Status */}
                                                <div className="col-span-2 flex justify-center">
                                                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                                                        }`}>
                                                        {client.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Performance Tab Content */}
                {activeTab === 'Performance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Performance Chart */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <p className="text-lg font-medium text-gray-600 mb-6">Monthly Performance</p>

                            {/* Loading State */}
                            {performanceLoading && (
                                <div className="flex justify-center items-center" style={{ height: '300px' }}>
                                    <div className="text-gray-500">Loading performance data...</div>
                                </div>
                            )}

                            {/* Error State */}
                            {performanceError && !performanceLoading && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-600">{performanceError}</p>
                                </div>
                            )}

                            {/* Chart */}
                            {!performanceLoading && !performanceError && (
                                <div className="relative" style={{ height: '300px', width: '100%' }}>
                                    {performanceData?.monthly_performance && performanceData.monthly_performance.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={performanceData.monthly_performance}
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
                                                        domain={[0, 'dataMax + 2']}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 400 }}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                                                        <p className="text-sm font-semibold text-gray-700">
                                                                            {data.month_full} {data.year}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600">
                                                                            Revenue: ${data.revenue?.toLocaleString() || '0'}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
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
                                            {/* Growth Label for last month - positioned near the last data point */}
                                            {performanceData.monthly_performance.length > 0 && (
                                                <div className="absolute top-16 right-8">
                                                    <div className="bg-white border border-[#3AD6F2] rounded px-3 py-2 shadow-sm">
                                                        <div className="text-xs font-medium text-gray-700">
                                                            {performanceData.monthly_performance[performanceData.monthly_performance.length - 1].month}
                                                        </div>
                                                        <div className="text-xs font-semibold text-[#3AD6F2]">
                                                            Growth: {performanceData.monthly_performance[performanceData.monthly_performance.length - 1].value}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex justify-center items-center h-full">
                                            <p className="text-gray-500 text-sm">No performance data available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Key Metrics */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <p className="text-lg font-medium text-gray-600 mb-6">Key Metrics</p>

                            {/* Loading State */}
                            {performanceLoading && (
                                <div className="flex justify-center items-center py-12">
                                    <div className="text-gray-500">Loading metrics...</div>
                                </div>
                            )}

                            {/* Error State */}
                            {performanceError && !performanceLoading && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-600">{performanceError}</p>
                                </div>
                            )}

                            {/* Metrics */}
                            {!performanceLoading && !performanceError && (
                                <div className="space-y-6">
                                    {/* Average Revenue per Client */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Average Revenue per Client:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.average_revenue_per_client?.formatted ||
                                                (performanceData?.key_metrics?.average_revenue_per_client?.value ?
                                                    `$${performanceData.key_metrics.average_revenue_per_client.value.toFixed(0)}` :
                                                    'N/A')}
                                        </span>
                                    </div>

                                    {/* Task Completion Rate */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Task Completion Rate:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.task_completion_rate?.formatted ||
                                                (performanceData?.key_metrics?.task_completion_rate?.value !== undefined ?
                                                    `${performanceData.key_metrics.task_completion_rate.value.toFixed(0)}%` :
                                                    'N/A')}
                                        </span>
                                    </div>

                                    {/* Staff Utilization */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Staff Utilization:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.staff_utilization?.formatted ||
                                                (performanceData?.key_metrics?.staff_utilization?.value !== undefined ?
                                                    `${performanceData.key_metrics.staff_utilization.value.toFixed(0)}%` :
                                                    'N/A')}
                                        </span>
                                    </div>

                                    {/* Client Retention */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Client Retention:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.client_retention?.formatted ||
                                                (performanceData?.key_metrics?.client_retention?.value !== undefined ?
                                                    `${performanceData.key_metrics.client_retention.value.toFixed(0)}%` :
                                                    'N/A')}
                                        </span>
                                    </div>
                                </div>
                            )}
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
                                                    className={`px-4 py-2 text-xs font-medium  rounded-lg transition-colors ${calendarView === view
                                                        ? 'bg-[#3AD6F2] text-white shadow-sm'
                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-[#3AD6F2] hover:text-gray-900'
                                                        }`}
                                                    style={{ borderRadius: '8px' }}
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
                                                className="px-4 py-2 text-xs font-medium bg-white text-gray-500  rounded-lg hover:bg-[#25c2df] transition-colors"
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
                                            <p className="text-xl font-medium text-gray-600 leading-none">
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
                                                    className={`relative h-24 md:h-28 w-full rounded-2xl border p-3 text-left transition-all ${day.isCurrentMonth
                                                        ? 'bg-white text-gray-600'
                                                        : 'bg-gray-50 text-gray-400'
                                                        } ${day.isToday ? 'border-[#3AD6F2]' : 'border-gray-100'} ${isSelected ? 'ring-2 ring-[#3AD6F2]' : ''
                                                        } hover:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]`}
                                                >
                                                    <span
                                                        className={`text-sm font-semibold ${day.isCurrentMonth
                                                            ? 'text-gray-600'
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
                                                                <p className="text-xs font-semibold text-gray-600 truncate">
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
                                <div className="bg-white rounded-lg p-4 md:p-6">
                                    <div className="flex items-start justify-between gap-2 mb-4">
                                        <div>
                                            <p className="text-base font-semibold text-gray-600">
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

                                <div className="bg-white rounded-lg p-3 md:p-6 shadow-sm">
                                    <div className="mb-4">
                                        <p className="text-base font-semibold text-gray-600">
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
                                                    <p className="text-sm font-semibold text-gray-600">
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
                                                            className="rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-600 hover:bg-[#3AD6F2] hover:text-white transition-colors"
                                                            style={{ borderRadius: '8px', fontSize: '12px' }}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 md:p-6">
                                    <p className="text-base font-semibold text-gray-600 mb-4">Conflict Summary</p>
                                    <div className="space-y-3">
                                        {conflictSummary.length > 0 ? (
                                            conflictSummary.map((event) => (
                                                <div key={event.id} className="rounded-lg bg-gray-50">
                                                    <p className="text-sm font-semibold text-gray-600">
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
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'Okay'
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
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'Okay'
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

                {/* Compliance & Audit Tab Content */}
                {activeTab === 'Compliance & Audit' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            <div className="rounded-xl bg-white p-6 lg:col-span-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h5 className="text-lg font-semibold text-gray-600">EFIN Status Overview</h5>
                                        <p className="text-sm text-[#64748B]">
                                            Track the current standing of your Electronic Filing Identification Numbers.
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-[#F1F5FF] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                                        Total EFINs: {totalEfin}
                                    </span>
                                </div>
                                <div className="relative mt-6 h-72">
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

                            <div className="rounded-xl bg-white p-6 lg:col-span-6">
                                <h5 className="text-lg font-semibold text-gray-600">Bank Partner Enrollment</h5>
                                <p className="mt-1 text-sm text-[#64748B]">
                                    Monitor the status of your banking partners and take action when needed.
                                </p>
                                <div className="mt-6 space-y-4">
                                    {bankPartners.map((partner) => (
                                        <div
                                            key={partner.id}
                                            className="flex items-center justify-between rounded-xl px-4 py-3"
                                        >
                                            <span className="text-sm font-medium text-gray-600">
                                                {partner.name}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${partnerStatusStyles[partner.status] ||
                                                    'bg-[#E2E8F0] text-[#475569]'
                                                    }`}
                                            >
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-6 ">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h5 className="text-lg font-semibold text-gray-600">Office-Level Audit Trail</h5>
                                    <p className="text-sm text-[#64748B]">
                                        Detailed activity logs across your offices for transparency and compliance.
                                    </p>
                                </div>

                            </div>

                            <div className="mt-6 overflow-hidden rounded-xl">
                                <div className="hidden bg-[#F9FBFF] px-6 py-3 text-xs font-semibold tracking-wide text-[#64748B] sm:grid sm:grid-cols-12">
                                    <span className="col-span-3">User</span>
                                    <span className="col-span-3">Office</span>
                                    <span className="col-span-4">Action</span>
                                    <span className="col-span-2 text-right">IP Address</span>
                                </div>
                                <div className="divide-y divide-[#EFF4FF]">
                                    {auditTrail.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-12 sm:items-center sm:px-6"
                                        >
                                            <div className="sm:col-span-3">
                                                <p className="text-sm font-medium text-gray-600">{entry.user}</p>
                                                <p className="text-xs text-[#94A3B8] sm:hidden">{entry.ip}</p>
                                            </div>
                                            <div className="sm:col-span-3">
                                                <p className="text-sm font-medium text-gray-600">{entry.office}</p>
                                                <p className="text-xs text-[#94A3B8] sm:hidden">{entry.timestamp}</p>
                                            </div>
                                            <div className="sm:col-span-4">
                                                <p className="text-sm font-medium text-gray-600">{entry.action}</p>
                                            </div>
                                            <div className="hidden text-right text-sm font-medium text-[#1F2937] sm:col-span-2 sm:block">
                                                {entry.ip}
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
                                style={{ borderRadius: '8px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateBooking}
                                className="rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                                style={{ borderRadius: '8px' }}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'Settings' && (
                <div className="space-y-6 p-6">
                   

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-xl bg-white p-6 border border-[#E4ECFF]">
                            <div>
                                <h5 className="text-lg font-semibold text-gray-500">Office Settings</h5>
                                <p className="text-sm text-[#64748B]">
                                    Configure office-specific settings and preferences.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-base font-medium tracking-wide text-gray-500">
                                        Operating Hours
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        {office.hours || 'Mon–Fri 9:00 AM – 6:00 PM'}
                                    </p>
                                </div>
                                <div className='text-end'>
                                    <p className="text-base font-medium tracking-wide text-gray-700">
                                        Timezone
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-600">{timezone}</p>
                                </div>
                                <div>
                                    <p className="text-base font-medium tracking-wide text-gray-500">
                                        Office Manager
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-600">{officeManager}</p>
                                </div>
                                <div className='text-end'>
                                    <p className="text-base font-medium tracking-wide text-gray-700">
                                        Status
                                    </p>
                                    <span className="mt-1 inline-flex items-center rounded-full bg-[#22C55E] px-3 py-1 text-xs font-semibold text-[#ffffff]">
                                        {office.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 rounded-xl bg-white p-6 border border-[#E4ECFF]">
                            <div>
                                <h5 className="text-lg font-medium text-gray-500">Tax Prep Software</h5>
                                <p className="text-sm text-[#64748B]">
                                    Configure a one-click login link for this office.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-base font-medium tracking-wide text-gray-500">
                                    Login URL
                                </label>
                                <input
                                    type="url"
                                    value={taxPrepUrl}
                                    onChange={(event) => setTaxPrepUrl(event.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full rounded-lg border border-[#E4ECFF] px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                />
                                <p className="text-xs text-dark-600">
                                    This link will be available to Firm Admins and Tax Preparers assigned to this office.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between " style={{
                                justifyContent:
                                    'end'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleTestTaxPrep}
                                    className="inline-flex items-center justify-center rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm gap-2 font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.25 2.25H15.75V6.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M7.5 10.5L15.75 2.25" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M13.5 9.75V14.25C13.5 14.6478 13.342 15.0294 13.0607 15.3107C12.7794 15.592 12.3978 15.75 12 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V6C2.25 5.60218 2.40804 5.22064 2.68934 4.93934C2.97064 4.65804 3.35218 4.5 3.75 4.5H8.25" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>

                                    Test Open
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveTaxPrep}
                                    className="inline-flex items-center justify-center rounded-lg bg-[#F56D2D] px-5 py-2 text-sm gap-2 font-semibold text-white transition-colors hover:bg-orange-600"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                        />
                                    </svg>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-xl bg-white p-6 ">
                        <div>
                            <h5 className="text-lg font-semibold text-gray-600">Office Branding</h5>
                            <p className="text-sm text-[#64748B]">
                                Override firm branding for this office.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Login URL
                                </label>
                                <input
                                    type="url"
                                    value={branding.loginUrl}
                                    onChange={handleBrandingChange('loginUrl')}
                                    className="w-full rounded-lg border border-[#E4ECFF] px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Favicon URL
                                </label>
                                <input
                                    type="url"
                                    value={branding.faviconUrl}
                                    onChange={handleBrandingChange('faviconUrl')}
                                    className="w-full rounded-lg border border-[#E4ECFF] px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                            <div className="flex flex-col gap-1">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Primary Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={branding.primaryColor}
                                        onChange={handleBrandingChange('primaryColor')}
                                        className="h-10 w-25 cursor-pointer bg-white p-1"
                                    />
                                    <input
                                        type="text"
                                        value={branding.primaryColor}
                                        onChange={handleBrandingChange('primaryColor')}
                                        className="w-full px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Secondary Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={branding.secondaryColor}
                                        onChange={handleBrandingChange('secondaryColor')}
                                        className="h-10 w-25 cursor-pointer bg-white p-1"
                                    />
                                    <input
                                        type="text"
                                        value={branding.secondaryColor}
                                        onChange={handleBrandingChange('secondaryColor')}
                                        className="w-full px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Use a grid for the 6/6 column split on medium screens and up */}
                            <div className="md:grid md:grid-cols-2 md:gap-4">
                                {/* First Column (6/12 width on md screens) - Custom Domain Input */}
                                <div className="flex flex-col gap-2 mb-4 md:mb-0">
                                    <label className="text-base font-medium tracking-wide text-gray-700">
                                        Custom Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={branding.customDomain}
                                        onChange={handleBrandingChange('customDomain')}
                                        className="w-full rounded-lg border border-[#E4ECFF] px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                    />
                                </div>

                                {/* Second Column (6/12 width on md screens) - White-Label Toggle */}
                                <div className="flex flex-col gap-2 justify-center">
                                    <div className="flex items-center gap-3">

                                        <button
                                            type="button"
                                            onClick={handleToggleWhiteLabel}
                                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors flex-shrink-0 ${whiteLabelEnabled ? 'bg-[#3AD6F2]' : 'bg-gray-200'}`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${whiteLabelEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className="text-base font-medium tracking-wide text-gray-500">Enable white-label for this office</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleResetBranding}
                                className="inline-flex items-center justify-center rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-[#F8FAFC]"
                                style={{ borderRadius: '8px' }}
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveBranding}
                                className="inline-flex items-center justify-center rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                                style={{ borderRadius: '8px' }}
                            >
                                Save Branding
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

