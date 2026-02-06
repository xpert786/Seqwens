import React from 'react';
import './EnhancedVariablesPanel.css';

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
        <div className="enhanced-variables-panel">
            <div className="variables-panel-header">
                <h3>Available Variables</h3>
                <button className="panel-close-btn" onClick={onClose}>×</button>
            </div>

            <div className="variables-search">
                <input
                    type="text"
                    placeholder="Search variables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="variables-search-input"
                />
            </div>

            <div className="variables-help-text">
                <p>💡 Click any variable to insert it into your content. It will be replaced with actual data when the email is sent.</p>
            </div>

            <div className="variables-groups">
                {Object.entries(filteredGroups).map(([groupKey, group]) => (
                    <div key={groupKey} className="variable-group">
                        <button
                            className="variable-group-header"
                            onClick={() => toggleGroup(groupKey)}
                        >
                            <span className="group-icon">{group.icon}</span>
                            <span className="group-label">{group.label}</span>
                            <span className="group-count">({group.variables.length})</span>
                            <span className={`group-toggle ${expandedGroups.includes(groupKey) ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {expandedGroups.includes(groupKey) && (
                            <div className="variable-group-content">
                                {group.variables.map((variable) => (
                                    <div
                                        key={variable.key}
                                        className="variable-item"
                                        onClick={() => onInsertVariable(`[${variable.key}]`)}
                                    >
                                        <div className="variable-info">
                                            <div className="variable-label">{variable.label}</div>
                                            <div className="variable-placeholder">[{variable.key}]</div>
                                            <div className="variable-description">{variable.description}</div>
                                        </div>
                                        <div className="variable-preview">
                                            {variable.isColor ? (
                                                <div className="color-preview" style={{ backgroundColor: variable.example }}>
                                                    {variable.example}
                                                </div>
                                            ) : variable.isImage ? (
                                                <div className="image-preview">🖼️ Image URL</div>
                                            ) : (
                                                <div className="text-preview">→ "{variable.example}"</div>
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
                <div className="no-results">
                    <p>No variables found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

export default EnhancedVariablesPanel;
