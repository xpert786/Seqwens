import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../../ClientOnboarding/utils/chatService';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function StaffMessageModal({ isOpen, onClose, staffId, staffName }) {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        try {
            setSending(true);

            // Use createTaxPreparerChat for internal staff messaging
            const response = await chatService.createTaxPreparerChat(staffId, {
                chat_type: 'firm_tax_preparer',
                opening_message: message.trim(),
                subject: `Message from Firm Admin to ${staffName}`,
                category: 'Staff',
                priority: 'Medium'
            });

            if (response.success) {
                toast.success('Message sent successfully');
                setMessage('');
                onClose();

                // Redirect to messages page with threadId
                const chatId = response.data?.id || response.data?.chat_id || response.data?.thread_id;
                if (chatId) {
                    navigate(`/firmadmin/messages?threadId=${chatId}`);
                } else {
                    navigate(`/firmadmin/messages`);
                }
            } else {
                throw new Error(response.message || 'Failed to send message');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black/40 p-6">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#E8F0FF] flex-shrink-0">
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">Send Message</h4>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-0.5">To: {staffName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                            <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-40 px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] resize-none"
                        placeholder="Type your message here..."
                    />
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-[#E8F0FF] flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition font-[BasisGrotesquePro]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !message.trim()}
                        className="px-4 py-2 bg-[#F56D2D] text-white text-sm font-bold rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{ borderRadius: "10px" }}
                    >
                        {sending ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.8334 1.16797L8.91673 12.3585C8.85689 12.5295 8.61877 12.5392 8.5452 12.3736L6.41675 7.58464M12.8334 1.16797L1.64289 5.08465C1.47193 5.14449 1.46221 5.38262 1.62774 5.45619L6.41675 7.58464M12.8334 1.16797L6.41675 7.58464" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Send Message
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
