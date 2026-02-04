
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ViewIcon, DownloadIcon, PrintIcon, CrossIcon } from "../icons";
import { taxpayerFirmAPI, paymentsAPI, handleAPIError } from "../../utils/apiUtils";
import { toast } from "react-toastify";
import "../../styles/Login.css";
import "../../styles/PaymentHistoryTab.css";

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

    return {
      id: payment.invoice_number || payment.transaction_id || payment.id || `PAY-${payment.id}`,
      description: payment.description || payment.invoice_description || 'Payment',
      paidDate: formattedDate,
      method: payment.payment_method || payment.method || "Credit Card",
      amount: `$${paidAmount.toFixed(2)}`,
      quantity: 1,
      rate: `$${paidAmount.toFixed(2)}`,
      subtotal: `$${paidAmount.toFixed(2)}`,
      tax: "$0.00",
      total: `$${paidAmount.toFixed(2)}`,
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
                  className="btn  me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(originalIndex);
                    setShowPopup(true);
                  }}
                >
                  <ViewIcon />
                </button>
                <button
                  className="btn  "
                  onClick={async (e) => {
                    e.stopPropagation();
                    setSelectedIndex(originalIndex);
                    setShowPopup(true);
                    setTimeout(await handleDownload, 300);
                    setTimeout(() => setShowPopup(false), 500);
                  }}
                >
                  <DownloadIcon />
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

      {showPopup && selectedIndex !== null && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              width: "85vw",
              maxWidth: "550px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content p-0"
              style={{
                maxHeight: "75vh",
                height: "75vh",
                overflow: "hidden",
                borderRadius: "12px"
              }}
            >

              <div
                className="p-3"
                ref={invoiceRef}
                style={{
                  overflowY: "auto",
                  maxHeight: "75vh",
                }}
              >
                <div className="text-end">
                  <button
                    onClick={() => setShowPopup(false)}
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
                    <h5 className="mb-1" style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "700", fontFamily: "BasisGrotesquePro" }}>Payment {paidInvoices[selectedIndex]?.id || payments[selectedIndex]?.id}</h5>
                    <p className="text-muted mb-3">Payment details and transaction information</p>

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
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>Phone: (855) 123-4567</p>
                    <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>Email: billing@cpaservices.com</p>
                  </div>

                  <div style={{ marginTop: "65px" }}>
                    <h6 style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "600" }}>PAYMENT</h6>
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{paidInvoices[selectedIndex]?.id || payments[selectedIndex]?.id}</p>
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>Phone: (855) 123-4567</p>
                    <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>Email: billing@cpaservices.com</p>
                  </div>
                </div>

                <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                <div className="mb-3 mt-2">
                  <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Bill To:</h5>
                  <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{paidInvoices[selectedIndex]?.client?.name || payments[selectedIndex]?.client?.name}</p>
                  <p className=" mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{paidInvoices[selectedIndex]?.client?.address || payments[selectedIndex]?.client?.address}</p>
                  <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{paidInvoices[selectedIndex]?.client?.email || payments[selectedIndex]?.client?.email}</p>
                </div>

                <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                <div className="mb-3">
                  <h5
                    className="mb-2"
                    style={{
                      color: "#3B4A66",
                      fontSize: "16px",
                      fontWeight: "500",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Services
                  </h5>

                  <div
                    className="d-flex fw-bold p-2 mb-1"
                    style={{ borderColor: "#dee2e6", backgroundColor: "#F3F7FF", borderRadius: "10px" }}
                  >
                    <div className="flex-grow-1" style={{ width: "100px", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro", }}>Description</div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Qty</div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Rate</div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Amount</div>
                  </div>

                  <div
                    className="d-flex align-items-center border-bottom pb-1 mb-1"
                    style={{ fontSize: "11px", borderColor: "#000" }}
                  >
                    <div className="flex-grow-1" style={{ fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>{paidInvoices[selectedIndex]?.description || payments[selectedIndex]?.description}</div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {paidInvoices[selectedIndex]?.quantity || payments[selectedIndex]?.quantity || 1}
                    </div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {paidInvoices[selectedIndex]?.rate || payments[selectedIndex]?.rate}
                    </div>
                    <div style={{ width: "80px", textAlign: "end", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {paidInvoices[selectedIndex]?.amount || payments[selectedIndex]?.amount}
                    </div>
                  </div>



                  <div className="d-flex justify-content-end mt-2">
                    <div
                      style={{
                        width: "100px",
                        textAlign: "end",
                        fontSize: "10px",
                        fontWeight: 400,
                        fontFamily: "BasisGrotesquePro",
                        color: "#3B4A66",
                        marginLeft: "150px"
                      }}

                    >
                      Subtotal:
                    </div>
                    <div
                      style={{
                        width: "100px",
                        textAlign: "end",
                        fontSize: "10px",
                        fontWeight: 400,
                        color: "#3B4A66",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    >
                      {paidInvoices[selectedIndex]?.subtotal || payments[selectedIndex]?.subtotal}
                    </div>
                  </div>


                  <div className="d-flex justify-content-end mt-3">
                    <div
                      style={{
                        width: "100px",
                        textAlign: "end",
                        fontSize: "10px",
                        fontWeight: 400,
                        color: "#3B4A66",
                        fontFamily: "BasisGrotesquePro",
                        marginLeft: "150px"
                      }}

                    >
                      Tax (0%):
                    </div>
                    <div
                      style={{
                        width: "100px",
                        textAlign: "end",
                        fontSize: "10px",
                        fontWeight: 400,
                        color: "#3B4A66",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    >
                      {paidInvoices[selectedIndex]?.tax || payments[selectedIndex]?.tax || "$0.00"}
                    </div>
                  </div>

                  <hr style={{ width: "30%", borderTop: "2px solid #000", marginLeft: "70%" }} />

                  <div className="d-flex justify-content-end mt-2">
                    <div
                      style={{
                        width: "100px",
                        textAlign: "end",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#3B4A66",
                        fontFamily: "BasisGrotesquePro",
                        marginLeft: "150px"
                      }}

                    >
                      Total:
                    </div>
                    <div
                      style={{
                        width: "100px",
                        textAlign: "end",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#3B4A66",
                      }}

                    >
                      {paidInvoices[selectedIndex]?.total || payments[selectedIndex]?.total}
                    </div>
                  </div>

                </div>

                <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                <p className="mt-2" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>
                  <strong style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "700", fontFamily: "BasisGrotesquePro", }}>Payment Terms:</strong><br />
                  Payment due within 30 days of invoice date.<br />
                  Late payments may be subject to a 1.5% monthly service charge.
                </p>

                <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />
                <div className="text-end mt-2">
                  <button
                    className="btn "
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

                    <span className="print"><PrintIcon /></span>
                    Print
                  </button>

                  <button
                    className="btn "
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
                    onClick={handleDownload}
                  >
                    <DownloadIcon style={{ marginRight: "4px" }} />
                    Download PDF
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default InvoicePopupWithPDF;

