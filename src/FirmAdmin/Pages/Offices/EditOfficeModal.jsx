import React, { useState, useEffect, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { toast } from 'react-toastify';
import { CrossesIcon } from '../../Components/icons';
import { firmOfficeAPI, handleAPIError, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { US_TIMEZONES } from './constants';

export default function EditOfficeModal({ isOpen, onClose, officeId, officeData, onOfficeUpdated }) {
    const [formData, setFormData] = useState({
        name: '',
        manager_id: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'US',
        phone_number: '',
        timezone: '',
        status: 'active',
        operation_hours: {
            Monday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
            Tuesday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
            Wednesday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
            Thursday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
            Friday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
            Saturday: { isOpen: true, startTime: '09:00 AM', endTime: '01:00 PM' },
            Sunday: { isOpen: false, startTime: '', endTime: '' }
        }
    });
    const [phoneCountry, setPhoneCountry] = useState('us');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);

    // Load office data when modal opens
    useEffect(() => {
        if (isOpen && officeData) {
            // Parse operation hours from API format (e.g., "09:00-17:00") to form format
            const parseOperationHours = (hours) => {
                const defaultHours = {
                    Monday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
                    Tuesday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
                    Wednesday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
                    Thursday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
                    Friday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
                    Saturday: { isOpen: true, startTime: '09:00 AM', endTime: '01:00 PM' },
                    Sunday: { isOpen: false, startTime: '', endTime: '' }
                };

                if (!hours || typeof hours !== 'object') {
                    return defaultHours;
                }

                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const parsed = {};

                days.forEach(day => {
                    const dayHours = hours[day];
                    if (!dayHours || dayHours === null) {
                        parsed[day] = { isOpen: false, startTime: '', endTime: '' };
                    } else {
                        // Parse "09:00-17:00" format
                        const [start, end] = dayHours.split('-');
                        if (start && end) {
                            // Convert 24-hour to 12-hour format
                            const startTime = convertTo12Hour(start);
                            const endTime = convertTo12Hour(end);
                            parsed[day] = { isOpen: true, startTime, endTime };
                        } else {
                            parsed[day] = defaultHours[day];
                        }
                    }
                });

                return parsed;
            };

            const convertTo12Hour = (time24) => {
                if (!time24) return '';
                const [hours, minutes] = time24.split(':');
                let hour12 = parseInt(hours);
                const period = hour12 >= 12 ? 'PM' : 'AM';
                if (hour12 > 12) hour12 -= 12;
                if (hour12 === 0) hour12 = 12;
                return `${hour12}:${minutes} ${period}`;
            };

            setFormData({
                name: officeData.name || '',
                manager_id: officeData.manager || officeData.manager_id || '',
                street_address: officeData.street_address || '',
                city: officeData.city || '',
                state: officeData.state || '',
                zip_code: officeData.zip_code || '',
                country: officeData.country || 'US',
                phone_number: officeData.phone_number || '',
                timezone: officeData.timezone || '',
                status: officeData.status || 'active',
                operation_hours: parseOperationHours(officeData.operation_hours)
            });

            // Set phone country from phone number
            if (officeData.phone_number) {
                const countryCode = officeData.phone_number.substring(0, 2);
                setPhoneCountry(countryCode || 'us');
            }
        }
    }, [isOpen, officeData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            operation_hours: {
                ...prev.operation_hours,
                [day]: {
                    ...prev.operation_hours[day],
                    isOpen: !prev.operation_hours[day].isOpen
                }
            }
        }));
    };

    const handleTimeChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            operation_hours: {
                ...prev.operation_hours,
                [day]: {
                    ...prev.operation_hours[day],
                    [field]: value
                }
            }
        }));
    };

    const formatTimeForAPI = (timeString) => {
        if (!timeString) return '';
        const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return timeString;

        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Office Name is required');
            return false;
        }
        if (!formData.street_address.trim()) {
            setError('Street Address is required');
            return false;
        }
        if (!formData.city.trim()) {
            setError('City is required');
            return false;
        }
        if (!formData.state.trim()) {
            setError('State is required');
            return false;
        }
        if (!formData.zip_code.trim()) {
            setError('Zip Code is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Build payload
            const payload = {
                name: formData.name.trim(),
                street_address: formData.street_address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zip_code: formData.zip_code.trim(),
                country: formData.country.trim(),
                status: formData.status,
            };

            // Optional fields
            if (formData.phone_number.trim()) {
                payload.phone_number = formData.phone_number.trim();
            }
            if (formData.manager_id) {
                payload.manager_id = Number(formData.manager_id);
            } else {
                payload.manager_id = null; // Remove manager if not selected
            }
            if (formData.timezone) {
                payload.timezone = formData.timezone;
            }

            // Operation hours - format for API
            const operationHours = {};
            Object.keys(formData.operation_hours).forEach(day => {
                const dayData = formData.operation_hours[day];
                if (dayData && dayData.isOpen && dayData.startTime && dayData.endTime) {
                    operationHours[day] = `${formatTimeForAPI(dayData.startTime)}-${formatTimeForAPI(dayData.endTime)}`;
                } else {
                    operationHours[day] = null;
                }
            });
            payload.operation_hours = operationHours;

            const response = await firmOfficeAPI.updateBasicDetails(officeId, payload);

            if (response.success) {
                toast.success(response.message || 'Office updated successfully', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                onClose();
                if (typeof onOfficeUpdated === 'function') {
                    onOfficeUpdated();
                }
            } else {
                throw new Error(response.message || 'Failed to update office');
            }
        } catch (err) {
            const errorMsg = handleAPIError(err);
            setError(errorMsg);
            toast.error(errorMsg || 'Failed to update office.', {
                position: 'top-right',
                autoClose: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffOptions = useCallback(async () => {
        setStaffLoading(true);
        try {
            const response = await firmAdminStaffAPI.listStaffWithAdmin();
            let staffList = [];

            // Extract staff list from response
            if (response?.success && Array.isArray(response?.data?.staff_members)) {
                staffList = response.data.staff_members;
            } else if (Array.isArray(response)) {
                staffList = response;
            } else if (Array.isArray(response?.data)) {
                staffList = response.data;
            }

            setStaffOptions(staffList || []);
        } catch (err) {
            console.error('Error loading staff members:', err);
            setStaffOptions([]);
        } finally {
            setStaffLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchStaffOptions();
        }
    }, [isOpen, fetchStaffOptions]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                style={{ fontFamily: 'BasisGrotesquePro' }}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-start border-b border-gray-200">
                    <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">Edit Office Location</h4>
                        <p className="text-sm text-gray-600">Update office location details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <CrossesIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Form Content */}
                <div className="px-6 py-6">
                    <div className="space-y-6">
                        {/* Row 1: Office Name and Office Manager */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Office Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Enter office name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Office Manager
                                </label>
                                <select
                                    name="manager_id"
                                    value={formData.manager_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                    disabled={staffLoading}
                                >
                                    <option value="">No Manager</option>
                                    {staffOptions.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name || staff.email || `Staff #${staff.id}`}
                                            {staff.role_display ? ` (${staff.role_display})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Street Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="street_address"
                                value={formData.street_address}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                placeholder="Enter street address"
                                required
                            />
                        </div>

                        {/* Row 3: City, State, Zip Code */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Enter city"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="State"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zip Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="zip_code"
                                    value={formData.zip_code}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Enter zip code"
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 4: Phone Number and Timezone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <PhoneInput
                                    country={phoneCountry}
                                    value={formData.phone_number || ''}
                                    onChange={(phone) => {
                                        setFormData(prev => ({ ...prev, phone_number: phone }));
                                    }}
                                    onCountryChange={(countryCode) => {
                                        setPhoneCountry(countryCode.toLowerCase());
                                    }}
                                    inputClass="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    containerClass="w-100 phone-input-container"
                                    enableSearch={true}
                                    countryCodeEditable={false}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timezone
                                </label>
                                <select
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                >
                                    <option value="">Select timezone</option>
                                    {US_TIMEZONES.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 5: Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Operating Hours */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                Operating Hours
                            </label>
                            <div className="space-y-4">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                    const dayData = formData.operation_hours[day] || { isOpen: false, startTime: '', endTime: '' };
                                    return (
                                        <div key={day} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                                            <div className="w-24 flex-shrink-0">
                                                <span className="text-sm font-medium text-gray-700">{day}</span>
                                            </div>
                                            <div className="flex items-center gap-4 flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDayToggle(day)}
                                                    className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${dayData.isOpen ? 'bg-[#3AD6F2]' : 'bg-gray-200'
                                                        }`}
                                                    aria-pressed={dayData.isOpen}
                                                >
                                                    <span className="sr-only">Toggle {day}</span>
                                                    <span
                                                        className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${dayData.isOpen ? 'translate-x-6' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                                <span className="text-sm text-gray-600 min-w-[50px]">
                                                    {dayData.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                                {dayData.isOpen && (
                                                    <>
                                                        <input
                                                            type="time"
                                                            value={dayData.startTime ? (() => {
                                                                const match = dayData.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                                                if (!match) return '';
                                                                let hours = parseInt(match[1]);
                                                                const minutes = match[2];
                                                                const period = match[3].toUpperCase();
                                                                if (period === 'PM' && hours !== 12) hours += 12;
                                                                if (period === 'AM' && hours === 12) hours = 0;
                                                                return `${hours.toString().padStart(2, '0')}:${minutes}`;
                                                            })() : ''}
                                                            onChange={(e) => {
                                                                const time24 = e.target.value;
                                                                if (!time24) {
                                                                    handleTimeChange(day, 'startTime', '');
                                                                    return;
                                                                }
                                                                const [hours, minutes] = time24.split(':');
                                                                let hour12 = parseInt(hours);
                                                                const period = hour12 >= 12 ? 'PM' : 'AM';
                                                                if (hour12 > 12) hour12 -= 12;
                                                                if (hour12 === 0) hour12 = 12;
                                                                handleTimeChange(day, 'startTime', `${hour12}:${minutes} ${period}`);
                                                            }}
                                                            className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent text-sm transition-all bg-white"
                                                        />
                                                        <span className="text-gray-400 font-medium px-1">to</span>
                                                        <input
                                                            type="time"
                                                            value={dayData.endTime ? (() => {
                                                                const match = dayData.endTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                                                if (!match) return '';
                                                                let hours = parseInt(match[1]);
                                                                const minutes = match[2];
                                                                const period = match[3].toUpperCase();
                                                                if (period === 'PM' && hours !== 12) hours += 12;
                                                                if (period === 'AM' && hours === 12) hours = 0;
                                                                return `${hours.toString().padStart(2, '0')}:${minutes}`;
                                                            })() : ''}
                                                            onChange={(e) => {
                                                                const time24 = e.target.value;
                                                                if (!time24) {
                                                                    handleTimeChange(day, 'endTime', '');
                                                                    return;
                                                                }
                                                                const [hours, minutes] = time24.split(':');
                                                                let hour12 = parseInt(hours);
                                                                const period = hour12 >= 12 ? 'PM' : 'AM';
                                                                if (hour12 > 12) hour12 -= 12;
                                                                if (hour12 === 0) hour12 = 12;
                                                                handleTimeChange(day, 'endTime', `${hour12}:${minutes} ${period}`);
                                                            }}
                                                            className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent text-sm transition-all bg-white"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ borderRadius: '8px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        style={{ borderRadius: '8px' }}
                    >
                        {loading ? 'Updating...' : 'Update Office'}
                    </button>
                </div>
            </div>
        </div>
    );
}


