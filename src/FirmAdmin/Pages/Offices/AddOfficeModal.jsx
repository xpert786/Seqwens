import React, { useState, useEffect, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { toast } from 'react-toastify';
import { CrossesIcon } from '../../Components/icons';
import { firmOfficeAPI, handleAPIError, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { US_TIMEZONES } from './constants';

const steps = [
    { id: 1, name: 'Basic Information' },
    { id: 2, name: 'Operating Hours' },
    { id: 3, name: 'Branding' }
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
    },

    // Branding
    enable_office_branding: false,
    logo: null,
    favicon: null,
    primary_color: '#F56D2D',
    secondary_color: '#3AD6F2',
    email_footer: ''
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

            // Branding fields
            payload.enable_office_branding = formData.enable_office_branding;
            payload.primary_color = formData.primary_color;
            payload.secondary_color = formData.secondary_color;
            if (formData.email_footer) {
                payload.email_footer = formData.email_footer.trim();
            }

            // Files
            const files = {};
            if (formData.logo) files.logo = formData.logo;
            if (formData.favicon) files.favicon = formData.favicon;

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

            // Default behavior: If no staff exists (only admin or none), 
            // the dropdown will have options but we could auto-select if needed.
            // As per requirements: "If no staff exists, auto-set Office Manager to Firm Admin"
            if (staffList.length > 0 && !formData.manager_id) {
                // Find first admin if available, or first person
                const admin = staffList.find(s => s.role === 'firm' || s.role === 'admin');
                if (admin && staffList.length === 1) {
                    setFormData(prev => ({ ...prev, manager_id: admin.id }));
                }
            }
        } catch (err) {
            console.error('Error loading staff members:', err);
            setStaffError(handleAPIError(err));
            setStaffOptions([]);
        } finally {
            setStaffLoading(false);
        }
    }, [formData.manager_id]);

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
                <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-start border-b border-gray-200 z-20">
                    <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">Add New Office Location</h4>
                        <p className="text-sm text-gray-600">Create a new office location for your firm</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 flex items-center justify-center !rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors ml-4 flex-shrink-0"
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
                                    className={`text-sm font-medium ${currentStep === step.id
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
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer font-[BasisGrotesquePro] hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                    className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm resize-none font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                    className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                        inputClass="!w-full !pl-14 !pr-4 !py-2.5 !border !border-[#E8F0FF] !rounded-lg focus:!outline-none focus:!ring-2 focus:!ring-[#3AD6F2] !text-sm !font-[BasisGrotesquePro]"
                                        containerClass="w-100 phone-input-container !rounded-lg"
                                        dropdownClass="!z-[10000] !max-h-[200px]"
                                        buttonClass="!border-r !border-[#E8F0FF] !bg-white hover:!bg-gray-50"
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
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                    className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer font-[BasisGrotesquePro] hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                        <div className="flex items-center gap-4 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`relative inline-flex h-6 w-11 items-center !rounded-full transition-all duration-300 focus:outline-none border-2 ${dayData.isOpen ? 'bg-[#F56D2D] border-[#F56D2D]' : 'bg-[#CBD5E1] border-[#CBD5E1]'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform !rounded-full bg-white shadow-sm transition-all duration-300 ${dayData.isOpen ? 'translate-x-6' : 'translate-x-0.5'
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
                                                        className="px-3 py-2 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-xs font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all"
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
                                                        className="px-3 py-2 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-xs font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Branding Toggle */}
                            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] !rounded-xl border border-[#E2E8F0]">
                                <div>
                                    <h5 className="text-sm font-bold text-gray-900">Enable Office-Level Branding</h5>
                                    <p className="text-xs text-gray-500 mt-1">If enabled, this office will use its own logo, colors, and favicon instead of firm-wide branding.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, enable_office_branding: !p.enable_office_branding }))}
                                    className={`relative inline-flex h-6 w-11 items-center !rounded-full transition-all duration-300 focus:outline-none border-2 ${formData.enable_office_branding ? 'bg-[#F56D2D] border-[#F56D2D]' : 'bg-[#CBD5E1] border-[#CBD5E1]'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform !rounded-full bg-white shadow-sm transition-all duration-300 ${formData.enable_office_branding ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            <div className={`space-y-6 transition-all duration-300 ${!formData.enable_office_branding ? 'opacity-50 pointer-events-none' : ''}`}>
                                {/* Image Uploads */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 p-4 bg-[#F8FAFC] !rounded-xl border border-[#E2E8F0]">
                                        <label className="text-sm font-semibold text-gray-700">Office Logo</label>
                                        <div className="relative group">
                                            <div className={`h-32 border-2 border-dashed !rounded-xl flex flex-col items-center justify-center transition-all bg-white ${formData.logo ? 'border-[#3AD6F2] bg-blue-50/30' : 'border-[#E8F0FF] hover:border-[#3AD6F2]'}`}>
                                                {formData.logo ? (
                                                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                                                        <img
                                                            src={URL.createObjectURL(formData.logo)}
                                                            alt="Logo Preview"
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                        <button
                                                            onClick={() => setFormData(p => ({ ...p, logo: null }))}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            <CrossesIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <div className="mx-auto w-10 h-10 bg-[#E8F0FF] rounded-full flex items-center justify-center text-[#F56D2D] mb-2">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.585-1.585a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Click or drag to upload logo</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    name="logo"
                                                    onChange={handleInputChange}
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-2">PNG, JPG, or SVG</p>
                                    </div>

                                    <div className="space-y-3 p-4 bg-[#F8FAFC] !rounded-xl border border-[#E2E8F0]">
                                        <label className="text-sm font-semibold text-gray-700">Office Favicon</label>
                                        <div className="relative group">
                                            <div className={`h-32 border-2 border-dashed !rounded-xl flex flex-col items-center justify-center transition-all bg-white ${formData.favicon ? 'border-[#3AD6F2] bg-blue-50/30' : 'border-[#E8F0FF] hover:border-[#3AD6F2]'}`}>
                                                {formData.favicon ? (
                                                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                                                        <img
                                                            src={URL.createObjectURL(formData.favicon)}
                                                            alt="Favicon Preview"
                                                            className="w-12 h-12 object-contain"
                                                        />
                                                        <button
                                                            onClick={() => setFormData(p => ({ ...p, favicon: null }))}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            <CrossesIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <div className="mx-auto w-10 h-10 bg-[#E8F0FF] rounded-full flex items-center justify-center text-[#F56D2D] mb-2">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Click or drag to upload favicon</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    name="favicon"
                                                    onChange={handleInputChange}
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-2">16x16 or 32x32 recommended</p>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 p-4 bg-[#F8FAFC] !rounded-xl border border-[#E2E8F0]">
                                        <label className="text-sm font-semibold text-gray-700">Primary Color</label>
                                        <div className="flex items-center gap-3 bg-white p-2 !rounded-lg border border-[#E8F0FF]">
                                            <input
                                                type="color"
                                                name="primary_color"
                                                value={formData.primary_color}
                                                onChange={handleInputChange}
                                                className="w-12 h-10 !rounded-md border border-gray-200 cursor-pointer overflow-hidden"
                                            />
                                            <input
                                                type="text"
                                                value={formData.primary_color}
                                                onChange={(e) => setFormData(p => ({ ...p, primary_color: e.target.value }))}
                                                className="flex-1 px-3 py-1.5 border-0 text-sm font-mono focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4 bg-[#F8FAFC] !rounded-xl border border-[#E2E8F0]">
                                        <label className="text-sm font-semibold text-gray-700">Secondary Color</label>
                                        <div className="flex items-center gap-3 bg-white p-2 !rounded-lg border border-[#E8F0FF]">
                                            <input
                                                type="color"
                                                name="secondary_color"
                                                value={formData.secondary_color}
                                                onChange={handleInputChange}
                                                className="w-12 h-10 !rounded-md border border-gray-200 cursor-pointer overflow-hidden"
                                            />
                                            <input
                                                type="text"
                                                value={formData.secondary_color}
                                                onChange={(e) => setFormData(p => ({ ...p, secondary_color: e.target.value }))}
                                                className="flex-1 px-3 py-1.5 border-0 text-sm font-mono focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email Footer */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Custom Email Footer</label>
                                    <textarea
                                        name="email_footer"
                                        value={formData.email_footer}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm resize-none"
                                        placeholder="Add a custom footer to be appended to all office communications"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-[BasisGrotesquePro]"
                        >
                            Previous
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-[BasisGrotesquePro]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleContinue}
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E54A1B] transition-all duration-200 disabled:opacity-50 font-[BasisGrotesquePro] flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {loading ? 'Saving...' : currentStep === steps.length ? 'Add Office' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
