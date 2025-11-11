import React, { useMemo, useState } from 'react';
import TabNavigation from '../../Components/TabNavigation';
import FoldersAndTagsView from './FoldersAndTagsView';
import AnalyticsView from './AnalyticsView';
import EmailSettingsView from './EmailSettingsView';

const templatesData = [
    {
        id: 'appointment-confirmation',
        title: 'Appointment Confirmation',
        description: 'Confirm scheduled appointments with clients',
        category: {
            label: 'Tax Preparation',
            pill: 'border border-[#C8D5FF] bg-white text-[#32406B]',
            icon: FolderIcon
        },
        subject: 'Payment Reminder - Invoice #[Invoice Number]',
        usage: '45 times',
        lastUsed: '2024-01-15',
        status: {
            label: 'Active',
            variant: 'active'
        }
    },
    {
        id: 'welcome-email',
        title: 'Welcome Email',
        description: 'Initial welcome email for new clients',
        category: {
            label: 'Onboarding',
            pill: 'border border-[#C8D5FF] bg-white text-[#32406B]',
            icon: PeopleIcon
        },
        subject: 'Welcome to [Firm Name] - Let\'s Get Started!',
        usage: '25 times',
        lastUsed: '2024-02-15',
        status: {
            label: 'Active',
            variant: 'active'
        }
    },
    {
        id: 'document-request',
        title: 'Document Request',
        description: 'Request missing documents from clients',
        category: {
            label: 'Scheduling',
            pill: 'border border-[#C8D5FF] bg-white text-[#32406B]',
            icon: ClockIcon
        },
        subject: 'Appointment Confirmed - [Date] at [Time]',
        usage: '35 times',
        lastUsed: '2024-03-15',
        status: {
            label: 'Draft',
            variant: 'draft'
        }
    }
];

const statusClasses = {
    active: '!border border-[#22C55E] bg-transparent text-[#198754]',
    draft: '!border border-[#FBBF24] bg-transparent text-[#D97706]',
    archived: 'bg-[#EEF2F7] text-[#6B7280]'
};

export default function EmailTemplate() {
    const tabs = useMemo(
        () => ['Templates', 'Folders and tags', 'Analytics', 'Email Settings'],
        []
    );
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="w-full bg-[#F3F6FD] px-4 py-6 text-[#1F2A55] sm:px-6 lg:px-8">
            <div className="mx-auto space-y-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h4 className="text-2xl font-semibold text-[#1F2A55]">
                            Email Templates
                        </h4>
                        <p className="mt-1 text-sm text-[#6E7DAE]">
                            Create and manage email templates for client communication
                        </p>
                    </div>
                    <button className="inline-flex h-11 items-center justify-center gap-2 self-start !rounded-lg !bg-[#F56D2D] px-4 font-semibold text-white">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.5 5.25L10.125 11.625L6.375 7.875L1.5 12.75" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 5.25H16.5V9.75" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>

                        Upgrade Plan
                    </button>
                </header>

                <TabNavigation
                    className="w-fit bg-white p-1"
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabClassName="px-4 sm:px-6 py-2 text-xs sm:text-sm md:text-base font-medium text-[#1F2A55]"
                    activeTabClassName="bg-[#3AD6F2] text-white shadow"
                    inactiveTabClassName="text-[#4A5673]"
                />

                <section className="space-y-6">
                    {activeTab === 'Templates' && (
                        <TemplatesView templates={templatesData} statusClasses={statusClasses} />
                    )}
                    {activeTab === 'Folders and tags' && <FoldersAndTagsView />}
                    {activeTab === 'Analytics' && <AnalyticsView />}
                    {activeTab === 'Email Settings' && <EmailSettingsView />}
                    {!['Templates', 'Folders and tags', 'Analytics', 'Email Settings'].includes(activeTab) && (
                        <EmptyTabState tab={activeTab} />
                    )}
                </section>
            </div>
        </div>
    );
}

const IconButton = ({ children, ariaLabel }) => (
    <button
        aria-label={ariaLabel}
        className=" text-[#4254A0] transition hover:bg-white hover:text-[#1F2A55]"
    >
        {children}
    </button>
);

const EmptyTabState = ({ tab }) => (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-[#6E7DAE]">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F6FD] text-[#3AD6F2]">
            <InboxIcon />
        </span>
        <div className="space-y-1">
            <p className="text-base font-semibold text-[#1F2A55]">
                {tab} coming soon
            </p>
            <p className="text-sm">
                We\'re still designing the experience here. Check back again later.
            </p>
        </div>
    </div>
);

const InfoStack = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7B8AB2]">
            {label}
        </p>
        <p className="mt-2 text-sm text-[#3D4C70]">{value}</p>
    </div>
);

