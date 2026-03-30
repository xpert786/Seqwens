import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import UnifiedEmailBuilder from '../../../Components/EmailBuilder/UnifiedEmailBuilder';
import { firmAdminEmailTemplatesAPI, firmAdminSettingsAPI, handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import {
    EMAIL_TEMPLATE_CATEGORIES,
    EMAIL_TEMPLATE_TYPES,
    EMAIL_TEMPLATE_TONES,
    ESSENTIAL_VARIABLES,
    convertPlainTextToHtml,
    getInitialFormState,
    VARIABLE_FIELD_LABELS
} from '../utils/emailTemplateUtils';

const TemplateFormModal = ({ template, onClose, onSubmit, onRevert }) => {
    const isEdit = Boolean(template?.id);
    const [formData, setFormData] = useState(getInitialFormState(template));
    const [lastFocusedField, setLastFocusedField] = useState('body_html');
    const [variables, setVariables] = useState([]);
    const [variablesLoading, setVariablesLoading] = useState(false);
    const [variablesError, setVariablesError] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [firmData, setFirmData] = useState(null);
    const [brandingData, setBrandingData] = useState(null);
    const [showRevertConfirm, setShowRevertConfirm] = useState(false);

    useEffect(() => {
        const fetchBrandingData = async () => {
            try {
                const response = await firmAdminSettingsAPI.getBrandingInfo();
                if (response.success) {
                    setBrandingData(response.data);
                }
                const firmResponse = await firmAdminSettingsAPI.getGeneralInfo();
                if (firmResponse.success) {
                    setFirmData(firmResponse.data);
                }
            } catch (error) {
                console.error('Failed to fetch branding data:', error);
            }
        };
        fetchBrandingData();
    }, []);

    useEffect(() => {
        setFormData(getInitialFormState(template));
        setLastFocusedField('body_html');
    }, [template]);

    const loadVariables = useCallback(async () => {
        if (!formData.email_type) {
            setVariables([]);
            return;
        }
        try {
            setVariablesLoading(true);
            const data = await firmAdminEmailTemplatesAPI.getVariables(formData.email_type);
            const fetchedVariables = data?.variables || [];
            const mergedVariables = [...fetchedVariables];
            ESSENTIAL_VARIABLES.forEach((essentialVar) => {
                const exists = mergedVariables.some(
                    (variable) =>
                        variable.key === essentialVar.key ||
                        variable.placeholder === essentialVar.placeholder
                );
                if (!exists) {
                    mergedVariables.push(essentialVar);
                }
            });
            setVariables(mergedVariables);
            setVariablesError('');
        } catch (err) {
            handleAPIError(err);
            setVariables(ESSENTIAL_VARIABLES);
            setVariablesError(err.message || 'Failed to fetch variables');
        } finally {
            setVariablesLoading(false);
        }
    }, [formData.email_type]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    const handleInsertVariable = (placeholder) => {
        if (!lastFocusedField) {
            toast.info('Select a field before inserting a variable');
            return;
        }
        setFormData((prev) => {
            const value = prev[lastFocusedField] || '';
            const needsSpacing = value && !value.endsWith(' ') ? ' ' : '';
            return {
                ...prev,
                [lastFocusedField]: `${value}${needsSpacing}${placeholder}`
            };
        });
    };

    const handleVariableDragStart = (event, placeholder) => {
        event.dataTransfer.setData('text/plain', placeholder);
        event.dataTransfer.effectAllowed = 'copy';
    };

    const handleFieldDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const handleFieldDrop = (event, field) => {
        event.preventDefault();
        const placeholder = event.dataTransfer.getData('text/plain');
        if (!placeholder) return;
        const target = event.target;
        const value = formData[field] || '';
        const start = target.selectionStart ?? value.length;
        const end = target.selectionEnd ?? value.length;
        const newValue = value.slice(0, start) + placeholder + value.slice(end);
        setFormData((prev) => ({
            ...prev,
            [field]: newValue
        }));
    };

    const handlePreview = async () => {
        if (!formData.subject.trim() || !formData.body_html.trim()) {
            toast.error('Subject and body are required for preview');
            return;
        }
        try {
            setPreviewLoading(true);
            const bodyContent = /<\/?[a-z][\s\S]*>/i.test(formData.body_html)
                ? formData.body_html
                : convertPlainTextToHtml(formData.body_html);
            const payload = {
                subject: formData.subject,
                header_content: formData.header_html || '',
                body_content: bodyContent || '',
                footer_content: formData.footer_html || '',
                email_type: formData.email_type
            };
            const data = await firmAdminEmailTemplatesAPI.previewTemplate(payload);
            setPreviewData(data);
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to generate preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Template name is required');
            return false;
        }
        if (!formData.subject.trim()) {
            toast.error('Subject is required');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        const payload = {
            name: formData.name.trim(),
            category: formData.category,
            email_type: formData.email_type,
            subject: formData.subject.trim(),
            tone: formData.tone,
            status: formData.status,
            is_active: !!formData.is_active
        };

        if (formData.description.trim()) payload.description = formData.description.trim();
        if (formData.header_html.trim()) payload.header_html = formData.header_html.trim();
        if (formData.body_html.trim()) {
            const rawBody = formData.body_html.trim();
            payload.body_html = /<\/?[a-z][\s\S]*>/i.test(rawBody) ? rawBody : convertPlainTextToHtml(rawBody);
        }
        if (formData.footer_html.trim()) payload.footer_html = formData.footer_html.trim();
        if (formData.body_text.trim()) payload.body_text = formData.body_text.trim();

        // Add new fields
        payload.editor_mode = formData.editor_mode;
        if (formData.editor_mode === 'visual' && formData.blocks_data) {
            payload.blocks_data = formData.blocks_data;
        }

        try {
            setSubmitting(true);
            const success = await onSubmit(payload);
            if (success) {
                setPreviewData(null);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevert = async () => {
        setShowRevertConfirm(true);
    };

    const confirmRevert = async () => {
        try {
            setSubmitting(true);
            setShowRevertConfirm(false);
            await firmAdminEmailTemplatesAPI.revertTemplate(template.id);
            toast.success('Template reverted to system default');
            if (onRevert) {
                onRevert();
            } else {
                onClose();
            }
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[75vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#1F2A55]">
                                {isEdit ? 'Edit Email Template' : 'Create Email Template'}
                            </h3>
                            <div className="mt-2 space-y-1">
                                <p className="text-sm text-[#6B7280]">
                                    ✨ <strong>No HTML knowledge required!</strong> Type your message naturally, and we'll handle the formatting.
                                </p>
                                <p className="text-xs text-[#94A3B8]">
                                    Use the variables on the right to personalize emails for each recipient
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-[#7B8AB2] p-2 rounded-full transition-all">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Top Level Fields */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-1.5">Template Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                    placeholder="Welcome Email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-1.5">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_CATEGORIES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-1.5">Email Type</label>
                                <select
                                    value={formData.email_type}
                                    onChange={(e) => setFormData({ ...formData, email_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_TYPES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-1.5">Tone</label>
                                <select
                                    value={formData.tone}
                                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                >
                                    {EMAIL_TEMPLATE_TONES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[#3B4A66] mb-1.5">Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                                    placeholder="Welcome to Firm Name!"
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="!flex items-center gap-2 text-sm text-[#1F2A55] mb-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="h-4 w-4 text-[#3AD6F2] border-[#C8D5FF] rounded focus:ring-[#3AD6F2]"
                                    />
                                    Set as Active Template
                                </label>
                            </div>
                        </div>

                        {/* The Visual/HTML Builder */}
                        <div className="border border-[#E8F0FF] rounded-xl overflow-hidden min-h-[600px] flex flex-col bg-white">
                            <UnifiedEmailBuilder
                                initialMode={formData.editor_mode}
                                initialBlocks={formData.blocks_data}
                                initialHTML={{
                                    header: formData.header_html,
                                    body: formData.body_html,
                                    footer: formData.footer_html
                                }}
                                firmData={firmData}
                                brandingData={brandingData}
                                onSave={(data) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        editor_mode: data.mode,
                                        blocks_data: data.blocks || prev.blocks_data,
                                        header_html: data.html?.header || prev.header_html,
                                        body_html: data.html?.body || prev.body_html,
                                        footer_html: data.html?.footer || prev.footer_html
                                    }));
                                }}
                                onModeChange={(mode) => setFormData(prev => ({ ...prev, editor_mode: mode }))}
                            />
                        </div>

                        {/* Optional Plain Text version */}
                        <div className='min-h-[200px] flex flex-col'>
                            <label className="block text-sm font-medium text-[#3B4A66] mb-1.5">Plain Text Version (Fallback)</label>
                            <textarea
                                value={formData.body_text}
                                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                                className="flex-1 w-full h-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] h-20 text-sm"
                                placeholder="Optional plain text version..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:justify-between">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handlePreview}
                                className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] !rounded-[10px] disabled:opacity-50"
                                disabled={previewLoading}
                            >
                                {previewLoading ? 'Generating preview...' : 'Preview'}
                            </button>
                        </div>
                        <div className="flex gap-3 sm:justify-end">
                            {isEdit && formData.email_type !== 'custom' && (
                                <button
                                    type="button"
                                    onClick={handleRevert}
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm text-[#F56D2D] bg-[#FFF5F2] border border-[#F56D2D] !rounded-[10px] disabled:opacity-50"
                                >
                                    Reset to Default
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-[#1F2A55] border border-[#E8F0FF] !rounded-[10px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                               className="px-4 py-2 text-sm !rounded-[10px] disabled:opacity-50 text-white bg-[#F56D2D] transition-none"
                                style={{
                                    color: 'white'
                                }}
                            >
                                <span style={{ pointerEvents: 'none' }}>
                                    {submitting ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
                                </span>
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {showRevertConfirm && (
                <div className="fixed inset-0 bg-[#1F2A55]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100000] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[#FFF5F2] text-[#F56D2D] rounded-full flex items-center justify-center mb-6">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-[#1F2A55] mb-2">Revert to Default?</h4>
                            <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
                                Are you sure you want to revert this template to system defaults? <br />
                                <strong className="text-[#F56D2D]">All your custom blocks and styling will be permanently lost.</strong>
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowRevertConfirm(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#1F2A55] bg-gray-50 hover:bg-gray-100 !rounded-[12px] transition-all"
                                >
                                    Keep Changes
                                </button>
                                <button
                                    onClick={confirmRevert}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#F56D2D] shadow-lg shadow-[#F56D2D]/20 !rounded-[12px] transition-all"
                                >
                                    Reset Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

export default TemplateFormModal;
