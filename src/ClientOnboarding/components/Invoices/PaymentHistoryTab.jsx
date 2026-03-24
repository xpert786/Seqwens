
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ViewIcon, DownloadIcon, PrintIcon, CrossIcon } from "../icons";
import { FiDownload, FiEye } from "react-icons/fi";
import { taxpayerFirmAPI, paymentsAPI, invoicesAPI, handleAPIError } from "../../utils/apiUtils";
import { toast } from "react-toastify";
import "../../styles/Login.css";
import "../../styles/PaymentHistoryTab.css";
import InvoiceDetailModal from "./InvoiceDetailModal";

const InvoicePopupWithPDF = ({ payments = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const invoiceRef = useRef(null);
  const [firmLogo, setFirmLogo] = useState(null);
  const [firmName, setFirmName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  // Map payments to display format
  const paidInvoices = payments.map(payment => {
    // Format the payment data for display
    const paidAmount = parseFloat(payment.amount || 0);
    const paidDate = payment.paid_date || payment.created_at || payment.date;
    const formattedDate = paidDate
      ? new Date(paidDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      : 'N/A';

    const invoiceTotalAmount = payment.invoice_total_amount !== undefined ? parseFloat(payment.invoice_total_amount) : paidAmount;

    return {
      id: payment.invoice_number || payment.transaction_id || payment.id || `PAY-${payment.id}`,
      description: payment.description || payment.invoice_description || 'Payment',
      paidDate: formattedDate,
      method: payment.payment_method || payment.method || "Credit Card",
      amount: `$${invoiceTotalAmount.toFixed(2)}`,
      quantity: 1,
      rate: `$${invoiceTotalAmount.toFixed(2)}`,
      subtotal: `$${invoiceTotalAmount.toFixed(2)}`,
      tax: "$0.00",
      total: `$${invoiceTotalAmount.toFixed(2)}`,
      client: {
        name: payment.client_name || 'Client',
        address: payment.billing_address || "Address not provided",
        email: payment.email || "Email not provided",
      },
      originalPayment: payment // Keep reference to original payment data
    };
  });

  // Calculate pagination
  const totalPages = Math.ceil(paidInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = paidInvoices.slice(startIndex, endIndex);

  // Reset selected index when page changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowPopup(false);
  }, [currentPage]);

  // Reset to first page when payments change
  useEffect(() => {
    setCurrentPage(1);
  }, [payments]);

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

  const handleDownload = async () => {
    const element = invoiceRef.current;
    if (!element || selectedIndex === null) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    const invoiceId = paidInvoices[selectedIndex]?.id || payments[selectedIndex]?.id || 'invoice';
    pdf.save(`${invoiceId}.pdf`);
  };

  return (
    <div className="bg-white p-3 rounded ">
      <div className="align-items-center mb-3" style={{ marginLeft: "10px" }}>
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Payment History
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
          Your completed payments
        </p>
      </div>
      {paidInvoices.length === 0 ? (
        <div className="text-center py-4" style={{ marginLeft: "10px" }}>
          <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
            No completed payments found.
          </p>
        </div>
      ) : (
        <>
          {paginatedInvoices.map((invoice, index) => {
            // Calculate the original index in paidInvoices array
            const originalIndex = startIndex + index;
            return (
              <div
                key={invoice.id || originalIndex}
                className="border rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center position-relative paid-invoice-card"
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === originalIndex ? '#FFF4E6' : '#ffffff',
                  borderColor: selectedIndex === originalIndex ? '#f7c491' : '#dee2e6',
                  marginLeft: "10px"

                }}
                onClick={() => setSelectedIndex(originalIndex)}
              >


                {/* LEFT SIDE */}
                <div>
                  <h6 className="mb-1 d-flex align-items-center" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                    {invoice.id}{' '}
                    <span
                      className="ms-2 px-2 py-1"
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fontFamily: "BasisGrotesquePro"
                      }}
                    >
                      Paid
                    </span>
                  </h6>
                  <p className="mb-1" style={{ fontSize: "12px", fontWeight: "400", color: "#4B5563", fontFamily: "BasisGrotesquePro" }}>{invoice.description}</p>
                  <p className="mb-0" style={{ fontSize: "12px", fontWeight: "400", color: "#4B5563", fontFamily: "BasisGrotesquePro" }}>
                    Paid {invoice.paidDate} • {invoice.method}
                  </p>
                </div>

                {/* CENTER - Paid Invoice */}
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <div style={{ color: "#4B5563", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                    Paid Invoice: <span style={{ color: '#F56D2D', fontSize: "19px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{invoice.amount}</span>
                  </div>
                </div>

                {/* RIGHT SIDE - Icon Buttons */}
                <div className="d-flex align-items-end flex-column">
                  <div className="d-flex mt-auto">
                    <button
                      className="btn  me-2 d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        width: '32px',
                        height: '32px',
                        padding: '0'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(originalIndex);
                        setShowPopup(true);
                      }}
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      className="btn d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        width: '32px',
                        height: '32px',
                        padding: '0'
                      }}
                      disabled={loading}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setLoading(true);
                          const currentPayment = paidInvoices[originalIndex]?.originalPayment;
                          const invoiceId = currentPayment?.invoice || currentPayment?.invoice_id;

                          console.log('Attempting PDF download with Invoice ID:', invoiceId, 'from Payment record:', currentPayment);

                          if (!invoiceId) {
                            toast.error("Invoice reference not found");
                            return;
                          }

                          const response = await invoicesAPI.downloadInvoicePDF(invoiceId);

                          const url = window.URL.createObjectURL(new Blob([response]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Invoice_${currentPayment.invoice_number || invoiceId}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                          setTimeout(() => {
                            toast.success('PDF downloaded successfully');
                          }, 2000);
                        } catch (error) {
                          console.error('PDF Download error:', error);
                          toast.error('Failed to download PDF. Please try again.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {loading && selectedIndex === originalIndex ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <FiDownload size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {paidInvoices.length > itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top" style={{ marginLeft: "10px", borderColor: '#E5E7EB' }}>
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn "
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
                          className="btn "
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
                  className="btn "
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
                Showing {startIndex + 1}-{Math.min(endIndex, paidInvoices.length)} of {paidInvoices.length}
              </div>
            </div>
          )}
        </>
      )}

      {/* Premium Invoice Details Modal */}
      <InvoiceDetailModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        invoice={paidInvoices[selectedIndex]?.originalPayment}
        isPayment={true}
      />


    </div>
  );
};

export default InvoicePopupWithPDF;

