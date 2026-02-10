import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { FiSearch, FiDownload, FiLoader, FiInfo } from "react-icons/fi";

export default function ArchivedMonitoring() {
    const [searchTerm, setSearchTerm] = useState("");
    const [retentionRule, setRetentionRule] = useState(null);
    const [loadingRetention, setLoadingRetention] = useState(true);
    const [retentionFormData, setRetentionFormData] = useState({
        enable_retention_rules: false,
        years_to_keep: 7,
        firm_id: null
    });
    const [submittingRetention, setSubmittingRetention] = useState(false);
    const [firmsData, setFirmsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchArchiveMonitoring();
        fetchRetentionRule();
    }, []);

    const fetchRetentionRule = async () => {
        try {
            setLoadingRetention(true);
            const response = await superAdminAPI.getRetentionRule();

            if (response.success && response.data) {
                setRetentionRule(response.data);
                setRetentionFormData({
                    enable_retention_rules: response.data.enable_retention_rules || false,
                    years_to_keep: response.data.years_to_keep || 7,
                    firm_id: response.data.firm || null
                });
            }
        } catch (err) {
            console.error('Error fetching retention rule:', err);
            // Non-critical, just log
        } finally {
            setLoadingRetention(false);
        }
    };

    const handleSaveRetentionRule = async () => {
        if (retentionFormData.years_to_keep < 1 || retentionFormData.years_to_keep > 100) {
            toast.error("Years to keep must be between 1 and 100", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            setSubmittingRetention(true);
            const payload = {
                enable_retention_rules: retentionFormData.enable_retention_rules,
                years_to_keep: retentionFormData.years_to_keep
            };

            if (retentionFormData.firm_id) {
                payload.firm_id = retentionFormData.firm_id;
            }

            const response = await superAdminAPI.createOrUpdateRetentionRule(payload);

            if (response.success) {
                toast.success(response.message || "Retention rule updated successfully", {
                    position: "top-right",
                    autoClose: 3000,
                });
                fetchRetentionRule();
            }
        } catch (err) {
            console.error('Error saving retention rule:', err);
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setSubmittingRetention(false);
        }
    };

    const fetchArchiveMonitoring = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getArchiveMonitoring();

            if (response.success && response.data) {
                // Transform API response to match component structure
                const transformedData = response.data.firms || response.data || [];
                setFirmsData(Array.isArray(transformedData) ? transformedData : []);
            } else {
                throw new Error(response.message || 'Failed to fetch archive monitoring data');
            }
        } catch (err) {
            console.error('Error fetching archive monitoring:', err);
            setError(handleAPIError(err));
            setFirmsData([]);
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            // Create CSV content
            const headers = ['Firm', 'Offices', 'Archived Docs', 'Storage Used', 'Retention', 'Last Audit'];
            const rows = firmsData.map(firm => [
                firm.firm || firm.name || '',
                firm.offices || firm.offices_count || '0',
                firm.archivedDocs || firm.archived_docs || firm.archived_documents || '0',
                firm.storageUsed || firm.storage_used || '0',
                firm.retention || firm.retention_period || '',
                firm.lastAudit || firm.last_audit || firm.last_audit_date || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `archive_monitoring_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Archive monitoring data exported successfully!', {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (err) {
            console.error('Error exporting CSV:', err);
            toast.error('Failed to export CSV', {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setExporting(false);
        }
    };

    // Filter firms based on search term
    const filteredFirmsData = firmsData.filter(firm => {
        const searchLower = searchTerm.toLowerCase();
        const firmName = (firm.firm || firm.name || '').toLowerCase();
        return firmName.includes(searchLower);
    });

    return (
        <div className="min-h-screen ">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Archive Monitoring */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-[#E8F0FF]">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro] mb-2">
                                Archive Monitoring
                            </h3>
                            <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                                Track, manage, and safeguard archives with ease
                            </p>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting || firmsData.length === 0}
                            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium font-[BasisGrotesquePro] hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderRadius: "7px" }}
                        >
                            {exporting ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FiDownload className="w-4 h-4" />
                                    Export CSV
                                </>
                            )}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-[300px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-[BasisGrotesquePro]"
                            placeholder="Search firms..."
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-center">
                                <FiLoader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Loading archive monitoring data...</p>
                            </div>
                        </div>
                    ) : filteredFirmsData.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                {searchTerm ? 'No firms found matching your search.' : 'No archive monitoring data available.'}
                            </p>
                        </div>
                    ) : (
                        /* Firms Data Table */
                        <div className="space-y-3">
                            {/* Header Row */}
                            <div className="grid grid-cols-6 gap-4 py-3 px-4 rounded-lg bg-gray-50">
                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Firm</div>
                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Offices</div>
                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Archived Docs</div>
                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Storage Used</div>
                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Retention</div>
                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Last Audit</div>
                            </div>

                            {/* Data Rows */}
                            {filteredFirmsData.map((firm, index) => (
                                <div key={firm.id || firm.firm_id || index} className="grid grid-cols-6 gap-4 py-4 px-4 border border-[#E8F0FF] rounded-lg bg-white hover:bg-gray-50 transition-colors">
                                    <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {firm.firm || firm.name || firm.firm_name || 'N/A'}
                                    </div>
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {firm.offices || firm.offices_count || '0'}
                                    </div>
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {firm.archivedDocs || firm.archived_docs || firm.archived_documents || '0'}
                                    </div>
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {firm.storageUsed || firm.storage_used || '0'}
                                    </div>
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {firm.retention || firm.retention_period || 'N/A'}
                                    </div>
                                    <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {firm.lastAudit || firm.last_audit || firm.last_audit_date || 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel - Data Retention */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF] shadow-sm">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro]">
                                Data Retention
                            </h3>
                            <div className="group relative">
                                <FiInfo className="text-gray-400 cursor-help hover:text-orange-500 transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                    Retention rules automate the lifecycle of your data. Once enabled, files older than the specified period will be automatically moved to cold storage (Archived) or permanently purged to optimize costs and maintain compliance.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro] leading-relaxed">
                            Maintain compliance and optimize storage costs by automating your data lifecycle.
                        </p>
                    </div>

                    {loadingRetention ? (
                        <div className="flex justify-center py-12">
                            <FiLoader className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Policy Explanation Card */}
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-2">
                                <h4 className="text-orange-800 text-sm font-bold font-[BasisGrotesquePro] mb-1 flex items-center gap-2">
                                    How it works
                                </h4>
                                <ul className="text-orange-700 text-xs space-y-2 list-disc pl-4 font-[BasisGrotesquePro]">
                                    <li>Data is scanned daily for expiration based on upload date.</li>
                                    <li>Expired documents are moved to secure off-site archive storage.</li>
                                    <li>Retention periods can be set per-firm or system-wide.</li>
                                </ul>
                            </div>

                            {/* Enable Retention Rules */}
                            <div className="p-4 border border-[#E8F0FF] rounded-xl hover:border-orange-200 transition-colors">
                                <label className="flex items-center cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={retentionFormData.enable_retention_rules}
                                        onChange={(e) => setRetentionFormData({
                                            ...retentionFormData,
                                            enable_retention_rules: e.target.checked
                                        })}
                                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 transition-all cursor-pointer"
                                        style={{ accentColor: "#F56D2D" }}
                                    />
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                                            Enable Auto-Retention
                                        </span>
                                        <span className="text-[11px] text-gray-500 font-normal">
                                            Turn on automated data lifecycle management
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* Years to Keep */}
                            {retentionFormData.enable_retention_rules && (
                                <div className="space-y-3 animate-fadeIn">
                                    <label className="block text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        Storage Duration (Years)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={retentionFormData.years_to_keep}
                                            onChange={(e) => setRetentionFormData({
                                                ...retentionFormData,
                                                years_to_keep: parseInt(e.target.value) || 7
                                            })}
                                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-[BasisGrotesquePro] text-lg font-bold text-[#3B4A66] transition-all"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                                            Years
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-normal italic">
                                        Tip: Most financial institutions follow a 7-year retention policy.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleSaveRetentionRule}
                                disabled={submittingRetention}
                                className="w-full bg-[#F56D2D] hover:bg-[#E45C1C] text-white px-6 py-3 rounded-xl text-sm font-bold font-[BasisGrotesquePro] transition-all transform hover:translate-y-[-1px] active:translate-y-[0] shadow-md hover:shadow-lg disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-2"
                            >
                                {submittingRetention ? (
                                    <>
                                        <FiLoader className="animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Retention Policy"
                                )}
                            </button>

                            {retentionRule && (
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Active Policy</span>
                                            <span className="text-sm font-bold text-[#3B4A66]">
                                                {retentionRule.enable_retention_rules
                                                    ? `${retentionRule.years_to_keep} Year Retention`
                                                    : "Manual Archive Only"}
                                            </span>
                                        </div>
                                        {retentionRule.updated_at && (
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 block mb-1">Last Synced</span>
                                                <span className="text-[11px] font-medium text-gray-500">
                                                    {new Date(retentionRule.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
