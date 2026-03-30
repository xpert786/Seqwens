import React, { useState } from 'react';

const DuplicateModal = ({ template, onClose, onSubmit }) => {
    const [newName, setNewName] = useState(template?.name ? `${template.name} (Copy)` : '');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-[#1F2A55] mb-4">Duplicate Template</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-[#3B4A66] mb-2">New Template Name</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                        placeholder="Enter template name"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] !rounded-[10px]" >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(newName)}
                       className="px-4 py-2 text-sm bg-[#F56D2D] text-white !rounded-[10px] hover:bg-[#E55A1D]"
                    >
                        Duplicate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateModal;
