import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { CrossesIcon } from '../../Components/icons';
import { firmOfficeAPI, handleAPIError, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';

const steps = [
    { id: 1, name: 'Basic Information' },
    { id: 2, name: 'Operating Hours' },
    { id: 3, name: 'Branding & Identity' },
    { id: 4, name: 'Service Pricing' },
    { id: 5, name: 'Compliance & Licensing' },
    { id: 6, name: 'Review & Finalize' }
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
    
    // Branding & Identity
    logo: null,
    primary_color: '#3AD6F2',
    secondary_color: '#F56D2D',
    custom_domain: '',
    letterhead_template_id: '',
    digital_signature: null,
    
    // Service Pricing
    individual_tax_return: '',
    business_tax_return: '',
    quarterly_tax_return: '',
    payroll_processing: '',
    custom_service_rates: {
        tax_preparation: '',
        bookkeeping: '',
        consultation: ''
    },
    
    // Compliance & Licensing
    efin_number: '',
    efin_status: '',
    refund_advance_products: false,
    refund_transfer_products: false,
    state_taxpreparer_license: '',
    ea_license_number: '',
    cpa_license_number: '',
    eo_policy_number: '',
    eo_policy_expiry_date: '',
    general_liability_policy_number: ''
};

export default function AddOfficeModal({ isOpen, onClose, onOfficeCreated }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState(null);
    const [signatureTab, setSignatureTab] = useState('draw');
    const signatureCanvasRef = useRef(null);
    const [signatureImage, setSignatureImage] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [typedSignature, setTypedSignature] = useState('');

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

    const handleCustomServiceRateChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            custom_service_rates: {
                ...prev.custom_service_rates,
                [field]: value
            }
        }));
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

    // Signature drawing handlers
    useEffect(() => {
        if (signatureTab === 'draw' && signatureCanvasRef.current) {
            const canvas = signatureCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [signatureTab]);

    const startDrawing = (e) => {
        if (signatureTab !== 'draw' || !signatureCanvasRef.current) return;
        setIsDrawing(true);
        const canvas = signatureCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e) => {
        if (!isDrawing || signatureTab !== 'draw' || !signatureCanvasRef.current) return;
        const canvas = signatureCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        if (signatureCanvasRef.current) {
            const ctx = signatureCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
            setSignatureImage(null);
        }
        setTypedSignature('');
    };

    const applySignature = () => {
        if (signatureTab === 'draw' && signatureCanvasRef.current) {
            const dataURL = signatureCanvasRef.current.toDataURL('image/png');
            setSignatureImage(dataURL);
            // Convert to blob for file upload
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'signature.png', { type: 'image/png' });
                    setFormData(prev => ({ ...prev, digital_signature: file }));
                });
        } else if (signatureTab === 'type' && typedSignature) {
            // For typed signature, we could create an image from text
            // For now, just store the text
            setFormData(prev => ({ ...prev, typed_signature: typedSignature }));
        } else if (signatureTab === 'upload' && formData.digital_signature) {
            // Already set in formData
            setSignatureImage(URL.createObjectURL(formData.digital_signature));
        }
    };

    const handleSignatureFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, digital_signature: file }));
            setSignatureImage(URL.createObjectURL(file));
        }
    };

    const checkComplianceStatus = () => {
        const checks = {
            profile: !!(formData.name && formData.street_address && formData.city && formData.state && formData.phone_number && formData.timezone),
            branding: !!(formData.logo || formData.digital_signature || formData.letterhead_template_id),
            pricing: !!(formData.individual_tax_return || formData.business_tax_return || formData.quarterly_tax_return || formData.payroll_processing),
            efin: !!(formData.efin_number && formData.efin_status),
            bankProducts: !!(formData.refund_advance_products || formData.refund_transfer_products)
        };
        return checks;
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

            // Branding
            if (formData.primary_color) {
                payload.primary_color = formData.primary_color;
            }
            if (formData.secondary_color) {
                payload.secondary_color = formData.secondary_color;
            }
            if (formData.custom_domain) {
                payload.custom_domain = formData.custom_domain;
            }
            if (formData.letterhead_template_id) {
                payload.letterhead_template_id = Number(formData.letterhead_template_id);
            }

            // Service pricing - these are strings in the API
            if (formData.individual_tax_return) {
                payload.individual_tax_return = formData.individual_tax_return.trim();
            }
            if (formData.business_tax_return) {
                payload.business_tax_return = formData.business_tax_return.trim();
            }
            if (formData.quarterly_tax_return) {
                payload.quarterly_tax_return = formData.quarterly_tax_return.trim();
            }
            if (formData.payroll_processing) {
                payload.payroll_processing = formData.payroll_processing.trim();
            }
            
            // Custom service rates - format as object with numeric values
            const customRates = {};
            if (formData.custom_service_rates.tax_preparation) {
                customRates.tax_preparation = parseFloat(formData.custom_service_rates.tax_preparation) || 0;
            }
            if (formData.custom_service_rates.bookkeeping) {
                customRates.bookkeeping = parseFloat(formData.custom_service_rates.bookkeeping) || 0;
            }
            if (formData.custom_service_rates.consultation) {
                customRates.consultation = parseFloat(formData.custom_service_rates.consultation) || 0;
            }
            if (Object.keys(customRates).length > 0) {
                payload.custom_service_rates = customRates;
            }

            // Compliance & Licensing
            if (formData.efin_number) {
                payload.efin_number = formData.efin_number;
            }
            if (formData.efin_status) {
                payload.efin_status = formData.efin_status;
            }
            payload.refund_advance_products = formData.refund_advance_products;
            payload.refund_transfer_products = formData.refund_transfer_products;
            if (formData.state_taxpreparer_license) {
                payload.state_taxpreparer_license = formData.state_taxpreparer_license;
            }
            if (formData.ea_license_number) {
                payload.ea_license_number = formData.ea_license_number;
            }
            if (formData.cpa_license_number) {
                payload.cpa_license_number = formData.cpa_license_number;
            }
            if (formData.eo_policy_number) {
                payload.eo_policy_number = formData.eo_policy_number;
            }
            if (formData.eo_policy_expiry_date) {
                payload.eo_policy_expiry_date = formData.eo_policy_expiry_date;
            }
            if (formData.general_liability_policy_number) {
                payload.general_liability_policy_number = formData.general_liability_policy_number;
            }

            // Prepare files (only logo and signature, letterhead_template_id is sent as ID)
            const files = {};
            if (formData.logo) {
                files.logo = formData.logo;
            }
            if (formData.digital_signature) {
                files.signature = formData.digital_signature;
            }

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
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="(555) 123-4567"
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

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Primary Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded border border-gray-300"
                                            style={{ backgroundColor: formData.primary_color || '#3AD6F2' }}
                                        />
                                        <input
                                            type="text"
                                            name="primary_color"
                                            value={formData.primary_color || '#3AD6F2'}
                                            onChange={handleInputChange}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="#3AD6F2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Secondary Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded border border-gray-300"
                                            style={{ backgroundColor: formData.secondary_color || '#F56D2D' }}
                                        />
                                        <input
                                            type="text"
                                            name="secondary_color"
                                            value={formData.secondary_color || '#F56D2D'}
                                            onChange={handleInputChange}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="#F56D2D"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Custom Domain (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="custom_domain"
                                    value={formData.custom_domain}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="downtown.taxfirm.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Letterhead Template ID (Optional)
                                </label>
                                <input
                                    type="number"
                                    name="letterhead_template_id"
                                    value={formData.letterhead_template_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Enter letterhead template ID"
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter the ID of an existing letterhead template</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            {/* EFIN Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EFIN Number
                                    </label>
                                    <input
                                        type="text"
                                        name="efin_number"
                                        value={formData.efin_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EFIN Status
                                    </label>
                                    <select
                                        name="efin_status"
                                        value={formData.efin_status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    >
                                        <option value="">Select status</option>
                                        <option value="Not Applied">Not Applied</option>
                                        <option value="Applied">Applied</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Revoked">Revoked</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Service Pricing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Individual Tax Return
                                </label>
                                <input
                                    type="text"
                                    name="individual_tax_return"
                                    value={formData.individual_tax_return}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Form 1040"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Tax Return
                                </label>
                                <input
                                    type="text"
                                    name="business_tax_return"
                                    value={formData.business_tax_return}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Form 1120"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quarterly Tax Return
                                </label>
                                <input
                                    type="text"
                                    name="quarterly_tax_return"
                                    value={formData.quarterly_tax_return}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Form 941"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payroll Processing
                                </label>
                                <input
                                    type="text"
                                    name="payroll_processing"
                                    value={formData.payroll_processing}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Bi-weekly"
                                />
                            </div>

                            {/* Custom Service Rates */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Custom Service Rates
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Tax Preparation</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.custom_service_rates.tax_preparation}
                                                onChange={(e) => handleCustomServiceRateChange('tax_preparation', e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="150.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Bookkeeping</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.custom_service_rates.bookkeeping}
                                                onChange={(e) => handleCustomServiceRateChange('bookkeeping', e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="75.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Consultation</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.custom_service_rates.consultation}
                                                onChange={(e) => handleCustomServiceRateChange('consultation', e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="200.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Refund Products */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Refund Advance Products
                                        </label>
                                        <p className="text-xs text-gray-500">Enable refund advance loans</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, refund_advance_products: !prev.refund_advance_products }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            formData.refund_advance_products ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                formData.refund_advance_products ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Refund Transfer
                                        </label>
                                        <p className="text-xs text-gray-500">Enable refund transfer services</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, refund_transfer_products: !prev.refund_transfer_products }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            formData.refund_transfer_products ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                formData.refund_transfer_products ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State Tax Preparer License
                                    </label>
                                    <input
                                        type="text"
                                        name="state_taxpreparer_license"
                                        value={formData.state_taxpreparer_license}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="License number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EA License Number
                                    </label>
                                    <input
                                        type="text"
                                        name="ea_license_number"
                                        value={formData.ea_license_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="EA License number"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        CPA License Number
                                    </label>
                                    <input
                                        type="text"
                                        name="cpa_license_number"
                                        value={formData.cpa_license_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="CPA license number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        E&O Policy Number
                                    </label>
                                    <input
                                        type="text"
                                        name="eo_policy_number"
                                        value={formData.eo_policy_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="Policy number"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        E&O Policy Expiry
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="eo_policy_expiry_date"
                                            value={formData.eo_policy_expiry_date}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="dd/mm/yyyy"
                                        />
                                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        General Liability Policy
                                    </label>
                                    <input
                                        type="text"
                                        name="general_liability_policy_number"
                                        value={formData.general_liability_policy_number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="Policy number"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 6 && (
                        <div className="space-y-6">
                            {/* Upload Signature and Logo Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Upload Signature */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload Signature</h3>
                                    
                                    {/* Signature Tabs */}
                                    <div className="flex border-b border-gray-200 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setSignatureTab('draw')}
                                            className={`px-4 py-2 text-sm font-medium ${
                                                signatureTab === 'draw'
                                                    ? 'text-[#3AD6F2] border-b-2 border-[#3AD6F2]'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Draw
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSignatureTab('type')}
                                            className={`px-4 py-2 text-sm font-medium ${
                                                signatureTab === 'type'
                                                    ? 'text-[#3AD6F2] border-b-2 border-[#3AD6F2]'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Type
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSignatureTab('upload')}
                                            className={`px-4 py-2 text-sm font-medium ${
                                                signatureTab === 'upload'
                                                    ? 'text-[#3AD6F2] border-b-2 border-[#3AD6F2]'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            Upload
                                        </button>
                                    </div>

                                    {/* Signature Content */}
                                    {signatureTab === 'draw' && (
                                        <div>
                                            <canvas
                                                ref={signatureCanvasRef}
                                                width={400}
                                                height={200}
                                                className="w-full border border-gray-300 rounded-lg cursor-crosshair"
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                style={{ touchAction: 'none' }}
                                            />
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={clearSignature}
                                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applySignature}
                                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600"
                                                >
                                                    Apply Signature
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {signatureTab === 'type' && (
                                        <div>
                                            <input
                                                type="text"
                                                value={typedSignature}
                                                onChange={(e) => setTypedSignature(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm mb-4"
                                                placeholder="Type your signature"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={clearSignature}
                                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applySignature}
                                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600"
                                                >
                                                    Apply Signature
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {signatureTab === 'upload' && (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSignatureFileUpload}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm mb-4"
                                            />
                                            {signatureImage && (
                                                <img src={signatureImage} alt="Signature" className="w-full border border-gray-300 rounded-lg mb-4" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={applySignature}
                                                className="w-full px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600"
                                            >
                                                Apply Signature
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Logo */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload Logo</h3>
                                    <label className="block">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#3AD6F2] transition-colors">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData(prev => ({ ...prev, logo: file }));
                                                    }
                                                }}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">Upload Logo</span>
                                                <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</span>
                                            </div>
                                        </div>
                                    </label>
                                    {formData.logo && (
                                        <div className="mt-4">
                                            <img src={URL.createObjectURL(formData.logo)} alt="Logo preview" className="max-h-32 mx-auto rounded" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Office Compliance & Setup Checklist */}
                            <div className="border border-gray-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Office Compliance & Setup Checklist</h3>
                                <p className="text-sm text-gray-600 mb-6">Complete all required steps to activate a new office.</p>
                                
                                {(() => {
                                    const compliance = checkComplianceStatus();
                                    return (
                                        <div className="space-y-4">
                                            {/* Profile */}
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                                    compliance.profile ? 'bg-[#3AD6F2] border-[#3AD6F2]' : 'border-gray-300'
                                                }`}>
                                                    {compliance.profile && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700">Profile</span>
                                                        <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">Required</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Complete Custom Office Profile (Address, Phone, Hours, Timezone)</p>
                                                </div>
                                            </div>

                                            {/* Branding */}
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                                    compliance.branding ? 'bg-[#3AD6F2] border-[#3AD6F2]' : 'border-gray-300'
                                                }`}>
                                                    {compliance.branding && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700">Branding</span>
                                                        <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">Required</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Upload Office Branding (Logos, Signatures)</p>
                                                </div>
                                            </div>

                                            {/* Pricing */}
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                                    compliance.pricing ? 'bg-[#3AD6F2] border-[#3AD6F2]' : 'border-gray-300'
                                                }`}>
                                                    {compliance.pricing && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700">Pricing</span>
                                                        <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">Required</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Define Office-Specific Pricing For Services</p>
                                                </div>
                                            </div>

                                            {/* Compliance - EFIN */}
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                                    compliance.efin ? 'bg-[#3AD6F2] border-[#3AD6F2]' : 'border-gray-300'
                                                }`}>
                                                    {compliance.efin && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700">Compliance</span>
                                                        <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">Required</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Verify EFIN Registration For This Office</p>
                                                </div>
                                            </div>

                                            {/* Compliance - Bank Products */}
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                                    compliance.bankProducts ? 'bg-[#3AD6F2] border-[#3AD6F2]' : 'border-gray-300'
                                                }`}>
                                                    {compliance.bankProducts && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700">Compliance</span>
                                                        <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded-full">Required</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Confirm Bank Product Enrollment (Refund Transfers, Advances)</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
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
