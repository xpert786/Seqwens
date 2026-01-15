import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { PayIcon, ViewIcon, LockIcon, CrossIcon, DownloadIcon, PrintIcon } from "../icons";
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { invoicesAPI, taxpayerFirmAPI, handleAPIError } from '../../utils/apiUtils';
import '../../styles/OutStandingTab.css';
const OutstandingTab = ({ invoices = [], summary = {} }) => {
    const [showModal, setShowModal] = useState(false);
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [firmLogo, setFirmLogo] = useState(null);
    const [firmName, setFirmName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCVV, setShowCVV] = useState(false);
    const itemsPerPage = 5;

    const handlePayNowClick = async (invoice) => {
        try {
            // Build success and cancel URLs - redirect to invoices page with success parameter
            const baseUrl = window.location.origin;
            const successUrl = `${baseUrl}/invoices?payment_success=true&invoice_id=${invoice.id}`;
            const cancelUrl = `${baseUrl}/invoices?payment_cancelled=true`;
            
            // Call the payment API with success and cancel URLs
            const response = await invoicesAPI.payInvoice(invoice.id, successUrl, cancelUrl);

            if (response.success && response.data && response.data.checkout_url) {
                // Redirect to Stripe Checkout
                window.location.href = response.data.checkout_url;
            } else {
                throw new Error(response.message || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage || 'Failed to process payment. Please try again.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                icon: false,
                className: "custom-toast-error",
                bodyClassName: "custom-toast-body",
            });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedInvoice(null);
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceDetailsModal(true);
    };

    const handleCloseInvoiceDetailsModal = () => {
        setShowInvoiceDetailsModal(false);
        setSelectedInvoice(null);
    };

    const handlePaymentSubmit = async () => {
        try {
            const invoiceId = selectedInvoice.id;
            // Build success and cancel URLs - redirect to invoices page with success parameter
            const baseUrl = window.location.origin;
            const successUrl = `${baseUrl}/invoices?payment_success=true&invoice_id=${invoiceId}`;
            const cancelUrl = `${baseUrl}/invoices?payment_cancelled=true`;
            
            // Call the payment API with success and cancel URLs
            const response = await invoicesAPI.payInvoice(invoiceId, successUrl, cancelUrl);

            if (response.success && response.data && response.data.checkout_url) {
                // Redirect to Stripe Checkout
                window.location.href = response.data.checkout_url;
            } else {
                throw new Error(response.message || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage || 'Failed to process payment. Please try again.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                icon: false,
                className: "custom-toast-error",
                bodyClassName: "custom-toast-body",
            });
        }
    };

    // Map all invoices to display format (show all invoices, not just outstanding)
    const allInvoices = invoices.map(inv => {
        const status = (inv.status || 'pending').toLowerCase();
        const remainingAmount = parseFloat(inv.remaining_amount || 0);
        const totalAmount = parseFloat(inv.amount || 0);
        const paidAmount = parseFloat(inv.paid_amount || 0);
        const isPaid = status === 'paid' || (remainingAmount === 0 && paidAmount > 0);
        
        return {
            id: inv.id,
            invoice_number: inv.invoice_number || `INV-${inv.id}`,
            status: inv.status || 'pending',
            name: inv.description || 'Invoice',
            amount: totalAmount,
            remaining_amount: remainingAmount,
            paid_amount: paidAmount,
            due: inv.formatted_due_date || inv.due_date,
            description: inv.description,
            issue_date: inv.formatted_issue_date || inv.issue_date,
            due_date: inv.formatted_due_date || inv.due_date,
            client_name: inv.client_name,
            status_display: inv.status_display || inv.status,
            status_color: inv.status_color || (inv.status === 'overdue' ? 'red' : inv.status === 'paid' ? 'green' : 'yellow'),
            isPaid: isPaid,
            payment_date: inv.payment_date || inv.paid_date
        };
    });

    // Use summary data from API (same as cards) or calculate as fallback
    const outstandingBalance = summary.outstanding_balance !== undefined 
        ? parseFloat(summary.outstanding_balance) 
        : allInvoices.reduce((sum, inv) => sum + (parseFloat(inv.remaining_amount) || 0), 0);
    
    const paidThisYear = summary.paid_this_year !== undefined 
        ? parseFloat(summary.paid_this_year) 
        : 0;
    
    const currentYear = new Date().getFullYear();

    // Calculate pagination
    const totalPages = Math.ceil(allInvoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInvoices = allInvoices.slice(startIndex, endIndex);

    // Reset modals when page changes
    useEffect(() => {
        setShowModal(false);
        setShowInvoiceDetailsModal(false);
        setSelectedInvoice(null);
    }, [currentPage]);

    // Get status badge style
    const getStatusBadgeStyle = (status, statusColor, isPaid) => {
        if (isPaid || status === 'paid' || statusColor === 'green') {
            return {
                color: '#166534',
                border: '1px solid #166534',
                backgroundColor: '#DCFCE7'
            };
        }
        if (status === 'overdue' || statusColor === 'red') {
            return {
                color: '#991B1B',
                border: '1px solid #991B1B',
                backgroundColor: '#FEE2E2'
            };
        }
        return {
            color: '#854D0E',
            border: '1px solid #854D0E',
            backgroundColor: '#FEF9C3'
        };
    };

    useEffect(() => {
        if (showModal || showInvoiceDetailsModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [showModal, showInvoiceDetailsModal]);

    // Fetch firm logo
    useEffect(() => {
        const fetchFirmLogo = async () => {
            try {
                const response = await taxpayerFirmAPI.getFirmLogo();
                if (response.success && response.data) {
                    setFirmLogo(response.data.logo_url);
                    setFirmName(response.data.firm_name || '');
                }
            } catch (error) {
                console.error('Error fetching firm logo:', error);
                // Silently fail - logo is optional
            }
        };
        fetchFirmLogo();
    }, []);

    // Export Outstanding Invoices to PDF
    const exportOutstandingInvoicesToPDF = () => {
        try {
            if (allInvoices.length === 0) {
                toast.info("No invoices to export");
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;

            // Header
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Outstanding Invoices Report", pageWidth / 2, yPosition, { align: "center" });
            yPosition += 10;

            // Report Date
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const reportDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
            yPosition += 15;

            // Summary
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Summary", 14, yPosition);
            yPosition += 8;

            const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const totalRemaining = allInvoices.reduce((sum, inv) => sum + inv.remaining_amount, 0);
            const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
            const outstandingCount = allInvoices.filter(inv => inv.remaining_amount > 0).length;

            const summaryData = [
                ["Total Invoices", allInvoices.length.toString()],
                ["Outstanding Invoices", outstandingCount.toString()],
                ["Total Amount", `$${totalAmount.toFixed(2)}`],
                ["Total Paid", `$${totalPaid.toFixed(2)}`],
                ["Total Remaining", `$${totalRemaining.toFixed(2)}`]
            ];

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            autoTable(doc, {
                startY: yPosition,
                head: [["Metric", "Value"]],
                body: summaryData,
                theme: "grid",
                headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 9 },
                margin: { left: 14, right: 14 },
                columnStyles: {
                    0: { cellWidth: 100 },
                    1: { cellWidth: 80 }
                }
            });

            yPosition = doc.lastAutoTable.finalY + 15;

            // Invoice Table
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`All Invoices (${allInvoices.length})`, 14, yPosition);
            yPosition += 8;

            // Prepare table data
            const tableData = allInvoices.map((invoice) => {
                const formatCurrency = (amount) => {
                    return `$${parseFloat(amount || 0).toFixed(2)}`;
                };

                const formatDate = (dateString) => {
                    if (!dateString) return "N/A";
                    try {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                    } catch {
                        return dateString;
                    }
                };

                return [
                    invoice.invoice_number || `INV-${invoice.id}`,
                    invoice.client_name || "N/A",
                    formatCurrency(invoice.amount),
                    formatCurrency(invoice.paid_amount),
                    formatCurrency(invoice.remaining_amount),
                    invoice.status_display || invoice.status || "Pending",
                    formatDate(invoice.issue_date),
                    formatDate(invoice.due_date)
                ];
            });

            // Create table
            autoTable(doc, {
                startY: yPosition,
                head: [["Invoice #", "Client", "Amount", "Paid", "Remaining", "Status", "Issue Date", "Due Date"]],
                body: tableData,
                theme: "grid",
                headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 8 },
                margin: { left: 14, right: 14 },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 30 }
                },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                didDrawPage: (data) => {
                    // Add page numbers
                    doc.setFontSize(8);
                    doc.text(
                        `Page ${data.pageNumber}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: "center" }
                    );
                }
            });

            // Save the PDF
            const fileName = `Outstanding_Invoices_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            toast.success("PDF exported successfully!");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error(`Error generating PDF: ${error.message}`);
        }
    };


    return (
        <div className="bg-white lg:p-3 md:p-2 px-1 rounded" >
            <div className="align-items-center mb-3 invoices-header" style={{marginLeft:"10px"}}>
                <h5
                    className="mb-0 me-3"
                    style={{
                        color: "#3B4A66",
                        fontSize: "20px",
                        fontWeight: "500",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Outstanding Invoices
                </h5>
                <p
                    className="mb-0"
                    style={{
                        color: "#4B5563",
                        fontSize: "14px",
                        fontWeight: "400",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Invoices that require payment
                </p>
            </div>

            {allInvoices.length === 0 ? (
                <div className="text-center py-4 empty-invoice-msg" style={{ marginLeft: "10px" }}>
                    <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        No invoices at this time.
                    </p>
                </div>
            ) : (
                <>
                {paginatedInvoices.map((inv, idx) => {
                    const statusStyle = getStatusBadgeStyle(inv.status, inv.status_color, inv.isPaid);
                    return (
                        <div
                            key={inv.id || idx}
                            className="border rounded p-3 mb-3 invoice-card"
                            style={{
                                backgroundColor: '#ffffff',
                                transition: 'background-color 0.3s ease',
                                fontFamily: "BasisGrotesquePro",
                                marginLeft: "10px"
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                {/* Left Info */}
                                <div>
                                    <strong style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                        {inv.invoice_number}
                                    </strong>
                                    <span
                                        className="badge ms-2 px-2 py-1"
                                        style={{
                                            ...statusStyle,
                                            fontSize: '12px',
                                            borderRadius: '15px',
                                            fontFamily: "BasisGrotesquePro"
                                        }}
                                    >
                                        {inv.status_display || inv.status}
                                    </span>

                                    <div className="small text-muted" style={{ marginLeft: "0px", marginTop: "4px", fontFamily: "BasisGrotesquePro", fontSize: "12px", fontWeight: "400", color: "#4B5563" }}>
                                        {inv.name}
                                    </div>
                                    <div className="small text-muted" style={{ marginLeft: "0px", marginTop: "2px", fontFamily: "BasisGrotesquePro", fontSize: "12px", fontWeight: "400", color: "#4B5563" }}>
                                        Due: {inv.due}
                                    </div>
                                </div>


                                <div className="text-center flex-grow-1">
                                    <div className="mb-0">
                                        <span style={{ color: "#4B5563", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                            {inv.isPaid ? 'Paid Invoice:' : 'Pay Invoice:'}
                                        </span>{' '}
                                        <span style={{ color: '#F56D2D', fontSize: "19px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                            ${inv.isPaid ? inv.paid_amount.toFixed(2) : (inv.remaining_amount || inv.amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>


                                <div className="text-end">
                                    <button
                                        className="btn btn-sm me-2"
                                        style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewInvoice(inv);
                                        }}
                                    >
                                        <ViewIcon />
                                    </button>

                                    {!inv.isPaid && (
                                        <button
                                            className="btn"
                                            style={{
                                                backgroundColor: '#F56D2D',
                                                color: '#FFFFFF',
                                                fontSize: '16px',
                                                padding: '8px 10px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePayNowClick(inv);
                                            }}
                                        >
                                            <PayIcon style={{ fontSize: '30px' }} />
                                            <span style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px" }}>Pay Now</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Pagination Controls */}
                {allInvoices.length > itemsPerPage && (
                    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top invoice-pagination" style={{ marginLeft: "10px", borderColor: '#E5E7EB' }}>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-sm"
                                style={{
                                    backgroundColor: currentPage === 1 ? '#F9FAFB' : 'white',
                                    borderColor: currentPage === 1 ? '#D1D5DB' : '#3B82F6',
                                    color: currentPage === 1 ? '#9CA3AF' : '#3B82F6',
                                    fontFamily: "BasisGrotesquePro",
                                    fontSize: "14px",
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1
                                }}
                            >
                                Previous
                            </button>
                            
                            <div className="d-flex align-items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: currentPage === page ? '#3B82F6' : 'white',
                                                    borderColor: currentPage === page ? '#3B82F6' : '#D1D5DB',
                                                    color: currentPage === page ? 'white' : '#6B7280',
                                                    fontFamily: "BasisGrotesquePro",
                                                    fontSize: "14px",
                                                    minWidth: "36px"
                                                }}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return (
                                            <span key={page} className="px-2" style={{ color: '#6B7280', fontFamily: "BasisGrotesquePro" }}>
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-sm"
                                style={{
                                    backgroundColor: currentPage === totalPages ? '#F9FAFB' : 'white',
                                    borderColor: currentPage === totalPages ? '#D1D5DB' : '#3B82F6',
                                    color: currentPage === totalPages ? '#9CA3AF' : '#3B82F6',
                                    fontFamily: "BasisGrotesquePro",
                                    fontSize: "14px",
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === totalPages ? 0.5 : 1
                                }}
                            >
                                Next
                            </button>
                        </div>

                        <div style={{ color: '#6B7280', fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                            Showing {startIndex + 1}-{Math.min(endIndex, allInvoices.length)} of {allInvoices.length}
                        </div>
                    </div>
                )}
                </>
            )}

            {showModal && selectedInvoice && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                >
                    <div
                        className=" rounded-4 p-4"
                        style={{
                            width: '550px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            border: "1px solid #E8F0FF",
                            backgroundColor: "#FFFFFF"
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <h6 className=" mb-0" style={{ color: "#3B4A66", fontSize: "22px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Make Payment</h6>
                                <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                                    Pay invoice {selectedInvoice.invoice_number || selectedInvoice.id}
                                </small>
                            </div>
                            <div
                                role="button"
                                onClick={handleCloseModal}
                                style={{ cursor: "pointer" }}
                            >
                                <CrossIcon />
                            </div>
                        </div>



                        <div className="rounded-3 p-3 mb-3" style={{ backgroundColor: "#F3F7FF", marginTop: "5px", border: "1px solid #E8F0FF" }}>
                            <div className="d-flex justify-content-between mb-1">
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Invoice ID</small>
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                                    {selectedInvoice.invoice_number || selectedInvoice.id}
                                </small>
                            </div>
                            {selectedInvoice.client_name && (
                                <div className="d-flex justify-content-between mb-1" style={{ marginTop: "8px" }}>
                                    <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Client</small>
                                    <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                                        {selectedInvoice.client_name}
                                    </small>
                                </div>
                            )}
                            <div className="d-flex justify-content-between mb-1" style={{ marginTop: "8px" }} >
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Description</small>
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                                    {selectedInvoice.description || selectedInvoice.name || 'N/A'}
                                </small>
                            </div>
                            <div className="d-flex justify-content-between mb-1" style={{ marginTop: "8px" }}>
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Due Date</small>
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                                    {selectedInvoice.due || selectedInvoice.formatted_due_date || 'N/A'}
                                </small>
                            </div>
                            <div className="d-flex justify-content-between" style={{ marginTop: "8px" }}>
                                <small className="fw-bold" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Remaining Amount</small>
                                <small className="fw-bold" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>
                                    ${(selectedInvoice.remaining_amount || selectedInvoice.amount || 0).toFixed(2)}
                                </small>
                            </div>
                        </div>

                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Payment Amount</Form.Label>
                                <Form.Control 
                                    size="sm" 
                                    type="number" 
                                    placeholder="$ 0" 
                                    defaultValue={(selectedInvoice.remaining_amount || selectedInvoice.amount || 0).toFixed(2)} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Payment Method</Form.Label>
                                <Form.Select size="sm" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}>
                                    <option>Credit/Debit Card</option>
                                    <option>UPI</option>
                                    <option>Net Banking</option>
                                </Form.Select>
                            </Form.Group>

                            <div style={{ backgroundColor: "#F3F7FF", borderRadius: "8px", padding: "12px", border: "1px solid #E8F0FF" }}>
                                <Form.Group className="mb-2">
                                    <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Cardholder Name</Form.Label>
                                    <Form.Control size="sm" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66" }} type="text" placeholder="Enter Name" />
                                </Form.Group>

                                <Form.Group className="mb-2">
                                    <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Card Number</Form.Label>
                                    <Form.Control size="sm" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66" }} type="text" placeholder="1234 5678 9012 3456" />
                                </Form.Group>

                                <div className="d-flex gap-2">
                                    <Form.Group className="mb-2 flex-grow-1">
                                        <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Expiry Date</Form.Label>
                                        <Form.Control size="sm" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66" }} type="text" placeholder="MM/YYYY" />
                                    </Form.Group>

                                    <Form.Group className="mb-2" style={{ width: '90px' }}>
                                        <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>CVV</Form.Label>
                                        <div style={{ position: "relative" }}>
                                            <Form.Control 
                                                size="sm" 
                                                style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", paddingRight: "30px" }} 
                                                type={showCVV ? "text" : "password"} 
                                                placeholder="123" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCVV(!showCVV)}
                                                style={{
                                                    position: "absolute",
                                                    right: "8px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    background: "none",
                                                    border: "none",
                                                    color: "#4B5563",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    padding: "0",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    zIndex: 10
                                                }}
                                            >
                                                <i className={`bi ${showCVV ? "bi-eye-slash" : "bi-eye"}`}></i>
                                            </button>
                                        </div>
                                    </Form.Group>
                                </div>
                            </div>
                        </Form>

                        <div className="alert rounded-3 py-2 px-3 d-flex align-items-center mt-2" style={{ backgroundColor: "#F0FDF4", color: "#166534", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                            <span className="me-1">
                                <LockIcon size={14} />
                            </span>
                            Your payment information is secure
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <Button
                                variant="light"
                                size="sm"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#ced4da',
                                    color: '#000',
                                    fontWeight: '500',
                                    fontFamily: "BasisGrotesquePro"
                                }}
                                onClick={handleCloseModal}
                            >
                                Cancel
                            </Button>

                            <Button
                                size="sm"
                                style={{ backgroundColor: '#F56D2D', borderColor: '#F56D2D', fontFamily: "BasisGrotesquePro" }}
                                className="text-white fw-semibold px-3"
                                onClick={handlePaymentSubmit}
                            >
                                Pay ${(selectedInvoice.remaining_amount || selectedInvoice.amount || 0).toFixed(2)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Details Modal */}
            {showInvoiceDetailsModal && selectedInvoice && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                    onClick={handleCloseInvoiceDetailsModal}
                >
                    <div
                        className="rounded-4 p-0"
                        style={{
                            width: '85vw',
                            maxWidth: '550px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            border: "1px solid #E8F0FF",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3">
                            <div className="text-end mb-2">
                                <button
                                    onClick={handleCloseInvoiceDetailsModal}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    <CrossIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
                                </button>
                            </div>

                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="mb-1" style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "700", fontFamily: "BasisGrotesquePro" }}>
                                        Invoice {selectedInvoice.invoice_number}
                                    </h5>
                                    <p className="text-muted mb-3" style={{ fontFamily: "BasisGrotesquePro", fontSize: "12px" }}>
                                        Invoice details and payment information
                                    </p>

                                    <div
                                        className="p-2 rounded d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "80px",
                                            height: "50px",
                                            backgroundColor: "#E8F0FF",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {firmLogo ? (
                                            <img
                                                src={firmLogo}
                                                alt={firmName || "Firm Logo"}
                                                style={{
                                                    maxWidth: "100%",
                                                    maxHeight: "100%",
                                                    objectFit: "contain"
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    setFirmLogo(null);
                                                }}
                                            />
                                        ) : (
                                            <strong
                                                style={{
                                                    color: "#3B4A66",
                                                    fontSize: "18px",
                                                    fontWeight: "500",
                                                    fontFamily: "BasisGrotesquePro"
                                                }}
                                            >
                                                Logo
                                            </strong>
                                        )}
                                    </div>

                                    <p className="mt-2 mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>123 Business Street</p>
                                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>City, State 12345</p>
                                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>Phone: (555) 123-4567</p>
                                    <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>Email: billing@seqwens.com</p>
                                </div>

                                <div style={{ marginTop: "65px" }}>
                                    <h6 style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>INVOICE</h6>
                                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{selectedInvoice.invoice_number}</p>
                                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>Phone: (555) 123-4567</p>
                                    <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>Email: billing@seqwens.com</p>
                                </div>
                            </div>

                            <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                            <div className="mb-3 mt-2">
                                <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Bill To:</h5>
                                <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>
                                    {selectedInvoice.client_name || 'Client'}
                                </p>
                                <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>
                                    456 Client Avenue
                                </p>
                                <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>
                                    Client City, State 67890
                                </p>
                            </div>

                            <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                            <div className="mb-3">
                                <h5 className="mb-2" style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                    Services
                                </h5>

                                <div className="d-flex fw-bold p-2 mb-1" style={{ borderColor: "#dee2e6", backgroundColor: "#F3F7FF", borderRadius: "10px" }}>
                                    <div className="flex-grow-1" style={{ fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Description</div>
                                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Qty</div>
                                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Rate</div>
                                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Amount</div>
                                </div>

                                <div className="d-flex align-items-center border-bottom pb-1 mb-1" style={{ fontSize: "11px", borderColor: "#000" }}>
                                    <div className="flex-grow-1" style={{ fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                        {selectedInvoice.description || selectedInvoice.name || 'Service'}
                                    </div>
                                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>1</div>
                                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                        ${selectedInvoice.amount.toFixed(2)}
                                    </div>
                                    <div style={{ width: "80px", textAlign: "end", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                        ${selectedInvoice.amount.toFixed(2)}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end mt-2">
                                    <div style={{ width: "100px", textAlign: "end", fontSize: "10px", fontWeight: 400, fontFamily: "BasisGrotesquePro", color: "#3B4A66", marginLeft: "150px" }}>
                                        Subtotal:
                                    </div>
                                    <div style={{ width: "100px", textAlign: "end", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                        ${selectedInvoice.amount.toFixed(2)}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end mt-3">
                                    <div style={{ width: "100px", textAlign: "end", fontSize: "10px", fontWeight: 400, fontFamily: "BasisGrotesquePro", color: "#3B4A66", marginLeft: "150px" }}>
                                        Tax (0%):
                                    </div>
                                    <div style={{ width: "100px", textAlign: "end", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                        $0.00
                                    </div>
                                </div>

                                <hr style={{ width: "30%", borderTop: "2px solid #000", marginLeft: "70%" }} />

                                <div className="d-flex justify-content-end mt-2">
                                    <div style={{ width: "100px", textAlign: "end", fontSize: "12px", fontWeight: "600", color: "#3B4A66", fontFamily: "BasisGrotesquePro", marginLeft: "150px" }}>
                                        Total:
                                    </div>
                                    <div style={{ width: "100px", textAlign: "end", fontSize: "12px", fontWeight: "700", color: "#3B4A66" }}>
                                        ${selectedInvoice.amount.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                            {/* Outstanding Balance and Paid This Year Section */}
                            <div className="mt-3 mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ backgroundColor: "#F3F7FF", border: "1px solid #E8F0FF" }}>
                                    <div>
                                        <h6 style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro", marginBottom: "4px" }}>
                                            Outstanding Balance
                                        </h6>
                                        <p style={{ color: "#4B5563", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro", margin: 0 }}>
                                            Total amount due across all invoices
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <h5 style={{ color: "#F56D2D", fontSize: "20px", fontWeight: "600", fontFamily: "BasisGrotesquePro", margin: 0 }}>
                                            ${outstandingBalance.toFixed(2)}
                                        </h5>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                                    <div>
                                        <h6 style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro", marginBottom: "4px" }}>
                                            Paid This Year
                                        </h6>
                                        <p style={{ color: "#4B5563", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro", margin: 0 }}>
                                            Total payments made in {currentYear}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <h5 style={{ color: "#166534", fontSize: "20px", fontWeight: "600", fontFamily: "BasisGrotesquePro", margin: 0 }}>
                                            ${paidThisYear.toFixed(2)}
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                            <p className="mt-2" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>
                                <strong style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "700", fontFamily: "BasisGrotesquePro" }}>Payment Terms:</strong><br />
                                Payment is due within 30 days of invoice date.<br />
                                Late payments may be subject to a 1.5% monthly service charge.
                            </p>

                            <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                            <div className="text-end mt-2">
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: "#E8F0FF",
                                        border: "1px solid #ced4da",
                                        color: "#000",
                                        fontFamily: "BasisGrotesquePro",
                                        fontSize: "11px",
                                        width: "80px",
                                        height: "34px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: "8px",
                                    }}
                                    onClick={() => window.print()}
                                >
                                    <PrintIcon style={{ marginRight: "4px" }} />
                                    Print
                                </button>

                                <button
                                    onClick={exportOutstandingInvoicesToPDF}
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: "#E8F0FF",
                                        border: "1px solid #ced4da",
                                        color: "#000",
                                        fontFamily: "BasisGrotesquePro",
                                        fontSize: "11px",
                                        width: "120px",
                                        height: "34px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <DownloadIcon style={{ marginRight: "4px" }} />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default OutstandingTab;
