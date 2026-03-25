import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { firmAdminEmailTemplatesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import TabNavigation from '../Integrations/TabNavigation';
import AnalyticsView from './AnalyticsView';
import EmailSettingsView from './EmailSettingsView';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Pagination from '../../../ClientOnboarding/components/Pagination';

// Extracted Components & Utils
import {
    statusClasses,
    extractTemplatesFromResponse
} from './utils/emailTemplateUtils';
import {
    InboxIcon,
    PlusIcon
} from './Icons';

import TemplateFormModal from './modals/TemplateFormModal';
import TemplatesListView from './TemplatesListView';

export default function EmailTemplate() {
    const tabs = useMemo(
        () => ['Email Templates', 'Analytics', 'Email Settings'],
        []
    );
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editorTemplate, setEditorTemplate] = useState(null);
    const [showEditorModal, setShowEditorModal] = useState(false);

    // Fetch templates from API
    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await firmAdminEmailTemplatesAPI.listTemplates();
            setTemplates(extractTemplatesFromResponse(data));
        } catch (err) {
            setError(err.message);
            handleAPIError(err);
            toast.error(err.message || 'Failed to fetch email templates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'Email Templates') {
            fetchTemplates();
        }
    }, [activeTab, fetchTemplates]);

    // Handler functions
    const handleCreateTemplate = async (templateData) => {
        try {
            await firmAdminEmailTemplatesAPI.createTemplate(templateData);
            toast.success('Template created successfully');
            fetchTemplates();
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to create template');
            return false;
        }
    };

    const handleUpdateTemplate = async (templateId, updateData) => {
        try {
            await firmAdminEmailTemplatesAPI.updateTemplate(templateId, updateData);
            toast.success('Template updated successfully');
            fetchTemplates();
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to update template');
            return false;
        }
    };

    const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [deletingTemplate, setDeletingTemplate] = useState(false);

    const handleDeleteTemplate = async (templateId) => {
        setTemplateToDelete(templateId);
        setShowDeleteTemplateConfirm(true);
    };

    const confirmDeleteTemplate = async () => {
        if (!templateToDelete) return false;

        try {
            setDeletingTemplate(true);
            await firmAdminEmailTemplatesAPI.deleteTemplate(templateToDelete);
            toast.success('Template deleted successfully');
            fetchTemplates();
            setShowDeleteTemplateConfirm(false);
            setTemplateToDelete(null);
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to delete template');
            return false;
        } finally {
            setDeletingTemplate(false);
        }
    };

    const handleDuplicateTemplate = async (templateId, newName) => {
        try {
            await firmAdminEmailTemplatesAPI.duplicateTemplate(templateId, newName);
            toast.success('Template duplicated successfully');
            fetchTemplates();
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to duplicate template');
            return false;
        }
    };

    const handleSendEmail = async (templateId, emailData) => {
        try {
            await firmAdminEmailTemplatesAPI.sendTemplate(templateId, emailData);
            toast.success('Email sent successfully');
            return true;
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to send email');
            return false;
        }
    };

    const openEditor = (template = null) => {
        setEditorTemplate(template);
        setShowEditorModal(true);
    };

    const closeEditor = () => {
        setShowEditorModal(false);
        setEditorTemplate(null);
    };

    return (
        <>
            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto space-y-6">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h4 className="text-2xl font-semibold text-[#1F2A55]">
                                Email Templates
                            </h4>
                            <p className="mt-1 text-sm text-[#6E7DAE]">
                                Create and manage email templates for client communication
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => openEditor(null)}
                                className="inline-flex h-11 items-center justify-center gap-2 self-start !rounded-[10px] px-4 font-semibold text-white bg-[#3AD6F2] hover:bg-[#3AD6F2] transition-none"
                                style={{
                                    backgroundColor: 'var(--firm-primary-color)',
                                    color: 'white'
                                }}
                            >
                                <PlusIcon />

                                <span style={{ pointerEvents: 'none' }}>
                                    Create Template
                                </span>
                            </button>
                        </div>
                    </header>

                    <TabNavigation
                        className="w-fit bg-white p-1"
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        tabClassName="px-4 sm:px-6 py-2 text-xs sm:text-sm md:text-base font-medium text-[#1F2A55]"
                        activeTabClassName="bg-[#3AD6F2] text-white shadow"
                        inactiveTabClassName="text-[#4A5673]"
                    />

                    <section className="space-y-6">
                        {activeTab === 'Email Templates' && (
                            <TemplatesListView
                                templates={templates}
                                statusClasses={statusClasses}
                                loading={loading}
                                error={error}
                                onRefresh={fetchTemplates}
                                onDelete={handleDeleteTemplate}
                                onDuplicate={handleDuplicateTemplate}
                                onSend={handleSendEmail}
                                onGetTemplate={firmAdminEmailTemplatesAPI.getTemplate}
                                onRequestEdit={openEditor}
                            />
                        )}
                        {activeTab === 'Analytics' && <AnalyticsView />}
                        {activeTab === 'Email Settings' && <EmailSettingsView />}
                        {!['Email Templates', 'Analytics', 'Email Settings'].includes(activeTab) && (
                            <EmptyTabState tab={activeTab} />
                        )}
                    </section>
                </div>

                {/* Template Editor Modal */}
                {showEditorModal && (
                    <TemplateFormModal
                        template={editorTemplate}
                        onClose={closeEditor}
                        onRevert={() => {
                            fetchTemplates();
                            closeEditor();
                        }}
                        onSubmit={async (templatePayload) => {
                            if (editorTemplate?.id) {
                                const success = await handleUpdateTemplate(editorTemplate.id, templatePayload);
                                if (success) {
                                    closeEditor();
                                }
                                return success;
                            }
                            const success = await handleCreateTemplate(templatePayload);
                            if (success) {
                                closeEditor();
                            }
                            return success;
                        }}
                    />
                )}
            </div>

            {/* Delete Template Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteTemplateConfirm}
                onClose={() => {
                    if (!deletingTemplate) {
                        setShowDeleteTemplateConfirm(false);
                        setTemplateToDelete(null);
                    }
                }}
                onConfirm={confirmDeleteTemplate}
                title="Delete Template"
                message="Are you sure you want to delete this template?"
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={deletingTemplate}
                isDestructive={true}
            />
        </>
    );
}
const EmptyTabState = ({ tab }) => (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-[#6E7DAE]">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F6FD] text-[#3AD6F2]">
            <InboxIcon />
        </span>
        <div className="space-y-1">
            <p className="text-base font-semibold text-[#1F2A55]">
                {tab} coming soon
            </p>
            <p className="text-sm">
                We're still designing the experience here. Check back again later.
            </p>
        </div>
    </div>
);
