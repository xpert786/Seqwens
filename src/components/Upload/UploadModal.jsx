import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

export default function UploadModal({ show, handleClose }) {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState({}); // file wise category

  // File selection handle
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  // Category change handle
  const handleCategoryChange = (fileName, category) => {
    setCategories((prev) => ({ ...prev, [fileName]: category }));
  };

  return (
    <Modal show={show} onHide={handleClose} size={step === 2 ? "lg" : "md"} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ color: "#F56D2D" }}>Upload Documents</Modal.Title>
      </Modal.Header>

      {/* Step 1 */}
      {step === 1 && (
        <>
          <Modal.Body>
            <p>Upload your tax documents securely</p>
            <div
              className="border rounded d-flex flex-column justify-content-center align-items-center p-5"
              style={{ borderStyle: "dashed", background: "#FCFCFD" }}
            >
              <input
                type="file"
                multiple
                className="form-control"
                style={{ maxWidth: "300px" }}
                onChange={handleFileChange}
              />
              <p className="text-muted mt-3 mb-0">Drop files here or click to browse</p>
              <small className="text-muted">
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 50MB per file)
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              style={{ backgroundColor: "#F56D2D", border: "none" }}
              onClick={() => setStep(2)}
              disabled={files.length === 0}
            >
              Upload Documents
            </Button>
          </Modal.Footer>
        </>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <>
          <Modal.Body>
            <div
              className="border rounded d-flex flex-column justify-content-center align-items-center p-4"
              style={{ borderStyle: "dashed", background: "#FCFCFD" }}
            >
              <input
                type="file"
                multiple
                className="form-control"
                style={{ maxWidth: "300px" }}
                onChange={handleFileChange}
              />
              <p className="text-muted mt-3 mb-0">Drop more files or click to browse</p>
            </div>

            <div className="row mt-4">
              {/* Left: File List */}
              <div className="col-md-6">
                <h6>Documents ({files.length})</h6>
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                  >
                    <div>
                      <strong>{file.name}</strong>
                      <div className="small text-muted">{(file.size / 1024).toFixed(2)} KB</div>
                    </div>
                    <span className="badge bg-warning text-dark">Pending</span>
                  </div>
                ))}
              </div>

              {/* Right: Config Section */}
              <div className="col-md-6">
                <h6>Configure Documents</h6>
                {files.map((file, i) => (
                  <div key={i} className="mb-3">
                    <label className="form-label">
                      {file.name} - Category
                    </label>
                    <select
                      className="form-select"
                      value={categories[file.name] || ""}
                      onChange={(e) => handleCategoryChange(file.name, e.target.value)}
                    >
                      <option value="">Select a Category</option>
                      <option value="Income Documents">Income Documents</option>
                      <option value="Tax Returns">Tax Returns</option>
                      <option value="W-2 Forms">W-2 Forms</option>
                    </select>
                  </div>
                ))}

                <div>
                  <label className="form-label">Selected Folder</label>
                  <div className="border rounded p-2">
                    Tax Year 2023 &gt; Income Documents &gt; W-2 Forms
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              style={{ backgroundColor: "#F56D2D", border: "none" }}
              disabled={files.length === 0}
            >
              Upload {files.length} Files
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
