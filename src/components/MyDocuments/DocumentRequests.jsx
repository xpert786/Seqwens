import React, { useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { FileIcon } from "../icons";
import { Link, useLocation } from 'react-router-dom';
import { BlackDateIcon, OverIcon, UpIcon } from "../icons"

export default function MyDocuments() {
  const [activeCard, setActiveCard] = useState(null);
  const location = useLocation();



  const documents = [
    {
      id: 1,
      year: '2022',
      type: 'W-2 Forms',
      dueDate: 'Mar 15, 2024',
      status: 'Pending',
      priority: 'High',
      requestedBy: 'Johnson, CPA',
      reminders: 1,
      overdueDays: 462,
      description:
        'Please upload all W-2 forms issued for employment for tax year 2022. Ensure all forms are complete and legible.',
      requestedDocs: ['My Paystub Copy', 'ID Verification'],
    },
    {
      id: 2,
      year: '2022',
      type: 'W-2 Forms',
      dueDate: 'Mar 16, 2024',
      status: 'Pending',
      priority: 'High',
      requestedBy: 'Johnson, CPA',
      reminders: 1,
      overdueDays: 462,
      description:
        'Please upload all W-2 forms issued for employment for tax year 2022. Ensure all forms are complete and legible.',
      requestedDocs: ['My Paystub Copy'],
    },
  ];

  return (
    <div >

      {/* Pending Requests */}
      <div className="bg-white p-4 rounded">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3" style={{ fontSize: "18px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
            Pending Document Requests
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
            Documents requested by your tax professional
          </p>
        </div>

        <div className="mt-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-4 p-3 mb-3"
              style={{
                cursor: 'pointer',
                backgroundColor: activeCard === doc.id ? '#FFF3E1' : '#FFFFFF',
                border: `1px solid ${activeCard === doc.id ? '#F49C2D' : '#dee2e6'}`,
              }}
              onClick={() => setActiveCard(doc.id)}
            >

              <div className="d-flex justify-content-between align-items-start">
                <div className="w-100">

                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-3">

                      < FileIcon /><strong className="me-2" style={{ fontSize: "15px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>{doc.year} {doc.type}</strong>

                      <span
                        className="badge text-white"
                        style={{
                          backgroundColor: '#EF4444',
                          fontSize: '12px',
                          fontFamily: "BasisGrotesquePro"

                        }}
                      >
                        {doc.priority}
                      </span>
                      <span
                        className="badge text-white"
                        style={{
                          backgroundColor: '#854D0E',
                          fontSize: '12px',
                          fontFamily: "BasisGrotesquePro"
                        }}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <button
                      className="btn btn-sm text-white d-flex align-items-center"
                      style={{
                        backgroundColor: '#F56D2D',
                        fontFamily: "BasisGrotesquePro",
                        gap: "6px",
                      }}
                    >
                      <UpIcon />
                      Upload
                    </button>

                  </div>


                  <div className="mb-1" style={{ marginLeft: "40px", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400", color: "#4B5563" }}>
                    Please upload W-2 for 2023 tax year
                  </div>


                  <div className="d-flex flex-wrap mb-1" style={{ marginLeft: "40px", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400", color: "#4B5563" }}>
                    <div
                      className="d-flex align-items-center"
                      style={{
                        fontSize: "14px",
                        fontFamily: "BasisGrotesquePro",
                        color: "#4B5563",
                      }}
                    >
                      <BlackDateIcon />
                      <span style={{ marginLeft: "8px", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400", color: "#4B5563" }}>
                        <strong className="fw-normal">Due:</strong> {doc.dueDate}
                      </span>

                      <span style={{ marginLeft: "8px", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400", color: "#4B5563" }}>
                        <strong className="fw-normal">Requested by:</strong> {doc.requestedBy}
                      </span>

                      <span style={{ color: "#51E7BB", marginLeft: "8px", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>1 reminder sent</span>
                    </div>

                  </div>

                  <div className="mb-2" style={{ marginLeft: "40px", fontFamily: "BasisGrotesquePro", color: "#51E7BB", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "400" }}>
                    <OverIcon /> Overdue by {doc.overdueDays} days
                  </div>


                  <div
                    className="p-2 mb-2 rounded-2"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#000',
                      fontSize: '14px',
                      fontFamily: "BasisGrotesquePro",
                      border: "1px solid #FFF4E6"
                    }}
                  >
                    <span style={{ color: "#3B4A66", fonts: "14px", fontWeight: "500" }}> Instructions:</span>  <br />
                    <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>{doc.description}</p>
                  </div>
                  <div>
                    <strong style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "600", fontFamily: "BasisGrotesquePro", marginLeft: "8px" }}>Requested Documents:</strong>
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {doc.requestedDocs.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 mb-2 text-dark"
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #FFF4E6",
                            borderRadius: "2000px",
                            fontSize: "12px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                            display: "inline-block",
                          }}
                        >
                          {item}
                        </div>

                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

