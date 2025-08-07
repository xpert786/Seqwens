import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { PayIcon, ViewIcon, LockIcon, CrossIcon } from "../icons";
import { Modal, Button, Form } from 'react-bootstrap';

const OutstandingTab = () => {
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
        alert(`Payment of $${selectedInvoice.amount} for ${selectedInvoice.id} processed.`);
        setShowModal(false);
    };


    const invoices = [
        {
            id: 'INV-2024-001',
            status: 'overdue',
            name: 'Soccer & Martial Arts Programs',
            amount: 750,
            due: 'Mar 16, 2024',
        },
        {
            id: 'INV-2024-002',
            status: 'pending',
            name: 'Counseling Tax Consultation',
            amount: 500,
            due: 'Mar 20, 2024',
        },
    ];

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

            {invoices.map((inv, idx) => {
                const isSelected = selectedBoxes.includes(inv.id);
                return (
                    <div
                        key={idx}
                        className="border rounded p-3 mb-3"
                        onClick={() => toggleSelection(inv.id)}
                        style={{
                            backgroundColor: isSelected ? '#FFF4E6' : '#ffffff',
                            transition: 'background-color 0.3s ease',
                            cursor: 'pointer',
                            fontFamily: "BasisGrotesquePro",
                            marginLeft:"10px"
,                       }}
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
                                <strong style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{inv.id}</strong>
                                <span
                                    className="badge ms-2 px-2 py-1"
                                    style={{
                                        color: inv.status === 'overdue' ? '#991B1B' : '#854D0E',
                                        border: `1px solid ${inv.status === 'overdue' ? '#991B1B' : '#854D0E'}`,
                                        backgroundColor: inv.status === 'overdue' ? '#FEE2E2' : '#FEF9C3',
                                        fontSize: '12px',
                                        borderRadius: '15px',
                                        fontFamily: "BasisGrotesquePro"
                                    }}
                                >
                                    {inv.status}
                                </span>

                                <div className="small text-muted" style={{ marginLeft: "18px", fontFamily: "BasisGrotesquePro", fontSize: "12px", fontWeight: "400", color: "#4B5563" }}>{inv.name}</div>
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
                                        ${inv.amount}
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
            })}

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
                                <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} >Pay invoice {selectedInvoice.id}</small>
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
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>{selectedInvoice.id}</small>
                            </div>
                            <div className="d-flex justify-content-between mb-1" style={{ marginTop: "8px" }}>
                                <small style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Next Due Date</small>
                                <small style={{ color: "#3B4A66" }}>Mar 15</small>
                            </div>
                            <div className="d-flex justify-content-between mb-1" style={{ marginTop: "8px" }} >
                                <small style={{ color: "#3B4A66" }}>Description</small>
                                <small style={{ color: "#3B4A66" }}>2023 Tax Return Preparation</small>
                            </div>
                            <div className="d-flex justify-content-between mb-1" style={{ marginTop: "8px" }}>
                                <small style={{ color: "#3B4A66" }}>Due Date</small>
                                <small style={{ color: "#3B4A66" }}>Mar 15, 2024</small>
                            </div>
                            <div className="d-flex justify-content-between" style={{ marginTop: "8px" }}>
                                <small className="fw-bold" style={{ color: "#3B4A66" }}>Total Amount</small>
                                <small className="fw-bold" style={{ color: "#3B4A66" }}>${selectedInvoice.amount}</small>
                            </div>
                        </div>

                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>Payment Amount</Form.Label>
                                <Form.Control size="sm" type="number" placeholder="$ 0" defaultValue={selectedInvoice.amount} />
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
                                Pay ${selectedInvoice.amount}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default OutstandingTab;
