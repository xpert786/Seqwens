import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firmAdminDashboardAPI } from '../../../ClientOnboarding/utils/apiUtils';

const ClientEngagementDetails = () => {
    const navigate = useNavigate();
    const [engagementData, setEngagementData] = useState({ clients: [], funnel: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStage, setFilterStage] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await firmAdminDashboardAPI.getEngagementData();

                if (result.success && result.data) {
                    setEngagementData({
                        clients: result.data.clients || [],
                        funnel: result.data.client_engagement?.funnel || [],
                        summary: result.data.client_engagement?.summary || {}
                    });
                } else {
                    throw new Error(result.message || 'Failed to fetch data');
                }
            } catch (err) {
                console.error('Error fetching engagement details:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStageFromEngagement = (engagement) => {
        if (!engagement) return 'New';
        if (engagement.has_completed_workflows) return 'Completed';
        if (engagement.has_signed_documents) return 'Signed';
        if (engagement.has_signature_requests) return 'Proposal';
        if (engagement.has_appointments) return 'Appointment';
        return 'New';
    };

    // Filter Logic
    const filteredClients = engagementData.clients.filter(client => {
        if (filterStage === 'All') return true;
        return getStageFromEngagement(client.engagement) === filterStage;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">Client Engagement Details</h3>
                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                        Detailed view of client engagement funnel and statuses.
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-white border border-[#dee2e6] text-[#343a40] rounded text-sm font-[BasisGrotesquePro] hover:bg-gray-50 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
            </div>

            {/* Summary Cards */}
            {!loading && !error && engagementData.summary && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setFilterStage('All'); setCurrentPage(1); }}>
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Total Clients</p>
                        <p className="text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{engagementData.summary.total_clients || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setFilterStage('Appointment'); setCurrentPage(1); }}>
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Appointments</p>
                        <p className="text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{engagementData.summary.clients_with_appointments || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setFilterStage('Proposal'); setCurrentPage(1); }}>
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Proposals</p>
                        <p className="text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{engagementData.summary.clients_with_signature_requests || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setFilterStage('Signed'); setCurrentPage(1); }}>
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Signed</p>
                        <p className="text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{engagementData.summary.clients_with_signed_documents || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => { setFilterStage('Completed'); setCurrentPage(1); }}>
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Completed</p>
                        <p className="text-2xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{engagementData.summary.clients_with_completed_workflows || 0}</p>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div
                className="mb-4 inline-block bg-white border border-gray-200"
                style={{
                    borderRadius: '12px',
                    padding: '6px'
                }}
            >
                <div
                    className="flex"
                    style={{
                        gap: '8px'
                    }}
                >
                    {['All', 'New', 'Appointment', 'Proposal', 'Signed', 'Completed'].map(stage => (
                        <button
                            key={stage}
                            onClick={() => { setFilterStage(stage); setCurrentPage(1); }}
                            style={{
                                borderRadius: '12px'
                            }}
                            className={`px-3 py-1.5 text-sm font-[BasisGrotesquePro] transition-colors
          ${filterStage === stage
                                    ? 'bg-[#00C0C6] text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {stage}
                        </button>
                    ))}
                </div>
            </div>


            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Client Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Stage
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Last Activity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Tasks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 font-[BasisGrotesquePro]">Loading...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-red-500 font-[BasisGrotesquePro]">{error}</td>
                                </tr>
                            ) : paginatedClients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 font-[BasisGrotesquePro]">No clients found for this stage.</td>
                                </tr>
                            ) : (
                                paginatedClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{client.full_name || `${client.first_name} ${client.last_name}`}</div>
                                            <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">{client.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{client.client_type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full font-[BasisGrotesquePro]
                      ${getStageFromEngagement(client.engagement) === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    getStageFromEngagement(client.engagement) === 'Signed' ? 'bg-blue-100 text-blue-800' :
                                                        getStageFromEngagement(client.engagement) === 'Proposal' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                {getStageFromEngagement(client.engagement)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">
                                                {client.last_activity ? new Date(client.last_activity).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{client.pending_tasks_count} Pending</div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && !error && filteredClients.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClients.length)} of {filteredClients.length} entries
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ borderRadius: '12px' }}
                                className={`px-3 py-1 border text-sm font-[BasisGrotesquePro] 
      ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Previous
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    style={{ borderRadius: '12px' }}
                                    className={`px-3 py-1 border text-sm font-[BasisGrotesquePro]
        ${currentPage === i + 1
                                            ? 'bg-[#00C0C6] text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{ borderRadius: '12px' }}
                                className={`px-3 py-1 border text-sm font-[BasisGrotesquePro]
      ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Next
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientEngagementDetails;
