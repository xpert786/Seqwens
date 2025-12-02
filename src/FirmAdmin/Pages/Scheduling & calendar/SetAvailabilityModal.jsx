import React, { useState, useEffect } from 'react';
import { firmAdminCalendarAPI, firmAdminStaffAPI, taxpayerFirmAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const SetAvailabilityModal = ({ isOpen, onClose, onSuccess, isTaxpayer = false }) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (!isTaxpayer) {
        fetchStaffMembers();
      }
      // Reset form
      setSelectedStaffId('');
      setStartDate('');
      setEndDate('');
      setStartTime('09:00');
      setEndTime('17:00');
      setSlotDuration(30);
      setErrors({});
    }
  }, [isOpen, isTaxpayer]);

  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      const response = await firmAdminStaffAPI.listStaff({ status: 'active' });
      if (response.success && response.data) {
        setStaffMembers(response.data.staff_members || []);
      } else {
        setStaffMembers([]);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast.error(handleAPIError(error) || 'Failed to load staff members', {
        position: 'top-right',
        autoClose: 3000,
        pauseOnHover: false
      });
      setStaffMembers([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!isTaxpayer && !selectedStaffId) {
      newErrors.staff_id = 'Please select a staff member';
    }
    if (!startDate) {
      newErrors.start_date = 'Please select a start date';
    }
    if (!endDate) {
      newErrors.end_date = 'Please select an end date';
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (!startTime) {
      newErrors.start_time = 'Please select a start time';
    }
    if (!endTime) {
      newErrors.end_time = 'Please select an end time';
    }
    if (startTime && endTime && startTime >= endTime) {
      newErrors.end_time = 'End time must be after start time';
    }
    if (!slotDuration || slotDuration < 15 || slotDuration > 480) {
      newErrors.slot_duration = 'Slot duration must be between 15 and 480 minutes';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);

      const availabilityData = {
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        slot_duration: parseInt(slotDuration)
      };

      if (!isTaxpayer) {
        availabilityData.staff_id = parseInt(selectedStaffId);
      }

      const response = isTaxpayer 
        ? await taxpayerFirmAPI.setAvailability(availabilityData)
        : await firmAdminCalendarAPI.setAvailability(availabilityData);

      if (response.success) {
        toast.success(response.message || 'Availability set successfully', {
          position: 'top-right',
          autoClose: 3000,
          pauseOnHover: false
        });
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.message || 'Failed to set availability', {
          position: 'top-right',
          autoClose: 3000,
          pauseOnHover: false
        });
      }
    } catch (error) {
      console.error('Error setting availability:', error);
      
      // Handle validation errors
      if (error.response) {
        const errorData = error.response.data || error.response;
        if (errorData.errors) {
          const apiErrors = {};
          Object.entries(errorData.errors).forEach(([field, msgs]) => {
            const messages = Array.isArray(msgs) ? msgs : [msgs];
            apiErrors[field] = messages.join(', ');
          });
          setErrors(apiErrors);
        }
      }
      
      toast.error(handleAPIError(error) || 'Failed to set availability', {
        position: 'top-right',
        autoClose: 3000,
        pauseOnHover: false
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h4 className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
            Set Availability
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Staff Selection (only for firm admin) */}
          {!isTaxpayer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Select Staff Member <span className="text-red-500">*</span>
              </label>
              {loadingStaff ? (
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 text-sm">
                  Loading staff members...
                </div>
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    if (errors.staff_id) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.staff_id;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm ${
                    errors.staff_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select staff member</option>
                  {staffMembers.map((staff) => {
                    const staffName = staff.staff_member?.name || staff.name || 'Unknown Staff';
                    const staffEmail = staff.contact?.email || staff.email || '';
                    return (
                      <option key={staff.id} value={staff.id}>
                        {staffName}{staffEmail ? ` (${staffEmail})` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
              {errors.staff_id && (
                <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.staff_id}</p>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.start_date) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.start_date;
                      return newErrors;
                    });
                  }
                  // If end date is before new start date, clear it
                  if (endDate && new Date(e.target.value) > new Date(endDate)) {
                    setEndDate('');
                  }
                }}
                min={today}
                className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm ${
                  errors.start_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.start_date && (
                <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.end_date) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.end_date;
                      return newErrors;
                    });
                  }
                }}
                min={startDate || today}
                className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm ${
                  errors.end_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.end_date && (
                <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (errors.start_time) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.start_time;
                      return newErrors;
                    });
                  }
                  // If end time is before or equal to new start time, clear it
                  if (endTime && e.target.value >= endTime) {
                    setEndTime('');
                  }
                }}
                className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm ${
                  errors.start_time ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.start_time && (
                <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.start_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (errors.end_time) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.end_time;
                      return newErrors;
                    });
                  }
                }}
                min={startTime || '00:00'}
                className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm ${
                  errors.end_time ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.end_time && (
                <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.end_time}</p>
              )}
            </div>
          </div>

          {/* Slot Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Slot Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <select
              value={slotDuration}
              onChange={(e) => {
                setSlotDuration(e.target.value);
                if (errors.slot_duration) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.slot_duration;
                    return newErrors;
                  });
                }
              }}
              className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm ${
                errors.slot_duration ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
            {errors.slot_duration && (
              <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">{errors.slot_duration}</p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#F97316' }}
            >
              {submitting ? 'Setting...' : 'Set Availability'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetAvailabilityModal;

