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
                    <h4  className="text-xl font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                        {ticket.id} - {ticket.subject}
                    </h4>
                    <p className="text-[#6B7280] font-[BasisGrotesquePro]">
                        Support ticket details and conversation history
                    </p>
                </div>

                {/* Ticket Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ">
                    {/* Left Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4 flex flex-col gap-2   ">
                            <div className="flex items-center gap-2 justify-between">
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Status:</span>
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium  ${
                                    ticket.status === 'Open' 
                                        ? 'bg-white text-gray-700' 
                                        : 'bg-green-100 text-green-700 border border-green-300'
                                }`} style={ticket.status === 'Open' ? { border: '0.5px solid #1E40AF' } : {}}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Priority:</span>
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                                    ticket.priority === 'High' 
                                        ? 'bg-white text-[#EF4444]' 
                                        : 'bg-white text-[#F59E0B]'
                                }`} style={ticket.priority === 'High' ? { border: '0.5px solid #EF4444' } : { border: '0.5px solid #F59E0B' }}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
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
                                    message.type === 'user' ? 'bg-[#1E40AF]' : 
                                    message.type === 'support' ? 'bg-[#10B981]' : 'bg-[#22C55E]'
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
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-4 gap-2">
                                {/* Attach File Button */}
                                <button
                                    onClick={handleAttachFile}
                                    className="px-4 py-2 border border-[#E8F0FF] text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                     style={{ borderRadius: '7px' }}
                                >   
                                    + Attach File
                                </button>

                                {/* Status and Priority Dropdowns */}
                                <div className="flex items-center space-x-2 gap-2">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="px-3 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>

                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="px-3 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
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
                                className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg text-sm font-medium hover:bg-orange-600 font-[BasisGrotesquePro] flex items-center"
                                     style={{ borderRadius: '7px' }}
                            >
                             <svg width="15" height="15"  viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                    <path d="M8.74916 5.7487L6.49916 7.9987M13.4652 0.52195C13.5363 0.497391 13.613 0.493349 13.6863 0.510287C13.7597 0.527224 13.8268 0.564458 13.88 0.617732C13.9332 0.671006 13.9703 0.738172 13.9872 0.811552C14.004 0.884933 13.9998 0.961568 13.9752 1.0327L9.53216 13.7302C9.50558 13.8061 9.4568 13.8723 9.39215 13.9201C9.3275 13.9679 9.24997 13.9952 9.16961 13.9985C9.08925 14.0017 9.00977 13.9807 8.94149 13.9382C8.8732 13.8957 8.81926 13.8337 8.78666 13.7602L6.37241 8.3287C6.33179 8.23838 6.25949 8.16607 6.16916 8.12545L0.737665 5.71045C0.664386 5.67773 0.602601 5.62379 0.560292 5.5556C0.517984 5.48741 0.497095 5.4081 0.500325 5.32791C0.503555 5.24772 0.530755 5.17035 0.578412 5.10578C0.626069 5.04121 0.691992 4.99242 0.767665 4.9657L13.4652 0.52195Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>

                                Send Reply
                            </button>
                        </div>
                    </div>
                </div>
        </div>
    );
}
