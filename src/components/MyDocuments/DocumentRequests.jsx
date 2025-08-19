import React, { useState } from 'react';
import { FileIcon, BlackDateIcon, OverIcon, UpIcon } from "../icons";
import "../../styles/MyDocuments.css";

export default function MyDocuments() {
  const [activeCard, setActiveCard] = useState(null);

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
    <div>
      {/* Pending Requests */}
      <div className="mydocs-container">
        <div className="mydocs-header">
          <h5 className="mydocs-title">Pending Document Requests</h5>
          <p className="mydocs-subtitle">
            Documents requested by your tax professional
          </p>
        </div>

        <div className="mt-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`mydocs-card ${activeCard === doc.id ? 'active' : ''}`}
              onClick={() => setActiveCard(doc.id)}
            >
              <div className="d-flex justify-content-between align-items-start w-100">
                <div className="w-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-3">
                      <span className="mydocs-icon-wrapper">
                        <FileIcon />
                      </span>

                      <strong className="mydocs-doc-title">
                        {doc.year} {doc.type}
                      </strong>

                      <span className="badge mydocs-badge-priority">
                        {doc.priority}
                      </span>
                      <span className="badge mydocs-badge-status">
                        {doc.status}
                      </span>
                    </div>

                    <button className="btn btn-sm mydocs-upload-btn d-flex align-items-center gap-2">
                      <UpIcon />
                      Upload
                    </button>

                  </div>

                  <div className="mydocs-description">
                    Please upload W-2 for 2023 tax year
                  </div>

                  <div className="d-flex flex-wrap mb-1 mydocs-info">
                    <div className="d-flex align-items-center">
                      <BlackDateIcon />
                      <span className="ms-2">
                        <strong className="fw-normal">Due:</strong> {doc.dueDate}
                      </span>
                      <span className="ms-2">
                        <strong className="fw-normal">Requested by:</strong> {doc.requestedBy}
                      </span>
                      <span className="ms-2 mydocs-reminder">
                        {doc.reminders} reminder sent
                      </span>
                    </div>
                  </div>

                  <div className="mydocs-overdue">
                    <OverIcon /> Overdue by {doc.overdueDays} days
                  </div>

                  <div className="mydocs-instructions">
                    <span className="mydocs-instructions-title">Instructions:</span>
                    <p className="mydocs-instructions-text">{doc.description}</p>
                  </div>

                  <div>
                    <strong className="mydocs-req-title">Requested Documents:</strong>
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {doc.requestedDocs.map((item, idx) => (
                        <div key={idx} className="mydocs-req-chip">
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

