import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function Billing() {
    const [billingAddress, setBillingAddress] = useState({
        name: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'United States',
    });
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBillingData = async () => {
            setLoading(true);
            setError(null);
            try {
                // TODO: Replace with actual FirmAdmin API calls
                // const addressResponse = await firmAdminDashboardAPI.getBillingAddress();
                // if (addressResponse.success && addressResponse.data) {
                //     setBillingAddress(addressResponse.data);
                // }
                // const paymentResponse = await firmAdminDashboardAPI.getPaymentMethods();
                // if (paymentResponse.success && paymentResponse.data) {
                //     setPaymentMethods(paymentResponse.data.payment_methods || []);
                // }
            } catch (err) {
                console.error('Error fetching billing data:', err);
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };
        fetchBillingData();
    }, []);

    const handleAddressChange = (field, value) => {
        setBillingAddress(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveAddress = async () => {
        setSaving(true);
        setError(null);
        try {
            // TODO: Replace with actual FirmAdmin API call
            // await firmAdminDashboardAPI.updateBillingAddress(billingAddress);
            toast.success("Billing address updated successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Billing Address
                        </h3>
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            Update your billing address for invoices and payments
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Full Name / Company Name
                            </label>
                            <input
                                type="text"
                                value={billingAddress.name}
                                onChange={(e) => handleAddressChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter name or company name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={billingAddress.street_address}
                                onChange={(e) => handleAddressChange('street_address', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter street address"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={billingAddress.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                    placeholder="Enter city"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                    State
                                </label>
                                <input
                                    type="text"
                                    value={billingAddress.state}
                                    onChange={(e) => handleAddressChange('state', e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                    placeholder="Enter state"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                    ZIP Code
                                </label>
                                <input
                                    type="text"
                                    value={billingAddress.zip_code}
                                    onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                    placeholder="Enter ZIP code"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value={billingAddress.country}
                                    onChange={(e) => handleAddressChange('country', e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                    placeholder="Enter country"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
                            <button
                                onClick={handleSaveAddress}
                                disabled={saving}
                                className="px-6 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC5E0] transition font-[BasisGrotesquePro] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Address'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Payment Methods
                        </h3>
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            Manage your payment methods for subscriptions and invoices
                        </p>
                    </div>

                    {paymentMethods.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mb-4">
                                No payment methods added yet
                            </p>
                            <button className="px-4 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC5E0] transition font-[BasisGrotesquePro] text-sm">
                                Add Payment Method
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paymentMethods.map((method, index) => (
                                <div key={index} className="p-4 border border-[#E5E7EB] rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                                {method.brand} •••• {method.last4}
                                            </p>
                                            <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                                Expires {method.expiry}
                                            </p>
                                        </div>
                                        {method.isPrimary && (
                                            <span className="px-2 py-1 bg-[#3AD6F2] text-white text-xs rounded font-[BasisGrotesquePro]">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

