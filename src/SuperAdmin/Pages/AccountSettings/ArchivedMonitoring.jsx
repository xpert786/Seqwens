import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { FiSearch, FiDownload, FiLoader } from "react-icons/fi";

export default function ArchivedMonitoring() {
    const [searchTerm, setSearchTerm] = useState("");
    const [enableRetentionRules, setEnableRetentionRules] = useState(false);
    const [retentionYears, setRetentionYears] = useState("5 Years");
    const [firmsData, setFirmsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchArchiveMonitoring();
    }, []);

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

    const retentionOptions = [
        "1 Year",
        "3 Years",
        "5 Years",
        "7 Years",
        "10 Years"
    ];

    return (
        <div className="min-h-screen ">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Archive Monitoring */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-[#E8F0FF] h-fit">
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
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF] h-fit">
                    {/* Header */}
                    <div className="mb-6">
                        <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro] mb-2">
                            Data Retention
                        </h3>
                        <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                            Auto-archive or purge data after a configurable retention period.
                        </p>
                    </div>

                    {/* Enable Retention Rules */}
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={enableRetentionRules}
                                onChange={(e) => setEnableRetentionRules(e.target.checked)}
                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                Enable Retention Rules
                            </span>
                        </label>
                    </div>

                    {/* Years to Keep */}
                    <div>
                        <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Years to keep
                        </label>
                        <div className="relative">
                            <select
                                value={retentionYears}
                                onChange={(e) => setRetentionYears(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-[BasisGrotesquePro] appearance-none"
                            >
                                {retentionOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
