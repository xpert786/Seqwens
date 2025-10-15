import React, { useState } from "react";
import { Accordion } from "react-bootstrap";
import PhoneInput from 'react-phone-input-2';
import "../styles/Dataintake.css";
import { FaPlus, FaTrash, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


export default function DataIntakeForm() {

  const [filingStatus, setFilingStatus] = useState("");
  const [hasDependents, setHasDependents] = useState(false);
  const [dependents, setDependents] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    // Save first-time user flag
    localStorage.setItem("userStatus", "new");
    navigate("/dashboard-first");

  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };
  const handleRemoveFile = () => {
    setUploadedFile(null);
  };


  const handleAddDependent = () => {
    setDependents([
      ...dependents,
      { firstName: '', middleInitial: '', lastName: '', dob: '', ssn: '' }
    ]);
  };

  const handleRemoveDependent = (index) => {
    const updated = [...dependents];
    updated.splice(index, 1);
    setDependents(updated);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...dependents];
    updated[index][field] = value;
    setDependents(updated);
  };
  return (
    <div className="row g-0 px-4 " >
      <div className="align-items-center mb-3 ">
        <h5 className="mb-0 me-3 " style={{
          color: "#3B4A66",
          fontSize: "28px",
          fontWeight: "500",
          fontFamily: "BasisGrotesquePro",
        }}>Data Intake Form</h5>
        <p className="mb-0" style={{
          color: "#4B5563",
          fontSize: "14px",
          fontWeight: "400",
          fontFamily: "BasisGrotesquePro",
        }}>Completed your tax informations started</p>
      </div>



      {/* Personal Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4 ">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Personal Information</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Your basic persnol and contact information</p>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>First Name</label>
            <input type="text" className="form-control" placeholder="Michale" />
          </div>
          <div className="col-md-2">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Middle Initial</label>
            <input type="text" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Last Name</label>
            <input type="text" className="form-control" placeholder="Brown" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Date of Birth</label>
            <input type="date" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Social Security Number (SSN)</label>
            <input type="text" className="form-control" />
          </div>

          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="michael@example.com"
              style={{ height: '45px' }}

            />
          </div>

          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Phone</label>
            <PhoneInput
              country={'us'}
              inputClass="form-control"
              containerClass="w-100"
              inputStyle={{
                width: '100%',
                height: '45px',
                padding: '6px 12px',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
              }}
              placeholder="Enter phone number"
            />
          </div>
          <div className="col-md-12">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Address</label>
            <input type="text" className="form-control" placeholder="123 Main St" />
          </div>
          <div className="col-md-3">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>City</label>
            <input type="text" className="form-control" placeholder="Anytown" />
          </div>
          <div className="col-md-3">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>State</label>
            <input type="text" className="form-control" placeholder="California" />
          </div>
          <div className="col-md-3">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>ZIP Code</label>
            <input type="text" className="form-control" placeholder="12345" />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Filing Status</label>
            <select className="form-select mt-2">
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_household">Head of Household</option>
              <option value="widow">Qualifying Widow</option>
            </select>
          </div>

        </div>
      </div>


      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Spouse Information</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Your spouse's information for joint filing</p>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>First Name</label>
            <input type="text" className="form-control" placeholder="sara" />
          </div>
          <div className="col-md-2">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Middle Initial</label>
            <input type="text" className="form-control" />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Last Name</label>
            <input type="text" className="form-control" placeholder="Johnson" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Date of Birth</label>
            <input type="date" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Social Security Number</label>
            <input type="text" className="form-control" placeholder="Michale" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="michael@example.com"
              style={{ height: '45px' }}

            />
          </div>

          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Phone</label>
            <PhoneInput
              country={'us'}
              inputClass="form-control"
              containerClass="w-100"
              inputStyle={{
                width: '100%',
                height: '45px',
                padding: '6px 12px',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
              }}
              placeholder="Enter phone number"
            />
          </div>

        </div>
      </div>
      <div className="card p-4 mb-4">

        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Dependents Information</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Information about your dependents</p>
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={hasDependents}
            onChange={(e) => setHasDependents(e.target.checked)}
            id="hasDependents"
          />
          <label className="form-check-label" htmlFor="hasDependents" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
            Do you have dependents?
          </label>
        </div>

        {hasDependents && (
          <>
            {dependents.length === 0 ? (
              <div className="text-center">
                <p className="text-muted mb-2" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 500, fontSize: "20px", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>No Dependents Added Yet</p>
                <button className="btn" style={{ border: "1px solid #E8F0FF", backgroundColor: "#F3F7FF", fontWeight: "500", fontSize: "13px", fontFamily: "BasisGrotesquePro" }} onClick={handleAddDependent}>
                  <FaPlus className="me-2" /> Add First Dependent
                </button>
              </div>
            ) : (
              <div className="dependent-list">
                {dependents.map((dep, index) => (
                  <div key={index} className="mb-4">
                    <div className="d-flex ">
                      <h3 className="mb-0" style={{ color: "#3B4A66", fontSize: "18px", }}>Dependent #{index + 1}</h3>
                      <button
                        className="btn btn-sm p-3"
                        onClick={() => handleRemoveDependent(index)}
                        title="Remove"
                        style={{ marginLeft: "72%" }}
                      >
                        <FaTrashAlt color="#EF4444" size={18} />
                      </button>

                    </div>
                    <div className="row align-items-end">
                      <div className="col-md-2">
                        <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "186x", color: "#3B4A66" }}>First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={dep.firstName}
                          onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                          placeholder="Sara"
                        />
                      </div>
                      <div className="col-md-1">
                        <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Middle Initial</label>
                        <input
                          type="text"
                          className="form-control"
                          value={dep.middleInitial}
                          onChange={(e) => handleInputChange(index, 'middleInitial', e.target.value)}
                          placeholder="sara"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={dep.lastName}
                          onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                          placeholder="Johnson"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Date of Birth</label>
                        <input
                          type="text"
                          className="form-control"
                          value={dep.dob}
                          onChange={(e) => handleInputChange(index, 'dob', e.target.value)}
                          placeholder="MM/DD/YYYY"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Social Security Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={dep.ssn}
                          onChange={(e) => handleInputChange(index, 'ssn', e.target.value)}
                          placeholder="Michale"

                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-outline-primary custom-btn-bg"
                  onClick={handleAddDependent} style={{ border: "1px solid #E8F0FF", backgroundColor: "#F3F7FF", fontWeight: "500", fontSize: "13px", fontFamily: "BasisGrotesquePro" }}
                >
                  <FaPlus className="me-2" /> Add Another Dependent
                </button>


              </div>
            )}
          </>
        )}
      </div>

      {/* Income */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Income Information</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Select all income types apply to you</p>
        </div>
        <div className="form-check mb-2">
          <input className="form-check-input" type="radio" name="filingStatus" value="w2" onChange={e => setFilingStatus(e.target.value)} />
          <label className="form-check-label" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>W-2</label>
        </div>
        <div className="form-check mb-2">
          <input className="form-check-input" type="radio" name="filingStatus" value="1099" onChange={e => setFilingStatus(e.target.value)} />
          <label className="form-check-label" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>1099</label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="radio" name="filingStatus" value="business" onChange={e => setFilingStatus(e.target.value)} />
          <label className="form-check-label" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Self-employed or business</label>
        </div>
      </div>


      {/* Other Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Other Information</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Additionals informations that may affect your tax return</p>
        </div>
        <div className="row">
          <div className="col-md-6 mb-2">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="ownHome" />
              <label className="form-check-label" htmlFor="ownHome" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Do you own a home?</label>
            </div>
            <div className="form-check mt-2">
              <input className="form-check-input" type="checkbox" id="inSchool" />
              <label className="form-check-label" htmlFor="inSchool" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Are you in school?</label>
            </div>
          </div>
          <div className="col-md-6 mb-2">
            <label className="form-label d-block" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Do you have other deductions or income your preparer should be aware of?</label>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="otherDeductions" id="otherYes" value="yes" />
              <label className="form-check-label" htmlFor="otherYes">Yes</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="otherDeductions" id="otherNo" value="no" />
              <label className="form-check-label" htmlFor="otherNo">No</label>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Additional Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Optional Additional Information</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Complete these sections if they apply to your situation</p>
        </div>

        <div className="list-group">
          <button className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            Business Information <span>&gt;</span>
          </button>
          <button className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mt-3">
            Rental Property Details <span>&gt;</span>
          </button>
          <button className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mt-3">
            Additional Deductions <span>&gt;</span>
          </button>
        </div>
      </div>


      {/* Direct Deposit */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">

        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Direct Depositn</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Provide your bank account information for direct deposit of your tax refaund</p>
        </div>

        <div className="col-md-6">
          <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "18px", color: "#3B4A66" }}>Bank Name</label>
          <input type="text" className="form-control" />
        </div>
        <div className="row g-3">


          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Routing Number</label>
            <input type="text" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Confirm Routing Number</label>
            <input type="text" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Account Number</label>
            <input type="text" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" }}>Confirm Account Number</label>
            <input type="text" className="form-control" />
          </div>
        </div>
      </div>


      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3 ">
          <h5 className="mb-0 me-3 " style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}>Document Upload</h5>
          <p className="mb-0" style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}>Upload your tax documents</p>
        </div>

        <div className="row align-items-start">
          {/* Upload Box */}
          <div className="col-md-6">
            <label
              htmlFor="file-upload"
              className="border rounded d-flex flex-column align-items-center justify-content-center p-4 text-center cursor-pointer"
              style={{
                minHeight: "180px",
                backgroundColor: "#f9fcff",
                borderStyle: "dashed",
                borderColor: "#ccc" // light gray
              }}
            >
              <div style={{ fontSize: "2rem", color: "#00aaff" }}>
                <i className="bi bi-upload" />
              </div>
              <strong style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Drop files here or click to browse</strong>
              <small className="mt-2" style={{ color: "#4B5563", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} >
                Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS (Max 10MB per file)
              </small>
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="d-none"
            />
          </div>

          {/* Uploaded File Preview */}
          {uploadedFile && (
            <div className="col-md-6 mt-3 mt-md-0">
              <div className="border rounded p-3 d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold">{uploadedFile.name}</div>
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark">Unrecognized</span>
                  <button
                    onClick={handleRemoveFile}
                    className="btn p-0 m-0 d-flex align-items-center justify-content-center"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      color: '#000',
                      fontSize: '16px',
                      lineHeight: '1',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-secondary">Save Draft</button>
        <button
          className="btn text-white"
          style={{ backgroundColor: '#F56D2D' }}
          onClick={handleSubmit}
        >
          Submit
        </button>

      </div>
    </div>
   
  );
}
