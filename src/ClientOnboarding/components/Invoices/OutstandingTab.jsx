import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { PayIcon, ViewIcon, LockIcon, CrossIcon } from "../icons";
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from "react-toastify";

const OutstandingTab = ({ invoices = [] }) => {
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const toggleSelection = (id) => {
        setSelectedBoxes((prev) =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handlePayNowClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedInvoice(null);
    };

    const handlePaymentSubmit = () => {
        toast.success(`Payment of $${(selectedInvoice.remaining_amount || selectedInvoice.amount || 0).toFixed(2)} for ${selectedInvoice.invoice_number || selectedInvoice.id} processed.`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
        setShowModal(false);
    };

    // Filter and map invoices to display format
    // Show invoices that are outstanding (pending status or have remaining amount)
    const outstandingInvoices = invoices
        .filter(inv => inv.status === 'pending' || (inv.remaining_amount && parseFloat(inv.remaining_amount) > 0))
        .map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number || `INV-${inv.id}`,
            status: inv.status || 'pending',
            name: inv.description || 'Invoice',
            amount: parseFloat(inv.remaining_amount || inv.amount || 0),
            due: inv.formatted_due_date || inv.due_date,
            description: inv.description,
            issue_date: inv.formatted_issue_date || inv.issue_date,
            due_date: inv.formatted_due_date || inv.due_date,
            client_name: inv.client_name,
            status_display: inv.status_display || inv.status,
            status_color: inv.status_color || (inv.status === 'overdue' ? 'red' : 'yellow'),
            paid_amount: parseFloat(inv.paid_amount || 0),
            remaining_amount: parseFloat(inv.remaining_amount || inv.amount || 0)
        }));

    // Get status badge style
    const getStatusBadgeStyle = (status, statusColor) => {
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
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [showModal]);


    return (
        <div className="bg-white p-3 rounded" >
            <div className="align-items-center mb-3 " style={{marginLeft:"10px"}}>
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

            {outstandingInvoices.length === 0 ? (
                <div className="text-center py-4" style={{ marginLeft: "10px" }}>
                    <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        No outstanding invoices at this time.
                    </p>
                </div>
            ) : (
                outstandingInvoices.map((inv, idx) => {
                    const isSelected = selectedBoxes.includes(inv.id);
                    const statusStyle = getStatusBadgeStyle(inv.status, inv.status_color);
                    return (
                        <div
                            key={inv.id || idx}
                            className="border rounded p-3 mb-3"
                            onClick={() => toggleSelection(inv.id)}
                            style={{
                                backgroundColor: isSelected ? '#FFF4E6' : '#ffffff',
                                transition: 'background-color 0.3s ease',
                                cursor: 'pointer',
                                fontFamily: "BasisGrotesquePro",
                                marginLeft: "10px"
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                {/* Left Info */}
                                <div>
                                    <input
                                        type="checkbox"
                                        className="form-check-input me-2"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(inv.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
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

                                    <div className="small text-muted" style={{ marginLeft: "18px", fontFamily: "BasisGrotesquePro", fontSize: "12px", fontWeight: "400", color: "#4B5563" }}>
                                        {inv.name}
                                    </div>
                                    <div className="small text-muted" style={{ marginLeft: "18px", marginTop: "2px", fontFamily: "BasisGrotesquePro", fontSize: "12px", fontWeight: "400", color: "#4B5563" }}>
                                        Due: {inv.due}
                                    </div>
                                </div>


                                <div className="text-center flex-grow-1">
                                    <div className="mb-0">
                                        <span style={{ color: "#4B5563", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                            Pay Invoice:
                                        </span>{' '}
                                        <span style={{ color: '#F56D2D', fontSize: "19px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                            ${inv.amount.toFixed(2)}
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
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ViewIcon />
                                    </button>

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
                                </div>
                            </div>
                        </div>
                    );
                })
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
                                        <Form.Control size="sm" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66" }} type="password" placeholder="123" />
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

        </div>
    );
};

export default OutstandingTab;
