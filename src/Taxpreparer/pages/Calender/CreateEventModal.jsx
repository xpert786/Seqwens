import React, { useState, useEffect } from 'react';
import { Cut, BlackCalender, PlusIcon, CrossIcon, ZoomIcon, GoogleMeetIcon } from '../../component/icons';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const CreateEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    event_title: '',
    appointment_duration: 30, // in minutes
    timezone: 'America/New_York',
    appointment_date: '',
    slots: [
      { id: 1, time: '09:00', client_id: '' }
    ],
    description: '',
    meeting_type: 'zoom'
  });
  
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch clients list
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.clients) {
        setClients(result.data.clients);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      toast.error('Failed to load clients', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeSlotChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.map(slot =>
        slot.id === id ? { ...slot, [field]: field === 'client_id' ? parseInt(value) || '' : value } : slot
      )
    }));
  };

  const addTimeSlot = () => {
    const newId = Math.max(...formData.slots.map(slot => slot.id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      slots: [...prev.slots, {
        id: newId,
        time: '09:00',
        client_id: ''
      }]
    }));
  };

  const removeTimeSlot = (id) => {
    if (formData.slots.length > 1) {
      setFormData(prev => ({
        ...prev,
        slots: prev.slots.filter(slot => slot.id !== id)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.event_title.trim()) {
      toast.error('Please enter event title', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!formData.appointment_date) {
      toast.error('Please select a date', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Validate slots
    const validSlots = formData.slots.filter(slot => slot.time && slot.client_id);
    if (validSlots.length === 0) {
      toast.error('Please add at least one time slot with a client', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare payload
      const payload = {
        event_title: formData.event_title,
        appointment_duration: formData.appointment_duration,
        timezone: formData.timezone,
        appointment_date: formData.appointment_date,
        slots: validSlots.map(slot => ({
          time: slot.time,
          client_id: slot.client_id
        })),
        meeting_type: formData.meeting_type
      };

      // Add description if provided
      if (formData.description.trim()) {
        payload.description = formData.description;
      }

      const url = `${API_BASE_URL}/taxpayer/tax-preparer/appointments/schedule/`;

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Appointments scheduled successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        if (onSubmit) {
          onSubmit(result.data);
        }
        onClose();
        // Reset form
        setFormData({
          event_title: '',
          appointment_duration: 30,
          timezone: 'America/New_York',
          appointment_date: '',
          slots: [{ id: 1, time: '09:00', client_id: '' }],
          description: '',
          meeting_type: 'zoom'
        });
      } else {
        throw new Error(result.message || 'Failed to schedule appointments');
      }
    } catch (error) {
      console.error('Error scheduling appointments:', error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ maxWidth: '750px' }}>
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div>
            <h5 className="font-semibold text-gray-900">Create New Event</h5>
            <p className="text-sm text-gray-600 mt-1">
              Schedule appointments with clients
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <Cut className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.event_title}
              onChange={(e) => handleInputChange('event_title', e.target.value)}
              placeholder="Enter event title"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              required
            />
          </div>

          {/* Appointment Duration & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Duration (minutes) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={formData.appointment_duration}
                onChange={(e) => handleInputChange('appointment_duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                required
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                required
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="America/Phoenix">America/Phoenix (MST - No DST)</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Date <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="date"
              value={formData.appointment_date}
              onChange={(e) => handleInputChange('appointment_date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              required
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Slots <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div className="space-y-3">
              {formData.slots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 flex-wrap">
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => handleTimeSlotChange(slot.id, 'time', e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    style={{ minWidth: '120px', border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                    required
                  />
                  <select
                    value={slot.client_id}
                    onChange={(e) => handleTimeSlotChange(slot.id, 'client_id', e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                    style={{ minWidth: '200px', border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                    required
                    disabled={loadingClients}
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name || `${client.first_name} ${client.last_name}`}
                      </option>
                    ))}
                  </select>
                  {formData.slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <CrossIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)', borderRadius: '8px' }}
              >
                <PlusIcon className="w-4 h-4" />
                Add Time Slot
              </button>
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Type <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              value={formData.meeting_type}
              onChange={(e) => handleInputChange('meeting_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              required
            >
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
              <option value="in_person">In Person</option>
              <option value="on_call">Phone Call</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description"
              rows={3}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)', borderRadius: '8px', opacity: submitting ? 0.6 : 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '8px' }}
            >
              {submitting ? 'Scheduling...' : 'Schedule Appointments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
