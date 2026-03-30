import React from 'react';
import { createPortal } from 'react-dom';

const PreviewModal = ({ template, onClose }) => {
    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#1F2A55]">Template Preview</h3>
                    <button onClick={onClose} className="text-[#7B8AB2] p-2 rounded-full transition-all">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-[#E8F0FF]">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#7B8AB2] mb-1">Subject</label>
                        <p className="text-sm font-semibold text-[#1F2A55]">{template.subject || 'No subject'}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#7B8AB2] mb-2 ml-1">Email Content</label>
                        <div
                            className="text-sm text-[#1F2A55] border border-[#E8F0FF] rounded-2xl p-6 bg-white shadow-inner min-h-[200px]"
                            dangerouslySetInnerHTML={{ __html: template.body_html || template.body || '<p>No content</p>' }}
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-[#1F2A55] text-white !rounded-[10px] font-bold text-sm transition-all active:scale-95"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PreviewModal;