function TemplatesView({ templates, statusClasses }) {
    return (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF]">
            <div className="border-b border-[#E8F0FF] px-5 py-5 sm:px-6 lg:px-8">
                <h3 className="text-lg font-semibold text-[#1F2A55]">Email Templates</h3>
                <p className="mt-1 text-sm text-[#7B8AB2]">Manage your email templates and their usage</p>
            </div>

            <div className="hidden xl:grid grid-cols-[2.4fr_1.2fr_2.2fr_1fr_1.1fr_1fr_auto] items-center gap-4 px-5 py-4 text-sm font-semibold tracking-wide text-[#4B5563] sm:px-6 lg:px-8">
                <span>Template</span>
                <span>Category</span>
                <span className="ml-3">Subject</span>
                <span>Usage</span>
                <span>Last Used</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
            </div>
            <div className="hidden xl:block">
                {templates.map((template, index) => (
                    <div
                        key={template.id}
                        className={`grid grid-cols-[2.4fr_1.2fr_2.2fr_1fr_1.1fr_1fr_auto] items-center gap-4 px-5 py-6 sm:px-6 lg:px-8 text-sm ${index !== 0 ? 'border-t border-[#E8F0FF]' : ''}`}
                    >
                        <div>
                            <p className="font-semibold text-[#1F2A55]">{template.title}</p>
                            <p className="mt-1 text-xs font-medium text-[#7B8AB2]">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center !rounded-full border border-[#C8D5FF] bg-white text-[#32406B]">
                                {React.createElement(template.category.icon, { className: 'h-4 w-4' })}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 !rounded-full px-3 py-[6px] text-[12px] font-semibold ${template.category.pill}`}
                            >
                                <span>{template.category.label}</span>
                            </span>
                        </div>
                        <p className="text-sm font-medium text-[#3D4C70]">{template.subject}</p>
                        <p className="font-medium text-[#1F2A55]">{template.usage}</p>
                        <p className="ml-3 text-[#3D4C70] font-medium">{template.lastUsed}</p>
                        <span
                            className={`inline-flex items-center justify-center rounded-full px-2 py-[6px] text-[11px] font-medium leading-tight ${statusClasses[template.status.variant] || statusClasses.archived}`}
                        >
                            {template.status.label}
                        </span>
                        <div className="flex items-center justify-end gap-2 text-[#5061A4]">
                            <IconButton ariaLabel="Preview template">
                                <EyeIcon />
                            </IconButton>
                            <IconButton ariaLabel="Edit template">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" stroke-width="0.5" />
                                    <path d="M8.70947 4.03906H4.62614C4.31672 4.03906 4.01997 4.16198 3.80118 4.38077C3.58239 4.59956 3.45947 4.89631 3.45947 5.20573V13.3724C3.45947 13.6818 3.58239 13.9786 3.80118 14.1974C4.01997 14.4161 4.31672 14.5391 4.62614 14.5391H12.7928C13.1022 14.5391 13.399 14.4161 13.6178 14.1974C13.8366 13.9786 13.9595 13.6818 13.9595 13.3724V9.28906" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M12.4284 3.82337C12.6605 3.59131 12.9753 3.46094 13.3034 3.46094C13.6316 3.46094 13.9464 3.59131 14.1784 3.82337C14.4105 4.05544 14.5409 4.37019 14.5409 4.69837C14.5409 5.02656 14.4105 5.34131 14.1784 5.57337L8.92086 10.8315C8.78234 10.9699 8.61123 11.0712 8.42327 11.1261L6.74736 11.6161C6.69716 11.6308 6.64395 11.6316 6.5933 11.6187C6.54265 11.6057 6.49642 11.5793 6.45945 11.5424C6.42248 11.5054 6.39613 11.4592 6.38315 11.4085C6.37017 11.3579 6.37105 11.3047 6.38569 11.2545L6.87569 9.57854C6.93083 9.39074 7.03234 9.21982 7.17086 9.08154L12.4284 3.82337Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </IconButton>
                            <IconButton ariaLabel="Duplicate template">
                                <DuplicateIcon />
                            </IconButton>
                            <IconButton ariaLabel="Send template">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" stroke-width="0.5" />
                                    <path d="M13.9582 4.03906L4.0415 7.2474L7.83317 8.9974L11.9165 6.08073L8.99984 10.1641L10.7498 13.9557L13.9582 4.03906Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </IconButton>
                        </div>
                    </div>
                ))}
            </div>

            <div className="divide-y divide-[#E8F0FF] xl:hidden">
                {templates.map((template) => (
                    <div key={template.id} className="space-y-4 px-5 py-6 sm:px-6">
                        <div className="space-y-2">
                            <div>
                                <p className="font-semibold text-[#1F2A55]">{template.title}</p>
                                <p className="text-xs text-[#7B8AB2]">{template.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center !rounded-full !border border-[#F56D2D] bg-white text-[#32406B]">
                                    {React.createElement(template.category.icon, { className: 'h-4 w-4' })}
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[12px] font-semibold ${template.category.pill}`}
                                >
                                    <span>{template.category.label}</span>
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <InfoStack label="Subject" value={template.subject} />
                            <InfoStack label="Usage" value={template.usage} />
                            <InfoStack label="Last Used" value={template.lastUsed} />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#7B8AB2]">Status</p>
                                <span
                                    className={`mt-2 inline-flex items-center justify-center rounded-full px-2 py-[6px] text-[11px] font-medium leading-tight ${statusClasses[template.status.variant] || statusClasses.archived}`}
                                >
                                    {template.status.label}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#E8F0FF] pt-4">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#7B8AB2]">Actions</span>
                            <div className="flex items-center gap-2 text-[#5061A4]">
                                <IconButton ariaLabel="Preview template">
                                    <EyeIcon />
                                </IconButton>
                                <IconButton ariaLabel="Edit template">
                                    <EditIcon />
                                </IconButton>
                                <IconButton ariaLabel="Duplicate template">
                                    <DuplicateIcon />
                                </IconButton>
                                <IconButton ariaLabel="Send template">
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}



function EyeIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 20H21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.2786 2.87868 18.5544 2.93359 18.8107 3.04104C19.0669 3.14849 19.2984 3.30628 19.4926 3.50046C19.6868 3.69464 19.8446 3.92611 19.952 4.18237C20.0595 4.43862 20.1144 4.71445 20.1144 4.993C20.1144 5.27156 20.0595 5.54739 19.952 5.80364C19.8446 6.0599 19.6868 6.29137 19.4926 6.48554L7.5 18.5L3 19.5L4 15L16.5 3.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function DuplicateIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="9"
                y="9"
                width="11"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15 9V7C15 5.34315 13.6569 4 12 4H7C5.34315 4 4 5.34315 4 7V12C4 13.6569 5.34315 15 7 15H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4 12L20 4L16 20L11.5 13.5L4 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M20 4L11.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function FolderIcon({ className = '' }) {
    return (
        <svg
            className={`h-4 w-4 ${className}`}
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4.66659 5.83073H9.33325M4.66659 10.4974H9.33325M4.66659 8.16406H6.99992M2.33325 12.4807V1.51406C2.33325 1.42124 2.37013 1.33221 2.43576 1.26658C2.5014 1.20094 2.59043 1.16406 2.68325 1.16406H9.48025C9.57305 1.16414 9.66201 1.20107 9.72759 1.26673L11.5639 3.10306C11.5966 3.13567 11.6224 3.17441 11.6401 3.21706C11.6577 3.25971 11.6667 3.30542 11.6666 3.35156V12.4807C11.6666 12.5267 11.6575 12.5722 11.6399 12.6147C11.6224 12.6571 11.5966 12.6957 11.5641 12.7282C11.5316 12.7607 11.493 12.7865 11.4505 12.8041C11.4081 12.8217 11.3625 12.8307 11.3166 12.8307H2.68325C2.63729 12.8307 2.59178 12.8217 2.54931 12.8041C2.50685 12.7865 2.46827 12.7607 2.43576 12.7282C2.40326 12.6957 2.37748 12.6571 2.35989 12.6147C2.34231 12.5722 2.33325 12.5267 2.33325 12.4807Z"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9.33325 1.16406V3.1474C9.33325 3.24022 9.37013 3.32925 9.43576 3.39488C9.5014 3.46052 9.59043 3.4974 9.68325 3.4974H11.6666"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function PeopleIcon({ className = '' }) {
    return (
        <svg
            className={`h-4 w-4 ${className}`}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M6.5 8C7.88071 8 9 6.88071 9 5.5C9 4.11929 7.88071 3 6.5 3C5.11929 3 4 4.11929 4 5.5C4 6.88071 5.11929 8 6.5 8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13.5 8C14.6046 8 15.5 7.10457 15.5 6C15.5 4.89543 14.6046 4 13.5 4C12.3954 4 11.5 4.89543 11.5 6C11.5 7.10457 12.3954 8 13.5 8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2.5 16C2.5 13.7909 4.29086 12 6.5 12H6.5C8.70914 12 10.5 13.7909 10.5 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.5 12H14C15.932 12 17.5 13.568 17.5 15.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ClockIcon({ className = '' }) {
    return (
        <svg
            className={`h-4 w-4 ${className}`}
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4.66675 1.16406V3.4974"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9.33325 1.16406V3.4974"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.0833 2.33594H2.91667C2.27233 2.33594 1.75 2.85827 1.75 3.5026V11.6693C1.75 12.3136 2.27233 12.8359 2.91667 12.8359H11.0833C11.7277 12.8359 12.25 12.3136 12.25 11.6693V3.5026C12.25 2.85827 11.7277 2.33594 11.0833 2.33594Z"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M1.75 5.83594H12.25"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function InboxIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M21 13H17L15 16H9L7 13H3V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V13Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21 13V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 13C7 15.2091 8.79086 17 11 17H13C15.2091 17 17 15.2091 17 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

