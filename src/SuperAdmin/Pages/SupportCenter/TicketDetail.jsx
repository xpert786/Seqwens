import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { superToastOptions } from "../../utils/toastConfig";

const statusOptions = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "blocked", label: "Blocked" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

const priorityOptions = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
];

const toTitleCase = (value) =>
    (value || "")
        .toString()
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const getMessageAccentClass = (senderRole = "") => {
    const normalized = senderRole.toLowerCase();
    if (normalized.includes("support")) return "bg-[#F56D2D]";
    if (normalized.includes("admin")) return "bg-[#3B82F6]";
    if (normalized.includes("client") || normalized.includes("user")) return "bg-[#1E40AF]";
    return "bg-[#22C55E]";
};

const formatDateTime = (value) => {
    if (!value) {
        return "—";
    }
    try {
        return new Date(value).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        return value;
    }
};

const normalizeTicketResponse = (data) => {
    if (!data) {
        return { ticket: {}, conversation: [], assignee: null, response_time_hours: null };
    }

    const baseTicket = data.ticket || data;

    const ticket = {
        ...baseTicket,
        status: baseTicket.status || "",
        priority: baseTicket.priority || "",
        category: baseTicket.category || "",
        status_display: baseTicket.status_display || toTitleCase(baseTicket.status),
        priority_display: baseTicket.priority_display || toTitleCase(baseTicket.priority),
        category_display: baseTicket.category_display || toTitleCase(baseTicket.category),
        created_at_display: baseTicket.created_at_display || formatDateTime(baseTicket.created_at),
        updated_at_display: baseTicket.updated_at_display || formatDateTime(baseTicket.updated_at),
    };

    const rawConversation = Array.isArray(data.conversation)
        ? data.conversation
        : Array.isArray(data.messages)
            ? data.messages
            : [];

    const conversation = rawConversation.map((message, index) => ({
        ...message,
        id: message.id ?? `${message.created_at || message.created_at_display || "message"}-${index}`,
        sender_name: message.sender_name || message.user_name || ticket.assignee || "Support",
        sender_role: message.sender_role || message.role || "",
        created_at_display: message.created_at_display || formatDateTime(message.created_at),
        message: message.message || message.body || "",
    }));

    return {
        ticket,
        conversation,
        assignee: data.assignee || baseTicket.assignee || null,
        response_time_hours:
            typeof data.response_time_hours === "number"
                ? data.response_time_hours
                : typeof data.response_time === "number"
                    ? data.response_time
                    : null,
    };
};

