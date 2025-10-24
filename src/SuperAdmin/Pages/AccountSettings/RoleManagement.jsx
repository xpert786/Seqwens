import React, { useState } from "react";
import { EditActionIcon, TrashIcon1 } from "../../Components/icons";

export default function RoleManagement({ onShowModal }) {
    const [roles, setRoles] = useState([
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


    const handleEdit = (roleId) => {
        console.log("Edit role:", roleId);
    };

    const handleDelete = (roleId) => {
        console.log("Delete role:", roleId);
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
                            style={{borderRadius: "7px"}}
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

                    {/* Role Entries */}
                    {roles.map((role) => (
                        <div key={role.id} className="grid grid-cols-3 gap-4 py-4 px-2 border border-[#E8F0FF] rounded-lg bg-white">
                            {/* Role Name */}
                            <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro] text-left">
                                {role.name}
                            </div>
                            
                            {/* Privileges */}
                            <div className="text-sm text-[#3B4A66] font-semibold font-[BasisGrotesquePro] text-center">
                                {role.privileges}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-end q">
                                <button 
                                    onClick={() => handleEdit(role.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <EditActionIcon />
                                </button>
                                <button 
                                    onClick={() => handleDelete(role.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
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
