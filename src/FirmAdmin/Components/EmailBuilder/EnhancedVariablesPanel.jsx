import React from 'react';

const VARIABLE_GROUPS = {
    client: {
        label: 'Client Information',
        icon: '👤',
        variables: [
            { key: 'FirstName', label: 'First Name', example: 'John', description: 'Client first name' },
            { key: 'LastName', label: 'Last Name', example: 'Smith', description: 'Client last name' },
            { key: 'FullName', label: 'Full Name', example: 'John Smith', description: 'Client full name' },
            { key: 'Email', label: 'Email', example: 'john.smith@example.com', description: 'Client email address' },
            { key: 'Phone', label: 'Phone', example: '(555) 123-4567', description: 'Client phone number' },
            { key: 'Address', label: 'Street Address', example: '123 Main Street', description: 'Client street address' },
            { key: 'City', label: 'City', example: 'New York', description: 'Client city' },
            { key: 'State', label: 'State', example: 'NY', description: 'Client state' },
            { key: 'ZipCode', label: 'ZIP Code', example: '10001', description: 'Client ZIP/postal code' },
        ],
    },
    spouse: {
        label: 'Spouse Information',
        icon: '💑',
        variables: [
            { key: 'SpouseFirstName', label: 'Spouse First Name', example: 'Jane', description: 'Spouse first name' },
            { key: 'SpouseLastName', label: 'Spouse Last Name', example: 'Smith', description: 'Spouse last name' },
            { key: 'SpouseFullName', label: 'Spouse Full Name', example: 'Jane Smith', description: 'Spouse full name' },
            { key: 'SpouseEmail', label: 'Spouse Email', example: 'jane.smith@example.com', description: 'Spouse email address' },
        ],
    },
    firm: {
        label: 'Firm Information',
        icon: '🏢',
        variables: [
            { key: 'FirmName', label: 'Firm Name', example: 'ABC Tax Services', description: 'Your firm name' },
            { key: 'FirmAddress', label: 'Firm Address', example: '456 Business Ave', description: 'Your firm address' },
            { key: 'FirmPhone', label: 'Firm Phone', example: '(555) 987-6543', description: 'Your firm phone number' },
            { key: 'FirmEmail', label: 'Firm Email', example: 'contact@abctax.com', description: 'Your firm email address' },
            { key: 'FirmWebsite', label: 'Firm Website', example: 'https://www.abctax.com', description: 'Your firm website URL' },
            { key: 'FirmLogo', label: 'Firm Logo URL', example: 'https://...', description: 'Your firm logo image URL', isImage: true },
            { key: 'PrimaryColor', label: 'Primary Brand Color', example: '#1E40AF', description: 'Primary brand color', isColor: true },
            { key: 'SecondaryColor', label: 'Secondary Brand Color', example: '#22C55E', description: 'Secondary brand color', isColor: true },
            { key: 'AssignedPreparerName', label: 'Assigned Preparer', example: 'Robert Johnson, CPA', description: 'Assigned tax preparer' },
            { key: 'AssignedPreparerEmail', label: 'Preparer Email', example: 'robert@abctax.com', description: 'Preparer email' },
        ],
    },
    subscription: {
        label: 'Subscription & Invites',
        icon: '📧',
        variables: [
            { key: 'InviteLink', label: 'Invite Link', example: 'https://app.seqwens.com/invite/abc123', description: 'Invitation link' },
            { key: 'ExpirationDate', label: 'Expiration Date', example: 'December 31, 2026', description: 'Invitation expiration' },
            { key: 'SubscriptionPlan', label: 'Subscription Plan', example: 'Professional Plan', description: 'Current subscription plan' },
            { key: 'RenewalDate', label: 'Renewal Date', example: 'January 1, 2027', description: 'Subscription renewal date' },
            { key: 'Role', label: 'User Role', example: 'Client', description: 'Recipient role' },
        ],
    },
    tax: {
        label: 'Tax Information',
        icon: '📊',
        variables: [
            { key: 'TaxYear', label: 'Tax Year', example: '2024', description: 'Current tax year' },
            { key: 'FilingStatus', label: 'Filing Status', example: 'Married Filing Jointly', description: 'Tax filing status' },
            { key: 'DueDate', label: 'Filing Due Date', example: 'April 15, 2025', description: 'Tax return due date' },
            { key: 'ExtensionDate', label: 'Extension Date', example: 'October 15, 2025', description: 'Extended deadline' },
        ],
    },
    system: {
        label: 'System & Dates',
        icon: '🗓️',
        variables: [
            { key: 'CurrentDate', label: 'Current Date', example: 'February 6, 2026', description: "Today's date" },
            { key: 'CurrentYear', label: 'Current Year', example: '2026', description: 'Current year' },
        ],
    },
};

