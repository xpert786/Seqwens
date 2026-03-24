
import React, { useEffect, useState } from 'react';
import { FiX, FiPrinter, FiDownload, FiCheckCircle, FiAlertTriangle, FiClock, FiFileText } from 'react-icons/fi';
import { taxpayerFirmAPI, invoicesAPI, handleAPIError } from '../../utils/apiUtils';
import logo from '../../../assets/logo.png';
import { toast } from 'react-toastify';

const InvoiceDetailModal = ({ isOpen, onClose, invoice, isPayment = false }) => {
    const [firmInfo, setFirmInfo] = useState({ name: '', logo: null, address: '', city: '', state: '', zip: '', phone: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [fullInvoice, setFullInvoice] = useState(null);

    useEffect(() => {
        if (isOpen && invoice) {
            fetchFirmInfo();
            fetchFullInvoiceDetails();
        } else {
            setFullInvoice(null);
        }
    }, [isOpen, invoice]);

    const fetchFullInvoiceDetails = async () => {
        try {
            // Determine the actual invoice ID (might be invoice.id or invoice.invoice or invoice.invoice_id)
            const id = invoice.invoice || invoice.invoice_id || invoice.id;
            if (!id) return;

            setLoading(true);
            const response = await invoicesAPI.getInvoiceDetails(id);
            if (response.success && response.data) {
                setFullInvoice(response.data);
            }
        } catch (error) {
            console.error('Error fetching full invoice details:', error);
            // Fallback to the passed invoice object if API fails
        } finally {
            setLoading(false);
        }
    };

    const fetchFirmInfo = async () => {
        try {
            const response = await taxpayerFirmAPI.getFirmLogo();
            if (response.success && response.data) {
                setFirmInfo({
                    name: response.data.firm_name || 'Seqwens',
                    logo: response.data.logo_url,
                    address: response.data.address || '123 Business Street',
                    city: response.data.city || 'City',
                    state: response.data.state || 'State',
                    zip: response.data.zip || '12345',
                    phone: response.data.phone || '(555) 123-4567',
                    email: response.data.email || 'billing@seqwens.com'
                });
            }
        } catch (error) {
            console.error('Error fetching firm info:', error);
        }
    };

    if (!isOpen || !invoice) return null;

    // Handle nested fullInvoice structure or fallback to simple invoice object
    const isFullInvoice = !!fullInvoice && !!fullInvoice.invoice;
    const displayData = isFullInvoice ? fullInvoice.invoice : (fullInvoice || invoice);
    const amountsData = isFullInvoice ? fullInvoice.amounts : displayData;
    const itemsData = isFullInvoice ? fullInvoice.invoice_items : displayData.invoice_items;
    const taxpayerData = isFullInvoice ? fullInvoice.taxpayer : displayData;

    const baseFee = parseFloat(amountsData.subtotal || amountsData.base_fee || amountsData.amount || 0);
    const taxAmount = parseFloat(amountsData.tax_amount || 0);
    const lateFee = parseFloat(amountsData.late_fee || 0);
    const overallFee = parseFloat(amountsData.total || amountsData.total_amount || (baseFee + taxAmount + lateFee));
    const paidAmount = parseFloat(amountsData.paid_amount || 0);
    const remainingAmount = parseFloat(amountsData.remaining_amount || (overallFee - paidAmount));
    const subtotal = baseFee;

    const statusDisplay = displayData.status_display || displayData.status || 'Pending';
    const statusColor = displayData.status_color || 'orange';

    const cleanDescription = (desc) => {
        if (!desc) return '';
        // Remove trailing price information like ": $123.45" or " - $123.45" or " $123.45"
        return desc.replace(/[:\-—~]?\s*\$\d+([,.]\d{2})?\s*$/, '').trim();
    };
    const getStatusConfig = () => {
        const s = statusDisplay.toLowerCase();
        if (s.includes('paid')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <FiCheckCircle /> };
        if (s.includes('overdue')) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <FiAlertTriangle /> };
        if (s.includes('pending') || s.includes('partial')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <FiClock /> };
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: <FiFileText /> };
    };

    const statusConfig = getStatusConfig();

    const handleDownloadPDF = async () => {
        try {
            setLoading(true);
            // Use the correct invoice ID
            const id = displayData.invoice || displayData.invoice_id || displayData.id;
            const response = await invoicesAPI.downloadInvoicePDF(id);

            // If the API returns a blob
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${displayData.invoice_number || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => {
                toast.success('PDF downloaded successfully');
            }, 2000);
        } catch (error) {
            console.error('PDF Download error:', error);
            toast.error('Failed to download PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scale-in-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative p-8 pr-16 md:pr-20 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-4 p-2 rounded-full hover:bg-white hover:shadow-md transition-all text-slate-400 hover:text-slate-600"
                        style={{ borderRadius: "50%" }}
                    >
                        <FiX size={20} />
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2">
                                {firmInfo.logo ? (
                                    <img src={firmInfo.logo} alt={firmInfo.name} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <img src={logo} alt="Seqwens" className="max-w-[70%] max-h-[70%] object-contain opacity-80" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                    {isPayment ? 'Payment Receipt' : 'Invoice Details'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-400 font-medium">{displayData.invoice_number || `#${displayData.id}`}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} flex items-center gap-1`}>
                                        {statusConfig.icon}
                                        {statusDisplay}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-left md:text-right space-y-1">
                            <p className="text-sm font-bold text-slate-800">{firmInfo.name}</p>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] md:ml-auto">
                                {firmInfo.address}<br />
                                {firmInfo.city}, {firmInfo.state} {firmInfo.zip}
                            </p>
                            <p className="text-xs text-slate-500">{firmInfo.phone}</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billed To</p>
                            <div className="space-y-1">
                                <p className="text-base font-bold text-slate-800">{taxpayerData.name || taxpayerData.client_name || 'Client Name'}</p>
                                <p className="text-sm text-slate-500">{taxpayerData.email || taxpayerData.client_email || 'Email not provided'}</p>
                                <p className="text-sm text-slate-500">{taxpayerData.phone_number || taxpayerData.client_phone || 'Phone not provided'}</p>
                            </div>
                        </div>
                        <div className="md:text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Issued On</p>
                            <div className="space-y-1">
                                <p className="text-base font-bold text-slate-800">{displayData.issue_date || displayData.formatted_issue_date || 'N/A'}</p>
                                <div className="flex md:justify-end items-center gap-2">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">Due Date:</span>
                                    <span className="text-sm font-bold text-slate-600">{displayData.due_date || displayData.formatted_due_date || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itemized Services</p>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(!itemsData || itemsData.length === 0) ? (
                                        <tr>
                                            <td className="px-5 py-5 text-sm font-medium text-slate-700">{cleanDescription(displayData.description) || 'General Professional Services'}</td>
                                            <td className="px-5 py-5 text-sm text-slate-500 text-center">1</td>
                                            <td className="px-5 py-5 text-sm font-bold text-slate-900 text-right">${subtotal.toFixed(2)}</td>
                                        </tr>
                                    ) : (
                                        itemsData.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-5 py-5 text-sm font-medium text-slate-700">{item.description}</td>
                                                <td className="px-5 py-5 text-sm text-slate-500 text-center">{item.qty || 1}</td>
                                                <td className="px-5 py-5 text-sm font-bold text-slate-900 text-right">${parseFloat(item.value || item.amount || 0).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Summary Bottom */}
                            <div className="bg-slate-50/50 p-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Base Fee</span>
                                    <span className="font-bold text-slate-700">${baseFee.toFixed(2)}</span>
                                </div>
                                {taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tax</span>
                                        <span className="font-bold text-slate-700">${taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {lateFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-rose-500 font-bold">Late Fee</span>
                                        <span className="font-bold text-rose-600">${lateFee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-slate-200 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-black text-slate-800 uppercase tracking-tight">Overall Fee</span>
                                    <span className="text-2xl font-black text-orange-500">${overallFee.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Notes */}
                    {(displayData.notes || displayData.payment_terms) && (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-serif">Important Notes</p>
                            <p className="text-xs text-slate-500 leading-relaxed italic">
                                {displayData.notes || 'No specific notes for this invoice. Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end items-center">
                    <button
                        onClick={() => window.print()}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        style={{ borderRadius: "12px" }}
                    >
                        <FiPrinter size={16} />
                        Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-3 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                        style={{ borderRadius: "12px" }}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <FiDownload size={16} />
                        )}
                        Download PDF
                    </button>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .scale-in-center {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
        </div>
    );
};

export default InvoiceDetailModal;
