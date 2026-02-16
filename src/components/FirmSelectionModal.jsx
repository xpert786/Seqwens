import { useState } from 'react';
import PropTypes from 'prop-types';
import { Building2, CheckCircle2, Clock, ShieldCheck, X, ArrowRight, Loader2 } from 'lucide-react';
import './FirmSelectionModal.css';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

export default function FirmSelectionModal({ firms, onSelect, onClose }) {
    const [selectedMembership, setSelectedMembership] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selectedMembership) {
            setError('Please select a firm to continue');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await userAPI.selectFirm(selectedMembership);

            if (data.success) {
                // Update tokens
                const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);

                // Update storage
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);

                // Call onSelect callback
                onSelect(data.user);
            } else {
                setError(data.message || 'Failed to select firm');
            }
        } catch (err) {
            console.error('Error selecting firm:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'disabled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="firm-selection-container min-h-screen w-full flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="firm-selection-card bg-white w-full max-w-2xl rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 relative text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-[#3AD6F2]/10 rounded-2xl">
                            <Building2 className="text-[#3AD6F2]" size={32} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                        Select Your Firm
                    </div>
                    <p className="text-gray-500 font-light text-lg">
                        You are a member of multiple firms. Please select one to continue.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {error}
                    </div>
                )}

                {/* Firm List */}
                <div className="p-8 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {firms.map((firmData) => {
                            const isSelected = selectedMembership === firmData.membership_id;
                            return (
                                <div
                                    key={firmData.membership_id}
                                    className={`
                                        group relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                                        ${isSelected
                                            ? 'border-[#3AD6F2] bg-[#3AD6F2]/5 ring-4 ring-[#3AD6F2]/5 translate-y-[-2px]'
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:translate-y-[-2px]'}
                                    `}
                                    onClick={() => setSelectedMembership(firmData.membership_id)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2.5 rounded-xl transition-colors duration-300 ${isSelected ? 'bg-[#3AD6F2]/10' : 'bg-gray-50 group-hover:bg-white'}`}>
                                            <Building2 size={24} className={isSelected ? 'text-[#3AD6F2]' : 'text-gray-400'} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            {firmData.is_current && (
                                                <span className="flex items-center gap-1 px-2.5 py-1 bg-[#3AD6F2] text-white text-[10px] uppercase tracking-wider font-bold rounded-full shadow-sm shadow-[#3AD6F2]/20">
                                                    <CheckCircle2 size={10} />
                                                    Current
                                                </span>
                                            )}
                                            <span className={`px-2.5 py-1 border text-[10px] font-semibold rounded-full uppercase tracking-wider shadow-sm ${getStatusColor(firmData.status)}`}>
                                                {firmData.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xl font-bold text-gray-900 mb-4 line-clamp-1 group-hover:text-[#3AD6F2] transition-colors">
                                        {firmData.firm.name}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400 flex items-center gap-2">
                                                <ShieldCheck size={14} className="opacity-70" /> Role
                                            </span>
                                            <span className={`font-semibold bg-white border border-gray-100 px-2.5 py-1 rounded-lg ${isSelected ? 'text-[#3AD6F2]' : 'text-gray-700'}`}>
                                                {firmData.role_display}
                                            </span>
                                        </div>

                                        {firmData.last_active_at && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 flex items-center gap-2">
                                                    <Clock size={14} className="opacity-70" /> Last Active
                                                </span>
                                                <span className="text-gray-600 font-medium">
                                                    {formatDate(firmData.last_active_at)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-3 right-3 text-[#3AD6F2]">
                                            <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-gray-400 font-light flex items-center gap-2">
                        <ShieldCheck size={16} />
                        Selection determines your available permissions.
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedMembership || loading}
                        
                        className={`
                            w-full sm:w-auto relative flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-bold transition-all duration-300
                            ${!selectedMembership || loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-[#3AD6F2] text-white hover:bg-[#2BC5E0] hover:shadow-2xl hover:shadow-[#3AD6F2]/30 hover:-translate-y-1 active:translate-y-0'}
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            <>
                                Continue to Dashboard
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

FirmSelectionModal.propTypes = {
    firms: PropTypes.arrayOf(
        PropTypes.shape({
            membership_id: PropTypes.number.isRequired,
            firm: PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
                subdomain: PropTypes.string,
                status: PropTypes.string,
            }).isRequired,
            role: PropTypes.string.isRequired,
            role_display: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
            is_current: PropTypes.bool,
            last_active_at: PropTypes.string,
        })
    ).isRequired,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func,
};


