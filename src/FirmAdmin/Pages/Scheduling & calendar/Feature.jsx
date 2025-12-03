import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firmAdminCalendarAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const featureCards = [
    {
        title: 'Calendar Integration',
        description: 'Sync with external calendars and manage firm vs staff calendars.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.66732 2.66406V1.66406M11.334 2.66406V1.66406M1.66732 5.9974H14.334M1.33398 7.9974C1.33398 5.4834 1.33398 4.22606 2.11532 3.4454C2.89665 2.66473 4.15332 2.66406 6.66732 2.66406H9.33398C11.848 2.66406 13.1053 2.66406 13.886 3.4454C14.6667 4.22673 14.6673 5.4834 14.6673 7.9974V9.33073C14.6673 11.8447 14.6673 13.1021 13.886 13.8827C13.1047 14.6634 11.848 14.6641 9.33398 14.6641H6.66732C4.15332 14.6641 2.89598 14.6641 2.11532 13.8827C1.33465 13.1014 1.33398 11.8447 1.33398 9.33073V7.9974Z" stroke="#3B4A66" strokeLinecap="round" />
                <path d="M12 11.3333C12 11.5101 11.9298 11.6797 11.8047 11.8047C11.6797 11.9298 11.5101 12 11.3333 12C11.1565 12 10.987 11.9298 10.8619 11.8047C10.7369 11.6797 10.6667 11.5101 10.6667 11.3333C10.6667 11.1565 10.7369 10.987 10.8619 10.8619C10.987 10.7369 11.1565 10.6667 11.3333 10.6667C11.5101 10.6667 11.6797 10.7369 11.8047 10.8619C11.9298 10.987 12 11.1565 12 11.3333ZM12 8.66667C12 8.84348 11.9298 9.01305 11.8047 9.13807C11.6797 9.2631 11.5101 9.33333 11.3333 9.33333C11.1565 9.33333 10.987 9.2631 10.8619 9.13807C10.7369 9.01305 10.6667 8.84348 10.6667 8.66667C10.6667 8.48986 10.7369 8.32029 10.8619 8.19526C10.987 8.07024 11.1565 8 11.3333 8C11.5101 8 11.6797 8.07024 11.8047 8.19526C11.9298 8.32029 12 8.48986 12 8.66667ZM8.66667 11.3333C8.66667 11.5101 8.59643 11.6797 8.4714 11.8047C8.34638 11.9298 8.17681 12 8 12C7.82319 12 7.65362 11.9298 7.5286 11.8047C7.40357 11.6797 7.33333 11.5101 7.33333 11.3333C7.33333 11.1565 7.40357 10.987 7.5286 10.8619C7.65362 10.7369 7.82319 10.6667 8 10.6667C8.17681 10.6667 8.34638 10.7369 8.4714 10.8619C8.59643 10.987 8.66667 11.1565 8.66667 11.3333ZM8.66667 8.66667C8.66667 8.84348 8.59643 9.01305 8.4714 9.13807C8.34638 9.2631 8.17681 9.33333 8 9.33333C7.82319 9.33333 7.65362 9.2631 7.5286 9.13807C7.40357 9.01305 7.33333 8.84348 7.33333 8.66667C7.33333 8.48986 7.40357 8.32029 7.5286 8.19526C7.65362 8.07024 7.82319 8 8 8C8.17681 8 8.34638 8.07024 8.4714 8.19526C8.59643 8.32029 8.66667 8.48986 8.66667 8.66667ZM5.33333 11.3333C5.33333 11.5101 5.2631 11.6797 5.13807 11.8047C5.01305 11.9298 4.84348 12 4.66667 12C4.48986 12 4.32029 11.9298 4.19526 11.8047C4.07024 11.6797 4 11.5101 4 11.3333C4 11.1565 4.07024 10.987 4.19526 10.8619C4.32029 10.7369 4.48986 10.6667 4.66667 10.6667C4.84348 10.6667 5.01305 10.7369 5.13807 10.8619C5.2631 10.987 5.33333 11.1565 5.33333 11.3333ZM5.33333 8.66667C5.33333 8.84348 5.2631 9.01305 5.13807 9.13807C5.01305 9.2631 4.84348 9.33333 4.66667 9.33333C4.48986 9.33333 4.32029 9.2631 4.19526 9.13807C4.07024 9.01305 4 8.84348 4 8.66667C4 8.48986 4.07024 8.32029 4.19526 8.19526C4.32029 8.07024 4.48986 8 4.66667 8C4.84348 8 5.01305 8.07024 5.13807 8.19526C5.2631 8.32029 5.33333 8.48986 5.33333 8.66667Z" fill="#3B4A66" />
            </svg>
        ),
        primary: true,
    },
    {
        title: 'Appointment Types',
        description: 'Create custom appointment types with time buffers and locations.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_5636_2528)">
                    <path d="M7.99967 3.9987V7.9987L10.6663 9.33203M14.6663 7.9987C14.6663 11.6806 11.6816 14.6654 7.99967 14.6654C4.31778 14.6654 1.33301 11.6806 1.33301 7.9987C1.33301 4.3168 4.31778 1.33203 7.99967 1.33203C11.6816 1.33203 14.6663 4.3168 14.6663 7.9987Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <defs>
                    <clipPath id="clip0_5636_2528">
                        <rect width="16" height="16" fill="white" />
                    </clipPath>
                </defs>
            </svg>

        ),
    },
    {
        title: 'Staff Assignment',
        description: 'Set up auto-assignment rules and round-robin scheduling.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.6668 14V12.6667C10.6668 11.9594 10.3859 11.2811 9.88578 10.781C9.38568 10.281 8.70741 10 8.00016 10H4.00016C3.29292 10 2.61464 10.281 2.11454 10.781C1.61445 11.2811 1.3335 11.9594 1.3335 12.6667V14M14.6668 14V12.6667C14.6664 12.0758 14.4697 11.5018 14.1077 11.0349C13.7457 10.5679 13.2389 10.2344 12.6668 10.0867M10.6668 2.08667C11.2404 2.23353 11.7489 2.56713 12.1119 3.03487C12.475 3.50261 12.6721 4.07789 12.6721 4.67C12.6721 5.26211 12.475 5.83739 12.1119 6.30513C11.7489 6.77287 11.2404 7.10647 10.6668 7.25333M8.66683 4.66667C8.66683 6.13943 7.47292 7.33333 6.00016 7.33333C4.5274 7.33333 3.3335 6.13943 3.3335 4.66667C3.3335 3.19391 4.5274 2 6.00016 2C7.47292 2 8.66683 3.19391 8.66683 4.66667Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

        ),
    },
    {
        title: 'Client Self-Scheduling',
        description: 'Configure booking links, website embed, and intake forms.',
        icon: (
            <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_5636_2538)">
                    <path d="M1.826 15.4852C1.83425 15.486 1.84125 15.49 1.8495 15.49H6.2605L6.2625 15.4905H13.0363C13.0898 15.4904 13.1419 15.4732 13.1849 15.4414C13.228 15.4095 13.2596 15.3647 13.2753 15.3135L14.6555 10.8032C14.6669 10.7659 14.6694 10.7263 14.6628 10.6878C14.6562 10.6493 14.6406 10.6129 14.6174 10.5815C14.5941 10.5501 14.5639 10.5246 14.529 10.507C14.4941 10.4894 14.4556 10.4802 14.4165 10.4802H8.6345C8.43089 9.99709 8.08929 9.58475 7.65248 9.29482C7.21566 9.00488 6.70303 8.85023 6.17875 8.85022H3.163C1.6945 8.85022 0.5 10.0457 0.5 11.5155V14.1405C0.5 14.149 0.504 14.156 0.50475 14.1642C0.527917 14.507 0.674558 14.8298 0.917499 15.0727C1.16044 15.3157 1.48321 15.4623 1.826 15.4855V15.4852ZM12.8515 14.9905H6.6005L7.82775 10.9802H14.0787L12.8515 14.9905ZM1 11.5155C1 10.3217 1.9705 9.35022 3.163 9.35022H6.17875C6.56795 9.35038 6.94991 9.45541 7.28447 9.65426C7.61904 9.85311 7.89385 10.1384 8.08 10.4802H7.64275C7.58921 10.4802 7.53709 10.4975 7.49407 10.5293C7.45104 10.5612 7.41938 10.606 7.40375 10.6572L6.078 14.99H5.56325C5.72675 14.7725 5.813 14.5145 5.79825 14.245C5.78244 13.9545 5.65973 13.6801 5.45375 13.4747C5.3443 13.3646 5.21409 13.2773 5.07068 13.2179C4.92727 13.1585 4.77349 13.1281 4.61825 13.1285H3.06975V11.775C3.06975 11.7087 3.04341 11.6451 2.99653 11.5982C2.94964 11.5513 2.88605 11.525 2.81975 11.525C2.75345 11.525 2.68986 11.5513 2.64297 11.5982C2.59609 11.6451 2.56975 11.7087 2.56975 11.775V13.1942C2.56975 13.4337 2.7645 13.6285 3.004 13.6285H4.61825C4.80025 13.6285 4.97125 13.6995 5.10025 13.8282C5.21902 13.9465 5.28989 14.1046 5.29925 14.272C5.30875 14.4485 5.2435 14.62 5.1155 14.7552C5.04538 14.8291 4.96098 14.888 4.86743 14.9283C4.77388 14.9686 4.67312 14.9895 4.57125 14.9897H1.92025C1.67627 14.9895 1.44235 14.8924 1.26983 14.7199C1.0973 14.5474 1.00026 14.3135 1 14.0695V11.5155ZM4.67125 8.61447C5.96625 8.61447 7.01975 7.56097 7.01975 6.26622C7.01975 4.97147 5.96625 3.91797 4.67125 3.91797C3.37625 3.91797 2.323 4.97147 2.323 6.26622C2.323 7.56097 3.3765 8.61447 4.67125 8.61447ZM4.67125 4.41797C5.6905 4.41797 6.51975 5.24697 6.51975 6.26622C6.51975 7.28547 5.69075 8.11447 4.67125 8.11447C3.65175 8.11447 2.823 7.28547 2.823 6.26622C2.823 5.24697 3.652 4.41797 4.67125 4.41797Z" fill="#3B4A66" />
                    <path d="M9.65211 0.5C7.60261 0.5 5.73786 1.5445 4.66386 3.29425C4.62919 3.35077 4.61838 3.41876 4.63383 3.48325C4.64928 3.54774 4.68972 3.60345 4.74624 3.63812C4.80276 3.6728 4.87075 3.6836 4.93524 3.66816C4.99973 3.65271 5.05544 3.61227 5.09011 3.55575C6.07236 1.9555 7.77761 1 9.65211 1C12.6006 1 14.9996 3.399 14.9996 6.3475C15.0002 7.61893 14.5462 8.84867 13.7196 9.81475C13.6982 9.83968 13.682 9.86858 13.6718 9.8998C13.6616 9.93102 13.6576 9.96394 13.6601 9.99668C13.6627 10.0294 13.6716 10.0614 13.6865 10.0906C13.7013 10.1199 13.7218 10.146 13.7467 10.1674C13.7717 10.1887 13.8006 10.205 13.8318 10.2152C13.863 10.2254 13.8959 10.2294 13.9287 10.2268C13.9614 10.2243 13.9933 10.2154 14.0226 10.2005C14.0519 10.1857 14.078 10.1652 14.0994 10.1403C15.0034 9.08338 15.5 7.73826 15.4996 6.3475C15.4996 3.12325 12.8766 0.5 9.65211 0.5Z" fill="#3B4A66" />
                    <path d="M12.1455 9.77713C12.0919 9.81611 12.0559 9.87481 12.0456 9.94031C12.0352 10.0058 12.0513 10.0727 12.0903 10.1264C12.1293 10.18 12.188 10.216 12.2534 10.2263C12.3189 10.2367 12.3859 10.2206 12.4395 10.1816C13.0436 9.74155 13.5353 9.16513 13.8747 8.49924C14.214 7.83334 14.3914 7.09676 14.3925 6.34937C14.3925 3.73562 12.266 1.60938 9.65251 1.60938C8.89629 1.60946 8.15108 1.79068 7.47926 2.13785C6.80744 2.48503 6.22854 2.98807 5.79101 3.60487C5.77205 3.63168 5.75856 3.66196 5.7513 3.69398C5.74404 3.726 5.74316 3.75914 5.74871 3.7915C5.75426 3.82386 5.76613 3.85481 5.78364 3.88259C5.80115 3.91036 5.82396 3.93442 5.85076 3.95337C5.9049 3.99167 5.97203 4.00688 6.03739 3.99568C6.06975 3.99013 6.1007 3.97826 6.12848 3.96075C6.15625 3.94324 6.18031 3.92043 6.19926 3.89363C6.59054 3.34204 7.10824 2.89219 7.70903 2.58173C8.30983 2.27126 8.97624 2.10921 9.65251 2.10913C11.9905 2.10913 13.8925 4.01112 13.8925 6.34912C13.8916 7.01764 13.7329 7.67649 13.4293 8.27211C13.1257 8.86773 12.6859 9.38329 12.1455 9.77687V9.77713Z" fill="#3B4A66" />
                    <path d="M9.47657 6.59409L10.9896 8.10709C11.0127 8.13039 11.0403 8.14888 11.0706 8.16149C11.1009 8.17411 11.1335 8.1806 11.1663 8.1806C11.1992 8.1806 11.2317 8.17411 11.262 8.16149C11.2924 8.14888 11.3199 8.13039 11.3431 8.10709C11.3663 8.0839 11.3847 8.05635 11.3973 8.02602C11.4099 7.99569 11.4164 7.96318 11.4164 7.93034C11.4164 7.89751 11.4099 7.865 11.3973 7.83467C11.3847 7.80434 11.3663 7.77679 11.3431 7.75359L9.90332 6.31384V3.33984C9.90332 3.27354 9.87698 3.20995 9.8301 3.16307C9.78321 3.11618 9.71962 3.08984 9.65332 3.08984C9.58702 3.08984 9.52343 3.11618 9.47654 3.16307C9.42966 3.20995 9.40332 3.27354 9.40332 3.33984V6.34709C9.40332 6.35934 9.40857 6.36984 9.41032 6.38159C9.40386 6.41973 9.4065 6.45885 9.41801 6.49577C9.42952 6.5327 9.44958 6.56639 9.47657 6.59409Z" fill="#3B4A66" />
                </g>
                <defs>
                    <clipPath id="clip0_5636_2538">
                        <rect width="16" height="16" fill="white" />
                    </clipPath>
                </defs>
            </svg>

        ),
    },
    {
        title: 'Notifications & Reminders',
        description: 'Set up automated reminders and custom notification sequences.',
        icon: (
            <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.0002 12V12.5C10.0002 13.0304 9.78944 13.5391 9.41437 13.9142C9.03929 14.2893 8.53059 14.5 8.00015 14.5C7.46972 14.5 6.96101 14.2893 6.58594 13.9142C6.21087 13.5391 6.00015 13.0304 6.00015 12.5V12M13.3652 10.9822C12.5627 10 11.9961 9.5 11.9961 6.79219C11.9961 4.3125 10.7298 3.42906 9.68765 3C9.54922 2.94312 9.4189 2.8125 9.37672 2.67031C9.1939 2.04812 8.6814 1.5 8.00015 1.5C7.3189 1.5 6.80609 2.04844 6.62515 2.67094C6.58297 2.81469 6.45265 2.94312 6.31422 3C5.27078 3.42969 4.00578 4.31 4.00578 6.79219C4.00422 9.5 3.43765 10 2.63515 10.9822C2.30265 11.3891 2.5939 12 3.17547 12H12.828C13.4064 12 13.6958 11.3872 13.3652 10.9822Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

        ),
    },
    {
        title: 'Compliance & Security',
        description: 'Configure audit trails and e-signature requirements.',
        icon: (
            <svg width="25" height="25" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.00026V9.50026C2.5 9.57526 2.525 9.65026 2.55 9.70026C2.625 9.85026 4.175 13.1503 7.8 14.7003C7.875 14.7253 7.925 14.7503 8 14.7503C8.075 14.7503 8.125 14.7253 8.2 14.7003C11.825 13.1503 13.4 9.85026 13.45 9.70026C13.475 9.62526 13.5 9.57526 13.5 9.50026V4.00026C13.5 3.77526 13.35 3.57526 13.125 3.52526C11.225 3.05026 8.3 1.12526 8.275 1.10026C8.1 1.00026 7.9 0.975259 7.725 1.10026C7.7 1.12526 4.775 3.05026 2.875 3.52526C2.65 3.57526 2.5 3.77526 2.5 4.00026ZM3.5 4.37526C5.175 3.85026 7.25 2.57526 8 2.10026C8.75 2.57526 10.825 3.85026 12.5 4.37526V9.37526C12.225 9.90026 10.825 12.4003 8 13.7003C5.175 12.4003 3.775 9.90026 3.5 9.37526V4.37526Z" fill="#3B4A66" />
                <path d="M7.15039 9.59844C7.25039 9.69844 7.37539 9.74844 7.50039 9.74844C7.62539 9.74844 7.75039 9.69844 7.85039 9.59844L10.3254 7.12344C10.5254 6.92344 10.5254 6.62344 10.3254 6.42344C10.1254 6.22344 9.82539 6.22344 9.62539 6.42344L7.50039 8.54844L6.37539 7.42344C6.17539 7.22344 5.87539 7.22344 5.67539 7.42344C5.47539 7.62344 5.47539 7.92344 5.67539 8.12344L7.15039 9.59844Z" fill="#3B4A66" />
            </svg>

        ),
    },
];

