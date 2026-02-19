import React, { useState, useEffect } from 'react';
import { userAPI, handleAPIError } from "../../utils/apiUtils";
import { setTokens } from '../../utils/userUtils';
import { toast } from 'react-toastify';
import './Membership.css';

export default function Membership() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setLoading(true);
                const response = await userAPI.getAvailableContexts();
                if (response.success) {
                    let rolesData = [];
                    const data = response.data || {};

                    if (Array.isArray(data.all_roles)) {
                        rolesData = data.all_roles;
                    } else if (Array.isArray(data.roles)) {
                        rolesData = data.roles;
                    } else if (Array.isArray(response.data)) {
                        rolesData = response.data;
                    }

                    setRoles(rolesData);

                    const active = rolesData.find(r => r.is_active || r.is_current);
                    if (active) setSelectedRole(active.role);
                }
            } catch (err) {
                console.error('Error fetching roles:', err);
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    const handleSwitchRole = async () => {
        if (switching || !selectedRole) return;

        const activeRoleObj = roles.find(r => r.role === selectedRole);
        if (activeRoleObj && activeRoleObj.is_active) {
            toast.info("You are already in this role context.");
            return;
        }

        setSwitching(true);
        try {
            const data = await userAPI.selectRole(selectedRole);

            if (data.success) {
                const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);

                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);

                toast.success(`Switched to ${data.user.active_role} role successfully!`);

                const activeRole = data.user.active_role;
                if (activeRole === 'firm_admin' || activeRole === 'firm_staff') {
                    window.location.href = '/firm/dashboard';
                } else if (activeRole === 'taxpayer') {
                    window.location.href = '/taxpayer/dashboard';
                } else {
                    window.location.href = '/';
                }
            } else {
                toast.error(data.message || 'Failed to switch role');
            }
        } catch (err) {
            console.error('Error switching role:', err);
            toast.error(handleAPIError(err));
        } finally {
            setSwitching(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg p-8">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-4 bg-gray-100 rounded w-64 mb-10"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100"></div>
                        <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 md:p-8">
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-bold text-[#111827] font-[BasisGrotesquePro] mb-3">
                        Select Your Role
                    </h3>
                    <p className="text-base text-[#6B7280] font-[BasisGrotesquePro]">
                        You have multiple roles. Please select one to continue.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="membership-role-list grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {roles.map((role) => (
                        <div
                            key={role.role}
                            className={`membership-role-card ${selectedRole === role.role ? 'selected' : ''} ${switching ? 'switching' : ''}`}
                            onClick={() => !switching && setSelectedRole(role.role)}
                        >
                            <div className={`membership-role-card-content p-6 border-2 rounded-2xl transition-all cursor-pointer flex flex-col justify-center items-center min-h-[140px] text-center ${selectedRole === role.role ? 'border-[#3AD6F2] bg-[#F0FBFF] shadow-sm' : 'border-[#E5E7EB] hover:border-[#3AD6F2] hover:bg-gray-50'}`}>
                                <h4 className="text-xl font-semibold text-[#111827] font-[BasisGrotesquePro] mb-3">
                                    {role.display_name}
                                </h4>
                                <div className="flex gap-2">
                                    {role.is_primary && (
                                        <span className="px-3 py-1 bg-[#10B981] text-white text-[11px] rounded-full font-semibold uppercase tracking-wider">
                                            Primary
                                        </span>
                                    )}
                                    {role.is_active && (
                                        <span className="px-3 py-1 bg-[#3AD6F2] text-white text-[11px] rounded-full font-semibold uppercase tracking-wider">
                                            Current
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-12">
                    <button
                        onClick={handleSwitchRole}
                        disabled={switching || !selectedRole}
                        className="px-12 py-3 bg-[#3AD6F2] text-white rounded-xl font-bold text-lg hover:bg-[#2BC5E0] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3AD6F2]/20"
                        style={{ borderRadius: '8px' }}
                    >
                        {switching ? (
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Switching...
                            </div>
                        ) : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
