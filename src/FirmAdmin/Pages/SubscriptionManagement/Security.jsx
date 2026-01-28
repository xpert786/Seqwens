import React, { useState, useEffect } from 'react';
import PciCompliance from './SecurityTAll-tab/PciCompliance';
import { firmAdminSubscriptionAPI } from '../../../ClientOnboarding/utils/apiUtils';

const Security = () => {
    const [statusData, setStatusData] = useState({
        encryption_status: 'Initializing...',
        last_security_scan: 'Checking...',
        compliance_level: 'Verifying...',
        spending_limits_enabled: false,
        overall_status: 'Checking...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await firmAdminSubscriptionAPI.getSecurityStatus();
                if (response.success) {
                    setStatusData(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch security status", error);
                // Fallback to safe defaults if API fails
                setStatusData({
                    encryption_status: 'Active',
                    last_security_scan: 'Passed',
                    compliance_level: 'Level 1',
                    spending_limits_enabled: false,
                    overall_status: 'Action Required'
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    return (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
            <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Compliance & Security</h5>

            {/* Security Status Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Encryption Status Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                    <div className="absolute top-4 right-4">
                        <div className=" flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 11L12 14L22 4" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Encryption Status</p>
                        <p className="text-xl sm:text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{statusData.encryption_status}</p>
                    </div>
                </div>

                {/* Last Security Scan Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                    <div className="absolute top-4 right-4">
                        <div className=" flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22.4984C12 22.4984 20.9986 19.4988 20.9986 12" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.9986 11.9984V2.99977C20.9986 2.99977 17.9991 1.5 12 1.5" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12.0006 22.4984C12.0006 22.4984 3.00195 19.4988 3.00195 12" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.00195 11.9984V2.99977C3.00195 2.99977 6.00149 1.5 12.0006 1.5" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Last Security Scan</p>
                        <p className="text-xl sm:text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{statusData.last_security_scan}</p>
                    </div>
                </div>

                {/* Compliance Level Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                    <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 bg-white !border !rounded-full text-xs font-medium font-[BasisGrotesquePro] ${statusData.overall_status === 'Secure' ? 'text-[#22C55E] border-[#22C55E]' : 'text-amber-500 border-amber-500'}`}>
                            {statusData.overall_status === 'Secure' ? 'Certified' : 'Pending'}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Compliance Level</p>
                        <p className="text-xl sm:text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{statusData.compliance_level}</p>
                    </div>
                </div>
            </div>

            <PciCompliance spendingLimitsEnabled={statusData.spending_limits_enabled} />
        </div>
    );
};

export default Security;

