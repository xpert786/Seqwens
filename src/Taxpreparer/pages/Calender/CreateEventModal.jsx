import React, { useState } from 'react';
import { Cut, BlackCalender, PlusIcon, CrossIcon, ZoomIcon, GoogleMeetIcon, Copy, Plusing } from '../../component/icons';
import image from "../../../assets/image.png";
const CreateEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
  const [showPhoneCallModal, setShowPhoneCallModal] = useState(false);
  const [participants, setParticipants] = useState([
    { id: 1, name: 'John Doe', avatar: image },
    { id: 2, name: 'Jane Smith', avatar: image },
    { id: 3, name: 'Mike Johnson', avatar: image }
  ]);
  const [formData, setFormData] = useState({
    eventTitle: '',
    appointmentDuration: '30 minutes',
    availability: '30 minutes',
    timeZone: '(GMT+05:30) India Standard Time - Kolkata',
    selectedDate: '22/08/2025',
    timeSlots: [
      { id: 1, startTime: '09:00 am', endTime: '09:30 am' },
      { id: 2, startTime: '10:00 am', endTime: '10:30 am' },
      { id: 3, startTime: '11:00 am', endTime: '11:30 am' }
    ],
    eventType: 'Google Meet video conferencing',
    description: ''
  });

  const eventTypeOptions = [
    { value: 'Google Meet video conferencing', label: 'Google Meet video conferencing', icon: <GoogleMeetIcon /> },
    { value: 'Zoom video conferencing', label: 'Zoom video conferencing', icon: <ZoomIcon /> },
    { value: 'In-person meeting', label: 'In-person meeting', icon: '🤝' },
    { value: 'Phone call', label: 'Phone call', icon: '📱' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeSlotChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const addTimeSlot = () => {
    const newId = Math.max(...formData.timeSlots.map(slot => slot.id)) + 1;
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, {
        id: newId,
        startTime: '12:00 pm',
        endTime: '12:30 pm'
      }]
    }));
  };

  const removeTimeSlot = (id) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleNext = () => {
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleOpenPhoneCallModal = () => {
    setShowPhoneCallModal(true);
  };

  const handleClosePhoneCallModal = () => {
    setShowPhoneCallModal(false);
  };

  const addParticipant = () => {
    const newId = Math.max(...participants.map(p => p.id)) + 1;
    setParticipants(prev => [...prev, {
      id: newId,
      name: 'New Participant',
      avatar: image
    }]);
  };

  const handlePhoneCallSubmit = () => {
    onSubmit({ type: 'phone_call', participants });
    setShowPhoneCallModal(false);
    onClose();
  };

  if (!isOpen) return null;

  // If phone call modal is open, don't show the main modal
  if (showPhoneCallModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }}>
      <div className="bg-white rounded-lg w-full mx-4 max-w-2xl shadow-xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <div>
              <h5 className="text-xl font-bold text-gray-800">Schedule A Free Phone Call With Sarah Johnson</h5>
              <p className="text-sm text-gray-600 mt-1">
                Use this to schedule 30 minute phone call meeting
              </p>
            </div>
            <button
              onClick={handleClosePhoneCallModal}
              // className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Cut className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-6 space-y-6">
            {/* Google Meet Section */}
            <div className="rounded-lg p-4 flex items-center justify-between" style={{ background: 'var(--Palette2-Dark-blue-50, #F3F7FF)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8  rounded flex items-center justify-center">
                  <GoogleMeetIcon className="w-5 h-5" />
                </div>
                <span className="text-gray-700 font-medium">Google Meet video conferencing</span>
              </div>
              <button className="w-8 h-8 bg-white rounded flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors">
                <Copy />
              </button>
            </div>

            {/* Booked By Section */}
              <div>
                <h6 className="text-sm font-medium mb-3" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Booked By</h6>
              <div className="flex items-center">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="relative">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-10 h-10 border-2 border-white shadow-sm"
                      style={{ 
                        marginLeft: index > 0 ? '-12px' : '0',
                        background: 'var(--Palette2-Gold-200, #FFF4E6)',
                        borderRadius: '50%'
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={addParticipant}
                  className="w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors border-2 border-white shadow-sm"
                  style={{ 
                    marginLeft: '-12px',
                    border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                    borderRadius: '50%'
                  }}
                >
                  <Plusing className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            {/* <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClosePhoneCallModal}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePhoneCallSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded-lg"
              >
                Schedule Call
              </button>
            </div> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ maxWidth: '750px' }}>
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <div>
            <h5 className="font-semibold text-gray-900">Create New Event</h5>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 1 ? 'Schedule a new appointment or meeting.' : 'Choose event type and add description.'}
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
          <div className="border-t border-gray-200 pt-4">
            {currentStep === 1 ? (
            <>
              {/* Event Title */}
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={formData.eventTitle}
              onChange={(e) => handleInputChange('eventTitle', e.target.value)}
              placeholder="Enter event title."
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
            />
          </div>

          {/* Appointment duration & Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment duration
              </label>
              <select
                value={formData.appointmentDuration}
                onChange={(e) => handleInputChange('appointmentDuration', e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              >
                <option value="15 minutes">15 minutes</option>
                <option value="30 minutes">30 minutes</option>
                <option value="45 minutes">45 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              >
                <option value="15 minutes">15 minutes</option>
                <option value="30 minutes">30 minutes</option>
                <option value="45 minutes">45 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
              </select>
            </div>
          </div>

          {/* Time Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select
              value={formData.timeZone}
              onChange={(e) => handleInputChange('timeZone', e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
            >
              <option value="(GMT+05:30) India Standard Time - Kolkata">(GMT+05:30) India Standard Time - Kolkata</option>
              <option value="(GMT+05:30) India Standard Time - Mumbai">(GMT+05:30) India Standard Time - Mumbai</option>
              <option value="(GMT+05:30) India Standard Time - Delhi">(GMT+05:30) India Standard Time - Delhi</option>
              <option value="(GMT+00:00) Greenwich Mean Time">(GMT+00:00) Greenwich Mean Time</option>
              <option value="(GMT-05:00) Eastern Standard Time">(GMT-05:00) Eastern Standard Time</option>
            </select>
          </div>

          {/* Add date & Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.selectedDate}
                  onChange={(e) => handleInputChange('selectedDate', e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="22/08/2025"
                  style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <BlackCalender className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timing
              </label>
              <div className="space-y-2">
                {formData.timeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={slot.startTime}
                      onChange={(e) => handleTimeSlotChange(slot.id, 'startTime', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      style={{ minWidth: '80px', border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                    />
                    <span className="text-sm text-gray-600 px-2">To</span>
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={(e) => handleTimeSlotChange(slot.id, 'endTime', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      style={{ minWidth: '80px', border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                    />
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 transition-colors flex-shrink-0"
                      >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-500  transition-colors flex-shrink-0"
                       >
                      <CrossIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add date button at bottom */}
          <div className="flex justify-start">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)', borderRadius: '8px' }}
            >
              Add a date
            </button>
          </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 ">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ borderRadius: '8px' }}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Event Type */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <div
                  onClick={() => setIsEventTypeOpen(!isEventTypeOpen)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white cursor-pointer flex items-center justify-between"
                  style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                >
                  <div className="flex items-center gap-2">
                    {eventTypeOptions.find(option => option.value === formData.eventType)?.icon}
                    <span className="text-gray-900">
                      {eventTypeOptions.find(option => option.value === formData.eventType)?.label}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isEventTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {eventTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          handleInputChange('eventType', option.value);
                          setIsEventTypeOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.icon}
                        <span className="text-gray-900">{option.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                />
              </div>
              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)', borderRadius: '8px' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleOpenPhoneCallModal}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ borderRadius: '8px' }}
                >
                  Create Event
                </button>
              </div>
            </>
          )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
