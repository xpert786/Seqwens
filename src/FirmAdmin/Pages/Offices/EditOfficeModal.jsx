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
        },
        // Branding
        email: '',
        enable_office_branding: false,
        logo: null,
        favicon: null,
        primary_color: '#F56D2D',
        secondary_color: '#3AD6F2',
        email_footer: ''
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
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
                operation_hours: parseOperationHours(officeData.operation_hours),
                // Branding
                email: officeData.email || '',
                enable_office_branding: officeData.enable_office_branding || false,
                primary_color: officeData.primary_color || '#F56D2D',
                secondary_color: officeData.secondary_color || '#3AD6F2',
                email_footer: officeData.email_footer || ''
            });

            // Set previews
            setLogoPreview(officeData.logo_url || null);
            setFaviconPreview(officeData.favicon_url || null);

            // Set phone country from phone number
            if (officeData.phone_number) {
                const countryCode = officeData.phone_number.substring(0, 2);
                setPhoneCountry(countryCode || 'us');
            }
        }
    }, [isOpen, officeData]);

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            if (file) {
                setFormData(prev => ({ ...prev, [name]: file }));
                if (name === 'logo') setLogoPreview(URL.createObjectURL(file));
                if (name === 'favicon') setFaviconPreview(URL.createObjectURL(file));
            }
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
                email: formData.email.trim(),
                enable_office_branding: formData.enable_office_branding,
                primary_color: formData.primary_color,
                secondary_color: formData.secondary_color,
                email_footer: formData.email_footer.trim(),
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

            // Files handling
            const files = {};
            if (formData.logo instanceof File) files.logo = formData.logo;
            if (formData.favicon instanceof File) files.favicon = formData.favicon;

            const response = files.logo || files.favicon
                ? await firmOfficeAPI.updateOfficeBranding(officeId, payload, files)
                : await firmOfficeAPI.updateBasicDetails(officeId, payload);

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
                <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-start border-b border-gray-200 z-20">
                    <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">Edit Office Location</h4>
                        <p className="text-sm text-gray-600">Update office location details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center !rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors ml-4 flex-shrink-0"
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
                                className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                    className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                    className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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
                                    className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
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

                        {/* Row 5: Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer font-[BasisGrotesquePro] hover:border-[#3AD6F2]/50 transition-all duration-200"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Branding Section */}
                        <div className="pt-6 border-t border-gray-100">
                            <h5 className="text-lg font-bold text-gray-900 mb-4">Branding & Email</h5>

                            <div className="space-y-6">
                                {/* Row: Office Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Office Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm font-[BasisGrotesquePro] bg-white hover:border-[#3AD6F2]/50 transition-all duration-200"
                                        placeholder="office@example.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Defaults to manager or firm email if not set.</p>
                                </div>

                                {/* Branding Toggle */}
                                <div className="flex items-center justify-between p-4 bg-[#F8FAFC] !rounded-xl border border-[#E2E8F0]">
                                    <div>
                                        <h5 className="text-sm font-bold text-gray-900">Enable Office-Level Branding</h5>
                                        <p className="text-xs text-gray-500 mt-1">Override firm-wide logo, colors, and favicon.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, enable_office_branding: !p.enable_office_branding }))}
                                        className={`relative inline-flex h-6 w-11 items-center !rounded-full transition-all duration-300 focus:outline-none ${formData.enable_office_branding ? 'bg-[#F56D2D]' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4.5 w-4.5 transform !rounded-full bg-white shadow-sm transition-all duration-300 ${formData.enable_office_branding ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className={`space-y-6 transition-all duration-300 ${!formData.enable_office_branding ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {/* Image Uploads */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Office Logo</label>
                                            <div className="relative group">
                                                <div className={`h-32 border-2 border-dashed !rounded-xl flex flex-col items-center justify-center transition-all ${logoPreview ? 'border-primary-light bg-primary-50' : 'border-[#E8F0FF] hover:border-[#3AD6F2]'}`}>
                                                    {logoPreview ? (
                                                        <div className="relative w-full h-full p-2 flex items-center justify-center">
                                                            <img
                                                                src={logoPreview}
                                                                alt="Logo Preview"
                                                                className="max-w-full max-h-full object-contain"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(p => ({ ...p, logo: null }));
                                                                    setLogoPreview(null);
                                                                }}
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
                                                            <p className="text-xs text-gray-500">Click to upload logo</p>
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
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Office Favicon</label>
                                            <div className="relative group">
                                                <div className={`h-32 border-2 border-dashed !rounded-xl flex flex-col items-center justify-center transition-all ${faviconPreview ? 'border-primary-light bg-primary-50' : 'border-[#E8F0FF] hover:border-[#3AD6F2]'}`}>
                                                    {faviconPreview ? (
                                                        <div className="relative w-full h-full p-2 flex items-center justify-center">
                                                            <img
                                                                src={faviconPreview}
                                                                alt="Favicon Preview"
                                                                className="w-12 h-12 object-contain"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(p => ({ ...p, favicon: null }));
                                                                    setFaviconPreview(null);
                                                                }}
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
                                                            <p className="text-xs text-gray-500">Click to upload favicon</p>
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
                                        </div>
                                    </div>

                                    {/* Colors */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    name="primary_color"
                                                    value={formData.primary_color}
                                                    onChange={handleInputChange}
                                                    className="w-12 h-12 !rounded-lg border border-gray-200 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.primary_color}
                                                    onChange={(e) => setFormData(p => ({ ...p, primary_color: e.target.value }))}
                                                    className="flex-1 px-4 py-2 border border-[#E8F0FF] !rounded-lg text-sm font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    name="secondary_color"
                                                    value={formData.secondary_color}
                                                    onChange={handleInputChange}
                                                    className="w-12 h-12 !rounded-lg border border-gray-200 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.secondary_color}
                                                    onChange={(e) => setFormData(p => ({ ...p, secondary_color: e.target.value }))}
                                                    className="flex-1 px-4 py-2 border border-[#E8F0FF] !rounded-lg text-sm font-mono"
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
                        </div>
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
                                                className={`relative inline-flex h-6 w-11 items-center !rounded-full transition-all duration-300 focus:outline-none ${dayData.isOpen ? 'bg-gradient-to-r from-[#F56D2D] to-[#ff8c57]' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4.5 w-4.5 transform !rounded-full bg-white shadow-sm transition-all duration-300 ${dayData.isOpen ? 'translate-x-5.5' : 'translate-x-1'
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
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-[BasisGrotesquePro]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#F56D2D] to-[#ff8c57] !rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 font-[BasisGrotesquePro] flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {loading ? 'Updating...' : 'Update Office'}
                    </button>
                </div>
            </div>
        </div>
    );
}