export default function TicketDetail({ ticketId, onBack }) {
    const [replyText, setReplyText] = useState("");
    const [status, setStatus] = useState("open");
    const [priority, setPriority] = useState("medium");
    const [ticketDetails, setTicketDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignableAdmins, setAssignableAdmins] = useState([]);
    const [assignListLoading, setAssignListLoading] = useState(false);
    const [assigningTicket, setAssigningTicket] = useState(false);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
    const [hasFetchedAdmins, setHasFetchedAdmins] = useState(false);
    const fileInputRef = useRef(null);

    const fetchTicketDetails = useCallback(
        async (withLoader = true) => {
            if (!ticketId) {
                return;
            }

            if (withLoader) {
                setLoading(true);
            }
            setError(null);

            try {
                const response = await superAdminAPI.getSupportTicket(ticketId);
                if (response.success && response.data) {
                    const normalized = normalizeTicketResponse(response.data);
                    setTicketDetails(normalized);
                } else {
                    throw new Error(response.message || "Failed to load ticket details");
                }
            } catch (err) {
                const message = handleAPIError(err);
                setError(message);
                toast.error(message, superToastOptions);
            } finally {
                if (withLoader) {
                    setLoading(false);
                }
            }
        },
        [ticketId]
    );

    useEffect(() => {
        fetchTicketDetails();
    }, [fetchTicketDetails]);

    useEffect(() => {
        if (ticketDetails?.ticket) {
            const ticketStatus = (ticketDetails.ticket.status || "open").toLowerCase();
            const ticketPriority = (ticketDetails.ticket.priority || "medium").toLowerCase();
            setStatus(ticketStatus);
            setPriority(ticketPriority);
        }
    }, [ticketDetails?.ticket?.status, ticketDetails?.ticket?.priority]);

    const ticket = ticketDetails?.ticket || {};
    const conversation = ticketDetails?.conversation || [];

    const originalMessage = useMemo(() => {
        const fromConversation = conversation.find((message) => message.is_original);
        if (fromConversation) {
            return fromConversation;
        }
        if (ticket.description) {
            return {
                id: "original",
                sender_name: ticket.user_name,
                sender_role: "Client",
                message: ticket.description,
                created_at_display: ticket.created_at_display,
                is_original: true,
            };
        }
        return null;
    }, [conversation, ticket.description, ticket.created_at_display, ticket.user_name]);

    const threadedConversation = useMemo(
        () => conversation.filter((message) => !message.is_original),
        [conversation]
    );

    const statusLabel = ticket.status_display || toTitleCase(ticket.status);
    const priorityLabel = ticket.priority_display || toTitleCase(ticket.priority);
    const categoryLabel = ticket.category_display || toTitleCase(ticket.category);
    const responseTimeLabel =
        typeof ticketDetails?.response_time_hours === "number"
            ? `${ticketDetails.response_time_hours.toFixed(1)} hrs`
            : "—";
    const assigneeName = ticketDetails?.assignee || ticket.assignee || "Unassigned";

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setAttachmentFile(file);
        }
    };

    const handleRemoveAttachment = () => {
        setAttachmentFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openAssignModal = async () => {
        setIsAssignModalOpen(true);

        if (hasFetchedAdmins) {
            const currentAssigneeId =
                ticketDetails?.ticket?.assigned_to_id ??
                ticketDetails?.ticket?.assigned_to ??
                ticketDetails?.ticket?.assignee_id ??
                null;
            if (currentAssigneeId) {
                setSelectedAssigneeId(Number(currentAssigneeId));
            }
            return;
        }

        setAssignListLoading(true);
        try {
            const response = await superAdminAPI.getSupportAdmins();
            if (response?.success && Array.isArray(response.data)) {
                setAssignableAdmins(response.data);
                const currentAssigneeId =
                    ticketDetails?.ticket?.assigned_to_id ??
                    ticketDetails?.ticket?.assigned_to ??
                    ticketDetails?.ticket?.assignee_id ??
                    null;
                if (currentAssigneeId) {
                    setSelectedAssigneeId(Number(currentAssigneeId));
                } else if (response.data.length === 1) {
                    setSelectedAssigneeId(response.data[0].id);
                }
                setHasFetchedAdmins(true);
            } else {
                throw new Error(response?.message || "Failed to load internal admins.");
            }
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, superToastOptions);
        } finally {
            setAssignListLoading(false);
        }
    };

    const closeAssignModal = () => {
        setIsAssignModalOpen(false);
        setSelectedAssigneeId(null);
        setAssignableAdmins([]);
        setHasFetchedAdmins(false);
    };

    const handleAssignTicket = async () => {
        if (!ticketId) {
            toast.error("Ticket information is missing.", superToastOptions);
            return;
        }

        if (!selectedAssigneeId) {
            toast.warn("Please select an internal admin to assign.", superToastOptions);
            return;
        }

        setAssigningTicket(true);
        try {
            const response = await superAdminAPI.assignSupportTicket(ticketId, selectedAssigneeId);
            if (response?.success) {
                toast.success(response?.message || "Ticket assigned successfully.", superToastOptions);
                await fetchTicketDetails(false);
                closeAssignModal();
            } else {
                throw new Error(response?.message || "Failed to assign ticket.");
            }
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, superToastOptions);
        } finally {
            setAssigningTicket(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) {
            toast.warn("Please enter a reply message.", superToastOptions);
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                message: replyText.trim(),
                status,
                priority,
            };

            if (attachmentFile) {
                payload.attachment = attachmentFile;
            }

            const response = await superAdminAPI.updateSupportTicket(ticketId, payload);

            if (!response.success) {
                throw new Error(response.message || "Failed to post reply");
            }

            toast.success(response.message || "Reply posted successfully.", superToastOptions);
            setReplyText("");
            handleRemoveAttachment();
            await fetchTicketDetails(false);
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, superToastOptions);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                <p className="text-sm text-[#3B4A66]">Loading ticket details...</p>
            </div>
        );
    }

    if (error || !ticketDetails) {
        return (
            <div className="bg-white border border-[#FEE2E2] rounded-lg p-6">
                <p className="text-sm text-[#B91C1C] font-medium mb-3">
                    {error || "Unable to load ticket details."}
                </p>
                <button
                    onClick={() => fetchTicketDetails()}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-md hover:bg-[#E4561F] transition-colors"
                    style={{ borderRadius: "7px" }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
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
                    <h4 className="text-xl font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                        {(ticket.ticket_number || ticket.id) ?? "Ticket"} – {ticket.subject || "No subject"}
                    </h4>
                    <p className="text-[#6B7280] font-[BasisGrotesquePro]">
                        Support ticket details and conversation history
                    </p>
                </div>

                {/* Ticket Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Status:</span>
                                <span
                                    className="ml-2 px-3 py-1 rounded-full text-xs font-medium border border-[#E8F0FF]"
                                    style={{ border: "0.5px solid #1E40AF" }}
                                >
                                    {statusLabel || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Priority:</span>
                                <span
                                    className="ml-2 px-3 py-1 rounded-full text-xs font-medium border border-[#E8F0FF]"
                                    style={{ border: "0.5px solid #F59E0B" }}
                                >
                                    {priorityLabel || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Category:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {categoryLabel || "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* User Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">User:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {ticket.user_name || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Email:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {ticket.user_email || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Assignee:</span>
                                <div className="flex items-center gap-3">
                                    <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                        {assigneeName}
                                    </span>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Card */}
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Firm:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {ticket.firm_name || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Created:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {ticket.created_at_display || ticket.created_at || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Updated:</span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {ticket.updated_at_display || ticket.updated_at || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                    Avg Response:
                                </span>
                                <span className="ml-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    {responseTimeLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Original Message */}
                {originalMessage && (
                    <div className="bg-white rounded-lg p-6 border border-[#E8F0FF] mb-6">
                        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-4">
                            Original Message
                        </h3>
                        <div className="space-y-1">
                            <div className="flex items-center mb-2">
                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {originalMessage.sender_name}
                                </span>
                                <span className="ml-2 text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                    {originalMessage.created_at_display}
                                </span>
                            </div>
                            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                {originalMessage.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Conversation */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF] mb-6">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-4">
                        Conversation
                    </h3>
                    {threadedConversation.length === 0 ? (
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            No replies have been posted yet.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {threadedConversation.map((message, index) => {
                                const messageKey = message.id ?? `${message.created_at || message.created_at_display || "msg"}-${index}`;
                                return (
                                    <div key={messageKey} className="flex">
                                        <div className={`w-1 h-auto rounded ${getMessageAccentClass(message.sender_role)}`}></div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                                <span className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                                    {message.sender_name || "Support"}
                                                </span>
                                                {message.sender_role && (
                                                    <span className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-[BasisGrotesquePro]">
                                                        {message.sender_role}
                                                    </span>
                                                )}
                                                {message.created_at_display && (
                                                    <span className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                                        {message.created_at_display}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] leading-relaxed">
                                                {message.message}
                                            </p>
                                            {message.attachment_url && (
                                                <a
                                                    href={message.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center text-xs text-[#2563EB] hover:text-[#1E3A8A] font-[BasisGrotesquePro]"
                                                >
                                                    <svg
                                                        className="w-3 h-3 mr-1"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13.828 10.172a4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.172-1.172M10.172 13.828a4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656L12 6.344"
                                                        />
                                                    </svg>
                                                    {message.attachment_name || "View attachment"}
                                                </a>
                                            )}
                                        </div>

                                        {isAssignModalOpen && (
                                            <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black bg-opacity-50 px-4">
                                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                                                    <button
                                                        type="button"
                                                        onClick={closeAssignModal}
                                                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        <span className="sr-only">Close</span>
                                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <div className="mb-5">
                                                        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                                            Assign Ticket
                                                        </h3>
                                                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                                            Choose an internal administrator to handle this support request.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {assignListLoading ? (
                                                            <div className="flex items-center justify-center py-10">
                                                                <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                                                    Loading administrators...
                                                                </span>
                                                            </div>
                                                        ) : assignableAdmins.length === 0 ? (
                                                            <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl p-5 text-center">
                                                                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                                                    No internal admins are available to assign. Please create an internal admin account first.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                                                    Select Admin
                                                                </label>
                                                                <select
                                                                    value={selectedAssigneeId ?? ""}
                                                                    onChange={(event) => setSelectedAssigneeId(Number(event.target.value) || null)}
                                                                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B4A66] font-[BasisGrotesquePro] text-sm"
                                                                >
                                                                    <option value="">Choose an internal admin</option>
                                                                    {assignableAdmins.map((admin) => (
                                                                        <option key={admin.id} value={admin.id}>
                                                                            {admin.name} · {toTitleCase(admin.role?.replace(/_/g, " "))}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="mt-6 flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={closeAssignModal}
                                                            className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] hover:bg-[#F3F4F6] transition-colors"
                                                            disabled={assigningTicket}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAssignTicket}
                                                            className="px-4 py-2 rounded-lg bg-[#F56D2D] text-white text-sm font-medium font-[BasisGrotesquePro] hover:bg-[#e15f1f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                            style={{ borderRadius: "7px" }}
                                                            disabled={assigningTicket || assignListLoading || !assignableAdmins.length}
                                                        >
                                                            {assigningTicket ? "Assigning..." : "Assign Ticket"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Reply Section */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-4">
                        Reply To Ticket
                    </h3>

                    <div className="space-y-4">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your response here..."
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] resize-none"
                            disabled={submitting}
                        />

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={submitting}
                        />

                        {attachmentFile && (
                            <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E8F0FF] px-3 py-2 rounded-lg">
                                <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro] truncate">
                                    {attachmentFile.name}
                                </span>
                                <button
                                    onClick={handleRemoveAttachment}
                                    className="text-xs text-[#F56D2D] font-medium hover:text-[#E4561F]"
                                    disabled={submitting}
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-3 gap-2">
                                <button
                                    onClick={handleAttachFile}
                                    className="px-4 py-2 border border-[#E8F0FF] text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                    style={{ borderRadius: "7px" }}
                                    disabled={submitting}
                                    type="button"
                                >
                                    + Attach File
                                </button>

                                <div className="flex items-center space-x-2 gap-2">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="px-3 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                        disabled={submitting}
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="px-3 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] bg-white font-[BasisGrotesquePro]"
                                        disabled={submitting}
                                    >
                                        {priorityOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSendReply}
                                className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg text-sm font-medium hover:bg-orange-600 font-[BasisGrotesquePro] flex items-center disabled:opacity-60"
                                style={{ borderRadius: "7px" }}
                                disabled={submitting}
                                type="button"
                            >
                                {submitting ? (
                                    <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                        <path d="M8.74916 5.7487L6.49916 7.9987M13.4652 0.52195C13.5363 0.497391 13.613 0.493349 13.6863 0.510287C13.7597 0.527224 13.8268 0.564458 13.88 0.617732C13.9332 0.671006 13.9703 0.738172 13.9872 0.811552C14.004 0.884933 13.9998 0.961568 13.9752 1.0327L9.53216 13.7302C9.50558 13.8061 9.4568 13.8723 9.39215 13.9201C9.3275 13.9679 9.24997 13.9952 9.16961 13.9985C9.08925 14.0017 9.00977 13.9807 8.94149 13.9382C8.8732 13.8957 8.81926 13.8337 8.78666 13.7602L6.37241 8.3287C6.33179 8.23838 6.25949 8.16607 6.16916 8.12545L0.737665 5.71045C0.664386 5.67773 0.602601 5.62379 0.560292 5.5556C0.517984 5.48741 0.497095 5.4081 0.500325 5.32791C0.503555 5.24772 0.530755 5.17035 0.578412 5.10578C0.626069 5.04121 0.691992 4.99242 0.767665 4.9657L13.4652 0.52195Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                {submitting ? "Sending..." : "Send Reply"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                        <button
                            type="button"
                            onClick={closeAssignModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                Assign Ticket
                            </h3>
                            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                Choose an internal administrator to handle this support request.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {assignListLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                        Loading administrators...
                                    </span>
                                </div>
                            ) : assignableAdmins.length === 0 ? (
                                <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl p-5 text-center">
                                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                        No internal admins are available to assign. Please create an internal admin account first.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                        Select Admin
                                    </label>
                                    <select
                                        value={selectedAssigneeId ?? ""}
                                        onChange={(event) => setSelectedAssigneeId(Number(event.target.value) || null)}
                                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B4A66] font-[BasisGrotesquePro] text-sm"
                                    >
                                        <option value="">Choose an internal admin</option>
                                        {assignableAdmins.map((admin) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} · {toTitleCase(admin.role?.replace(/_/g, " "))}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeAssignModal}
                                className="px-4 py-2 border border-[#D1D5DB] text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] hover:bg-[#F3F4F6] transition-colors rounded-[7px]"
                                style={{ borderRadius: "7px" }}
                                disabled={assigningTicket}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleAssignTicket}
                                className="px-4 py-2 bg-[#F56D2D] text-white text-sm font-medium font-[BasisGrotesquePro] hover:bg-[#e15f1f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-[7px]"
                                style={{ borderRadius: "7px" }}
                                disabled={assigningTicket || assignListLoading || !assignableAdmins.length}
                            >
                                {assigningTicket ? "Assigning..." : "Assign Ticket"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
