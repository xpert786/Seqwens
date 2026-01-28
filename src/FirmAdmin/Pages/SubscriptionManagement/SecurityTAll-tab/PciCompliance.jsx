import React from 'react';

const PciCompliance = ({ spendingLimitsEnabled }) => {
    const complianceItems = [
        {
            text: 'Control who can purchase add-ons and set spending limits',
            enabled: spendingLimitsEnabled,
            statusLabel: spendingLimitsEnabled ? '(Active)' : '(Not Configured)'
        },
        { text: 'Do not use vendor-supplied defaults for passwords', enabled: true },
        { text: 'Protect stored cardholder data', enabled: true },
        { text: 'Encrypt transmission of cardholder data', enabled: true },
        { text: 'Use and regularly update anti-virus software', enabled: true },
        { text: 'Develop and maintain secure systems', enabled: true },
        { text: 'Restrict access to cardholder data', enabled: true },
        { text: 'Assign unique ID to each person with access', enabled: true }
    ];

    return (
        <div className=" p-4 sm:p-6">
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Staff Purchase Permissions & Security Policies</h6>
            <div className="space-y-3">
                {complianceItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <div className=" flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.enabled ? (
                                <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.5 5.5L6 7L11 2" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10.5 6V9.5C10.5 9.76522 10.3946 10.0196 10.2071 10.2071C10.0196 10.3946 9.76522 10.5 9.5 10.5H2.5C2.23478 10.5 1.98043 10.3946 1.79289 10.2071C1.60536 10.0196 1.5 9.76522 1.5 9.5V2.5C1.5 2.23478 1.60536 1.98043 1.79289 1.79289C1.98043 1.60536 2.23478 1.5 2.5 1.5H8" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="6" cy="6" r="4.5" stroke="#F59E0B" strokeWidth="1.5" />
                                    <path d="M6 3.5V6.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                                    <circle cx="6" cy="8.25" r="0.5" fill="#F59E0B" />
                                </svg>
                            )}
                        </div>
                        <p className={`text-sm font-[BasisGrotesquePro] ${item.enabled ? 'text-gray-700' : 'text-amber-600'}`}>
                            {item.text} {item.statusLabel && <span className="font-medium">{item.statusLabel}</span>}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PciCompliance;


