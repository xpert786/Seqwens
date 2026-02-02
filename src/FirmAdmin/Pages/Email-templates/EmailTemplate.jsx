import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { firmAdminEmailTemplatesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import TabNavigation from '../Integrations/TabNavigation';
import AnalyticsView from './AnalyticsView';
import EmailSettingsView from './EmailSettingsView';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Pagination from '../../../ClientOnboarding/components/Pagination';
import '../../styles/EmailTemplate.css';
const statusClasses = {
    active: '!border border-[#22C55E] bg-transparent text-[#198754]',
    draft: '!border border-[#FBBF24] bg-transparent text-[#D97706]',
    archived: 'bg-[#EEF2F7] text-[#6B7280]'
};

const EMAIL_TEMPLATE_CATEGORIES = [
    { value: 'letterhead', label: 'Letterhead' },
    { value: 'tax_preparation', label: 'Tax Preparation' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'scheduling', label: 'Scheduling' },
    { value: 'payment', label: 'Payment' },
    { value: 'document_request', label: 'Document Request' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'notification', label: 'Notification' },
    { value: 'other', label: 'Other' }
];

const EMAIL_TEMPLATE_TYPES = [
    { value: 'client_invite', label: 'Client Invite' },
    { value: 'staff_invite', label: 'Staff Invite' },
    { value: 'firm_onboarding', label: 'Firm Onboarding' },
    { value: 'account_deletion', label: 'Account Deletion' },
    { value: 'subscription_created', label: 'Subscription Created' },
    { value: 'subscription_ending', label: 'Subscription Ending' },
    { value: 'subscription_expired', label: 'Subscription Expired' }
];

const EMAIL_TEMPLATE_TONES = [
    { value: 'formal', label: 'Formal' },
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'warm', label: 'Warm' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'informative', label: 'Informative' }
];

const EMAIL_TEMPLATE_STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' }
];

const VARIABLE_GROUPS = {
    client: {
        label: 'Client Information',
        icon: '👤',
        variables: [
            {
                key: 'FirstName',
                label: 'First Name',
                description: 'Client first name',
                placeholder: '[FirstName]',
                example: 'John'
            },
            {
                key: 'LastName',
                label: 'Last Name',
                description: 'Client last name',
                placeholder: '[LastName]',
                example: 'Smith'
            },
            {
                key: 'FullName',
                label: 'Full Name',
                description: 'Client full name',
                placeholder: '[FullName]',
                example: 'John Smith'
            },
            {
                key: 'Email',
                label: 'Email',
                description: 'Client email address',
                placeholder: '[Email]',
                example: 'john.smith@example.com'
            },
            {
                key: 'Phone',
                label: 'Phone',
                description: 'Client phone number',
                placeholder: '[Phone]',
                example: '(555) 123-4567'
            },
            {
                key: 'Address',
                label: 'Street Address',
                description: 'Client street address',
                placeholder: '[Address]',
                example: '123 Main Street'
            },
            {
                key: 'City',
                label: 'City',
                description: 'Client city',
                placeholder: '[City]',
                example: 'New York'
            },
            {
                key: 'State',
                label: 'State',
                description: 'Client state',
                placeholder: '[State]',
                example: 'NY'
            },
            {
                key: 'ZipCode',
                label: 'ZIP Code',
                description: 'Client ZIP/postal code',
                placeholder: '[ZipCode]',
                example: '10001'
            }
        ]
    },
    spouse: {
        label: 'Spouse Information',
        icon: '💑',
        variables: [
            {
                key: 'SpouseFirstName',
                label: 'Spouse First Name',
                description: 'Spouse first name',
                placeholder: '[SpouseFirstName]',
                example: 'Jane'
            },
            {
                key: 'SpouseLastName',
                label: 'Spouse Last Name',
                description: 'Spouse last name',
                placeholder: '[SpouseLastName]',
                example: 'Smith'
            },
            {
                key: 'SpouseFullName',
                label: 'Spouse Full Name',
                description: 'Spouse full name',
                placeholder: '[SpouseFullName]',
                example: 'Jane Smith'
            },
            {
                key: 'SpouseEmail',
                label: 'Spouse Email',
                description: 'Spouse email address',
                placeholder: '[SpouseEmail]',
                example: 'jane.smith@example.com'
            }
        ]
    },
    firm: {
        label: 'Firm Information',
        icon: '🏢',
        variables: [
            {
                key: 'FirmName',
                label: 'Firm Name',
                description: 'Your firm name',
                placeholder: '[FirmName]',
                example: 'ABC Tax Services'
            },
            {
                key: 'FirmPhone',
                label: 'Firm Phone',
                description: 'Your firm phone number',
                placeholder: '[FirmPhone]',
                example: '(555) 987-6543'
            },
            {
                key: 'FirmEmail',
                label: 'Firm Email',
                description: 'Your firm email address',
                placeholder: '[FirmEmail]',
                example: 'contact@abctax.com'
            },
            {
                key: 'FirmWebsite',
                label: 'Firm Website',
                description: 'Your firm website URL',
                placeholder: '[FirmWebsite]',
                example: 'https://www.abctax.com'
            },
            {
                key: 'AssignedPreparerName',
                label: 'Assigned Preparer Name',
                description: 'Name of assigned tax preparer',
                placeholder: '[AssignedPreparerName]',
                example: 'Robert Johnson, CPA'
            },
            {
                key: 'AssignedPreparerEmail',
                label: 'Assigned Preparer Email',
                description: 'Email of assigned tax preparer',
                placeholder: '[AssignedPreparerEmail]',
                example: 'robert.johnson@abctax.com'
            }
        ]
    },
    subscription: {
        label: 'Subscription & Invites',
        icon: '📧',
        variables: [
            {
                key: 'InviteLink',
                label: 'Invite Link',
                description: 'Invitation link URL',
                placeholder: '[InviteLink]',
                example: 'https://app.seqwens.com/invite/abc123'
            },
            {
                key: 'ExpirationDate',
                label: 'Expiration Date',
                description: 'Invitation expiration date',
                placeholder: '[ExpirationDate]',
                example: 'December 31, 2026'
            },
            {
                key: 'SubscriptionPlan',
                label: 'Subscription Plan',
                description: 'Current subscription plan name',
                placeholder: '[SubscriptionPlan]',
                example: 'Professional Plan'
            },
            {
                key: 'RenewalDate',
                label: 'Renewal Date',
                description: 'Subscription renewal date',
                placeholder: '[RenewalDate]',
                example: 'January 1, 2027'
            },
            {
                key: 'Role',
                label: 'User Role',
                description: 'Recipient role in the system',
                placeholder: '[Role]',
                example: 'Client'
            }
        ]
    },
    tax: {
        label: 'Tax Information',
        icon: '📊',
        variables: [
            {
                key: 'TaxYear',
                label: 'Tax Year',
                description: 'Current tax year',
                placeholder: '[TaxYear]',
                example: '2024'
            },
            {
                key: 'FilingStatus',
                label: 'Filing Status',
                description: 'Tax filing status',
                placeholder: '[FilingStatus]',
                example: 'Married Filing Jointly'
            },
            {
                key: 'DueDate',
                label: 'Filing Due Date',
                description: 'Tax return due date',
                placeholder: '[DueDate]',
                example: 'April 15, 2025'
            },
            {
                key: 'ExtensionDate',
                label: 'Extension Date',
                description: 'Extended filing deadline',
                placeholder: '[ExtensionDate]',
                example: 'October 15, 2025'
            }
        ]
    },
    system: {
        label: 'System & Dates',
        icon: '🗓️',
        variables: [
            {
                key: 'CurrentDate',
                label: 'Current Date',
                description: 'Today\'s date',
                placeholder: '[CurrentDate]',
                example: 'February 2, 2026'
            },
            {
                key: 'CurrentYear',
                label: 'Current Year',
                description: 'Current year',
                placeholder: '[CurrentYear]',
                example: '2026'
            }
        ]
    }
};

// Flatten all variables for backward compatibility
const ESSENTIAL_VARIABLES = Object.values(VARIABLE_GROUPS)
    .flatMap(group => group.variables);

const extractTemplatesFromResponse = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.templates)) return payload.templates;
    if (Array.isArray(payload.results)) return payload.results;
    return [];
};

export default function EmailTemplate() {
    const tabs = useMemo(
        () => ['Email Templates', 'Analytics', 'Email Settings'],
        []
    );
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editorTemplate, setEditorTemplate] = useState(null);
    const [showEditorModal, setShowEditorModal] = useState(false);

    // Fetch templates from API
    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await firmAdminEmailTemplatesAPI.listTemplates();
            setTemplates(extractTemplatesFromResponse(data));
        } catch (err) {
            setError(err.message);
            handleAPIError(err);
            toast.error(err.message || 'Failed to fetch email templates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'Email Templates') {
            fetchTemplates();
        }
    }, [activeTab, fetchTemplates]);

    // Handler functions
    const handleCreateTemplate = async (templateData) => {
        try {
            await firmAdminEmailTemplatesAPI.createTemplate(templateData);
            toast.success('Template created successfully');
            fetchTemplates();
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to create template');
            return false;
        }
    };

    const handleUpdateTemplate = async (templateId, updateData) => {
        try {
            await firmAdminEmailTemplatesAPI.updateTemplate(templateId, updateData);
            toast.success('Template updated successfully');
            fetchTemplates();
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to update template');
            return false;
        }
    };

    const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [deletingTemplate, setDeletingTemplate] = useState(false);

    const handleDeleteTemplate = async (templateId) => {
        setTemplateToDelete(templateId);
        setShowDeleteTemplateConfirm(true);
    };

    const confirmDeleteTemplate = async () => {
        if (!templateToDelete) return false;

        try {
            setDeletingTemplate(true);
            await firmAdminEmailTemplatesAPI.deleteTemplate(templateToDelete);
            toast.success('Template deleted successfully');
            fetchTemplates();
            setShowDeleteTemplateConfirm(false);
            setTemplateToDelete(null);
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to delete template');
            return false;
        } finally {
            setDeletingTemplate(false);
        }
    };

    const handleDuplicateTemplate = async (templateId, newName) => {
        try {
            await firmAdminEmailTemplatesAPI.duplicateTemplate(templateId, newName);
            toast.success('Template duplicated successfully');
            fetchTemplates();
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to duplicate template');
            return false;
        }
    };

    const handleSendEmail = async (templateId, emailData) => {
        try {
            await firmAdminEmailTemplatesAPI.sendTemplate(templateId, emailData);
            toast.success('Email sent successfully');
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to send email');
            return false;
        }
    };

    const openEditor = (template = null) => {
        setEditorTemplate(template);
        setShowEditorModal(true);
    };

    const closeEditor = () => {
        setShowEditorModal(false);
        setEditorTemplate(null);
    };

    return (
        <>
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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => openEditor(null)}
                                className="inline-flex h-11 items-center justify-center gap-2 self-start !rounded-lg !bg-[#3AD6F2] px-4 font-semibold text-white hover:bg-[#2BC5E0] transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Create Template
                            </button>

                        </div>
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
                        {activeTab === 'Email Templates' && (
                            <TemplatesView
                                templates={templates}
                                statusClasses={statusClasses}
                                loading={loading}
                                error={error}
                                onRefresh={fetchTemplates}
                                onDelete={handleDeleteTemplate}
                                onDuplicate={handleDuplicateTemplate}
                                onSend={handleSendEmail}
                                onGetTemplate={firmAdminEmailTemplatesAPI.getTemplate}
                                onRequestEdit={openEditor}
                                onRequestCreate={() => openEditor(null)}
                            />
                        )}
                        {activeTab === 'Analytics' && <AnalyticsView />}
                        {activeTab === 'Email Settings' && <EmailSettingsView />}
                        {!['Email Templates', 'Analytics', 'Email Settings'].includes(activeTab) && (
                            <EmptyTabState tab={activeTab} />
                        )}
                    </section>
                </div>

                {/* Template Editor Modal */}
                {showEditorModal && (
                    <TemplateFormModal
                        template={editorTemplate}
                        onClose={closeEditor}
                        onRevert={() => {
                            fetchTemplates();
                            closeEditor();
                        }}
                        onSubmit={async (templatePayload) => {
                            if (editorTemplate?.id) {
                                const success = await handleUpdateTemplate(editorTemplate.id, templatePayload);
                                if (success) {
                                    closeEditor();
                                }
                                return success;
                            }
                            const success = await handleCreateTemplate(templatePayload);
                            if (success) {
                                closeEditor();
                            }
                            return success;
                        }}
                    />
                )}
            </div>

            {/* Delete Template Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteTemplateConfirm}
                onClose={() => {
                    if (!deletingTemplate) {
                        setShowDeleteTemplateConfirm(false);
                        setTemplateToDelete(null);
                    }
                }}
                onConfirm={confirmDeleteTemplate}
                title="Delete Template"
                message="Are you sure you want to delete this template?"
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={deletingTemplate}
                isDestructive={true}
            />
        </>
    );
}

const IconButton = ({ children, ariaLabel, onClick }) => (
    <button
        aria-label={ariaLabel}
        onClick={onClick}
        className=" text-[#4254A0] transition hover:bg-white hover:text-[#1F2A55]"
    >
        {children}
    </button>
);

// Simple Modal Components
const DuplicateModal = ({ template, onClose, onSubmit }) => {
    const [newName, setNewName] = useState(template?.name ? `${template.name} (Copy)` : '');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-[#1F2A55] mb-4">Duplicate Template</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-[#3B4A66] mb-2">New Template Name</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                        placeholder="Enter template name"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(newName)}
                        className="px-4 py-2 text-sm bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D]"
                    >
                        Duplicate
                    </button>
                </div>
            </div>
        </div>
    );
};

const SendEmailModal = ({ template, onClose, onSend }) => {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [variables, setVariables] = useState({});
    const [variablesInput, setVariablesInput] = useState('{}');
    const [variablesError, setVariablesError] = useState('');
    const [availableVariables, setAvailableVariables] = useState([]);
    const [variablesLoading, setVariablesLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const loadVariables = useCallback(async () => {
        if (!template?.email_type) {
            setAvailableVariables([]);
            return;
        }
        try {
            setVariablesLoading(true);
            const data = await firmAdminEmailTemplatesAPI.getVariables(template.email_type);
            setAvailableVariables(data?.variables || []);
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to load template variables');
        } finally {
            setVariablesLoading(false);
        }
    }, [template?.email_type]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    useEffect(() => {
        setVariablesInput(JSON.stringify(variables, null, 2));
    }, [variables]);

    useEffect(() => {
        setVariables({});
        setVariablesInput('{}');
        setVariablesError('');
    }, [template?.id]);

    const handleVariablesInputChange = (value) => {
        setVariablesInput(value);
        try {
            const parsed = value.trim() ? JSON.parse(value) : {};
            setVariables(parsed);
            setVariablesError('');
        } catch {
            setVariablesError('Invalid JSON format');
        }
    };

    const handleApplyVariable = (variable) => {
        setVariables((prev) => ({
            ...prev,
            [variable.key]: variable.example || variable.placeholder || ''
        }));
    };

    const handleSubmit = async () => {
        if (!recipientEmail || !recipientEmail.trim()) {
            toast.error('Please enter recipient email');
            return;
        }
        if (variablesError) {
            toast.error('Please fix variables JSON before sending');
            return;
        }
        try {
            setSending(true);
            const success = await onSend({
                recipient_email: recipientEmail.trim(),
                recipient_name: recipientName.trim() || undefined,
                variables
            });
            if (success) {
                onClose();
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4 send-email-modal">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto send-email-modal-box">
                <h3 className="text-lg font-semibold text-[#1F2A55] mb-4">Send Email</h3>
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] mb-2">Recipient Email *</label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="client@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] mb-2">Recipient Name</label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="Jane Smith"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#3B4A66] mb-2">Template Variables (JSON)</label>
                        <textarea
                            value={variablesInput}
                            onChange={(e) => handleVariablesInputChange(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] h-40 font-mono text-xs"
                            placeholder='{"Firm Name": "ABC Tax Services"}'
                        />
                        {variablesError && (
                            <p className="mt-1 text-xs text-red-500">{variablesError}</p>
                        )}
                    </div>
                    <div className="border border-dashed border-[#C8D5FF] rounded-lg p-4 bg-[#F9FBFF]">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#1F2A55]">
                                    Available Variables {template?.email_type ? `(${template.email_type.replace('_', ' ')})` : ''}
                                </p>
                                <p className="text-xs text-[#6B7280]">
                                    Click a variable to add it with example data
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={loadVariables}
                                className="mt-2 inline-flex items-center justify-center rounded-md border border-[#E8F0FF] px-3 py-1.5 text-xs font-semibold text-[#1F2A55] hover:bg-white sm:mt-0"
                            >
                                Refresh
                            </button>
                        </div>
                        <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                            {variablesLoading ? (
                                <p className="text-sm text-[#7B8AB2]">Loading variables...</p>
                            ) : availableVariables.length === 0 ? (
                                <p className="text-sm text-[#7B8AB2]">No variables available for this email type.</p>
                            ) : (
                                availableVariables.map((variable) => (
                                    <div
                                        key={variable.key}
                                        className="flex flex-col gap-1 rounded-lg border border-[#E8F0FF] bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-[#1F2A55]">{variable.label}</p>
                                            <p className="text-xs text-[#6B7280]">{variable.description}</p>
                                            <p className="text-xs text-[#94A3B8]">Placeholder: {variable.placeholder}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleApplyVariable(variable)}
                                            className="self-start rounded-md border border-[#3AD6F2] px-3 py-1 text-xs font-semibold text-[#1F2A55] hover:bg-[#EBFCFF]"
                                        >
                                            Use example
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:justify-end send-email-footer">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={sending}
                        className="px-4 py-2 text-sm bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PreviewModal = ({ template, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-[#1F2A55]">Template Preview</h3>
                    <button onClick={onClose} className="text-[#7B8AB2] hover:text-[#1F2A55]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#3B4A66] mb-1">Subject</label>
                        <p className="text-sm text-[#1F2A55]">{template.subject || 'No subject'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#3B4A66] mb-1">Body</label>
                        <div
                            className="text-sm text-[#1F2A55] border border-[#E8F0FF] rounded-lg p-4 bg-gray-50"
                            dangerouslySetInnerHTML={{ __html: template.body_html || template.body || '<p>No content</p>' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const VARIABLE_FIELD_LABELS = {
    subject: 'Subject',
    header_html: 'Header HTML',
    body_html: 'Body HTML',
    footer_html: 'Footer HTML',
    body_text: 'Body Text'
};

const convertPlainTextToHtml = (text = '') => {
    if (!text.trim()) return '';
    const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => {
            const lines = paragraph.split(/\n/).map((line) => line.trim());
            return `<p>${lines.join('<br />')}</p>`;
        });
    return paragraphs.join('\n');
};

const getInitialFormState = (template) => ({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'onboarding',
    email_type: template?.email_type || 'client_invite',
    subject: template?.subject || '',
    header_html: template?.header_html || '',
    body_html: template?.body_html || template?.body || '',
    footer_html: template?.footer_html || '',
    body_text: template?.body_text || '',
    tone: template?.tone || 'professional',
    status: template?.status || 'draft',
    is_active: template?.is_active ?? false
});

const TemplateFormModal = ({ template, onClose, onSubmit, onRevert }) => {
    const isEdit = Boolean(template?.id);
    const [formData, setFormData] = useState(getInitialFormState(template));
    const [lastFocusedField, setLastFocusedField] = useState('body_html');
    const [variables, setVariables] = useState([]);
    const [variablesLoading, setVariablesLoading] = useState(false);
    const [variablesError, setVariablesError] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setFormData(getInitialFormState(template));
        setLastFocusedField('body_html');
    }, [template]);

    const loadVariables = useCallback(async () => {
        if (!formData.email_type) {
            setVariables([]);
            return;
        }
        try {
            setVariablesLoading(true);
            const data = await firmAdminEmailTemplatesAPI.getVariables(formData.email_type);
            const fetchedVariables = data?.variables || [];
            const mergedVariables = [...fetchedVariables];
            ESSENTIAL_VARIABLES.forEach((essentialVar) => {
                const exists = mergedVariables.some(
                    (variable) =>
                        variable.key === essentialVar.key ||
                        variable.placeholder === essentialVar.placeholder
                );
                if (!exists) {
                    mergedVariables.push(essentialVar);
                }
            });
            setVariables(mergedVariables);
            setVariablesError('');
        } catch (err) {
            handleAPIError(err);
            setVariables(ESSENTIAL_VARIABLES);
            setVariablesError(err.message || 'Failed to fetch variables');
        } finally {
            setVariablesLoading(false);
        }
    }, [formData.email_type]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    const handleInsertVariable = (placeholder) => {
        if (!lastFocusedField) {
            toast.info('Select a field before inserting a variable');
            return;
        }
        setFormData((prev) => {
            const value = prev[lastFocusedField] || '';
            const needsSpacing = value && !value.endsWith(' ') ? ' ' : '';
            return {
                ...prev,
                [lastFocusedField]: `${value}${needsSpacing}${placeholder}`
            };
        });
    };

    const handleVariableDragStart = (event, placeholder) => {
        event.dataTransfer.setData('text/plain', placeholder);
        event.dataTransfer.effectAllowed = 'copy';
    };

    const handleFieldDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const handleFieldDrop = (event, field) => {
        event.preventDefault();
        const placeholder = event.dataTransfer.getData('text/plain');
        if (!placeholder) return;
        const target = event.target;
        const value = formData[field] || '';
        const start = target.selectionStart ?? value.length;
        const end = target.selectionEnd ?? value.length;
        const newValue = value.slice(0, start) + placeholder + value.slice(end);
        setFormData((prev) => ({
            ...prev,
            [field]: newValue
        }));
    };

    const handlePreview = async () => {
        if (!formData.subject.trim() || !formData.body_html.trim()) {
            toast.error('Subject and body are required for preview');
            return;
        }
        try {
            setPreviewLoading(true);
            const bodyContent = /<\/?[a-z][\s\S]*>/i.test(formData.body_html)
                ? formData.body_html
                : convertPlainTextToHtml(formData.body_html);
            const payload = {
                subject: formData.subject,
                header_content: formData.header_html || '',
                body_content: bodyContent || '',
                footer_content: formData.footer_html || '',
                email_type: formData.email_type
            };
            const data = await firmAdminEmailTemplatesAPI.previewTemplate(payload);
            setPreviewData(data);
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to generate preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Template name is required');
            return false;
        }
        if (!formData.subject.trim()) {
            toast.error('Subject is required');
            return false;
        }
        if (!formData.body_html.trim()) {
            toast.error('Body HTML is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        const payload = {
            name: formData.name.trim(),
            category: formData.category,
            email_type: formData.email_type,
            subject: formData.subject.trim(),
            tone: formData.tone,
            status: formData.status,
            is_active: !!formData.is_active
        };

        if (formData.description.trim()) payload.description = formData.description.trim();
        if (formData.header_html.trim()) payload.header_html = formData.header_html.trim();
        if (formData.body_html.trim()) {
            const rawBody = formData.body_html.trim();
            payload.body_html = /<\/?[a-z][\s\S]*>/i.test(rawBody) ? rawBody : convertPlainTextToHtml(rawBody);
        }
        if (formData.footer_html.trim()) payload.footer_html = formData.footer_html.trim();
        if (formData.body_text.trim()) payload.body_text = formData.body_text.trim();

        try {
            setSubmitting(true);
            const success = await onSubmit(payload);
            if (success) {
                setPreviewData(null);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevert = async () => {
        if (!window.confirm('Are you sure you want to revert this template to system defaults? All your customizations will be lost.')) {
            return;
        }

        try {
            setSubmitting(true);
            await firmAdminEmailTemplatesAPI.revertTemplate(template.id);
            toast.success('Template reverted to system default');
            if (onRevert) {
                onRevert();
            } else {
                onClose();
            }
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setSubmitting(false);
        }
    };

    const fieldLabel = VARIABLE_FIELD_LABELS[lastFocusedField] || 'selected field';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1200]">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#1F2A55]">
                            {isEdit ? 'Edit Email Template' : 'Create Email Template'}
                        </h3>
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-[#6B7280]">
                                ✨ <strong>No HTML knowledge required!</strong> Type your message naturally, and we'll handle the formatting.
                            </p>
                            <p className="text-xs text-[#94A3B8]">
                                Use the variables on the right to personalize emails for each recipient
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#7B8AB2] hover:text-[#1F2A55] p-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)] lg:gap-6">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Template Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                    placeholder="Welcome Email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                    placeholder="Short internal description"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_CATEGORIES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Email Type</label>
                                <select
                                    value={formData.email_type}
                                    onChange={(e) => setFormData({ ...formData, email_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_TYPES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Tone</label>
                                <select
                                    value={formData.tone}
                                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_TONES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_STATUSES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col justify-end md:col-span-2">
                                <label className="text-sm font-medium text-[#3B4A66] mb-2">Active Template</label>
                                <label className="inline-flex items-center gap-2 text-sm text-[#1F2A55]">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="h-4 w-4 text-[#3AD6F2] border-[#C8D5FF] rounded focus:ring-[#3AD6F2]"
                                    />
                                    Use this template for live communications
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] mb-2">Subject *</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onFocus={() => setLastFocusedField('subject')}
                                onDragOver={handleFieldDragOver}
                                onDrop={(event) => handleFieldDrop(event, 'subject')}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="Welcome to Firm Name!"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {['header_html', 'body_html', 'footer_html'].map((field) => (
                                <div key={field} className={field === 'body_html' ? 'lg:col-span-3' : 'lg:col-span-3'}>
                                    <label className="block text-sm font-medium text-[#3B4A66] mb-2 capitalize">
                                        {VARIABLE_FIELD_LABELS[field]} {field === 'body_html' ? '*' : ''}
                                    </label>
                                    <textarea
                                        value={formData[field]}
                                        onFocus={() => setLastFocusedField(field)}
                                        onDragOver={handleFieldDragOver}
                                        onDrop={(event) => handleFieldDrop(event, field)}
                                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                        className={`w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-mono text-xs ${field === 'body_html' ? 'h-48' : 'h-32'}`}
                                        placeholder="<div>Content...</div>"
                                    />
                                    {field === 'body_html' && (
                                        <p className="mt-1 text-xs text-[#6B7280]">
                                            Type plain text and we will wrap it with HTML automatically. You can also drag variables directly into this field.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] mb-2">Body Text (optional)</label>
                            <textarea
                                value={formData.body_text}
                                onFocus={() => setLastFocusedField('body_text')}
                                onDragOver={handleFieldDragOver}
                                onDrop={(event) => handleFieldDrop(event, 'body_text')}
                                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] h-32"
                                placeholder="Plain text version for fallback"
                            />
                        </div>

                        {previewData && (
                            <div className="border border-[#E8F0FF] rounded-lg p-4 bg-[#FDFDFE]">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-sm font-semibold text-[#1F2A55]">Preview</p>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewData(null)}
                                        className="text-xs text-[#7B8AB2] hover:text-[#1F2A55]"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <p className="text-sm font-medium text-[#1F2A55] mb-3">{previewData.subject}</p>
                                <div
                                    className="border border-[#E8F0FF] rounded-lg bg-white p-4 text-sm text-[#1F2A55]"
                                    dangerouslySetInnerHTML={{ __html: previewData.html }}
                                />
                                {previewData.sample_variables && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-[#6B7280] uppercase">Sample Variables</p>
                                        <div className="grid gap-2 mt-1 sm:grid-cols-2">
                                            {Object.entries(previewData.sample_variables).map(([key, value]) => (
                                                <div key={key} className="rounded-md border border-[#E8F0FF] bg-white px-3 py-2 text-xs text-[#1F2A55]">
                                                    <span className="font-semibold">{key}:</span> {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Enhanced Variable Picker - Grouped by Category */}
                    <div className="mt-6 lg:mt-0">
                        <div className="border border-dashed border-[#C8D5FF] rounded-lg p-4 bg-[#F9FBFF] lg:sticky lg:top-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-[#1F2A55] inline-flex items-center gap-2">
                                            📝 Available Variables
                                        </p>
                                        <p className="text-xs text-[#6B7280] mt-1">
                                            Click to insert into {fieldLabel.toLowerCase()}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadVariables}
                                        className="text-xs text-[#3AD6F2] hover:underline"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {/* Helpful Info Banner */}
                                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-900 leading-relaxed">
                                        💡 <strong>Tip:</strong> Variables are automatically replaced with real data when emails are sent.
                                        Example: <code className="bg-blue-100 px-1 rounded">[FirstName]</code> becomes "John"
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 max-h-96 overflow-y-auto space-y-3 pr-1">
                                {variablesLoading ? (
                                    <p className="text-sm text-[#7B8AB2]">Loading variables...</p>
                                ) : variablesError ? (
                                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                        <p className="font-semibold">⚠️ Using default variables</p>
                                        <p className="text-xs mt-1">{variablesError}</p>
                                    </div>
                                ) : (
                                    // Render grouped variables
                                    Object.entries(VARIABLE_GROUPS).map(([groupKey, group]) => (
                                        <div key={groupKey} className="border border-[#E8F0FF] rounded-lg bg-white p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">{group.icon}</span>
                                                <p className="text-xs font-bold uppercase text-[#1F2A55] tracking-wide">
                                                    {group.label}
                                                </p>
                                                <span className="text-xs text-[#94A3B8] ml-auto">
                                                    {group.variables.length}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {group.variables.map((variable) => (
                                                    <button
                                                        key={variable.key}
                                                        type="button"
                                                        draggable
                                                        onDragStart={(event) => handleVariableDragStart(event, variable.placeholder)}
                                                        onClick={() => handleInsertVariable(variable.placeholder)}
                                                        className="w-full text-left rounded-md border border-[#E8F0FF] bg-gray-50 px-2.5 py-2 text-xs hover:bg-[#EBFCFF] hover:border-[#3AD6F2] transition-all group"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-[#1F2A55] text-sm">
                                                                    {variable.label}
                                                                </p>
                                                                <p className="text-[#6B7280] mt-0.5">
                                                                    {variable.description}
                                                                </p>
                                                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                                                                        {variable.placeholder}
                                                                    </code>
                                                                    {variable.example && (
                                                                        <>
                                                                            <span className="text-[#94A3B8]">→</span>
                                                                            <span className="text-xs text-green-600 font-medium">
                                                                                "{variable.example}"
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#3AD6F2]">
                                                                    <path d="M12 8H4M8 4v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Help Footer */}
                            <div className="mt-4 pt-3 border-t border-[#E8F0FF]">
                                <p className="text-xs text-[#7B8AB2] mb-2">📚 Need help?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        className="text-xs px-2 py-1.5 bg-white border border-[#E8F0FF] rounded hover:bg-gray-50 text-[#1F2A55]"
                                        onClick={() => window.open('https://seqwens-s3.s3.us-east-1.amazonaws.com/docs/email_templates_guide.pdf', '_blank')}
                                    >
                                        📖 View Docs
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:justify-between">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handlePreview}
                            className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            disabled={previewLoading}
                        >
                            {previewLoading ? 'Generating preview...' : 'Preview'}
                        </button>
                    </div>
                    <div className="flex gap-3 sm:justify-end">
                        {isEdit && formData.email_type !== 'custom' && (
                            <button
                                type="button"
                                onClick={handleRevert}
                                disabled={submitting}
                                className="px-4 py-2 text-sm text-[#F56D2D] bg-[#FFF5F2] border border-[#F56D2D] rounded-lg hover:bg-[#FFE0D4] disabled:opacity-50"
                            >
                                Reset to Default
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-4 py-2 text-sm bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

// Helper function to transform API data to display format
const transformTemplateData = (template) => {
    // Map API status to display format
    const statusMap = {
        'active': { label: 'Active', variant: 'active' },
        'draft': { label: 'Draft', variant: 'draft' },
        'archived': { label: 'Archived', variant: 'archived' },
        'inactive': { label: 'Inactive', variant: 'archived' }
    };

    // Map category to icon
    const categoryIconMap = {
        'tax_preparation': FolderIcon,
        'onboarding': PeopleIcon,
        'scheduling': ClockIcon,
        'payment': FolderIcon,
        'document': FolderIcon,
        'document_request': FolderIcon,
        'appointment': ClockIcon,
        'reminder': ClockIcon,
        'notification': FolderIcon,
        'letterhead': FolderIcon,
        'other': FolderIcon
    };

    const category = (template.category || 'other').toLowerCase();
    const categoryLabel = template.category_display || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const status = statusMap[template.status?.toLowerCase()] || statusMap['draft'];
    const usageCount = typeof template.usage_count === 'number' ? template.usage_count : 0;
    const lastUsedTimestamp = template.last_used_at || template.last_used || template.updated_at;
    const lastUsed = lastUsedTimestamp ? new Date(lastUsedTimestamp).toLocaleDateString() : 'Never';

    return {
        id: template.id || template.template_id,
        title: template.name || template.title || 'Untitled Template',
        description: template.description || '',
        category: {
            label: categoryLabel,
            pill: 'border border-[#C8D5FF] bg-white text-[#32406B]',
            icon: categoryIconMap[category.toLowerCase()] || FolderIcon
        },
        subject: template.subject || 'No subject',
        usage: `${usageCount} ${usageCount === 1 ? 'time' : 'times'}`,
        lastUsed,
        status: status,
        rawData: template // Keep original data for API calls
    };
};

function TemplatesView({
    templates,
    statusClasses,
    loading,
    error,
    onRefresh,
    onDelete,
    onDuplicate,
    onSend,
    onGetTemplate,
    onRequestEdit,
    onRequestCreate
}) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const transformedTemplates = templates.map(transformTemplateData);

    // Pagination calculations
    const totalItems = transformedTemplates.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedTemplates = transformedTemplates.slice(startIndex, endIndex);

    // Reset to page 1 when templates change
    useEffect(() => {
        setCurrentPage(1);
    }, [templates.length]);

    const handlePreview = async (template) => {
        try {
            const fullTemplate = await onGetTemplate(template.id);
            setSelectedTemplate(fullTemplate);
            setShowPreviewModal(true);
        } catch (err) {
            toast.error('Failed to load template details');
        }
    };

    const handleEdit = async (template) => {
        try {
            const fullTemplate = await onGetTemplate(template.id);
            onRequestEdit?.(fullTemplate);
        } catch (err) {
            toast.error('Failed to load template details');
        }
    };

    const handleDelete = async (template) => {
        await onDelete(template.id);
    };

    const handleDuplicate = (template) => {
        setSelectedTemplate(template);
        setShowDuplicateModal(true);
    };

    const handleSend = async (template) => {
        try {
            const fullTemplate = await onGetTemplate(template.id);
            setSelectedTemplate(fullTemplate);
            setShowSendModal(true);
        } catch (err) {
            toast.error('Failed to load template details');
        }
    };

    const handleDuplicateSubmit = async (newName) => {
        if (!newName || !newName.trim()) {
            toast.error('Please enter a name for the duplicate');
            return;
        }
        const success = await onDuplicate(selectedTemplate.id, newName.trim());
        if (success) {
            setShowDuplicateModal(false);
            setSelectedTemplate(null);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF] p-8 text-center">
                <p className="text-[#7B8AB2]">Loading templates...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF] p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC4E0]"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF]">
                <div className="border-b border-[#E8F0FF] px-5 py-5 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-[#1F2A55]">Email Templates</h3>
                        <p className="mt-1 text-sm text-[#7B8AB2]">Manage your email templates and their usage</p>
                    </div>
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
                {transformedTemplates.length === 0 ? (
                    <div className="p-8 text-center text-[#7B8AB2]">
                        <p>No templates found. Create your first template to get started.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden xl:block">
                            {paginatedTemplates.map((template, index) => (
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
                                        <IconButton ariaLabel="Preview template" onClick={() => handlePreview(template)}>
                                            <EyeIcon />
                                        </IconButton>
                                        <IconButton ariaLabel="Edit template" onClick={() => handleEdit(template)}>
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" strokeWidth="0.5" />
                                                <path d="M8.70947 4.03906H4.62614C4.31672 4.03906 4.01997 4.16198 3.80118 4.38077C3.58239 4.59956 3.45947 4.89631 3.45947 5.20573V13.3724C3.45947 13.6818 3.58239 13.9786 3.80118 14.1974C4.01997 14.4161 4.31672 14.5391 4.62614 14.5391H12.7928C13.1022 14.5391 13.399 14.4161 13.6178 14.1974C13.8366 13.9786 13.9595 13.6818 13.9595 13.3724V9.28906" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12.4284 3.82337C12.6605 3.59131 12.9753 3.46094 13.3034 3.46094C13.6316 3.46094 13.9464 3.59131 14.1784 3.82337C14.4105 4.05544 14.5409 4.37019 14.5409 4.69837C14.5409 5.02656 14.4105 5.34131 14.1784 5.57337L8.92086 10.8315C8.78234 10.9699 8.61123 11.0712 8.42327 11.1261L6.74736 11.6161C6.69716 11.6308 6.64395 11.6316 6.5933 11.6187C6.54265 11.6057 6.49642 11.5793 6.45945 11.5424C6.42248 11.5054 6.39613 11.4592 6.38315 11.4085C6.37017 11.3579 6.37105 11.3047 6.38569 11.2545L6.87569 9.57854C6.93083 9.39074 7.03234 9.21982 7.17086 9.08154L12.4284 3.82337Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </IconButton>
                                        <IconButton ariaLabel="Duplicate template" onClick={() => handleDuplicate(template)}>
                                            <DuplicateIcon />
                                        </IconButton>
                                        <IconButton ariaLabel="Send template" onClick={() => handleSend(template)}>
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
                                                <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" strokeWidth="0.5" />
                                                <path d="M13.9582 4.03906L4.0415 7.2474L7.83317 8.9974L11.9165 6.08073L8.99984 10.1641L10.7498 13.9557L13.9582 4.03906Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </IconButton>
                                        <IconButton ariaLabel="Delete template" onClick={() => handleDelete(template)}>
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </IconButton>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="divide-y divide-[#E8F0FF] xl:hidden">
                            {paginatedTemplates.map((template) => (
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
                                            <IconButton ariaLabel="Preview template" onClick={() => handlePreview(template)}>
                                                <EyeIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Edit template" onClick={() => handleEdit(template)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Duplicate template" onClick={() => handleDuplicate(template)}>
                                                <DuplicateIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Send template" onClick={() => handleSend(template)}>
                                                <SendIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Delete template" onClick={() => handleDelete(template)}>
                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </IconButton>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-5 py-4 sm:px-6 lg:px-8 border-t border-[#E8F0FF]">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    startIndex={startIndex}
                                    endIndex={endIndex}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Duplicate Modal */}
                {showDuplicateModal && (
                    <DuplicateModal
                        template={selectedTemplate}
                        onClose={() => {
                            setShowDuplicateModal(false);
                            setSelectedTemplate(null);
                        }}
                        onSubmit={handleDuplicateSubmit}
                    />
                )}

                {/* Send Email Modal */}
                {showSendModal && selectedTemplate && (
                    <SendEmailModal
                        template={selectedTemplate}
                        onClose={() => {
                            setShowSendModal(false);
                            setSelectedTemplate(null);
                        }}
                        onSend={async (emailData) => {
                            const success = await onSend(selectedTemplate.id, emailData);
                            if (success) {
                                setShowSendModal(false);
                                setSelectedTemplate(null);
                            }
                        }}
                    />
                )}

                {/* Preview Modal */}
                {showPreviewModal && selectedTemplate && (
                    <PreviewModal
                        template={selectedTemplate}
                        onClose={() => {
                            setShowPreviewModal(false);
                            setSelectedTemplate(null);
                        }}
                    />
                )}
            </div>
        </>
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

