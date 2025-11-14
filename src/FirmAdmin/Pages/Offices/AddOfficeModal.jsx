import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { CrossesIcon } from '../../Components/icons';
import { firmOfficeAPI, handleAPIError, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';

const initialFormState = {
    name: '',
    phone_number: '',
    street_address: '',
    city: '',
        state: '',
    zip_code: '',
    country: 'USA',
    manager_id: '',
    status: 'active',
};

export default function AddOfficeModal({ isOpen, onClose, onOfficeCreated }) {
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload = {
                name: formData.name.trim(),
                phone_number: formData.phone_number.trim(),
                street_address: formData.street_address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zip_code: formData.zip_code.trim(),
                country: formData.country.trim(),
                status: formData.status,
            };

            if (formData.manager_id) {
                payload.manager_id = Number(formData.manager_id);
            }

            const response = await firmOfficeAPI.createOffice(payload);

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

    const handleClose = () => {
        resetForm();
        onClose();
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

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 relative"
                style={{ fontFamily: 'BasisGrotesquePro' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Add Office Location</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Create a new office for your firm and assign a manager.
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <CrossesIcon className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Office Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="Enter office name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="+1 408 555 0123"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="street_address"
                            value={formData.street_address}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                            placeholder="123 Main St, Suite 100"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="San Francisco"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                State <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="CA"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Zip Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="zip_code"
                                value={formData.zip_code}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="94105"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3AD6F2]"
                                placeholder="USA"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Office Manager (optional)
                            </label>
                            <div className="flex flex-col gap-2">
                                <select
                                    name="manager_id"
                                    value={formData.manager_id}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#3AD6F2]"
                                    disabled={staffLoading || staffOptions.length === 0}
                                >
                                    <option value="">Select a manager</option>
                                    {staffOptions.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name || staff.email || `Staff #${staff.id}`}
                                            {staff.role_display ? ` (${staff.role_display})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <button
                                        type="button"
                                        onClick={fetchStaffOptions}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                                        disabled={staffLoading}
                                    >
                                        {staffLoading ? 'Loading...' : 'Refresh Staff'}
                                    </button>
                                    {staffError && <span className="text-red-500">{staffError}</span>}
                                    {!staffLoading && !staffError && staffOptions.length === 0 && (
                                        <span>No staff members found.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#3AD6F2]"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Office'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const handleClearSignature = () => {
        setFormData(prev => ({
            ...prev,
            signature: {
                ...prev.signature,
                signatureData: null,
                signatureImage: null
            }
        }));
    };

    const handleContinue = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // Handle form submission
            console.log('Form submitted:', formData);
            onClose();
            // Call the callback to refresh offices if provided
            if (onOfficeCreated) {
                onOfficeCreated();
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

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
                <div className="sticky top-0 bg-white  px-6 py-4 flex justify-between items-start">
                    <div>
                        <h4  className="text-2xl font-bold text-gray-900 mb-1">Add New Office Location</h4>
                        <p className="text-sm text-gray-600">Create a new office location for your firm</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Navigation */}
                <div className="m-2 px-6 py-4 bg-[#E8F0FF] rounded-lg">
                    <div className="flex items-center py-2 flex-wrap gap-2" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <span
                                    className={`text-sm font-medium ${currentStep === step.id || currentStep > step.id
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
                                        name="officeName"
                                        value={formData.officeName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="Enter office name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Office Manager
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="officeManager"
                                            value={formData.officeManager}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">Select manager</option>
                                            <option value="michael-chen">Michael Chen</option>
                                            <option value="sarah-martinez">Sarah Martinez</option>
                                            <option value="david-rodriguez">David Rodriguez</option>
                                            <option value="lisa-thompson">Lisa Thompson</option>
                                        </select>
                                        <svg
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
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
                                    name="streetAddress"
                                    value={formData.streetAddress}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Enter street address"
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
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">State</option>
                                            <option value="NY">New York</option>
                                            <option value="CA">California</option>
                                            <option value="TX">Texas</option>
                                            <option value="FL">Florida</option>
                                        </select>
                                        <svg
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zip Code
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="Enter zip code"
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
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
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
                                        name="emailAddress"
                                        value={formData.emailAddress}
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
                                <div className="relative">
                                    <select
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                    >
                                        <option value="">Select timezone</option>
                                        <option value="EST">Eastern Standard Time (EST)</option>
                                        <option value="CST">Central Standard Time (CST)</option>
                                        <option value="MST">Mountain Standard Time (MST)</option>
                                        <option value="PST">Pacific Standard Time (PST)</option>
                                    </select>
                                    <svg
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4">
                            {[
                                { key: 'monday', label: 'Monday' },
                                { key: 'tuesday', label: 'Tuesday' },
                                { key: 'wednesday', label: 'Wednesday' },
                                { key: 'thursday', label: 'Thursday' },
                                { key: 'friday', label: 'Friday' },
                                { key: 'saturday', label: 'Saturday' },
                                { key: 'sunday', label: 'Sunday' }
                            ].map((day) => {
                                const dayData = formData.operatingHours[day.key];
                                return (
                                    <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                                        {/* Day Name */}
                                        <div className="w-24 flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-500">{day.label}</span>
                                        </div>

                                        {/* Toggle and Status */}
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => handleDayToggle(day.key)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${dayData.isOpen ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dayData.isOpen ? 'translate-x-6' : 'translate-x-1'
                                                        }`}

                                                />
                                            </button>
                                            <span className={`text-sm font-medium ${dayData.isOpen ? 'text-gray-500' : 'text-gray-500'}`} >
                                                {dayData.isOpen ? 'Open' : 'Closed'}
                                            </span>
                                        </div>

                                        {/* Time Inputs */}
                                        {dayData.isOpen && (
                                            <div className="flex items-center gap-2 flex-1 sm:flex-shrink-0 sm:w-auto">
                                                <input
                                                    type="text"
                                                    value={dayData.startTime}
                                                    onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm w-full sm:w-32"
                                                    placeholder="09:00 AM"

                                                    readOnly
                                                />
                                                <span className="text-sm text-gray-500">to</span>
                                                <input
                                                    type="text"
                                                    value={dayData.endTime}
                                                    onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm w-full sm:w-32"
                                                    placeholder="05:00 PM"

                                                    readOnly
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            {/* Row 1: Logo URL and Favicon URL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Logo URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.branding.logoUrl}
                                            onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="https://example.com/logo.png"
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M17 8L12 3L7 8" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M12 3V15" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Favicon URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.branding.faviconUrl}
                                            onChange={(e) => handleBrandingChange('faviconUrl', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="https://example.com/favicon.ico"
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M17 8L12 3L7 8" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M12 3V15" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Primary Color and Secondary Color */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Primary Color
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <div
                                            className="w-12 h-5 border border-gray-300 flex-shrink-0"
                                            style={{ backgroundColor: formData.branding.primaryColor }}
                                        />
                                        <input
                                            type="text"
                                            value={formData.branding.primaryColor}
                                            onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="#3AD6F2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Secondary Color
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <div
                                            className="w-12 h-5 border border-gray-300 flex-shrink-0"
                                            style={{ backgroundColor: formData.branding.secondaryColor }}
                                        />
                                        <input
                                            type="text"
                                            value={formData.branding.secondaryColor}
                                            onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="#F56D2D"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Custom Domain */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Custom Domain (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.branding.customDomain}
                                    onChange={(e) => handleBrandingChange('customDomain', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="downtown.taxfirm.com"
                                />
                            </div>

                            {/* Row 4: White-Label Branding Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enable White-Label Branding
                                </label>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-gray-500 mb-0">
                                        Remove main firm branding and use office-specific branding only
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleBrandingChange('whiteLabelBranding', !formData.branding.whiteLabelBranding)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${formData.branding.whiteLabelBranding ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.branding.whiteLabelBranding ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Row 5: Letterhead Template and Digital Signature */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Letterhead Template */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Letterhead Template
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.branding.letterheadTemplate}
                                            onChange={(e) => handleBrandingChange('letterheadTemplate', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm bg-white"
                                            placeholder="Upload letterhead template"
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center bg-white flex-shrink-0"
                                            style={{ minWidth: '44px', borderRadius: '8px' }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14 2V6C14 6.53043 14.2107 7.03914 14.5858 7.41421C14.9609 7.78929 15.4696 8 16 8H20M10 9H8M16 13H8M16 17H8M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>

                                {/* Digital Signature */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Digital Signature
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.branding.digitalSignature}
                                            onChange={(e) => handleBrandingChange('digitalSignature', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm bg-white"
                                            placeholder="Upload signature image"
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center bg-white flex-shrink-0"
                                            style={{ minWidth: '44px', borderRadius: '8px' }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14.5 4H9.5L7 7H4C3.46957 7 2.96086 7.21071 2.58579 7.58579C2.21071 7.96086 2 8.46957 2 9V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V9C22 8.46957 21.7893 7.96086 21.4142 7.58579C21.0391 7.21071 20.5304 7 20 7H17L14.5 4Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M12 16C13.6569 16 15 14.6569 15 13C15 11.3431 13.6569 10 12 10C10.3431 10 9 11.3431 9 13C9 14.6569 10.3431 16 12 16Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            {/* Predefined Service Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Individual Tax Return
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="text"
                                                value={formData.servicePricing.individualTaxReturn}
                                                onChange={(e) => handleServicePricingChange('individualTaxReturn', e.target.value)}
                                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="250"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quarterly Bookkeeping
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="text"
                                                value={formData.servicePricing.quarterlyBookkeeping}
                                                onChange={(e) => handleServicePricingChange('quarterlyBookkeeping', e.target.value)}
                                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Business Tax Return
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="text"
                                                value={formData.servicePricing.businessTaxReturn}
                                                onChange={(e) => handleServicePricingChange('businessTaxReturn', e.target.value)}
                                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="750"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payroll Processing
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="text"
                                                value={formData.servicePricing.payrollProcessing}
                                                onChange={(e) => handleServicePricingChange('payrollProcessing', e.target.value)}
                                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                placeholder="150"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Service Rates */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-0">Custom Service Rates</p>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomService}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        style={{ borderRadius: '8px', fontSize: '14px' }}
                                    >
                                        Add Custom Rate
                                    </button>
                                </div>

                                {/* Custom Service Entries */}
                                {formData.customServices.length > 0 && (
                                    <div className="space-y-4">
                                        {formData.customServices.map((service) => (
                                            <div key={service.id} className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-500">
                                                    {service.name || 'Service name'}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={service.name}
                                                        onChange={(e) => handleCustomServiceChange(service.id, 'name', e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                        placeholder="Service name"
                                                    />
                                                    <div className="relative flex-shrink-0" style={{ width: '400px' }}>
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                        <input
                                                            type="text"
                                                            value={service.price}
                                                            onChange={(e) => handleCustomServiceChange(service.id, 'price', e.target.value)}
                                                            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCustomService(service.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M9 3L3 9M3 3L9 9" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            {/* EFIN Number and EFIN Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EFIN Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.compliance.efinNumber}
                                        onChange={(e) => handleComplianceChange('efinNumber', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EFIN Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.compliance.efinStatus}
                                            onChange={(e) => handleComplianceChange('efinStatus', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="Not Applied">Not Applied</option>
                                            <option value="Applied">Applied</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                        <svg
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Quarterly Bookkeeping and Payroll Processing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quarterly Bookkeeping
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                        <input
                                            type="text"
                                            value={formData.servicePricing.quarterlyBookkeeping}
                                            onChange={(e) => handleServicePricingChange('quarterlyBookkeeping', e.target.value)}
                                            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payroll Processing
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                        <input
                                            type="text"
                                            value={formData.servicePricing.payrollProcessing}
                                            onChange={(e) => handleServicePricingChange('payrollProcessing', e.target.value)}
                                            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="150"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Service Rates */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-0">Custom Service Rates</p>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomService}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        style={{ borderRadius: '8px', fontSize: '14px' }}
                                    >
                                        Add Custom Rate
                                    </button>
                                </div>

                                {/* Custom Service Entries */}
                                {formData.customServices.length > 0 && (
                                    <div className="space-y-4">
                                        {formData.customServices.map((service) => (
                                            <div key={service.id} className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-500">
                                                    {service.name || 'Service name'}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={service.name}
                                                        onChange={(e) => handleCustomServiceChange(service.id, 'name', e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                        placeholder="Service name"
                                                    />
                                                    <div className="relative flex-shrink-0" style={{ width: '400px' }}>
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                        <input
                                                            type="text"
                                                            value={service.price}
                                                            onChange={(e) => handleCustomServiceChange(service.id, 'price', e.target.value)}
                                                            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCustomService(service.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M9 3L3 9M3 3L9 9" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Refund Advance Products */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Refund Advance Products
                                </label>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500 mb-0">
                                        Enable refund advance loans
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleComplianceChange('refundAdvanceProducts', !formData.compliance.refundAdvanceProducts)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${formData.compliance.refundAdvanceProducts ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.compliance.refundAdvanceProducts ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Refund Transfer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Refund Transfer
                                </label>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500 mb-0">
                                        Enable refund transfer services
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleComplianceChange('refundTransfer', !formData.compliance.refundTransfer)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${formData.compliance.refundTransfer ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.compliance.refundTransfer ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* EFIN Number and EFIN Status (Bottom) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EFIN Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.compliance.efinNumber}
                                        onChange={(e) => handleComplianceChange('efinNumber', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        EFIN Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.compliance.efinStatus}
                                            onChange={(e) => handleComplianceChange('efinStatus', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="Not Applied">Not Applied</option>
                                            <option value="Applied">Applied</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                        <svg
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            {/* State Tax Preparer License and EA License Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State Tax Preparer License
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.compliance.stateTaxPreparerLicense}
                                        onChange={(e) => handleComplianceChange('stateTaxPreparerLicense', e.target.value)}
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
                                        value={formData.compliance.eaLicenseNumber}
                                        onChange={(e) => handleComplianceChange('eaLicenseNumber', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="EA License number"
                                    />
                                </div>
                            </div>

                            {/* CPA License Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CPA License Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.compliance.cpaLicenseNumber}
                                    onChange={(e) => handleComplianceChange('cpaLicenseNumber', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="CPA license number"
                                />
                            </div>

                            {/* E&O Policy Number and E&O Policy Expiry */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        E&O Policy Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.compliance.eoPolicyNumber}
                                        onChange={(e) => handleComplianceChange('eoPolicyNumber', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                        placeholder="Policy number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        E&O Policy Expiry
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.compliance.eoPolicyExpiry}
                                            onChange={(e) => handleComplianceChange('eoPolicyExpiry', e.target.value)}
                                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                            placeholder="dd/mm/yyyy"
                                        />
                                        <svg
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* General Liability Policy */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    General Liability Policy
                                </label>
                                <input
                                    type="text"
                                    value={formData.compliance.generalLiabilityPolicy}
                                    onChange={(e) => handleComplianceChange('generalLiabilityPolicy', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                    placeholder="Policy number"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 7 && (
                        <div className="space-y-6">
                            {/* Upload Signature and Upload Logo Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Upload Signature Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Upload Signature
                                    </label>

                                    {/* Tabs */}
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => handleSignatureTabChange('draw')}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${formData.signature.tab === 'draw'
                                                    ? 'bg-[#3AD6F2] text-white'
                                                    : 'bg-[#F3F7FF] text-gray-700 hover:bg-gray-200'
                                                }`}
                                            style={{ borderRadius: '8px', fontSize: '14px' }}
                                        >
                                            Draw
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSignatureTabChange('type')}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${formData.signature.tab === 'type'
                                                    ? 'bg-[#3AD6F2] text-white'
                                                    : 'bg-[#F3F7FF] text-gray-700 hover:bg-gray-200'
                                                }`}
                                            style={{ borderRadius: '8px', fontSize: '14px' }}
                                        >
                                            Type
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSignatureTabChange('upload')}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${formData.signature.tab === 'upload'
                                                    ? 'bg-[#3AD6F2] text-white'
                                                    : 'bg-[#F3F7FF] text-gray-700 hover:bg-gray-200'
                                                }`}
                                            style={{ borderRadius: '8px', fontSize: '14px' }}
                                        >
                                            Upload
                                        </button>
                                    </div>

                                    {/* Signature Canvas Area */}
                                    <div className=" rounded-lg bg-[#F3F7FF]" style={{ minHeight: '200px' }}>
                                        {formData.signature.tab === 'draw' && (
                                            <div className="p-4">
                                                {formData.signature.signatureImage ? (
                                                    <img
                                                        src={formData.signature.signatureImage}
                                                        alt="Signature"
                                                        className="w-full h-auto"
                                                        style={{ maxHeight: '180px' }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-48 text-gray-400 ">
                                                        <p className="text-sm">Draw your signature here</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {formData.signature.tab === 'type' && (
                                            <div className="p-4">
                                                <input
                                                    type="text"
                                                    placeholder="Type your signature"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                />
                                            </div>
                                        )}
                                        {formData.signature.tab === 'upload' && (
                                            <div className="p-4">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    signature: {
                                                                        ...prev.signature,
                                                                        signatureImage: reader.result
                                                                    }
                                                                }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Signature Action Buttons */}
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={handleClearSignature}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            style={{ borderRadius: '8px', fontSize: '14px' }}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors"
                                            style={{ borderRadius: '8px', fontSize: '14px' }}
                                        >
                                            Apply Signature
                                        </button>
                                    </div>
                                </div>

                                {/* Upload Logo Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Upload Logo
                                    </label>

                                    {/* Logo Upload Area */}
                                    <div
                                        className=" border-gray-300 rounded-lg bg-[#F3F7FF] p-8 text-center cursor-pointer"
                                        onClick={() => document.getElementById('logo-upload').click()}
                                    >
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        {formData.logo.preview ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={formData.logo.preview}
                                                    alt="Logo preview"
                                                    className="mx-auto max-h-32 object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            logo: { file: null, preview: null }
                                                        }));
                                                    }}
                                                    className="text-sm text-gray-600 hover:text-gray-800"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center">
                                                <svg className="text-gray-400" width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M9.91634 4.66667L6.99967 1.75L4.08301 4.66667" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M7 1.75V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>

                                                <p className="text-sm font-medium text-gray-700 mb-0">Upload Logo</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Office Compliance & Setup Checklist */}
                            <div>
                                <h5 className="text-lg font-semibold text-gray-900 mb-2">
                                    Office Compliance & Setup Checklist
                                </h5>
                                <p className="text-sm text-gray-600 mb-6">
                                    Complete all required steps to activate a new office.
                                </p>

                                {/* Checklist Items */}
                                <div className="space-y-4">
                                    {/* Profile */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border-2 border-[#3AD6F2] bg-[#3AD6F2] flex items-center justify-center flex-shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                Complete Custom Office Profile (Address, Phone, Hours, Timezone)
                                            </span>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                                            Required
                                        </span>
                                    </div>

                                    {/* Branding */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border-2 border-[#3AD6F2] bg-[#3AD6F2] flex items-center justify-center flex-shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                Upload Office Branding (Logos, Signatures)
                                            </span>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                                            Required
                                        </span>
                                    </div>

                                    {/* Pricing */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border-2 border-[#3AD6F2] bg-[#3AD6F2] flex items-center justify-center flex-shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                Define Office-Specific Pricing For Services
                                            </span>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                                            Required
                                        </span>
                                    </div>

                                    {/* Compliance - EFIN */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border-2 border-[#3AD6F2] bg-[#3AD6F2] flex items-center justify-center flex-shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                Verify EFIN Registration For This Office
                                            </span>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                                            Required
                                        </span>
                                    </div>

                                    {/* Compliance - Bank Products */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border-2 border-[#3AD6F2] bg-[#3AD6F2] flex items-center justify-center flex-shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                Confirm Bank Product Enrollment (Refund Transfers, Advances)
                                            </span>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                                            Required
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    {currentStep !== 7 && (
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${currentStep === 1
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            style={{ borderRadius: '8px' }}
                        >
                            Previous
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ borderRadius: '8px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleContinue}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors"
                        style={{ borderRadius: '8px' }}
                    >
                        {currentStep === 7 ? 'Add Office' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}

