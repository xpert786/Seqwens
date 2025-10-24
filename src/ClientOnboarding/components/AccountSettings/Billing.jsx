import React, { useState, useEffect } from "react";
import { BillIcon, DelIcon, CrossIcon } from "../icons";
import "../../styles/icon.css";
import { Modal, Button, Form } from "react-bootstrap";
import { billingAPI, handleAPIError } from "../../utils/apiUtils";

const Billing = () => {
  const [billingInformation, setBillingInformation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  const fetchBillingInformation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billingAPI.getBillingInformation();
      setBillingInformation(data);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };
  fetchBillingInformation();
}, []);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [editMonth, setEditMonth] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editDefault, setEditDefault] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      last4: "5678",
      brand: "MASTERCARD",
      expiry: "8/2026",
      isPrimary: true,
    },
    {
      id: 2,
      last4: "1234",
      brand: "VISA",
      expiry: "12/2025",
      isPrimary: false,
    },
  ]);

  const [billingAddress] = useState({
    name: "Michael Brown",
    street: "123 Main St",
    cityStateZip: "Anytown, CA 12345",
  });

  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const setAsPrimary = (id) => {
    const updatedMethods = paymentMethods.map((method) => ({
      ...method,
      isPrimary: method.id === id,
    }));
    setPaymentMethods(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    setShowModal(true);
  };

  const handleModalSave = () => {
    const newId = paymentMethods.length + 1;
    const newMethod = {
      id: newId,
      last4: "9999",
      brand: "AMEX",
      expiry: "10/2028",
      isPrimary: false,
    };
    setPaymentMethods([...paymentMethods, newMethod]);
    setShowModal(false);
  };

  const handleCardClick = (id) => setSelectedId(id);

  return (
    <div>
      <div className="align-items-center mb-3 ">
        <h3 className="mb-0 me-3" style={{ color: "#3B4A66", fontSize: "20px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Billing Information</h3>
        <p className="mb-0" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
          View your billing details and payment methods
        </p>
      </div>

      <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Payment Methods</h5>

      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className="mb-3 rounded p-3"
          style={{
            border: "1px solid #F49C2D",
            backgroundColor: selectedId === method.id ? "#FFF4E6" : "#FFFFFF",
            cursor: "pointer",
          }}
          onClick={() => handleCardClick(method.id)}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <div className="d-flex align-items-center gap-2">
              <span className="bill">
                <BillIcon />
              </span>
              <div className="d-flex flex-column">
                <div>
                  <span className="fw-bold">•••• •••• •••• {method.last4}</span>
                  {method.isPrimary && (
                    <span
                      className="ms-2"
                      style={{
                        backgroundColor: "#22C55E",
                        borderRadius: "1rem",
                        padding: "0.35em 0.65em",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        lineHeight: "1",
                        color: "white",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    >
                      Primary
                    </span>
                  )}
                </div>
                <small className="text-muted mt-2" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontWeight: "400", fontSize: "12px" }}>
                  {method.brand} - Expires {method.expiry}
                </small>
              </div>
            </div>
            <div className="d-flex gap-2">
              {!method.isPrimary && (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #22C55E", color: "#22C55E", fontFamily: "BasisGrotesquePro", fontSize: "16px", fontWeight: "400" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAsPrimary(method.id);
                  }}
                >
                  Set as Primary
                </button>
              )}
              <button
                className="btn btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditCard(method);
                  const [month, year] = method.expiry.split("/");
                  setEditMonth(month);
                  setEditYear(year);
                  setEditDefault(method.isPrimary);
                  setShowEditModal(true);
                }}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8F0FF",
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "16px",
                  fontWeight: "400"
                }}
              >
                Edit
              </button>

            </div>
          </div>
        </div>
      ))}

      <button
        className="btn mb-4"
        style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8F0FF", color: "#3B4A66", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
        onClick={handleAddPaymentMethod}
      >
        <i className="bi bi-plus-lg me-2"></i> Add Payment Method
      </button>

      <h5 className="mb-3" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "18px", fontWeight: "500" }}>Billing Address</h5>
      <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8F0FF' }}>
        <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.name}</p>
        <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.street}</p>
        <p className="mb-0" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>{billingAddress.cityStateZip}</p>
      </div>

      <button className="btn" style={{ backgroundColor: "#F3F7FF", border: "1px solid #E8F0FF", color: "#3B4A66", fontSize: "17px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
        Edit Billing Address
      </button>



      {/* Edit popup pages */}

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        dialogClassName="custom-modal-width"
        contentClassName="rounded-4"
      >
        <Modal.Header className="border-0 pb-0">
          <div className="d-flex justify-content-between align-items-start w-100">
            <div>
              <Modal.Title style={{
                fontFamily: "BasisGrotesquePro",
                fontWeight: 500,
                color: "#3B4A66",
                fontSize: "22px",
                marginLeft: "8px"
              }}>
                Edit Payment Method
              </Modal.Title>
              <p style={{
                color: "#4B5563",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "400",
                marginLeft: "8px",
                marginBottom: "0",
              }}>
                Update your payment method details
              </p>
            </div>
            <Button
              variant="light"
              onClick={() => setShowEditModal(false)}
              style={{
                backgroundColor: "#F0F4FF",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CrossIcon size={18} color="#1F2937" />
            </Button>
          </div>
        </Modal.Header>

        <hr style={{ borderColor: "#c9ccd1ff", margin: "0" }} />

        <Modal.Body style={{ padding: "1rem 1.5rem" }}>
          <Form>
            <div className="d-flex gap-2 mb-3">
              <Form.Group className="w-50">
                <Form.Label style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}>Month</Form.Label>
                <Form.Select value={editMonth} onChange={(e) => setEditMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="w-50">
                <Form.Label style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}>Year</Form.Label>
                <Form.Select value={editYear} onChange={(e) => setEditYear(e.target.value)}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={2025 + i}>{2025 + i}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <Form.Check
              type="switch"
              id="set-default"
              label="Set as default payment method"
              className="custom-switch"
            />
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 justify-content-between">
          <div className="d-flex align-items-center">
            <Button
              style={{
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro",
                backgroundColor: "#EF4444",
                border: "1px solid #EF4444",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <DelIcon /> Print
            </Button>

            <Button
              variant="light"
              onClick={() => setShowEditModal(false)}
              style={{
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro",
                marginLeft: "12px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8F0FF"
              }}
            >
              Cancel
            </Button>
          </div>


          <div className="d-flex gap-">

            <Button
              style={{
                backgroundColor: "#F56D2D",
                border: "none",
                color: "#FFFFFF",
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro"
              }}
              onClick={() => {
                const updated = paymentMethods.map((pm) =>
                  pm.id === editCard.id
                    ? { ...pm, expiry: `${editMonth}/${editYear}`, isPrimary: editDefault }
                    : editDefault ? { ...pm, isPrimary: false } : pm
                );
                setPaymentMethods(updated);
                setShowEditModal(false);
              }}
            >
              Update Payment Method
            </Button>
          </div>
        </Modal.Footer>

      </Modal>






      {/* Add payment popup pages */}

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        dialogClassName="custom-modal-width"
        contentClassName="rounded-4"
      >
        <Modal.Header className="border-0 pb-0">
          <div className="d-flex justify-content-between align-items-start w-100">
            <div>
              <Modal.Title
                style={{
                  fontFamily: "BasisGrotesquePro",
                  fontWeight: 500,
                  color: "#3B4A66",
                  fontSize: "22px",
                  marginLeft: "8px"
                }}
              >
                Add Payment Method
              </Modal.Title>
              <p
                style={{
                  color: "#6B7280",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#4B5563",
                  marginLeft: "8px",
                  marginBottom: "0",
                }}
              >
                Add a new payment method to your account
              </p>
            </div>
            <Button
              variant="light"
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: "#F0F4FF",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CrossIcon size={18} color="#1F2937" />
            </Button>
          </div>
        </Modal.Header>

        <hr style={{ borderColor: "#c9ccd1ff", margin: "0" }} />

        <Modal.Body style={{ padding: "1rem 1.5rem" }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Card Number</Form.Label>
              <Form.Control type="text" placeholder="1234 5678 9012 3456" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Cardholder Name</Form.Label>
              <Form.Control type="text" placeholder="John Doe" />
            </Form.Group>

            <div className="d-flex gap-2">
              <Form.Group className="mb-3 w-50">
                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Expiry Date</Form.Label>
                <Form.Control type="text" placeholder="MM/YYYY" />
              </Form.Group>

              <Form.Group className="mb-3 w-50">
                <Form.Label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>CVV</Form.Label>
                <Form.Control type="text" placeholder="123" />
              </Form.Group>
            </div>

            <Form.Check
              type="switch"
              id="set-default"
              label="Set as default payment method"
              style={{
                color: "#3B4A66",
                fontSize: "12px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
              className="custom-switch"
            />

          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowModal(false)} style={{ color: "#131323", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: "#F56D2D", border: "none", color: "#FFFFFF", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
            onClick={handleModalSave}
          >
            Add Payment Method
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Billing;