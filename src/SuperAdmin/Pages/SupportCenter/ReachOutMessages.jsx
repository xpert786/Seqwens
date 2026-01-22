import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../../ClientOnboarding/utils/corsConfig';

const ReachOutMessages = () => {
    const API_BASE_URL = getApiBaseUrl();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedMsg, setSelectedMsg] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`${API_BASE_URL}/accounts/admin/reach-out-messages/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Reach Out Messages</h1>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-800/50 border-b border-zinc-800 text-zinc-400 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Name</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">Reason</th>
                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {messages.length > 0 ? messages.map((msg) => (
                            <tr key={msg.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    {new Date(msg.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{msg.name}</td>
                                <td className="px-6 py-4">
                                    <a href={`mailto:${msg.email}`} className="text-blue-400 hover:text-blue-300">
                                        {msg.email}
                                    </a>
                                </td>
                                <td className="px-6 py-4 max-w-md truncate" title={msg.reason}>
                                    {msg.reason}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedMsg(msg)}
                                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                                    No reach out messages found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Message Detail Modal */}
            {selectedMsg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#18181b] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Message Details</h2>
                                    <p className="text-zinc-500 text-sm">{new Date(selectedMsg.created_at).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedMsg(null)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                                    <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Sender Name</span>
                                    <span className="text-white font-medium">{selectedMsg.name}</span>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                                    <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Email Address</span>
                                    <a href={`mailto:${selectedMsg.email}`} className="text-blue-400 hover:text-blue-300 font-medium">{selectedMsg.email}</a>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Message Content</span>
                                <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedMsg.reason}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setSelectedMsg(null)}
                                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
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
