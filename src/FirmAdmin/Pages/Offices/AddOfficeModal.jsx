import React, { useState, useEffect, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { toast } from 'react-toastify';
import { CrossesIcon } from '../../Components/icons';
import { firmOfficeAPI, handleAPIError, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';

const steps = [
    { id: 1, name: 'Basic Information' },
    { id: 2, name: 'Operating Hours' }
];

const initialFormState = {
    // Basic Information
    name: '',
    manager_id: '',
    description: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    phone_number: '',
    email: '',
    timezone: '',
    status: 'active',
    
    // Operating Hours
    operation_hours: {
        Monday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
        Tuesday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
        Wednesday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
        Thursday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
        Friday: { isOpen: true, startTime: '09:00 AM', endTime: '05:00 PM' },
        Saturday: { isOpen: true, startTime: '09:00 AM', endTime: '01:00 PM' },
        Sunday: { isOpen: false, startTime: '', endTime: '' }
    }
};

export default function AddOfficeModal({ isOpen, onClose, onOfficeCreated }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialFormState);
    const [phoneCountry, setPhoneCountry] = useState('us');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'file') {
            const file = files[0] || null;
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
        // Convert "09:00 AM" to "09:00" format
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


    const resetForm = () => {
        setFormData(initialFormState);
        setCurrentStep(1);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateCurrentStep = () => {
        if (currentStep === 1) {
            // Validate Basic Information
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
            if (!formData.country.trim()) {
                setError('Country is required');
                return false;
            }
        }
        return true;
    };

    const handleContinue = () => {
        if (!validateCurrentStep()) {
            return;
        }

        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
            setError(null);
        } else {
            // Last step - submit the form
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            // Build payload according to API specification
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
            }
            if (formData.timezone) {
                payload.timezone = formData.timezone;
            }
            if (formData.description) {
                payload.description = formData.description.trim();
            }

            // Operation hours - format for API (null for closed days)
            const operationHours = {};
            Object.keys(formData.operation_hours).forEach(day => {
                const dayData = formData.operation_hours[day];
                if (dayData && dayData.isOpen && dayData.startTime && dayData.endTime) {
                    operationHours[day] = `${formatTimeForAPI(dayData.startTime)}-${formatTimeForAPI(dayData.endTime)}`;
                } else {
                    operationHours[day] = null;
                }
            });
            if (Object.keys(operationHours).length > 0) {
                payload.operation_hours = operationHours;
            }

            // Prepare files (empty object since branding fields are removed)
            const files = {};

            const response = await firmOfficeAPI.createOffice(payload, files);

            if (response.success) {
                toast.success(response.message || 'Office location created successfully', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                resetForm();
                onClose();
                if (typeof onOfficeCreated === 'function') {
                    onOfficeCreated();
                }
            } else {
                throw new Error(response.message || 'Failed to create office location');
            }
        } catch (err) {
            const errorMsg = handleAPIError(err);
            setError(errorMsg);
            toast.error(errorMsg || 'Failed to create office location.', {
                position: 'top-right',
                autoClose: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffOptions = useCallback(async () => {
        setStaffLoading(true);
        setStaffError(null);
        try {
            const response = await firmAdminStaffAPI.listBasicStaff();
            let staffList = [];

            if (Array.isArray(response)) {
                staffList = response;
            } else if (Array.isArray(response?.data?.staff_members)) {
                staffList = response.data.staff_members;
            } else if (Array.isArray(response?.staff_members)) {
                staffList = response.staff_members;
            }

            setStaffOptions(staffList || []);
        } catch (err) {
            console.error('Error loading staff members:', err);
            setStaffError(handleAPIError(err));
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
                    handleClose();
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
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">Add New Office Location</h4>
                        <p className="text-sm text-gray-600">Create a new office location for your firm</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <CrossesIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Navigation */}
                <div className="px-6 py-4 bg-[#E8F0FF]">
                    <div className="flex items-center flex-wrap gap-2">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <span
                                    className={`text-sm font-medium ${
                                        currentStep === step.id
                                            ? 'text-[#F56D2D]'
                                            : currentStep > step.id
                                            ? 'text-[#F56D2D]'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {step.name}
                                </span>
                                {index < steps.length - 1 && (
                                    <span className="text-gray-400 text-sm">»</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Form Content */}
                <div className="px-6 py-6">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Row 1: Office Name and Office Manager */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Office Name
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
                                        <option value="">Select manager</option>
                                        {staffOptions.map((staff) => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name || staff.email || `Staff #${staff.id}`}
                                                {staff.role_display ? ` (${staff.role_display})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm resize-none"
                                    placeholder="Brief description of this office location and its specialities"
                                />
                            </div>

                            {/* Row 3: Street Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Street Address
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

                            {/* Row 4: City, State, Zip Code */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
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
                                        State
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
                                        Zip Code
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

                            {/* Row 5: Phone Number and Email Address */}
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
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="office@taxfirm.com"
                                    />
                                </div>
                            </div>

                            {/* Row 6: Timezone */}
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
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="America/Phoenix">Mountain Time (Arizona)</option>
                                    <option value="America/Alaska">Alaska Time</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                const dayData = formData.operation_hours[day] || { isOpen: false, startTime: '', endTime: '' };
                                return (
                                    <div key={day} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="w-24 flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-700">{day}</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    dayData.isOpen ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        dayData.isOpen ? 'translate-x-6' : 'translate-x-1'
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
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                    />
                                                    <span className="text-gray-400">to</span>
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
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            Previous
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ borderRadius: '8px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        style={{ borderRadius: '8px' }}
                    >
                        {loading ? 'Saving...' : currentStep === steps.length ? 'Add Office' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
