import React, { useState, useRef } from "react";

const ESignatureModal = ({ show, onClose, pages }) => {
  const [activeTab, setActiveTab] = useState("draw");
  const canvasRef = useRef(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [initials, setInitials] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const today = new Date().toISOString().slice(0, 10);

  if (!show) return null;

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedSignature(URL.createObjectURL(file));
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded shadow p-4 w-100" style={{ maxWidth: "1300px", maxHeight: "95vh", overflow: "hidden" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-semibold" style={{ fontFamily: "BasisGrotesquePro",}}>E-Signature – Tax_Return_2023_DRAFT.Pdf</h5>
            <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro",}}>Review and electronically sign this document</small>
          </div>
          <button className="btn btn-outline-secondary" onClick={onClose}>✖</button>
        </div>

        {/* Signer Selection */}
             <h6>Select current Signer</h6>
        <div className="d-flex gap-3 mb-3">
       
          <div className="flex-grow-1  text-white rounded d-flex align-items-center justify-content-between px-3 py-2" style={{backgroundColor:"#00C0C6"}}>
            <div>
              <div className="fw-bold" >Primary Taxpayer</div>
              <small>Signer: Michael Brown</small>
            </div>
            <span className="badge bg-light text-dark">Pending</span>
          </div>
          <div className="flex-grow-1 border rounded d-flex align-items-center justify-content-between px-3 py-2" style={{backgroundColor:"#F3F7FF"}}>
            <div>
              <div className="fw-bold">Spouse</div>
              <small>Signer: Jennifer Brown</small>
            </div>
            <span className="badge bg-light text-dark">Pending</span>
          </div>
        </div>

        <div className="d-flex" style={{ height: "calc(100% - 150px)" }}>
          {/* Thumbnails */}
          <div className="border-end pe-2" style={{ width: "100px", overflowY: "auto" }}>
            {pages.map((page, index) => (
              <img
                key={page.id}
                src={page.image}
                alt={`Page ${page.id}`}
                className={`img-thumbnail mb-2 ${currentPageIndex === index ? "border-primary border-2" : ""}`}
                style={{ cursor: "pointer", width: "100%" }}
                onClick={() => setCurrentPageIndex(index)}
              />
            ))}
          </div>

          {/* Page Preview */}
          <div className="flex-grow-1 px-3" style={{ overflowY: "auto", maxHeight: "80vh" }}>
            <img src={pages[currentPageIndex].image} alt={`Page ${currentPageIndex + 1}`} style={{ width: "100%", borderRadius: "6px" }} />
            <div className="text-center mt-2">
              Page {currentPageIndex + 1} of {pages.length}
            </div>
          </div>

          {/* Signature Form */}
          <div className="border-start ps-3" style={{ width: "360px" }}>
            <h6 className="mb-3">Complete Signature Fields <small className="text-muted">(Primary Taxpayer: Michael Brown)</small></h6>

            <label className="fw-semibold mb-2 d-block">Signature <span className="text-danger">(Required)</span></label>
            <ul className="nav nav-tabs mb-3">
              {['draw', 'type', 'upload'].map(tab => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </li>
              ))}
            </ul>

            {activeTab === 'draw' && (
              <>
                <canvas ref={canvasRef} width={300} height={100} style={{ border: '1px solid #ccc', borderRadius: '4px', width: '100%' }} />
                <div className="d-flex justify-content-between mt-2">
                  <button className="btn btn-sm btn-outline-danger" onClick={clearCanvas}>Clear</button>
                  <button className="btn btn-sm btn-warning">Apply Signature</button>
                </div>
              </>
            )}

            {activeTab === 'type' && (
              <input type="text" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} placeholder="Type your signature" className="form-control mb-3" />
            )}

            {activeTab === 'upload' && (
              <>
                <input type="file" accept="image/*" onChange={handleUpload} className="form-control mb-2" />
                {uploadedSignature && <img src={uploadedSignature} alt="Uploaded Signature" style={{ maxWidth: '100%', height: 'auto' }} />}
              </>
            )}

            <div className="mb-3 mt-3">
              <label>Date <span className="text-danger">(Required)</span></label>
              <input type="date" className="form-control" value={today} readOnly />
            </div>

            <div className="mb-3">
              <label>Initial <span className="text-muted">(Optional)</span></label>
              <input type="text" className="form-control" placeholder="Enter Initials" value={initials} onChange={(e) => setInitials(e.target.value)} />
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <div>
                <button className="btn btn-outline-primary me-2">Preview</button>
                <button className="btn text-white" style={{ backgroundColor: "#F56D2D" }}>Complete Signature</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignatureModal;