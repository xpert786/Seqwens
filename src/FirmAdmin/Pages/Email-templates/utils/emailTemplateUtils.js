import { FolderIcon, PeopleIcon, ClockIcon } from '../Icons';

export const statusClasses = {
    active: '!border border-[#22C55E] bg-transparent text-[#198754]',
    draft: '!border border-[#FBBF24] bg-transparent text-[#D97706]',
    archived: 'bg-[#EEF2F7] text-[#6B7280]'
};

export const EMAIL_TEMPLATE_CATEGORIES = [
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

export const EMAIL_TEMPLATE_TYPES = [
    { value: 'client_invite', label: 'Client Invite' },
    { value: 'staff_invite', label: 'Staff Invite' },
    { value: 'firm_onboarding', label: 'Firm Onboarding' },
    { value: 'account_deletion', label: 'Account Deletion' },
    { value: 'subscription_created', label: 'Subscription Created' },
    { value: 'subscription_ending', label: 'Subscription Ending' },
    { value: 'subscription_expired', label: 'Subscription Expired' }
];

export const EMAIL_TEMPLATE_TONES = [
    { value: 'formal', label: 'Formal' },
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'warm', label: 'Warm' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'informative', label: 'Informative' }
];

export const EMAIL_TEMPLATE_STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' }
];

export const VARIABLE_GROUPS = {
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

export const ESSENTIAL_VARIABLES = Object.values(VARIABLE_GROUPS)
    .flatMap(group => group.variables);

export const extractTemplatesFromResponse = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.templates)) return payload.templates;
    if (Array.isArray(payload.results)) return payload.results;
    return [];
};

export const VARIABLE_FIELD_LABELS = {
    subject: 'Subject',
    header_html: 'Header HTML',
    body_html: 'Body HTML',
    footer_html: 'Footer HTML',
    body_text: 'Body Text'
};

export const convertPlainTextToHtml = (text = '') => {
    if (!text.trim()) return '';
    const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => {
            const lines = paragraph.split(/\n/).map((line) => line.trim());
            return `<p>${lines.join('<br />')}</p>`;
        });
    return paragraphs.join('\n');
};

export const getInitialFormState = (template) => ({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'onboarding',
    email_type: template?.email_type || 'client_invite',
    subject: template?.subject || '',
    header_html: template?.header_html || '',
    body_html: template?.body_html || template?.body || '',
    footer_html: template?.footer_html || '',
    editor_mode: template?.editor_mode || 'visual',
    blocks_data: template?.blocks_data || [],
    body_text: template?.body_text || '',
    tone: template?.tone || 'professional',
    status: template?.status || 'draft',
    is_active: template?.is_active ?? false
});

export const transformTemplateData = (template) => {
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
