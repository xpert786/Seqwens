
import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function CreateAppointmentModal({ isOpen, onClose, onSuccess, staffId, staffName, initialDate, appointment }) {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        appointment_date: '',
        appointment_time: '',
        appointment_duration: 30,
        appointment_with_id: staffId || '',
        user_id: '', // Client ID (optional)
        meeting_type: 'zoom',
        meeting_location: '',
        phone_number: '', // Added for phone call type
    });

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                // Edit mode
                setFormData({
                    subject: appointment.subject || '',
                    description: appointment.description || '',
                    appointment_date: appointment.date || appointment.appointment_date,
                    appointment_time: appointment.start_time || appointment.appointment_time,
                    appointment_duration: calculateDuration(appointment.start_time, appointment.end_time) || appointment.appointment_duration || 30,
                    appointment_with_id: appointment.appointment_with_id || staffId,
                    user_id: appointment.user_id || appointment.client_id || '', // Need to map this correctly from appointment object
                    meeting_type: appointment.meeting_type || 'zoom',
                    meeting_location: appointment.meeting_location || '',
                    phone_number: appointment.phone_number || ''
                });
            } else {
                // Create mode
                setFormData({
                    subject: '',
                    description: '',
                    appointment_date: initialDate ? initialDate.toISOString().split('T')[0] : '',
                    appointment_time: initialDate ? initialDate.toTimeString().split(' ')[0].substring(0, 5) : '',
                    appointment_duration: 30,
                    appointment_with_id: staffId || '',
                    user_id: '',
                    meeting_type: 'zoom',
                    meeting_location: '',
                    phone_number: ''
                });
            }

            fetchClients();
        }
    }, [isOpen, initialDate, staffId, appointment]);

    const calculateDuration = (start, end) => {
        if (!start || !end) return 30;
        // Simple parse for HH:MM:SS
        const startDate = new Date(`1970-01-01T${start}`);
        const endDate = new Date(`1970-01-01T${end}`);
        return (endDate - startDate) / 60000;
    };

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            // Fetch firm clients
            // Using firm-admin/clients/ endpoint which returns paginated list usually
            // For dropdown we might want a simpler list or search, but let's try basic list
            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/firm-admin/clients/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    // data might be { clients: [], ... } or just [] or pagination object
                    // Assuming result.data.clients or result.data directly
                    const clientList = result.data.results || result.data.clients || result.data;
                    if (Array.isArray(clientList)) {
                        setClients(clientList);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;

        setLoading(true);
        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/firm-admin/appointments/${appointment.id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                toast.success("Appointment deleted successfully");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(result.message || "Failed to delete appointment");
            }
        } catch (error) {
            console.error("Error deleting appointment:", error);
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const payload = {
                ...formData,
                // If user_id is empty, send null or omit? Serializer handles optional.
                user_id: formData.user_id || null,
                user: formData.user_id || null
            };

            let url = `${API_BASE_URL}/taxpayer/firm-admin/appointments/create/`;
            let method = 'POST';

            if (appointment) {
                url = `${API_BASE_URL}/taxpayer/firm-admin/appointments/${appointment.id}/`;
                method = 'PATCH';
            }

            const response = await fetchWithCors(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(appointment ? "Appointment updated successfully" : "Appointment created successfully");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(result.message || "Failed to save appointment");
            }
        } catch (error) {
            console.error("Error saving appointment:", error);
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
            <div className="bg-white rounded-lg border border-[#E8F0FF] w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-[#E8F0FF] flex-shrink-0">
                    <div>
                        <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">Add Calendar Event</h5>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Schedule a new meeting or appointment</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar flex-1">
                    <form id="create-appointment-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Subject *</label>
                            <input
                                type="text"
                                name="subject"
                                required
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                placeholder="Meeting subject"
                            />
                        </div>

                        {/* Client Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Client (Optional)</label>
                            <select
                                name="user_id"
                                value={formData.user_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                            >
                                <option value="">-- Internal Event / No Client --</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.full_name || client.email || `Client #${client.id}`}
                                    </option>
                                ))}
                            </select>
                            {loadingClients && <p className="text-xs text-gray-500 mt-1">Loading clients...</p>}
                        </div>

                        {/* Staff (Read Only if passed) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Staff Member</label>
                            <div className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg font-[BasisGrotesquePro] text-gray-600">
                                {staffName || "Selected Staff"}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Date *</label>
                                <input
                                    type="date"
                                    name="appointment_date"
                                    required
                                    value={formData.appointment_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Time *</label>
                                <input
                                    type="time"
                                    name="appointment_time"
                                    required
                                    value={formData.appointment_time}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                />
                            </div>
                        </div>

                        {/* Duration & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Duration (min)</label>
                                <input
                                    type="number"
                                    name="appointment_duration"
                                    min="15"
                                    step="15"
                                    value={formData.appointment_duration}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Meeting Type</label>
                                <select
                                    name="meeting_type"
                                    value={formData.meeting_type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                >
                                    <option value="zoom">Zoom</option>
                                    <option value="google_meet">Google Meet</option>
                                    <option value="in_person">In Person</option>
                                    <option value="on_call">Phone Call</option>
                                </select>
                            </div>
                        </div>

                        {/* Location (conditional) */}
                        {(formData.meeting_type === 'in_person' || formData.meeting_type === 'other') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Location</label>
                                <input
                                    type="text"
                                    name="meeting_location"
                                    value={formData.meeting_location}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                    placeholder="e.g. Conference Room A"
                                />
                            </div>
                        )}

                        {/* Phone (conditional) */}
                        {formData.meeting_type === 'on_call' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone_number"
                                    value={formData.phone_number || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                    placeholder="e.g. 555-0123"
                                />
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                placeholder="Additional details..."
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[#E8F0FF] flex-shrink-0">
                    <div>
                        {appointment && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-[BasisGrotesquePro]"
                                disabled={loading}
                            >
                                Delete
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-gray-700"
                            style={{ borderRadius: "10px" }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-appointment-form"
                            className="px-4 py-2 text-sm bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] flex items-center gap-2"
                            style={{ borderRadius: "10px" }}
                            disabled={loading}
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {appointment ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
