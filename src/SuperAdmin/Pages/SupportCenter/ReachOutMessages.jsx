import React, { useState, useEffect } from 'react';
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';

const ReachOutMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedMsg, setSelectedMsg] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getReachOutMessages();
            if (response.success) {
                setMessages(response.data);
            }
        } catch (err) {
            console.error(err);
            setError(handleAPIError(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-12">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Loading messages...</p>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h3 className="text-[#3B4A66] text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                    Reach Out Messages
                </h3>
                <p className="text-[#4B5563] text-sm font-normal font-[BasisGrotesquePro]">
                    View and manage contact requests from the landing page.
                </p>
            </div>

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white border border-[#E8F0FF] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#F9FAFB] border-b border-[#E8F0FF]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[BasisGrotesquePro]">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[BasisGrotesquePro]">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[BasisGrotesquePro]">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[BasisGrotesquePro]">Reason</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider font-[BasisGrotesquePro] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8F0FF]">
                            {messages.length > 0 ? messages.map((msg) => (
                                <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                        {new Date(msg.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">{msg.name}</td>
                                    <td className="px-6 py-4">
                                        <a href={`mailto:${msg.email}`} className="text-blue-600 hover:text-blue-800 text-sm font-[BasisGrotesquePro]">
                                            {msg.email}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#4B5563] max-w-xs truncate font-[BasisGrotesquePro]" title={msg.reason}>
                                        {msg.reason}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedMsg(msg)}
                                            className="text-xs bg-white hover:bg-gray-50 text-[#3B4A66] px-3 py-1.5 rounded-lg border border-[#E8F0FF] transition-colors font-medium font-[BasisGrotesquePro]"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-[#6B7280] font-[BasisGrotesquePro]">
                                        No reach out messages found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMsg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border border-[#E8F0FF] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">Message Details</h2>
                                    <p className="text-[#6B7280] text-sm font-[BasisGrotesquePro]">{new Date(selectedMsg.created_at).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedMsg(null)}
                                    className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 border border-[#E8F0FF] p-4 rounded-xl">
                                    <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Sender Name</span>
                                    <span className="text-[#1F2A55] font-medium font-[BasisGrotesquePro]">{selectedMsg.name}</span>
                                </div>
                                <div className="bg-gray-50 border border-[#E8F0FF] p-4 rounded-xl">
                                    <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Email Address</span>
                                    <a href={`mailto:${selectedMsg.email}`} className="text-blue-600 hover:text-blue-800 font-medium font-[BasisGrotesquePro]">{selectedMsg.email}</a>
                                </div>
                            </div>

                            <div className="bg-gray-50 border border-[#E8F0FF] p-6 rounded-xl">
                                <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 font-[BasisGrotesquePro]">Message Content</span>
                                <div className="text-[#3B4A66] leading-relaxed whitespace-pre-wrap font-[BasisGrotesquePro]">
                                    {selectedMsg.reason}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setSelectedMsg(null)}
                                    className="px-6 py-2.5 bg-white hover:bg-gray-50 text-[#3B4A66] rounded-xl border border-[#E8F0FF] transition-colors font-medium font-[BasisGrotesquePro]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReachOutMessages;
