import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Pagination from '../../../ClientOnboarding/components/Pagination';
import { transformTemplateData } from './utils/emailTemplateUtils';
import {
    EyeIcon,
    EditIcon,
    BoxedEditIcon,
    DuplicateIcon,
    BoxedSendIcon,
    SendIcon,
    TrashIcon
} from './Icons';
import DuplicateModal from './modals/DuplicateModal';
import SendEmailModal from './modals/SendEmailModal';
import PreviewModal from './modals/PreviewModal';

const IconButton = ({ children, ariaLabel, onClick }) => (
    <button
        aria-label={ariaLabel}
        onClick={onClick}
        className=" text-[#4254A0] transition hover:bg-white hover:text-[#1F2A55]"
    >
        {children}
    </button>
);

const InfoStack = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7B8AB2]">
            {label}
        </p>
        <p className="mt-2 text-sm text-[#3D4C70]">{value}</p>
    </div>
);

const TemplatesListView = ({
    templates,
    statusClasses,
    loading,
    error,
    onRefresh,
    onDelete,
    onDuplicate,
    onSend,
    onGetTemplate,
    onRequestEdit
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const transformedTemplates = templates.map(transformTemplateData);

    // Pagination calculations
    const totalItems = transformedTemplates.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedTemplates = transformedTemplates.slice(startIndex, endIndex);

    // Reset to page 1 when templates change
    useEffect(() => {
        setCurrentPage(1);
    }, [templates.length]);

    const handlePreview = async (template) => {
        try {
            const fullTemplate = await onGetTemplate(template.id);
            setSelectedTemplate(fullTemplate);
            setShowPreviewModal(true);
        } catch (err) {
            toast.error('Failed to load template details');
        }
    };

    const handleEdit = async (template) => {
        try {
            const fullTemplate = await onGetTemplate(template.id);
            onRequestEdit?.(fullTemplate);
        } catch (err) {
            toast.error('Failed to load template details');
        }
    };

    const handleDelete = async (template) => {
        await onDelete(template.id);
    };

    const handleDuplicate = (template) => {
        setSelectedTemplate(template);
        setShowDuplicateModal(true);
    };

    const handleSend = async (template) => {
        try {
            const fullTemplate = await onGetTemplate(template.id);
            setSelectedTemplate(fullTemplate);
            setShowSendModal(true);
        } catch (err) {
            toast.error('Failed to load template details');
        }
    };

    const handleDuplicateSubmit = async (newName) => {
        if (!newName || !newName.trim()) {
            toast.error('Please enter a name for the duplicate');
            return;
        }
        const success = await onDuplicate(selectedTemplate.id, newName.trim());
        if (success) {
            setShowDuplicateModal(false);
            setSelectedTemplate(null);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF] p-8 text-center">
                <p className="text-[#7B8AB2]">Loading templates...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF] p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={onRefresh}
                    className="px-6 py-2 bg-[#3AD6F2] text-white !rounded-[10px] hover:bg-[#2BC4E0] shadow-md transition-all font-semibold"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#E8F0FF]">
                <div className="border-b border-[#E8F0FF] px-5 py-5 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-[#1F2A55]">Email Templates</h3>
                        <p className="mt-1 text-sm text-[#7B8AB2]">Manage your email templates and their usage</p>
                    </div>
                </div>

                <div className="hidden xl:grid grid-cols-[2.4fr_1.2fr_2.2fr_1fr_1.1fr_1fr_auto] items-center gap-4 px-5 py-3 text-xs font-semibold tracking-wide text-[#4B5563] sm:px-6 lg:px-8 bg-gray-50/50">
                    <span>Template</span>
                    <span>Category</span>
                    <span>Subject</span>
                    <span>Usage</span>
                    <span>Last Used</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                </div>
                {transformedTemplates.length === 0 ? (
                    <div className="p-8 text-center text-[#7B8AB2]">
                        <p>No templates found. Create your first template to get started.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden xl:block">
                            {paginatedTemplates.map((template, index) => (
                                <div
                                    key={template.id}
                                    className={`grid grid-cols-[2.4fr_1.2fr_2.2fr_1fr_1.1fr_1fr_auto] items-center gap-4 px-5 py-4 sm:px-6 lg:px-8 text-xs ${index !== 0 ? 'border-t border-[#E8F0FF]' : ''}`}
                                >
                                    <div className="flex flex-col justify-center min-h-[40px]">
                                        <p className="font-semibold text-[#1F2A55] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{template.title}</p>
                                        {template.description && (
                                            <p className="mt-1 text-[10px] font-medium text-[#7B8AB2] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center !rounded-full border border-[#C8D5FF] bg-white text-[#32406B]">
                                            {React.createElement(template.category.icon, { className: 'h-3 w-3' })}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-[2px] text-[10px] font-semibold !rounded-full ${template.category.pill}`}
                                        >
                                            <span>{template.category.label}</span>
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-[#3D4C70] whitespace-nowrap overflow-hidden text-ellipsis">{template.subject}</p>
                                    <p className="font-medium text-[#1F2A55]">{template.usage}</p>
                                    <p className="text-[#3D4C70] font-medium">{template.lastUsed}</p>
                                    <span
                                        className={`inline-flex items-center justify-center !rounded-full px-2 py-[2px] text-[10px] font-medium leading-tight ${statusClasses[template.status.variant] || statusClasses.archived}`}
                                    >
                                        {template.status.label}
                                    </span>
                                    <div className="flex items-center justify-end gap-2 text-[#5061A4]">
                                        <IconButton ariaLabel="Preview template" onClick={() => handlePreview(template)}>
                                            <EyeIcon />
                                        </IconButton>
                                        <IconButton ariaLabel="Edit template" onClick={() => handleEdit(template)}>
                                            <BoxedEditIcon />
                                        </IconButton>
                                        <IconButton ariaLabel="Duplicate template" onClick={() => handleDuplicate(template)}>
                                            <DuplicateIcon />
                                        </IconButton>
                                        <IconButton ariaLabel="Send template" onClick={() => handleSend(template)}>
                                            <BoxedSendIcon />
                                        </IconButton>
                                        <IconButton ariaLabel="Delete template" onClick={() => handleDelete(template)}>
                                            <TrashIcon />
                                        </IconButton>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="divide-y divide-[#E8F0FF] xl:hidden">
                            {paginatedTemplates.map((template) => (
                                <div key={template.id} className="space-y-4 px-5 py-6 sm:px-6">
                                    <div className="space-y-2">
                                        <div>
                                            <p className="font-semibold text-[#1F2A55]">{template.title}</p>
                                            <p className="text-xs text-[#7B8AB2]">{template.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center !rounded-full !border border-[#F56D2D] bg-white text-[#32406B]">
                                                {React.createElement(template.category.icon, { className: 'h-4 w-4' })}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[12px] font-semibold ${template.category.pill}`}
                                            >
                                                <span>{template.category.label}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                        <InfoStack label="Subject" value={template.subject} />
                                        <InfoStack label="Usage" value={template.usage} />
                                        <InfoStack label="Last Used" value={template.lastUsed} />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#7B8AB2]">Status</p>
                                            <span
                                                className={`mt-2 inline-flex items-center justify-center rounded-full px-2 py-[6px] text-[11px] font-medium leading-tight ${statusClasses[template.status.variant] || statusClasses.archived}`}
                                            >
                                                {template.status.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#E8F0FF] pt-4">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#7B8AB2]">Actions</span>
                                        <div className="flex items-center gap-2 text-[#5061A4]">
                                            <IconButton ariaLabel="Preview template" onClick={() => handlePreview(template)}>
                                                <EyeIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Edit template" onClick={() => handleEdit(template)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Duplicate template" onClick={() => handleDuplicate(template)}>
                                                <DuplicateIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Send template" onClick={() => handleSend(template)}>
                                                <SendIcon />
                                            </IconButton>
                                            <IconButton ariaLabel="Delete template" onClick={() => handleDelete(template)}>
                                                <TrashIcon />
                                            </IconButton>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-5 py-4 sm:px-6 lg:px-8 border-t border-[#E8F0FF]">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    startIndex={startIndex}
                                    endIndex={endIndex}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Duplicate Modal */}
                {showDuplicateModal && (
                    <DuplicateModal
                        template={selectedTemplate}
                        onClose={() => {
                            setShowDuplicateModal(false);
                            setSelectedTemplate(null);
                        }}
                        onSubmit={handleDuplicateSubmit}
                    />
                )}

                {/* Send Email Modal */}
                {showSendModal && selectedTemplate && (
                    <SendEmailModal
                        template={selectedTemplate}
                        onClose={() => {
                            setShowSendModal(false);
                            setSelectedTemplate(null);
                        }}
                        onSend={async (emailData) => {
                            const success = await onSend(selectedTemplate.id, emailData);
                            if (success) {
                                setShowSendModal(false);
                                setSelectedTemplate(null);
                            }
                        }}
                    />
                )}

                {/* Preview Modal */}
                {showPreviewModal && selectedTemplate && (
                    <PreviewModal
                        template={selectedTemplate}
                        onClose={() => {
                            setShowPreviewModal(false);
                            setSelectedTemplate(null);
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default TemplatesListView;
