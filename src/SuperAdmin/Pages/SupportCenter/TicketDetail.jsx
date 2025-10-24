import React, { useState } from "react";

export default function TicketDetail({ ticketId, onBack }) {
    const [replyText, setReplyText] = useState("");
    const [status, setStatus] = useState("Open");
    const [priority, setPriority] = useState("High");

    // Sample ticket data - in real app this would come from API
    const ticket = {
        id: "TICK-001",
        subject: "Unable To Process Payments",
        status: "Open",
        priority: "High",
        category: "Compliance",
        user: "Michael Johnson",
        assignee: "Sarah Wilson",
        created: "2024-01-15 09:30",
        updated: "2024-01-15 14:20",
        responseTime: "4 Hrs",
        originalMessage: "Payment processing is failing for all clients. Getting error code 500.",
        conversation: [
            {
                id: 1,
                sender: "Michael Johnson",
                timestamp: "2024-01-15 09:30",
                message: "Payment processing is failing for all clients. Getting error code 500.",
                type: "user"
            },
            {
                id: 2,
                sender: "Support Team",
                timestamp: "2024-01-15 09:30",
                message: "Thank you for contacting support. We're looking into this issue and will have an update for you shortly.",
                type: "support"
            },
            {
                id: 3,
                sender: "Sarah Wilson",
                timestamp: "2024-01-15 09:30",
                message: "I've identified the issue with the payment processing. It appears to be related to a recent API update. I'm working on a fix now.",
                type: "assignee"
            }
        ]
    };

    const handleSendReply = () => {
        if (replyText.trim()) {
            console.log('Sending reply:', replyText);
            // Add reply logic here
            setReplyText("");
        }
    };

    const handleAttachFile = () => {
        console.log('Attach file clicked');
        // Add file attachment logic here
    };

    return (
        <div className="space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <button 
                        onClick={onBack}
                        className="mb-4 text-blue-600 hover:text-blue-800 font-[BasisGrotesquePro] flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Tickets
                    </button>
                    <h1 className="text-3xl font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                        {ticket.id} - {ticket.subject}
                    </h1>
                    <p className="text-[#6B7280] font-[BasisGrotesquePro]">
                        Support ticket details and conversation history
                    </p>
                </div>

                {/* Ticket Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Left Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Status:</span>
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${
                                    ticket.status === 'Open' 
                                        ? 'bg-gray-100 text-gray-700 border-gray-300' 
                                        : 'bg-green-100 text-green-700 border-green-300'
                                }`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Priority:</span>
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${
                                    ticket.priority === 'High' 
                                        ? 'bg-red-100 text-red-700 border-red-300' 
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                }`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Category:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">{ticket.category}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">User:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">{ticket.user}</span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Assignee:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">{ticket.assignee}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Created:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">{ticket.created}</span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Updated:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">{ticket.updated}</span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Response Time:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">{ticket.responseTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Original Message */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF] mb-6">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-4">
                        Original Message
                    </h3>
                    <p className="text-[#6B7280] font-[BasisGrotesquePro]">
                        {ticket.originalMessage}
                    </p>
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF] mb-6">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-4">
                        Conversation
                    </h3>
                    <div className="space-y-4">
                        {ticket.conversation.map((message) => (
                            <div key={message.id} className="flex">
                                <div className={`w-1 h-auto rounded ${
                                    message.type === 'user' ? 'bg-blue-500' : 
                                    message.type === 'support' ? 'bg-green-500' : 'bg-green-500'
                                }`}></div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center mb-2">
                                        <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                            {message.sender}
                                        </span>
                                        <span className="ml-2 text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                            {message.timestamp}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                        {message.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reply Section */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-4">
                        Reply To Ticket
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Reply Textarea */}
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your response Here........"
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] resize-none"
                        />

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {/* Attach File Button */}
                                <button
                                    onClick={handleAttachFile}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[#3B4A66] hover:bg-gray-50 font-[BasisGrotesquePro]"
                                >
                                    + Attach File
                                </button>

                                {/* Status and Priority Dropdowns */}
                                <div className="flex items-center space-x-2">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>

                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Send Reply Button */}
                            <button
                                onClick={handleSendReply}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 font-[BasisGrotesquePro] flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Reply
                            </button>
                        </div>
                    </div>
                </div>
        </div>
    );
}
