import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Building2, CheckCircle2, Clock, ShieldCheck, X, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import './FirmSelectionModal.css';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

export default function FirmSelectionModal({ firms, onSelect, onClose, loginCategory }) {
    const navigate = useNavigate();
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
        <div className="firm-selection-container min-h-screen w-full flex items-center justify-center bg-gray-50/50 py-4 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="firm-selection-card bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-50 relative text-left">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <button
                            onClick={() => (onClose ? onClose() : navigate(-1))}
                            title="Go Back"
                            style={{
                                width: "52px",
                                height: "52px",
                                borderRadius: "50%",
                                border: "1px solid #E5E7EB",
                                backgroundColor: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#F9FAFB";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#ffffff";
                            }}
                        >
                            <ArrowLeft
                                style={{
                                    width: "26px",
                                    height: "26px",
                                    color: "#6B7280",
                                    transition: "transform 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateX(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateX(0)";
                                }}
                            />
                        </button>

                        <div className="p-2.5 sm:p-3 bg-gradient-to-br from-[#3AD6F2]/20 to-[#3AD6F2]/5 rounded-xl sm:rounded-2xl border border-[#3AD6F2]/10 shrink-0">
                            <Building2 className="text-[#3AD6F2] w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                {loginCategory === 'taxpayer' ? 'Select Your Tax Office' : 'Select Your Firm'}
                            </h1>
                            <p className="text-gray-500 font-light text-xs sm:text-sm mt-0.5 sm:mt-1">
                                {loginCategory === 'taxpayer'
                                    ? 'You are a client at multiple tax offices. Choose one to continue.'
                                    : 'You are a member of multiple firms. Please select one to continue.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {error}
                    </div>
                )}

                {/* Firm List */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[50vh] custom-scrollbar">
                    {firms && firms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {firms.map((firmData) => {
                                const isSelected = selectedMembership === firmData.membership_id;
                                return (
                                    <div
                                        key={firmData.membership_id}
                                        className={`
                                            group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                                            ${isSelected
                                                ? 'border-[#3AD6F2] bg-[#3AD6F2]/5 ring-4 ring-[#3AD6F2]/5 translate-y-[-2px]'
                                                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:translate-y-[-2px]'}
                                        `}
                                        onClick={() => setSelectedMembership(firmData.membership_id)}
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`p-2.5 rounded-xl transition-colors duration-300 ${isSelected ? 'bg-[#3AD6F2]/10' : 'bg-gray-50 group-hover:bg-white'}`}>
                                                <Building2 size={24} className={isSelected ? 'text-[#3AD6F2]' : 'text-gray-400'} />
                                            </div>
                                            <div className="flex items-center gap-2">
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

                                        <div className="text-xl font-bold text-gray-900 mb-4 line-clamp-1 group-hover:text-[#3AD6F2] transition-colors text-left pl-1">
                                            {firmData.firm.name}
                                        </div>

                                        <div className="space-y-4 pl-1">
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
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Building2 size={40} className="text-gray-200 mb-3" />
                            <p className="text-gray-500 font-semibold text-sm">
                                {loginCategory === 'taxpayer'
                                    ? 'No tax office memberships found for your taxpayer account.'
                                    : 'No firm memberships found for your account.'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">Please contact your administrator or try a different login type.</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 sm:p-6 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] sm:text-[15px] text-gray-400 font-medium flex items-center gap-2 text-center sm:text-left">
                        <ShieldCheck size={14} className="shrink-0 hidden sm:block" />
                        <span className="leading-tight">Selection determines your available permissions.</span>
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedMembership || loading}
                        style={{
                            borderRadius: '12px',
                            whiteSpace: 'nowrap'
                        }}
                        className={`
        w-full sm:w-auto relative flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 font-bold transition-all duration-300 text-sm shadow-md
        ${!selectedMembership || loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gradient-to-r from-[#3AD6F2] to-[#2BB1CC] text-white hover:shadow-xl hover:shadow-[#3AD6F2]/30 hover:-translate-y-0.5 active:translate-y-0 border border-[#3AD6F2]/20'}
    `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Processing...
                            </>
                        ) : (
                            <>
                                Continue to Dashboard
                                <ArrowRight size={18} />
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
    loginCategory: PropTypes.oneOf(['firm', 'taxpayer']),
};