const featureSettings = [
    { name: 'Google Calendar Sync', status: 'Active', statusClasses: 'bg-[#22C55E] text-white', updated: 'Nov 1, 2023' },
    { name: 'Outlook Calendar Sync', status: 'Pending', statusClasses: 'bg-[#FACC15] text-[#854D0E]', updated: 'Oct 28, 2023' },
    { name: 'Two-Way Sync', status: 'Active', statusClasses: 'bg-[#22C55E] text-white', updated: 'Nov 2, 2023' },
    { name: 'SMS Reminders', status: 'Active', statusClasses: 'bg-[#22C55E] text-white', updated: 'Oct 15, 2023' },
];

const syncOptions = [
    'One-way (SeQwens to external)',
    'Two-way (Changes in SeQwens reflect in personal calendars)',
];

const externalSyncOptions = ['Google Calendar', 'Outlook Calendar', 'Apple Calendar'];
const calendarTypeOptions = ['Firm Calendar', 'Staff Calendars', 'Client Appointments'];

const Feature = () => {
    const location = useLocation();
    const [currentDate] = useState(new Date());
    const [statistics, setStatistics] = useState({
        scheduled_month: 0,
        completed: 0,
        no_show_rate: 0,
        avg_duration_display: '0m'
    });
    const [loadingStats, setLoadingStats] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedSyncDirection, setSelectedSyncDirection] = useState(syncOptions[0]);
    const [isSyncDropdownOpen, setIsSyncDropdownOpen] = useState(false);
    const [selectedExternalSync, setSelectedExternalSync] = useState(new Set([externalSyncOptions[0]]));
    const [selectedCalendarTypes, setSelectedCalendarTypes] = useState(new Set([calendarTypeOptions[0]]));
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const assignmentMethods = [
        { id: 'availability', label: 'Auto-assign by availability' },
        { id: 'roundRobin', label: 'Round-robin for new leads' },
        { id: 'manual', label: 'Manual assignment only' },
    ];
    const staffMembers = ['Sarah Miller', 'Michael Brown', 'David Wilson', 'Emily Johnson'];
    const [selectedAssignmentMethod, setSelectedAssignmentMethod] = useState(assignmentMethods[0].id);
    const [selectedStaffMember, setSelectedStaffMember] = useState(staffMembers[0]);
    const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
    const [isStaffActive, setIsStaffActive] = useState(true);
    const [appointmentTypeName, setAppointmentTypeName] = useState('');
    const [appointmentDescription, setAppointmentDescription] = useState('');
    const [appointmentTypes] = useState([
        { id: 1, name: 'Consultation', duration: '30 min' },
        { id: 2, name: 'Tax Preparation', duration: '60 min' },
        { id: 3, name: 'Training', duration: '90 min' },
        { id: 4, name: 'Audit Support', duration: '120 min' },
    ]);

    const toggleExternalSync = (option) => {
        const updated = new Set(selectedExternalSync);
        if (updated.has(option)) {
            updated.delete(option);
        } else {
            updated.add(option);
        }
        setSelectedExternalSync(updated);
    };

    const toggleCalendarType = (option) => {
        const updated = new Set(selectedCalendarTypes);
        if (updated.has(option)) {
            updated.delete(option);
        } else {
            updated.add(option);
        }
        setSelectedCalendarTypes(updated);
    };

    // Fetch statistics
    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoadingStats(true);
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const day = currentDate.getDate();
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const response = await firmAdminCalendarAPI.getCalendar({
                    view: 'month',
                    date: dateStr
                });

                if (response.success && response.data?.statistics) {
                    setStatistics({
                        scheduled_month: response.data.statistics.scheduled_month || 0,
                        completed: response.data.statistics.completed || 0,
                        no_show_rate: response.data.statistics.no_show_rate || 0,
                        avg_duration_display: response.data.statistics.avg_duration_display || '0m'
                    });
                }
            } catch (error) {
                console.error('Error fetching statistics:', error);
                toast.error(handleAPIError(error) || 'Failed to load statistics', {
                    position: 'top-right',
                    autoClose: 3000
                });
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStatistics();
    }, [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()]);

    // Navigation tabs
    const navTabs = ['Calendar', 'Appointments', 'Features', 'Staff'];
    const tabPaths = {
        Calendar: '/firmadmin/calendar',
        Appointments: '/firmadmin/calendar/appointments',
        Features: '/firmadmin/calendar/features',
        Staff: '/firmadmin/calendar/staff',
    };

    // Metric cards data
    const metricCards = [
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 10H21" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            value: statistics.scheduled_month.toString(),
            label: 'Scheduled (month)'
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            value: statistics.completed.toString(),
            label: 'Completed'
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 1.25C7.74022 1.25 6.53204 1.75044 5.64124 2.64124C4.75045 3.53204 4.25 4.74022 4.25 6C4.25 7.25978 4.75045 8.46796 5.64124 9.35876C6.53204 10.2496 7.74022 10.75 9 10.75C10.2598 10.75 11.468 10.2496 12.3588 9.35876C13.2496 8.46796 13.75 7.25978 13.75 6C13.75 4.74022 13.2496 3.53204 12.3588 2.64124C11.468 1.75044 10.2598 1.25 9 1.25ZM5.75 6C5.75 5.13805 6.09241 4.3114 6.7019 3.7019C7.3114 3.09241 8.13805 2.75 9 2.75C9.86195 2.75 10.6886 3.09241 11.2981 3.7019C11.9076 4.3114 12.25 5.13805 12.25 6C12.25 6.86195 11.9076 7.6886 11.2981 8.2981C10.6886 8.90759 9.86195 9.25 9 9.25C8.13805 9.25 7.3114 8.90759 6.7019 8.2981C6.09241 7.6886 5.75 6.86195 5.75 6Z" fill="#00C0C6" />
                    <path d="M15 2.25C14.8011 2.25 14.6103 2.32902 14.4697 2.46967C14.329 2.61032 14.25 2.80109 14.25 3C14.25 3.19891 14.329 3.38968 14.4697 3.53033C14.6103 3.67098 14.8011 3.75 15 3.75C15.5967 3.75 16.169 3.98705 16.591 4.40901C17.0129 4.83097 17.25 5.40326 17.25 6C17.25 6.59674 17.0129 7.16903 16.591 7.59099C16.169 8.01295 15.5967 8.25 15 8.25C14.8011 8.25 14.6103 8.32902 14.4697 8.46967C14.329 8.61032 14.25 8.80109 14.25 9C14.25 9.19891 14.329 9.38968 14.4697 9.53033C14.6103 9.67098 14.8011 9.75 15 9.75C15.9946 9.75 16.9484 9.35491 17.6517 8.65165C18.3549 7.94839 18.75 6.99456 18.75 6C18.75 5.00544 18.3549 4.05161 17.6517 3.34835C16.9484 2.64509 15.9946 2.25 15 2.25Z" fill="#00C0C6" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.678 13.52C5.078 12.72 6.961 12.25 9 12.25C11.039 12.25 12.922 12.72 14.322 13.52C15.7 14.308 16.75 15.51 16.75 17C16.75 18.49 15.7 19.692 14.322 20.48C12.922 21.28 11.039 21.75 9 21.75C6.961 21.75 5.078 21.28 3.678 20.48C2.3 19.692 1.25 18.49 1.25 17C1.25 15.51 2.3 14.308 3.678 13.52ZM4.422 14.823C3.267 15.483 2.75 16.28 2.75 17C2.75 17.72 3.267 18.517 4.422 19.177C5.556 19.825 7.173 20.25 9 20.25C10.827 20.25 12.444 19.825 13.578 19.177C14.733 18.517 15.25 17.719 15.25 17C15.25 16.281 14.733 15.483 13.578 14.823C12.444 14.175 10.827 13.75 9 13.75C7.173 13.75 5.556 14.175 4.422 14.823Z" fill="#00C0C6" />
                    <path d="M18.1598 13.2673C17.9654 13.2248 17.7621 13.2614 17.5946 13.3688C17.4271 13.4763 17.3092 13.6459 17.2668 13.8403C17.2243 14.0347 17.2609 14.238 17.3683 14.4054C17.4758 14.5729 17.6454 14.6908 17.8398 14.7333C18.6318 14.9063 19.2648 15.2053 19.6828 15.5473C20.1008 15.8893 20.2498 16.2243 20.2498 16.5003C20.2498 16.7503 20.1298 17.0453 19.7968 17.3543C19.4618 17.6653 18.9468 17.9523 18.2838 18.1523C18.1894 18.1806 18.1016 18.2273 18.0253 18.2896C17.9489 18.3519 17.8856 18.4287 17.839 18.5154C17.7923 18.6022 17.7632 18.6973 17.7533 18.7954C17.7434 18.8934 17.7529 18.9924 17.7813 19.0868C17.8096 19.1811 17.8563 19.269 17.9186 19.3453C17.9809 19.4216 18.0577 19.4849 18.1445 19.5316C18.2312 19.5782 18.3263 19.6073 18.4244 19.6172C18.5224 19.6271 18.6214 19.6176 18.7158 19.5893C19.5388 19.3413 20.2738 18.9583 20.8178 18.4533C21.3638 17.9463 21.7498 17.2793 21.7498 16.5003C21.7498 15.6353 21.2758 14.9123 20.6328 14.3863C19.9888 13.8593 19.1218 13.4783 18.1598 13.2673Z" fill="#00C0C6" />
                </svg>
            ),
            value: `${statistics.no_show_rate}%`,
            label: 'No-show rate'
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 13.0012L21.223 16.4832C21.2983 16.5333 21.3858 16.5621 21.4761 16.5664C21.5664 16.5707 21.6563 16.5505 21.736 16.5078C21.8157 16.4651 21.8824 16.4016 21.9289 16.324C21.9754 16.2464 22 16.1577 22 16.0672V7.87124C22 7.78326 21.9768 7.69684 21.9328 7.62069C21.8887 7.54454 21.8253 7.48136 21.7491 7.43754C21.6728 7.39372 21.5863 7.3708 21.4983 7.3711C21.4103 7.3714 21.324 7.3949 21.248 7.43924L16 10.5012" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H14C15.1046 18 16 17.1046 16 16V8C16 6.89543 15.1046 6 14 6Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            value: statistics.avg_duration_display,
            label: 'Avg. duration'
        }
    ];

    const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :
        location.pathname.includes('/features') ? 'Features' :
            location.pathname.includes('/staff') ? 'Staff' : 'Calendar';

    return (
        <div className="min-h-screen bg-[#F6F7FF] p-6">
            <div className="mx-auto space-y-6">
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Features</h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">Manage appointments, deadlines, and meetings</p>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {metricCards.map((card, index) => (
                            <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] pt-6 px-4 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <div className="text-[#3AD6F2] mb-2">{card.icon}</div>
                                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-4">{card.label}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] leading-none">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-2 mb-6">
                        <div className="flex gap-2">
                            {navTabs.map((tab) => (
                                <Link
                                    key={tab}
                                    to={tabPaths[tab]}
                                    className={`px-4 py-2 font-[BasisGrotesquePro] transition-colors !rounded-lg ${
                                        activeTab === tab
                                            ? 'bg-[#3AD6F2] !text-white font-semibold'
                                            : 'bg-transparent hover:bg-gray-50 !text-black'
                                    }`}
                                >
                                    {tab}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* <div className="rounded-lg border border-[#E8F0FF] bg-white p-4 sm:p-6">
                    <h4 className="text-lg font-semibold text-[#1E293B] mb-4 font-[BasisGrotesquePro]">System Features & Configuration</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {featureCards.map((card) => (
                            <div key={card.title} className="rounded-xl !border border-[#E8F0FF] bg-white p-4 sm:p-5 flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className=" flex items-center justify-center text-xl mt-2">
                                        {card.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-[#1E293B] font-[BasisGrotesquePro]">{card.title}</h4>
                                        <p className="text-xs text-[#64748B] font-[BasisGrotesquePro] mt-1 leading-relaxed">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (card.title === 'Calendar Integration') {
                                                setIsCalendarModalOpen(true);
                                            } else if (card.title === 'Appointment Types') {
                                                setIsAppointmentModalOpen(true);
                                            } else if (card.title === 'Staff Assignment') {
                                                setIsStaffModalOpen(true);
                                            }
                                        }}
                                        className={`px-4 py-2 text-xs font-medium !rounded-lg transition-colors font-[BasisGrotesquePro] ${card.primary
                                            ? 'bg-[#F56D2D] text-white hover:bg-[#E55A1D] border border-transparent'
                                            : 'bg-white text-[#3B4A66] hover:bg-[#E6F9FD] border border-[#E8F0FF]'
                                            }`}
                                    >
                                        Configure
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div> */}

                <div className="rounded-lg !border border-[#E8F0FF] bg-white">
                    <div className="px-4 sm:px-6 py-4 !border-b border-[#E8F0FF]">
                        <h4 className="text-lg font-semibold text-[#1E293B] font-[BasisGrotesquePro]">Current Settings Overview</h4>
                    </div>
                    <div className="px-3 sm:px-6 py-4 space-y-3">
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] items-center text-xs font-semibold uppercase tracking-wide text-[#3B4A66] font-[BasisGrotesquePro] px-4">
                            <span>Feature</span>
                            <span>Status</span>
                            <span>Last Updated</span>
                            <span>Actions</span>
                        </div>
                        <div className="space-y-3">
                            {featureSettings.map((item) => (
                                <div
                                    key={item.name}
                                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] items-start md:items-center gap-3 rounded-xl !border border-[#E8F0FF]  px-4 py-3 font-[BasisGrotesquePro] text-sm text-[#1E293B]"
                                >
                                    <div className="font-semibold text-[#1E293B]">{item.name}</div>
                                    <div>
                                        <span className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium ${item.statusClasses}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="text-[#475569]">{item.updated}</div>
                                    <div className="flex justify-start md:justify-end">
                                        <button className="inline-flex items-center justify-center !border border-[#E8F0FF] rounded-lg p-1.5 text-[#3B4A66] transition-colors hover:bg-[#F6F7FF]" aria-label="Edit feature">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="19.5" height="19.5" rx="3.75" fill="#F3F7FF" />
                                                <rect x="0.25" y="0.25" width="19.5" height="19.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5" />
                                                <path d="M10 5.49816H6.5C6.23478 5.49816 5.98043 5.60352 5.79289 5.79105C5.60536 5.97859 5.5 6.23294 5.5 6.49816V13.4982C5.5 13.7634 5.60536 14.0177 5.79289 14.2053C5.98043 14.3928 6.23478 14.4982 6.5 14.4982H13.5C13.7652 14.4982 14.0196 14.3928 14.2071 14.2053C14.3946 14.0177 14.5 13.7634 14.5 13.4982V9.99816M13.1875 5.31066C13.3864 5.11175 13.6562 5 13.9375 5C14.2188 5 14.4886 5.11175 14.6875 5.31066C14.8864 5.50957 14.9982 5.77936 14.9982 6.06066C14.9982 6.34196 14.8864 6.61175 14.6875 6.81066L10 11.4982L8 11.9982L8.5 9.99816L13.1875 5.31066Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {isCalendarModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="relative flex w-full max-w-xl flex-col rounded-[24px] bg-white  max-h-[80vh]">
                        <div className="flex items-center justify-between gap-4 px-4 py-4 border-b border-[#E8F0FF]">
                            <h4 className="text-[22px] font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Calendar Integration Settings</h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCalendarModalOpen(false);
                                    setIsSyncDropdownOpen(false);
                                }}
                                className="flex items-center justify-center  text-[#3B4A66] transition-colors hover:border-[#CBD5F5] hover:bg-white hover:text-[#1E293B]"
                                aria-label="Close modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>

                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            <div className="space-y-2.5">
                                <p className="text-[16px] font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">External Calendar Sync</p>
                                <div className="flex flex-col gap-2">
                                    {externalSyncOptions.map((option) => (
                                        <label
                                            key={option}
                                            className="inline-flex items-center gap-3 text-sm text-[#2F3A5C] font-[BasisGrotesquePro] cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedExternalSync.has(option)}
                                                onChange={() => toggleExternalSync(option)}
                                                className="peer hidden"
                                            />
                                            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded border border-[#3AD6F2] bg-white transition-colors peer-checked:bg-[#3AD6F2]">
                                                <svg className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 5L4 8L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                            <span className="pl-1">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <p className="text-[16px] font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Sync Direction</p>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsSyncDropdownOpen((prev) => !prev)}
                                        className="flex w-full items-center justify-between rounded-[14px] border border-[#E8F0FF] bg-white px-4 py-3 text-sm text-[#2F3A5C] font-[BasisGrotesquePro]"
                                    >
                                        {selectedSyncDirection}
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isSyncDropdownOpen ? 'rotate-180' : ''}`}>
                                            <path d="M4 6L8 10L12 6" stroke="#97A6BA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isSyncDropdownOpen && (
                                        <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-[14px] border border-[#E8F0FF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                                            {syncOptions.map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSyncDirection(option);
                                                        setIsSyncDropdownOpen(false);
                                                    }}
                                                    className={`block w-full px-4 py-2 text-left text-sm font-[BasisGrotesquePro] text-[#475569] hover:bg-[#F6F7FF] ${option === selectedSyncDirection ? 'bg-[#F1F5F9] text-[#1F2937]' : ''}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <p className="text-[16px] font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Calendar Types</p>
                                <div className="flex flex-col gap-2">
                                    {calendarTypeOptions.map((option) => (
                                        <label
                                            key={option}
                                            className="inline-flex items-center gap-3 text-sm text-[#2F3A5C] font-[BasisGrotesquePro] cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCalendarTypes.has(option)}
                                                onChange={() => toggleCalendarType(option)}
                                                className="peer hidden"
                                            />
                                            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded border border-[#3AD6F2] bg-white transition-colors peer-checked:bg-[#3AD6F2]">
                                                <svg className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 5L4 8L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                            <span className="pl-1">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#E8F0FF] bg-[#FBFDFF] rounded-b-[24px]">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCalendarModalOpen(false);
                                    setIsSyncDropdownOpen(false);
                                }}
                                className="rounded-lg border border-[#CBD5F5] px-5 py-2 text-sm font-medium text-[#2F3A5C] font-[BasisGrotesquePro] hover:bg-[#F8FAFC]"
                            >
                                Cancel
                            </button>
                            <button type="button" className="rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-medium text-white font-[BasisGrotesquePro] hover:bg-[#E55A1D]">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAppointmentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="relative flex w-full max-w-xl flex-col rounded-[24px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.15)] max-h-[80vh]">
                        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#E8F0FF]">
                            <h4 className="text-[22px] font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Appointment Types Configuration</h4>
                            <button
                                type="button"
                                onClick={() => setIsAppointmentModalOpen(false)}
                                className="flex items-center justify-center text-[#3B4A66] transition-colors hover:border-[#CBD5F5] hover:bg-white hover:text-[#1E293B]"
                                aria-label="Close modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>

                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-lg font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Appointment Type Name</label>
                                <input
                                    type="text"
                                    value={appointmentTypeName}
                                    onChange={(event) => setAppointmentTypeName(event.target.value)}
                                    placeholder="e.g. Tax Consultation"
                                    className="w-full !rounded-lg border border-[#E8F0FF] bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-lg font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Description</label>
                                <textarea
                                    value={appointmentDescription}
                                    onChange={(event) => setAppointmentDescription(event.target.value)}
                                    placeholder="Describe the appointment type.."
                                    rows={3}
                                    className="w-full !rounded-lg !border border-[#E8F0FF] bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Existing Types</p>
                                <div className="space-y-2">
                                    {appointmentTypes.map((type) => (
                                        <div
                                            key={type.id}
                                            className="flex items-center justify-between !rounded-lg !border border-[#E8F0FF] bg-[#F3F7FF] px-3 py-2"
                                        >
                                            <div className="text-sm font-[BasisGrotesquePro] text-[#2F3A5C]">
                                                <span className="font-semibold">{type.name}</span>
                                                <span className="text-[#64748B]"> – {type.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" className="!rounded-md !border border-[#CBD5F5] px-3 py-1 text-xs font-medium text-[#1E293B] font-[BasisGrotesquePro] hover:bg-white">
                                                    Edit
                                                </button>
                                                <button type="button" className="!rounded-md bg-[#EF4444] px-3 py-1 text-xs font-medium text-white font-[BasisGrotesquePro] hover:bg-[#EF4444]">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <button type="button" className="!rounded-lg bg-[#F56D2D] px-4 py-2 text-xs font-semibold text-white font-[BasisGrotesquePro] hover:bg-[#E55A1D]">
                                    Add New Type
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#E8F0FF] bg-[#FBFDFF] rounded-b-[24px]">
                            <button
                                type="button"
                                onClick={() => setIsAppointmentModalOpen(false)}
                                className="!rounded-lg !border border-[#CBD5F5] px-5 py-2 text-sm font-medium text-[#2F3A5C] font-[BasisGrotesquePro] hover:bg-[#F8FAFC]"
                            >
                                Cancel
                            </button>
                            <button type="button" className="!rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-medium text-white font-[BasisGrotesquePro] hover:bg-[#E55A1D]">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isStaffModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="relative flex w-full max-w-xl flex-col rounded-[24px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.15)]">
                        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#E8F0FF]">
                            <h4 className="text-[22px] font-semibold text-[#2F3A5C] font-[BasisGrotesquePro]">Staff Assignment Rules</h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsStaffModalOpen(false);
                                    setIsStaffDropdownOpen(false);
                                }}
                                className="flex  items-center justify-center bg-[#EEF4FF] text-[#3B4A66] transition-colors hover:border-[#CBD5F5] hover:bg-white hover:text-[#1E293B]"
                                aria-label="Close modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>

                            </button>
                        </div>
                        <div className="px-8 py-6 space-y-6">
                            <div className="space-y-4">
                                <p className="text-lg font-semibold leading-[22px] text-[#1E293B] font-[BasisGrotesquePro]">Assignment Method</p>
                                <div className="flex flex-col gap-2.5">
                                    {assignmentMethods.map((method) => (
                                        <label
                                            key={method.id}
                                            className="inline-flex items-center gap-[18px] text-sm font-[BasisGrotesquePro] text-[#27344A]"
                                        >
                                            <input
                                                type="radio"
                                                name="staff-assignment-method"
                                                value={method.id}
                                                checked={selectedAssignmentMethod === method.id}
                                                onChange={() => setSelectedAssignmentMethod(method.id)}
                                                className="peer hidden"
                                            />
                                            <span
                                                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-transparent transition"
                                                style={{
                                                    background: selectedAssignmentMethod === method.id
                                                        ? 'linear-gradient(#FFFFFF,#FFFFFF) padding-box, linear-gradient(135deg,#3AD6F2,#00AEEF) border-box'
                                                        : 'linear-gradient(#FFFFFF,#FFFFFF) padding-box, linear-gradient(135deg,#D7E3FF,#D7E3FF) border-box',
                                                    borderWidth: selectedAssignmentMethod === method.id ? '1.5px' : '1px',
                                                }}
                                            >
                                                <span className={`h-2 w-2 rounded-full bg-[#00AEEF] transition ${selectedAssignmentMethod === method.id ? 'opacity-100' : 'opacity-0'}`} />
                                            </span>
                                            <span className="peer-checked:text-[#1D2B4F] ml-3">{method.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-lg font-semibold leading-[22px] text-[#1E293B] font-[BasisGrotesquePro]">Default Staff for Appointments</p>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                                        className="flex w-full items-center justify-between rounded-[12px] border border-[#D6E4FF] bg-white px-4 py-3.5 text-sm font-[BasisGrotesquePro] text-[#1E293B] shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                                    >
                                        {selectedStaffMember}
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isStaffDropdownOpen ? 'rotate-180' : ''}`}>
                                            <path d="M4 6L8 10L12 6" stroke="#97A6BA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isStaffDropdownOpen && (
                                        <div className="absolute left-0 right-0 mt-2 !rounded-[12px] border border-[#D6E4FF] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] overflow-hidden">
                                            {staffMembers.map((member) => (
                                                <button
                                                    key={member}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStaffMember(member);
                                                        setIsStaffDropdownOpen(false);
                                                    }}
                                                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-[BasisGrotesquePro] text-[#475569] hover:bg-[#F6F7FF] ${selectedStaffMember === member ? 'bg-[#F1F5F9] text-[#1F2937]' : ''}`}
                                                >
                                                    {member}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <label className="flex items-center gap-4 text-sm font-[BasisGrotesquePro] text-[#2F3A5C]">
                                <input
                                    type="checkbox"
                                    checked={isStaffActive}
                                    onChange={() => setIsStaffActive((prev) => !prev)}
                                    className="peer hidden"
                                />
                                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded border border-[#3AD6F2] bg-white peer-checked:bg-gradient-to-br peer-checked:from-[#3AD6F2] peer-checked:to-[#00AEEF]">
                                    <svg
                                        className={`h-3 w-3 text-white transition-opacity ${isStaffActive ? 'opacity-100' : 'opacity-0'}`}
                                        viewBox="0 0 12 10"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M1 5L4 8L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <span className='ml-3'>Active (available for appointments)</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-[#E8F0FF] bg-[#FBFDFF] rounded-b-[24px]">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsStaffModalOpen(false);
                                    setIsStaffDropdownOpen(false);
                                }}
                                className="!rounded-lg border border-[#CBD5F5] px-5 py-2 text-sm font-medium text-[#2F3A5C] font-[BasisGrotesquePro] hover:bg-[#F8FAFC]"
                            >
                                Cancel
                            </button>
                            <button type="button" className="!rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-medium text-white font-[BasisGrotesquePro] hover:bg-[#E55A1D]">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feature;
