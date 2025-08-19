
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ViewIcon, DownloadIcon, PrintIcon, CrossIcon } from "../icons";
import "../../styles/Login.css";

const invoices = [
  {
    id: "INV-2024-001",
    description: "2023 Tax Return Preparation",
    paidDate: "Mar 15 2024",
    method: "Credit Card",
    amount: "$750.00",
    quantity: 1,
    rate: "$750.00",
    subtotal: "$750.00",
    tax: "$0.00",
    total: "$750.00",
    client: {
      name: "Michael Boone",
      address: "468 Client Avenue, Client City, State 67890",
      email: "michaelboone@gmail.com",
    },
  },
  {
    id: "INV-2024-001",
    description: "2023 Tax Return Preparation",
    paidDate: "Mar 15 2024",
    method: "Credit Card",
    amount: "$750.00",
    quantity: 1,
    rate: "$750.00",
    subtotal: "$750.00",
    tax: "$0.00",
    total: "$750.00",
    client: {
      name: "Michael Boone",
      address: "468 Client Avenue, Client City, State 67890",
      email: "michaelboone@gmail.com",
    },
  },
];

const InvoicePopupWithPDF = () => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const invoiceRef = useRef(null);

  const handleDownload = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`${invoices[selectedIndex].id}.pdf`);
  };

  return (
    <div className="bg-white p-3 rounded ">
      <div className="align-items-center mb-3" style={{marginLeft:"10px"}}>
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Paid Invoices
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
          Your payment history
        </p>
      </div>
      {invoices.map((invoice, index) => (
        <div
          key={index}
          className="border rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center position-relative"
          style={{
            cursor: 'pointer',
            backgroundColor: selectedIndex === index ? '#FFF4E6' : '#ffffff',
            borderColor: selectedIndex === index ? '#f7c491' : '#dee2e6',
            marginLeft:"10px"

          }}
          onClick={() => setSelectedIndex(index)}
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
                className="btn btn-sm me-2"
                onClick={() => {
                  setSelectedIndex(index);
                  setShowPopup(true);
                }}
              >
                <ViewIcon />
              </button>
              <button
                className="btn  btn-sm"
                onClick={async () => {
                  setSelectedIndex(index);
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
      ))}

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
                    <h5 className="mb-1" style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "700", fontFamily: "BasisGrotesquePro" }}>Invoice {invoices[selectedIndex].id}</h5>
                    <p className="text-muted mb-3">Invoice details and payment information</p>

                    <div
                      className="p-2 rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "80px",
                        height: "50px",
                        backgroundColor: "#E8F0FF",
                      }}
                    >
                      <strong style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Logo</strong>
                    </div>

                    <p className="mt-2 mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>123 Business Street</p>
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>City, State 12345</p>
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>Phone: (855) 123-4567</p>
                    <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "8px", fontWeight: "400" }}>Email: billing@cpaservices.com</p>
                  </div>

                  <div style={{ marginTop: "65px" }}>
                    <h6 style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "600" }}>INVOICE</h6>
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{invoices[selectedIndex].id}</p>
                    <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>Phone: (855) 123-4567</p>
                    <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>Email: billing@cpaservices.com</p>
                  </div>
                </div>

                <hr style={{ borderTop: "2px solid #4B5563", margin: "4px 0" }} />

                <div className="mb-3 mt-2">
                  <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Bill To:</h5>
                  <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{invoices[selectedIndex].client.name}</p>
                  <p className=" mb-1" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{invoices[selectedIndex].client.address}</p>
                  <p style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "10px", fontWeight: "400" }}>{invoices[selectedIndex].client.email}</p>
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
                    <div className="flex-grow-1" style={{ fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>{invoices[selectedIndex].description}</div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {invoices[selectedIndex].quantity}
                    </div>
                    <div style={{ width: "80px", textAlign: "center", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {invoices[selectedIndex].rate}
                    </div>
                    <div style={{ width: "80px", textAlign: "end", fontSize: "10px", fontWeight: 400, color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {invoices[selectedIndex].amount}
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
                      {invoices[selectedIndex].subtotal}
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
                      {invoices[selectedIndex].tax}
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
                      {invoices[selectedIndex].total}
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
                   
                    <span className="print"><PrintIcon /></span>
                    Print
                  </button>

                  <button
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

