import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { firmAdminEmailTemplatesAPI, firmAdminSettingsAPI, firmAdminClientsAPI, handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { SendIcon } from '../Icons';

const SendEmailModal = ({ template, onClose, onSend }) => {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [variables, setVariables] = useState({});
    const [variablesInput, setVariablesInput] = useState('{}');
    const [variablesError, setVariablesError] = useState('');
    const [availableVariables, setAvailableVariables] = useState([]);
    const [variablesLoading, setVariablesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);

    // Client search states
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [isSearchingClients, setIsSearchingClients] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    const loadVariables = useCallback(async () => {
        if (!template?.email_type) {
            setAvailableVariables([]);
            return;
        }
        try {
            setVariablesLoading(true);
            const data = await firmAdminEmailTemplatesAPI.getVariables(template.email_type);
            setAvailableVariables(data?.variables || []);
        } catch (err) {
            handleAPIError(err);
            toast.error(err.message || 'Failed to load template variables');
        } finally {
            setVariablesLoading(false);
        }
    }, [template?.email_type]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    useEffect(() => {
        if (isAdvancedMode) {
            setVariablesInput(JSON.stringify(variables, null, 2));
        }
    }, [variables, isAdvancedMode]);

    useEffect(() => {
        setVariables(prev => ({
            FirmName: prev.FirmName || '',
            FirmAddress: prev.FirmAddress || '',
            FirmPhone: prev.FirmPhone || ''
        }));
        setVariablesInput('{}');
        setVariablesError('');
    }, [template?.id]);

    // Fetch Firm Details for auto-population
    useEffect(() => {
        const fetchFirmDetails = async () => {
            try {
                const response = await firmAdminSettingsAPI.getGeneralInfo();
                if (response.success && response.data) {
                    setVariables(prev => ({
                        ...prev,
                        FirmName: response.data.name || prev.FirmName || '',
                        FirmAddress: response.data.address || prev.FirmAddress || '',
                        FirmPhone: response.data.phone_number || prev.FirmPhone || '',
                        FirmEmail: response.data.email || prev.FirmEmail || '',
                        FirmWebsite: response.data.website || prev.FirmWebsite || ''
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch firm details:', err);
            }
        };
        fetchFirmDetails();
    }, []);

    // Handle searching clients
    useEffect(() => {
        const fetchClients = async () => {
            if (clientSearch.length < 2) {
                setClients([]);
                return;
            }

            try {
                setIsSearchingClients(true);
                const response = await firmAdminClientsAPI.listClients({
                    search: clientSearch,
                    page_size: 10
                });

                if (response.success && response.data?.clients) {
                    setClients(response.data.clients);
                }
            } catch (err) {
                console.error('Failed to fetch clients:', err);
            } finally {
                setIsSearchingClients(false);
            }
        };

        const timer = setTimeout(fetchClients, 300);
        return () => clearTimeout(timer);
    }, [clientSearch]);

    const handleSelectClient = async (client) => {
        const firstName = client.profile?.first_name || client.first_name || '';
        const lastName = client.profile?.last_name || client.last_name || '';
        const fullName = client.profile?.full_name || client.name || `${firstName} ${lastName}`.trim();
        const email = client.profile?.email || client.email || '';

        setRecipientEmail(email);
        setRecipientName(fullName);
        setClientSearch('');
        setShowClientDropdown(false);

        const newVariables = {
            ...variables,
            FirstName: firstName,
            LastName: lastName,
            FullName: fullName,
            Email: email,
            Phone: client.profile?.phone || client.phone || '',
            Address: client.profile?.address || '',
            City: client.profile?.city || '',
            State: client.profile?.state || '',
            ZipCode: client.profile?.zip_code || ''
        };
        setVariables(newVariables);
        toast.info(`Imported details for ${fullName}`, { icon: '📥' });
    };

    const handleSendToSelf = () => {
        try {
            const rawData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            const userData = rawData ? JSON.parse(rawData) : null;
            if (userData?.email) {
                setRecipientEmail(userData.email);
                setRecipientName(userData.full_name || userData.name || (userData.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : 'Me'));
                toast.info('Set to your profile info');
            } else {
                toast.error('Could not find your profile email');
            }
        } catch (err) {
            console.error('Profile extraction error:', err);
            toast.error('Error loading your profile');
        }
    };

    const handleVariableChange = (key, value) => {
        setVariables(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleVariablesInputChange = (value) => {
        setVariablesInput(value);
        try {
            const parsed = value.trim() ? JSON.parse(value) : {};
            setVariables(parsed);
            setVariablesError('');
        } catch {
            setVariablesError('Invalid JSON format');
        }
    };

    const handleSubmit = async () => {
        if (!recipientEmail || !recipientEmail.trim()) {
            toast.error('Please enter a recipient email');
            return;
        }
        if (isAdvancedMode && variablesError) {
            toast.error('Please fix JSON errors first');
            return;
        }
        try {
            setSending(true);
            const success = await onSend({
                recipient_email: recipientEmail.trim(),
                recipient_name: recipientName.trim() || undefined,
                variables
            });
            if (success) {
                onClose();
            }
        } finally {
            setSending(false);
        }
    };

    const EssentialVariables = [
        { key: 'FirstName', label: 'First Name', placeholder: 'e.g. John' },
        { key: 'LastName', label: 'Last Name', placeholder: 'e.g. Smith' },
        { key: 'FullName', label: 'Full Name', placeholder: 'e.g. John Smith' },
        { key: 'FirmName', label: 'Firm Name', placeholder: 'e.g. ABC Tax Services' },
        { key: 'FirmAddress', label: 'Firm Address', placeholder: 'e.g. 123 Main St, Suite 100' },
        { key: 'FirmPhone', label: 'Firm Phone', placeholder: 'e.g. (555) 000-0000' },
        { key: 'FirmEmail', label: 'Firm Email', placeholder: 'e.g. info@firm.com' },
        { key: 'FirmWebsite', label: 'Firm Website', placeholder: 'e.g. www.firm.com' }
    ];

    return createPortal(
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-start sm:items-center justify-center z-[99999] p-3 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl sm:rounded-3xl p-4 sm:p-0 max-w-2xl w-full max-h-[100vh] sm:max-h-[92vh] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#E8F0FF]/30 flex items-center justify-between bg-transparent sticky top-0 z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#3AD6F2] to-[#2BC5E0] flex items-center justify-center text-white shadow-lg shadow-[#3AD6F2]/30">
                            <SendIcon />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-xl font-bold text-[#1F2A55]">Send Email</h3>
                            <p className="text-[10px] sm:text-xs text-[#7B8AB2] font-semibold tracking-wider">PREVIEW & SEND</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#7B8AB2] hover:text-[#1F2A55] hover:bg-white/50 rounded-full transition-all">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {/* Recipient Selection */}
                    <div className="space-y-6">
                        <div className="relative group">
                            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#3B4A66] mb-3 px-1 opacity-70">Smart Search Client</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={clientSearch}
                                    onChange={(e) => {
                                        setClientSearch(e.target.value);
                                        setShowClientDropdown(true);
                                    }}
                                    onFocus={() => setShowClientDropdown(true)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/40 border-2 border-transparent focus:border-[#3AD6F2]/30 hover:bg-white/60 rounded-2xl focus:outline-none transition-all text-sm font-medium placeholder-[#7B8AB2]/50 shadow-sm"
                                    placeholder="Type name or email address..."
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8AB2] transition-colors group-focus-within:text-[#3AD6F2]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </div>
                                {isSearchingClients && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-[#3AD6F2] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {showClientDropdown && clientSearch.length >= 2 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl border border-white rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto py-2 p-1 ring-1 ring-black/5">
                                    {clients.length === 0 && !isSearchingClients ? (
                                        <div className="px-4 py-4 text-center text-sm text-[#7B8AB2] italic">No results found</div>
                                    ) : (
                                        clients.map(client => (
                                            <button
                                                key={client.id}
                                                onClick={() => handleSelectClient(client)}
                                                className="w-full text-left px-4 py-3.5 hover:bg-[#3AD6F2]/10 group transition-all rounded-xl"
                                            >
                                                <div className="font-bold text-[#1F2A55] text-sm group-hover:text-[#3AD6F2] transition-colors">
                                                    {client.profile?.first_name || client.first_name} {client.profile?.last_name || client.last_name || client.name}
                                                </div>
                                                <div className="text-xs text-[#7B8AB2] font-medium">{client.profile?.email || client.email}</div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#3B4A66] px-1 opacity-70">Recipient Email *</label>
                                <input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white/50 border border-transparent focus:border-[#3AD6F2]/30 rounded-xl focus:outline-none transition-all text-sm font-semibold shadow-sm"
                                    placeholder="e.g. john@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#3B4A66] px-1 opacity-70">Recipient Name</label>
                                <input
                                    type="text"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white/50 border border-transparent focus:border-[#3AD6F2]/30 rounded-xl focus:outline-none transition-all text-sm font-semibold shadow-sm"
                                    placeholder="e.g. John Smith"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-[#94A3B8] font-bold tracking-tight">* MANDATORY RECIPIENT</span>
                            <button
                                type="button"
                                onClick={handleSendToSelf}
                                className="text-xs font-extrabold text-[#3AD6F2] hover:text-[#2BC5E0] bg-[#3AD6F2]/5 px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Use My Account Info
                            </button>
                        </div>
                    </div>

                {/* Variable Settings */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3B4A66] opacity-70">Personalization</label>
                        <button
                            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${isAdvancedMode ? 'bg-[#1F2A55] text-white shadow-lg' : 'bg-white/50 text-[#3B4A66] hover:bg-white border border-white/50 shadow-sm'}`}
                        >
                            {isAdvancedMode ? 'Standard View' : 'Expert (JSON)'}
                        </button>
                    </div>

                    {isAdvancedMode ? (
                        <div className="space-y-3">
                            <textarea
                                value={variablesInput}
                                onChange={(e) => handleVariablesInputChange(e.target.value)}
                                className="w-full px-5 py-4 bg-[#1F2A55] text-[#A5B4FC] border border-white/10 rounded-2xl focus:outline-none h-32 sm:h-48 font-mono text-xs leading-relaxed shadow-inner"
                                placeholder='{"Placeholder": "Value"}'
                            />
                            {variablesError && (
                                <div className="text-xs text-red-500 flex items-center gap-2 font-bold px-2 bg-red-500/10 py-2 rounded-lg">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    SYNTAX ERROR: {variablesError}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-6 sm:space-y-8 shadow-sm">
                                {/* Fixed/Essential Variables */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <p className="text-[11px] font-black text-[#7B8AB2] uppercase tracking-[0.2em]">Profile Basics</p>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#E8F0FF] to-transparent"></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {EssentialVariables.map(v => (
                                            <div key={v.key} className="space-y-1.5">
                                                <label className="block text-[11px] font-bold text-[#3B4A66]/80 px-1">{v.label}</label>
                                                <input
                                                    type="text"
                                                    value={variables[v.key] || ''}
                                                    onChange={(e) => handleVariableChange(v.key, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white/70 border border-white focus:border-[#3AD6F2]/30 rounded-xl focus:outline-none text-sm font-medium transition-all shadow-sm"
                                                    placeholder={v.placeholder}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Template Variables */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <p className="text-[11px] font-black text-[#7B8AB2] uppercase tracking-[0.2em]">Email Context</p>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#E8F0FF] to-transparent"></div>
                                        <button
                                            onClick={loadVariables}
                                            className="p-1.5 text-[#3AD6F2] hover:bg-[#3AD6F2]/10 rounded-full transition-all"
                                            disabled={variablesLoading}
                                            title="Sync variables"
                                        >
                                            <svg className={variablesLoading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                                            </svg>
                                        </button>
                                    </div>

                                    {variablesLoading ? (
                                        <div className="py-6 flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-3 border-[#3AD6F2] border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-bold text-[#7B8AB2] uppercase tracking-widest">Detecting Placeholders</span>
                                        </div>
                                    ) : availableVariables.length === 0 ? (
                                        <div className="py-4 text-center bg-white/30 rounded-2xl border border-dashed border-white/60">
                                            <p className="text-xs text-[#94A3B8] font-medium italic">No custom placeholders detected for this type</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-5">
                                            {availableVariables.filter(v => !EssentialVariables.find(e => e.key === v.key)).map(v => (
                                                <div key={v.key} className="space-y-2 group">
                                                    <div className="flex justify-between items-baseline px-1">
                                                        <label className="block text-[11px] font-bold text-[#3B4A66]">{v.label || v.key}</label>
                                                        <span className="text-[9px] text-[#94A3B8] font-mono group-focus-within:text-[#3AD6F2] transition-colors">[{v.key}]</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={variables[v.key] || ''}
                                                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                                                        className="w-full px-5 py-3 bg-white/70 border border-white focus:border-[#3AD6F2]/30 rounded-xl focus:outline-none text-sm font-semibold transition-all shadow-sm"
                                                        placeholder={v.placeholder || `Value for ${v.label || v.key}`}
                                                    />
                                                    {v.description && <p className="mt-1.5 text-[10px] text-[#6B7280] italic leading-relaxed px-1">{v.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-4 sm:py-6 border-t border-[#E8F0FF]/30 bg-transparent flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-extrabold text-[#3B4A66] hover:bg-white/60 rounded-xl sm:rounded-2xl border border-white/50 transition-all active:scale-95 order-2 sm:order-1"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={sending}
                        className="w-full sm:w-auto px-10 py-3 text-sm font-black bg-gradient-to-r from-[#F56D2D] to-[#E55A1D] text-white rounded-xl sm:rounded-2xl hover:shadow-[0_10px_30px_rgba(245,109,45,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 order-1 sm:order-2"
                    >
                        {sending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                SENDING...
                            </>
                        ) : (
                            <>
                                <span>SEND TEMPLATE</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SendEmailModal;