const EnhancedVariablesPanel = ({ onInsertVariable, onClose }) => {
    const [expandedGroups, setExpandedGroups] = React.useState(['client', 'firm']);
    const [searchQuery, setSearchQuery] = React.useState('');

    const toggleGroup = (groupKey) => {
        setExpandedGroups((prev) =>
            prev.includes(groupKey)
                ? prev.filter((k) => k !== groupKey)
                : [...prev, groupKey]
        );
    };

    const filteredGroups = React.useMemo(() => {
        if (!searchQuery.trim()) return VARIABLE_GROUPS;

        const query = searchQuery.toLowerCase();
        const filtered = {};

        Object.entries(VARIABLE_GROUPS).forEach(([groupKey, group]) => {
            const matchingVars = group.variables.filter(
                (v) =>
                    v.key.toLowerCase().includes(query) ||
                    v.label.toLowerCase().includes(query) ||
                    v.description.toLowerCase().includes(query) ||
                    v.example.toLowerCase().includes(query)
            );

            if (matchingVars.length > 0) {
                filtered[groupKey] = { ...group, variables: matchingVars };
            }
        });

        return filtered;
    }, [searchQuery]);

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="p-[20px] border-b border-[#e8f0ff] flex justify-between items-center bg-[#f9fbff]">
                <h4 className="m-0 text-[16px] font-bold text-[#1f2a55]">Available Variables</h4>
                <button
                    className="text-[24px] cursor-pointer text-[#6e7dae] bg-transparent border-none p-0 leading-none"
                    onClick={onClose}
                >
                    ×
                </button>
            </div>

            <div className="p-[16px] border-b border-[#e8f0ff]">
                <input
                    type="text"
                    placeholder="Search variables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-[10px_12px] border-2 border-[#e8f0ff] rounded-[6px] text-[14px] text-[#1f2a55] transition-all duration-200 focus:outline-none focus:border-[#3ad6f2] focus:shadow-[0_0_0_3px_rgba(58,214,242,0.1)]"
                />
            </div>

            <div className="p-[12px_16px] bg-[#ebfcff] border-b border-[#e8f0ff]">
                <p className="m-0 text-[12px] text-[#1f2a55] leading-[1.5]">💡 Click any variable to insert it into your content. It will be replaced with actual data when the email is sent.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-[8px] custom-scrollbar">
                {Object.entries(filteredGroups).map(([groupKey, group]) => (
                    <div key={groupKey} className="mb-[8px] border border-[#e8f0ff] rounded-[8px] overflow-hidden bg-white">
                        <button
                            className="w-full p-[12px_16px] bg-[#f9fbff] border-none flex items-center gap-[8px] cursor-pointer transition-all duration-200 text-left "
                            onClick={() => toggleGroup(groupKey)}
                       >
                           <span className="text-[18px]">{group.icon}</span>
                            <span className="flex-1 text-[13px] font-bold text-[#1f2a55]">{group.label}</span>
                            <span className="text-[11px] text-[#6e7dae] font-semibold">({group.variables.length})</span>
                            <span className={`text-[10px] text-[#6e7dae] transition-transform duration-200 ${expandedGroups.includes(groupKey) ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {expandedGroups.includes(groupKey) && (
                            <div className="border-t border-[#e8f0ff]">
                                {group.variables.map((variable) => (
                                    <div
                                        key={variable.key}
                                        className="p-[12px_16px] border-b border-[#f3f6fd] last:border-b-0 cursor-pointer transition-all duration-200 hover:bg-[#ebfcff]"
                                        onClick={() => onInsertVariable && onInsertVariable(`[${variable.key}]`)}
                                    >
                                        <div className="mb-[8px]">
                                            <div className="text-[13px] font-semibold text-[#1f2a55] mb-[4px]">{variable.label}</div>
                                            <div className="text-[11px] font-mono text-[#3ad6f2] bg-[#f3f6fd] p-[2px_6px] rounded-[3px] inline-block mb-[4px]">[{variable.key}]</div>
                                            <div className="text-[11px] text-[#6e7dae] leading-[1.4]">{variable.description}</div>
                                        </div>
                                        <div className="mt-[8px]">
                                            {variable.isColor ? (
                                                <div className="text-[11px] text-white p-[6px_10px] rounded-[4px] text-center font-mono font-bold shadow-[0_2px_4px_rgba(0,0,0,0.1)]" style={{ backgroundColor: variable.example }}>
                                                    {variable.example}
                                                </div>
                                            ) : variable.isImage ? (
                                                <div className="text-[12px] text-[#6e7dae] p-[6px_10px] bg-[#f9fbff] rounded-[4px] text-center border border-[#e8f0ff]">🖼️ Image URL</div>
                                            ) : (
                                                <div className="text-[12px] text-[#6e7dae] italic p-[6px_10px] bg-[#f9fbff] rounded-[4px] border-l-[3px] border-[#3ad6f2]">
                                                    → "{variable.example}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {Object.keys(filteredGroups).length === 0 && (
                <div className="p-[40px_20px] text-center">
                    <p className="m-0 text-[14px] text-[#6e7dae]">No variables found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

export default EnhancedVariablesPanel;

