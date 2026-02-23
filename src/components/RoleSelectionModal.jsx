import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Building2, User, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Users, Briefcase } from 'lucide-react';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

// ─── Role classification helpers ─────────────────────────────────────────────

function getRoleCategory(roleValue) {
    if (!roleValue) return 'other';
    const lower = roleValue.toLowerCase();
    if (
        lower === 'firm' || lower === 'admin' || lower === 'firmadmin' ||
        lower === 'staff' || lower === 'tax_preparer' || lower === 'team_member' ||
        lower === 'accountant' || lower === 'bookkeeper' || lower === 'assistant' ||
        lower === 'preparer'
    ) return 'firm';
    if (lower === 'client' || lower === 'taxpayer') return 'taxpayer';
    return 'other';
}

const FIRM_ROLE_DISPLAY = {
    firm: 'Firm Admin',
    admin: 'Firm Admin',
    firmadmin: 'Firm Admin',
    staff: 'Tax Preparer',
    tax_preparer: 'Tax Preparer',
    team_member: 'Team Member',
    accountant: 'Accountant',
    bookkeeper: 'Bookkeeper',
    assistant: 'Assistant',
    preparer: 'Tax Preparer',
};

const TAXPAYER_ROLE_DISPLAY = {
    client: 'Taxpayer / Client',
    taxpayer: 'Taxpayer / Client',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoleSelectionModal({ roles, allFirms, onSelect, onClose }) {
    // Group roles by category
    const { firmRoles, taxpayerRoles } = useMemo(() => {
        const firm = [];
        const taxpayer = [];
        roles.forEach(role => {
            const cat = getRoleCategory(role.role);
            if (cat === 'firm') firm.push(role);
            else if (cat === 'taxpayer') taxpayer.push(role);
        });
        return { firmRoles: firm, taxpayerRoles: taxpayer };
    }, [roles]);

    // Phase 1: pick login type (firm | taxpayer)
    const [loginType, setLoginType] = useState(null); // null | 'firm' | 'taxpayer'

    // Phase 2: pick the specific role within the chosen type
    const [selectedRole, setSelectedRole] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // What roles are shown in the second phase
    const rolesForType = loginType === 'firm' ? firmRoles : loginType === 'taxpayer' ? taxpayerRoles : [];

    const submitRole = async (roleToSubmit, type) => {
        if (!roleToSubmit) {
            setError('Please select an account to continue');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await userAPI.selectRole(roleToSubmit);

            if (data.success) {
                const rememberMe =
                    localStorage.getItem('rememberMe') === 'true' ||
                    sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);

                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);

                // Pass the login category back so SelectContext can filter firms
                onSelect(data.user, type);
            } else {
                setError(data.message || 'Failed to select role');
            }
        } catch (err) {
            console.error('Error selecting role:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginTypeSelect = (type) => {
        setError(null);
        const list = type === 'firm' ? firmRoles : taxpayerRoles;

        if (list.length === 1) {
            // Auto-submit if there's only one role, bypassing the redundant selection step
            submitRole(list[0].role, type);
        } else {
            setLoginType(type);
            setSelectedRole(null);
        }
    };

    const handleSubmit = () => {
        submitRole(selectedRole, loginType);
    };

    // Count how many firms are relevant per category (for the info hint)
    const firmCount = allFirms
        ? allFirms.filter(f => getRoleCategory(f.role) === 'firm').length
        : null;
    const taxpayerCount = allFirms
        ? allFirms.filter(f => getRoleCategory(f.role) === 'taxpayer').length
        : null;

    return (
        <div className="firm-selection-container min-h-screen w-full flex items-center justify-center bg-gray-50/50 py-4 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-50">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2.5 sm:p-3 bg-gradient-to-br from-[#3AD6F2]/20 to-[#3AD6F2]/5 rounded-xl sm:rounded-2xl border border-[#3AD6F2]/10 shrink-0">
                            <ShieldCheck className="text-[#3AD6F2] w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex flex-col">
                            {loginType ? (
                                <>
                                    <button
                                        onClick={() => { setLoginType(null); setSelectedRole(null); setError(null); }}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mb-1 transition-colors w-fit"
                                        id="back-to-login-type"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back to login type
                                    </button>
                                    <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                        {loginType === 'firm' ? 'Select Your Firm Role' : 'Select Your Taxpayer Role'}
                                    </h1>
                                    <p className="text-gray-500 font-light text-xs sm:text-sm mt-0.5 sm:mt-1">
                                        {loginType === 'firm'
                                            ? 'Choose the role you want to access.'
                                            : 'Confirm your taxpayer role to continue.'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                        How are you logging in?
                                    </h1>
                                    <p className="text-gray-500 font-light text-xs sm:text-sm mt-0.5 sm:mt-1">
                                        You have multiple accounts. Please select the type to continue.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[50vh] custom-scrollbar">

                    {/* ── Phase 1: Pick login type ── */}
                    {!loginType && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Firm card */}
                            {firmRoles.length > 0 && (
                                <button
                                    id="login-type-firm"
                                    onClick={() => handleLoginTypeSelect('firm')}
                                    className="group relative p-5 rounded-2xl border-2 border-gray-100 bg-white hover:border-[#3AD6F2] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left w-full"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-[#3AD6F2]/10 transition-colors">
                                            <Building2 className="text-blue-500 group-hover:text-[#3AD6F2] w-6 h-6 transition-colors" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-base">Firm</div>
                                            <div className="text-gray-400 text-xs">Administrator or team member</div>
                                        </div>
                                        <ArrowRight className="ml-auto text-gray-300 group-hover:text-[#3AD6F2] w-4 h-4 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {firmRoles.slice(0, 3).map(r => (
                                            <span
                                                key={r.role}
                                                className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-100"
                                            >
                                                {FIRM_ROLE_DISPLAY[r.role.toLowerCase()] || r.display_name}
                                            </span>
                                        ))}
                                        {firmRoles.length > 3 && (
                                            <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                                +{firmRoles.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                    {firmCount != null && firmCount > 0 && (
                                        <p className="text-[10px] text-gray-400 mt-3">
                                            {firmCount} firm {firmCount === 1 ? 'membership' : 'memberships'} available
                                        </p>
                                    )}
                                </button>
                            )}

                            {/* Taxpayer card */}
                            {taxpayerRoles.length > 0 && (
                                <button
                                    id="login-type-taxpayer"
                                    onClick={() => handleLoginTypeSelect('taxpayer')}
                                    className="group relative p-5 rounded-2xl border-2 border-gray-100 bg-white hover:border-[#F56D2D] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left w-full"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 bg-orange-50 rounded-xl group-hover:bg-[#F56D2D]/10 transition-colors">
                                            <User className="text-orange-400 group-hover:text-[#F56D2D] w-6 h-6 transition-colors" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-base">Taxpayer / Client</div>
                                            <div className="text-gray-400 text-xs">Personal tax filing account</div>
                                        </div>
                                        <ArrowRight className="ml-auto text-gray-300 group-hover:text-[#F56D2D] w-4 h-4 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="bg-orange-50 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-100">
                                            Taxpayer / Client
                                        </span>
                                    </div>
                                    {taxpayerCount != null && taxpayerCount > 0 && (
                                        <p className="text-[10px] text-gray-400 mt-3">
                                            {taxpayerCount} tax {taxpayerCount === 1 ? 'office' : 'offices'} available
                                        </p>
                                    )}
                                </button>
                            )}

                            {/* Fallback: if only "other" roles, show them all */}
                            {firmRoles.length === 0 && taxpayerRoles.length === 0 && (
                                <div className="col-span-2">
                                    <div className="grid grid-cols-1 gap-3">
                                        {roles.map(role => (
                                            <div
                                                key={role.role}
                                                className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedRole === role.role ? 'border-[#3AD6F2] bg-[#3AD6F2]/5' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
                                                onClick={() => setSelectedRole(role.role)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{role.display_name}</div>
                                                        {role.is_primary && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Primary</span>}
                                                    </div>
                                                    {selectedRole === role.role && <CheckCircle2 size={18} className="text-[#3AD6F2]" fill="currentColor" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Phase 2: Pick specific role within login type ── */}
                    {loginType && rolesForType.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            {rolesForType.map(role => {
                                const isSelected = selectedRole === role.role;
                                const accentColor = loginType === 'firm' ? '#3AD6F2' : '#F56D2D';
                                return (
                                    <div
                                        key={role.role}
                                        id={`select-role-${role.role}`}
                                        className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${isSelected
                                            ? 'shadow-md -translate-y-0.5'
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5'
                                            }`}
                                        style={isSelected
                                            ? { borderColor: accentColor, backgroundColor: `${accentColor}08` }
                                            : {}
                                        }
                                        onClick={() => setSelectedRole(role.role)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-2 rounded-xl transition-colors"
                                                style={isSelected
                                                    ? { backgroundColor: `${accentColor}1A` }
                                                    : { backgroundColor: '#F9FAFB' }
                                                }
                                            >
                                                {loginType === 'firm'
                                                    ? <Briefcase size={18} style={{ color: isSelected ? accentColor : '#9CA3AF' }} />
                                                    : <Users size={18} style={{ color: isSelected ? accentColor : '#9CA3AF' }} />
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800 text-sm">
                                                    {loginType === 'firm'
                                                        ? (FIRM_ROLE_DISPLAY[role.role.toLowerCase()] || role.display_name)
                                                        : (TAXPAYER_ROLE_DISPLAY[role.role.toLowerCase()] || role.display_name)
                                                    }
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {role.is_primary && (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">
                                                            Primary
                                                        </span>
                                                    )}
                                                    {role.is_active && (
                                                        <span
                                                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                                                            style={{ backgroundColor: `${accentColor}1A`, color: accentColor, borderColor: `${accentColor}30` }}
                                                        >
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 size={18} fill="currentColor" style={{ color: accentColor }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {loginType && (
                    <div className="p-4 sm:p-6 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[13px] sm:text-[15px] text-gray-400 font-medium flex items-center gap-2 text-center sm:text-left">
                            <ShieldCheck size={14} className="shrink-0 hidden sm:block" />
                            <span className="leading-tight">Selection determines your available permissions.</span>
                        </p>
                        <button
                            id="continue-role-selection"
                            onClick={handleSubmit}
                            disabled={!selectedRole || loading}
                            style={{ borderRadius: '12px', whiteSpace: 'nowrap' }}
                            className={`w-full sm:w-auto relative flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 font-bold transition-all duration-300 text-sm shadow-md
                                ${!selectedRole || loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : loginType === 'firm'
                                        ? 'bg-gradient-to-r from-[#3AD6F2] to-[#2BB1CC] text-white hover:shadow-xl hover:shadow-[#3AD6F2]/30 hover:-translate-y-0.5 border border-[#3AD6F2]/20'
                                        : 'bg-gradient-to-r from-[#F56D2D] to-[#E05A20] text-white hover:shadow-xl hover:shadow-[#F56D2D]/30 hover:-translate-y-0.5 border border-[#F56D2D]/20'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

RoleSelectionModal.propTypes = {
    roles: PropTypes.arrayOf(
        PropTypes.shape({
            role: PropTypes.string.isRequired,
            display_name: PropTypes.string.isRequired,
            is_primary: PropTypes.bool,
            is_active: PropTypes.bool,
        })
    ).isRequired,
    allFirms: PropTypes.array,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func,
};
