import React, { useState, useEffect } from "react";
import { EditActionIcon, TrashIcon1 } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import { superToastOptions } from "../../utils/toastConfig";

export default function RoleManagement({ onShowModal }) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRole, setEditingRole] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Fetch roles from API
    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getRoles();

            if (response.success && response.data) {
                setRoles(response.data.roles || response.data || []);
            } else {
                // Fallback to default roles if API doesn't return data
                setRoles([
                    {
                        id: 1,
                        name: "Super Admin",
                        privileges: "Full Control"
                    },
                    {
                        id: 2,
                        name: "Support Admin",
                        privileges: "Limited Access"
                    },
                    {
                        id: 3,
                        name: "Billing Admin",
                        privileges: "Subscription Control"
                    }
                ]);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError(handleAPIError(err));
            // Fallback to default roles on error
            setRoles([
                {
                    id: 1,
                    name: "Super Admin",
                    privileges: "Full Control"
                },
                {
                    id: 2,
                    name: "Support Admin",
                    privileges: "Limited Access"
                },
                {
                    id: 3,
                    name: "Billing Admin",
                    privileges: "Subscription Control"
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
            setEditingRole(role);
            // Open edit modal (you can enhance this with a proper edit modal)
            console.log("Edit role:", role);
            toast.info('Edit role functionality - implement edit modal', superToastOptions);
        }
    };

    const handleDelete = async (roleId) => {
        if (!deleteConfirm || deleteConfirm !== roleId) {
            setDeleteConfirm(roleId);
            return;
        }

        try {
            const response = await superAdminAPI.deleteRole(roleId);

            if (response.success) {
                toast.success('Role deleted successfully', superToastOptions);
                setRoles(roles.filter(r => r.id !== roleId));
                setDeleteConfirm(null);
            } else {
                throw new Error(response.message || 'Failed to delete role');
            }
        } catch (err) {
            console.error('Error deleting role:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg, superToastOptions);
            setDeleteConfirm(null);
        }
    };

    const handleAddUser = () => {
        if (onShowModal) {
            onShowModal();
        }
    };


    return (
        <>
            <div className="mb-9 p-4 bg-white rounded-lg">
                {/* Header Section */}
                <div className="mb-6">
                    <h3 className="text-[#3B4A66] text- xl font-semibold font-[BasisGrotesquePro] mb-2">
                        Role Management
                    </h3>
                    <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro] mb-4">
                        Manage role names, privileges, and save as templates.
                    </p>

                    {/* Add User Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleAddUser}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium font-[BasisGrotesquePro] hover:bg-orange-600 transition-colors flex items-center gap-2"
                            style={{ borderRadius: "7px" }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add User
                        </button>
                    </div>
                </div>

                {/* Role List */}
                <div className="space-y-2">
                    {/* Header Row */}
                    <div className="grid grid-cols-3 gap-4  px-2  rounded-lg">
                        <div className="text-md font-thin text-[#3B4A66] font-[BasisGrotesquePro] text-left">
                            Role Name
                        </div>
                        <div className="text-md font-thin text-[#3B4A66] font-[BasisGrotesquePro] text-center">
                            Privileges
                        </div>
                        <div className="text-md font-thin text-[#3B4A66] font-[BasisGrotesquePro] text-right">
                            Actions
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading roles...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-700 font-[BasisGrotesquePro]">{error}</p>
                            <button
                                onClick={fetchRoles}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Role Entries */}
                    {!loading && roles.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No roles found</p>
                        </div>
                    )}

                    {!loading && roles.map((role) => (
                        <div key={role.id} className="grid grid-cols-3 gap-4 py-4 px-2 border border-[#E8F0FF] rounded-lg bg-white">
                            {/* Role Name */}
                            <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro] text-left">
                                {role.name || role.role_name}
                            </div>

                            {/* Privileges */}
                            <div className="text-sm text-[#3B4A66] font-semibold font-[BasisGrotesquePro] text-center">
                                {role.privileges || (Array.isArray(role.permissions) ? role.permissions.join(', ') : 'N/A')}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(role.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                                    title="Edit role"
                                >
                                    <EditActionIcon />
                                </button>
                                <button
                                    onClick={() => handleDelete(role.id)}
                                    className={`w-8 h-8 flex items-center justify-center transition-colors ${deleteConfirm === role.id
                                        ? 'text-red-600 hover:text-red-800'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    title={deleteConfirm === role.id ? 'Click again to confirm' : 'Delete role'}
                                >
                                    <TrashIcon1 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </>
    );
}
