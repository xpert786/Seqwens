import React, { useState, useEffect } from "react";
import { Accordion } from "react-bootstrap";
import PhoneInput from 'react-phone-input-2';
import "../styles/Dataintake.css";
import { FaPlus, FaTrash, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { dataIntakeAPI, handleAPIError } from "../utils/apiUtils";
import { getAccessToken, getUserData } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";

export default function DataIntakeForm() {
  const [filingStatus, setFilingStatus] = useState("");
  const [hasDependents, setHasDependents] = useState(false);
  const [dependents, setDependents] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    middleInitial: "",
    lastName: "",
    dateOfBirth: "",
    ssn: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    filingStatus: "",
  });

  // Spouse Information State
  const [spouseInfo, setSpouseInfo] = useState({
    firstName: "",
    middleInitial: "",
    lastName: "",
    dateOfBirth: "",
    ssn: "",
    email: "",
    phone: "",
  });

  // Bank Information State
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    routingNumber: "",
    confirmRoutingNumber: "",
    accountNumber: "",
    confirmAccountNumber: "",
  });

  // Other Information State
  const [otherInfo, setOtherInfo] = useState({
    ownsHome: false,
    inSchool: false,
    otherDeductions: "",
  });

  const navigate = useNavigate();

  // Check if user already has data intake data and pre-fill form
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          console.log("No access token found");
          return;
        }

        console.log("Checking for existing data intake data...");
        
        // Call both APIs to check for existing data
        const apiBaseUrl = getApiBaseUrl();
        const [personalDataResponse, fileDataResponse] = await Promise.all([
          // Check for personal data
          fetch(`${apiBaseUrl}/taxpayer/personal-data-intake/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }),
          // Check for uploaded files
          fetch(`${apiBaseUrl}/taxpayer/income-data-intake/`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })
        ]);

        // Handle personal data response
        if (personalDataResponse.ok) {
          const personalResult = await personalDataResponse.json();
          console.log("Existing personal data found:", personalResult);
          
          if (personalResult.success && personalResult.data) {
            const data = personalResult.data;
            
            // Pre-fill ALL form fields with existing data
            setPersonalInfo({
              firstName: data.first_name || "",
              middleInitial: data.middle_name || "",
              lastName: data.last_name || "",
              dateOfBirth: data.dateOfBirth || "",
              ssn: data.ssn || "",
              email: data.email || "",
              phone: data.phone_number || "",
              address: data.address || "",
              city: data.city || "",
              state: data.state || "",
              zip: data.zip || "",
              filingStatus: data.filling_status || "",
            });

            // Pre-fill spouse information
            if (data.spouse_info) {
              setSpouseInfo({
                firstName: data.spouse_info.spouse_first_name || "",
                middleInitial: "",
                lastName: data.spouse_info.spouse_last_name || "",
                dateOfBirth: data.spouse_info.spouse_dateOfBirth || "",
                ssn: data.spouse_info.spouse_ssn || "",
                email: data.spouse_info.spouse_email || "",
                phone: data.spouse_info.spouse_phone_number || "",
              });
            }

            // Pre-fill bank information
            if (data.bank_info) {
              setBankInfo({
                bankName: data.bank_info.bank_name || "",
                routingNumber: data.bank_info.routing_number || "",
                confirmRoutingNumber: data.bank_info.routing_number || "",
                accountNumber: data.bank_info.account_number || "",
                confirmAccountNumber: data.bank_info.account_number || "",
              });
            }

            // Pre-fill other information
            setOtherInfo({
              ownsHome: data.does_own_a_home || false,
              inSchool: data.in_school || false,
              otherDeductions: data.other_deductions ? "yes" : "no"
            });

            // Set filing status
            if (data.income_information) {
              setFilingStatus(data.income_information);
            } else {
              setFilingStatus("w2"); // Default to w2 if no data
            }

            // Set dependents
            if (data.no_of_dependents > 0) {
              setHasDependents(true);
              // Create empty dependent objects for the count
              const emptyDependents = Array(data.no_of_dependents).fill().map(() => ({
                firstName: '',
                middleInitial: '',
                lastName: '',
                dob: '',
                ssn: ''
              }));
              setDependents(emptyDependents);
            }

            console.log("Form pre-filled with existing personal data");
          }
        } else {
          console.log("No existing personal data found");
          // Set default income information to w2
          setFilingStatus("w2");
        }

        // Handle file data response
        if (fileDataResponse.ok) {
          const fileResult = await fileDataResponse.json();
          console.log("Existing file data found:", fileResult);
          
          if (fileResult.success && fileResult.data && fileResult.data.tax_documents && fileResult.data.tax_documents.length > 0) {
            // If files exist, show the first file (or handle multiple files as needed)
            const firstFile = fileResult.data.tax_documents[0];
            console.log("Setting uploaded file:", firstFile);
            
            // Extract filename from URL
            const filename = firstFile.document_url.split('/').pop() || "uploaded_document.png";
            
            // Create a mock file object to display the existing file
            const mockFile = {
              name: filename,
              size: 1024 * 1024, // Set a default size of 1MB since API doesn't provide size
              type: "image/png", // Default type, could be improved
              lastModified: new Date(firstFile.created_at).getTime(),
              url: firstFile.document_url, // Store the URL for reference
              isExistingFile: true // Flag to indicate this is an existing file
            };
            
            setUploadedFile(mockFile);
            console.log("Existing file displayed in upload section:", mockFile);
          } else {
            console.log("No existing files found in tax_documents");
          }
        } else {
          console.log("No existing file data found");
        }
      } catch (error) {
        console.error("Error checking existing data:", error);
        console.log("Showing empty form due to error");
        // Set default income information to w2
        setFilingStatus("w2");
      }
    };

    checkExistingData();
  }, []);

  const handleSubmit = async () => {
    try {
      // Build the personal data payload for first API
      const personalDataPayload = {
        personal_info: {
          first_name: personalInfo.firstName,
          middle_initial: personalInfo.middleInitial,
          last_name: personalInfo.lastName,
          dateOfBirth: personalInfo.dateOfBirth,
          ssn: personalInfo.ssn,
          email: personalInfo.email,
          phone: personalInfo.phone,
          address: personalInfo.address,
          city: personalInfo.city,
          state: personalInfo.state,
          zip: personalInfo.zip,
          filing_status: personalInfo.filingStatus,
          income_information: filingStatus,
          no_of_dependents: hasDependents ? dependents.length : 0,
          other_deductions: otherInfo.otherDeductions === "yes",
          does_own_a_home: otherInfo.ownsHome,
          in_school: otherInfo.inSchool,
          spouse_info: {
            spouse_first_name: spouseInfo.firstName,
            spouse_middle_name: spouseInfo.middleInitial,
            spouse_last_name: spouseInfo.lastName,
            spouse_dateOfBirth: spouseInfo.dateOfBirth,
            spouse_ssn: spouseInfo.ssn,
            spouse_email: spouseInfo.email,
            spouse_phone_number: spouseInfo.phone
          },
          dependents: hasDependents ? dependents.map(dep => ({
            dependent_first_name: dep.firstName,
            dependent_middle_name: dep.middleInitial,
            dependent_last_name: dep.lastName,
            dependent_dateOfBirth: dep.dob,
            dependent_ssn: dep.ssn
          })) : []
        },
        bank_info: {
          bank_name: bankInfo.bankName,
          routing_number: bankInfo.routingNumber,
          account_number: bankInfo.accountNumber
        }
      };

      // Prepare file upload form data for second API
      const fileFormData = new FormData();
      if (uploadedFile) {
        fileFormData.append("tax_documents", uploadedFile);
      }
      fileFormData.append("income_information", "w2"); // Default value as per curl

      // Get the access token
      const token = getAccessToken() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwNTkxMzQ5LCJpYXQiOjE3NjA1ODc3NDksImp0aSI6IjQ4NDlmOGNmY2MyNTQ4ZmNhZGRjZmMxYmYzMGIzODVmIiwidXNlcl9pZCI6IjMifQ.i2wpfckXFolye9W0mav1PxBQhg6tmCy31jAqeXQLHFY";
      
      console.log("Submitting dual API calls...");
      console.log("Bank info being sent:", {
        bank_name: bankInfo.bankName,
        routing_number: bankInfo.routingNumber,
        account_number: bankInfo.accountNumber
      });
      
      // Call both APIs simultaneously using Promise.all
      const apiBaseUrl = getApiBaseUrl();
      const [personalDataResult, fileUploadResult] = await Promise.all([
        // First API: Personal data (JSON)
        fetch(`${apiBaseUrl}/taxpayer/personal-data-intake/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(personalDataPayload)
        }),
        
        // Second API: File upload
        fetch(`${apiBaseUrl}/taxpayer/income-data-intake/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Cookie": "csrftoken=ixFCvQ0kTg9v34Ddg81rTDl4v1Q1AOLv"
          },
          body: fileFormData
        })
      ]);

      // Check if both requests were successful
      if (!personalDataResult.ok) {
        throw new Error(`Personal data API failed: ${personalDataResult.status} ${personalDataResult.statusText}`);
      }
      
      if (!fileUploadResult.ok) {
        throw new Error(`File upload API failed: ${fileUploadResult.status} ${fileUploadResult.statusText}`);
      }

      const personalDataResponse = await personalDataResult.json();
      const fileUploadResponse = await fileUploadResult.json();
      
      console.log("Personal data submission successful:", personalDataResponse);
      console.log("File upload successful:", fileUploadResponse);
      
      localStorage.setItem("userStatus", "new");
      navigate("/dashboard-first");
    } catch (err) {
      console.error("Dual API submission error:", err);
      const errorMessage = handleAPIError(err);
      alert(`Submission failed: ${errorMessage}`);
    }
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

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpouseInfoChange = (field, value) => {
    setSpouseInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankInfoChange = (field, value) => {
    setBankInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOtherInfoChange = (field, value) => {
    setOtherInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="row g-0 px-4">
      <div className="align-items-center mb-3">
        <h5 className="mb-0 me-3" style={{ 
          color: "#3B4A66", 
          fontSize: "28px", 
          fontWeight: "500", 
          fontFamily: "BasisGrotesquePro" 
        }}>
          Data Intake Form
        </h5>
        <p className="mb-0" style={{ 
          color: "#4B5563", 
          fontSize: "14px", 
          fontWeight: "400", 
          fontFamily: "BasisGrotesquePro" 
        }}>
          Complete your tax information started
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Personal Information
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Your basic personal and contact information
          </p>
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              First Name
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Michael" 
              value={personalInfo.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Middle Initial
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={personalInfo.middleInitial}
              onChange={(e) => handlePersonalInfoChange('middleInitial', e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Last Name
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Brown" 
              value={personalInfo.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Date of Birth
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={personalInfo.dateOfBirth}
              onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Social Security Number (SSN)
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={personalInfo.ssn}
              onChange={(e) => handlePersonalInfoChange('ssn', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Email
            </label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="michael@example.com" 
              style={{ height: '45px' }}
              value={personalInfo.email}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Phone
            </label>
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
                borderRadius: '0.375rem' 
              }} 
              placeholder="Enter phone number"
              value={personalInfo.phone}
              onChange={(phone) => handlePersonalInfoChange('phone', phone)}
            />
          </div>
          <div className="col-md-12">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Address
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="123 Main St" 
              value={personalInfo.address}
              onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              City
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Anytown" 
              value={personalInfo.city}
              onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              State
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="California" 
              value={personalInfo.state}
              onChange={(e) => handlePersonalInfoChange('state', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              ZIP Code
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="12345" 
              value={personalInfo.zip}
              onChange={(e) => handlePersonalInfoChange('zip', e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Filing Status
            </label>
            <select 
              className="form-select mt-2"
              value={personalInfo.filingStatus}
              onChange={(e) => handlePersonalInfoChange('filingStatus', e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_household">Head of Household</option>
              <option value="widow">Qualifying Widow</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spouse Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Spouse Information
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Your spouse's information for joint filing
          </p>
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              First Name
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Sara" 
              value={spouseInfo.firstName}
              onChange={(e) => handleSpouseInfoChange('firstName', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Middle Initial
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={spouseInfo.middleInitial}
              onChange={(e) => handleSpouseInfoChange('middleInitial', e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Last Name
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Johnson" 
              value={spouseInfo.lastName}
              onChange={(e) => handleSpouseInfoChange('lastName', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Date of Birth
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={spouseInfo.dateOfBirth}
              onChange={(e) => handleSpouseInfoChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Social Security Number
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={spouseInfo.ssn}
              onChange={(e) => handleSpouseInfoChange('ssn', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Email
            </label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="sara@example.com" 
              style={{ height: '45px' }}
              value={spouseInfo.email}
              onChange={(e) => handleSpouseInfoChange('email', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Phone
            </label>
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
                borderRadius: '0.375rem' 
              }} 
              placeholder="Enter phone number"
              value={spouseInfo.phone}
              onChange={(phone) => handleSpouseInfoChange('phone', phone)}
            />
          </div>
        </div>
      </div>

      {/* Dependents Information */}
      <div className="card p-4 mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Dependents Information
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Information about your dependents
          </p>
        </div>
        <div className="form-check mb-3">
          <input 
            className="form-check-input" 
            type="checkbox" 
            checked={hasDependents} 
            onChange={(e) => setHasDependents(e.target.checked)} 
            id="hasDependents" 
          />
          <label 
            className="form-check-label" 
            htmlFor="hasDependents" 
            style={{ 
              color: "#3B4A66", 
              fontSize: "13px", 
              fontWeight: "400", 
              fontFamily: "BasisGrotesquePro" 
            }}
          >
            Do you have dependents?
          </label>
        </div>
        {hasDependents && (
          <>
            {dependents.length === 0 ? (
              <div className="text-center">
                <p className="text-muted mb-2" style={{ 
                  fontFamily: "BasisGrotesquePro", 
                  fontWeight: 500, 
                  fontSize: "20px", 
                  color: "#3B4A66" 
                }}>
                  No Dependents Added Yet
                </p>
                <button 
                  className="btn" 
                  style={{ 
                    border: "1px solid #E8F0FF", 
                    backgroundColor: "#F3F7FF", 
                    fontWeight: "500", 
                    fontSize: "13px", 
                    fontFamily: "BasisGrotesquePro" 
                  }} 
                  onClick={handleAddDependent}
                >
                  <FaPlus className="me-2" /> Add First Dependent
                </button>
              </div>
            ) : (
              <div className="dependent-list">
                {dependents.map((dep, index) => (
                  <div key={index} className="mb-4">
                    <div className="d-flex">
                      <h3 className="mb-0" style={{ 
                        color: "#3B4A66", 
                        fontSize: "18px" 
                      }}>
                        Dependent #{index + 1}
                      </h3>
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
                        <label className="form-label" style={{ 
                          fontFamily: "BasisGrotesquePro", 
                          fontWeight: 400, 
                          fontSize: "16px", 
                          color: "#3B4A66" 
                        }}>
                          First Name
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={dep.firstName} 
                          onChange={(e) => handleInputChange(index, 'firstName', e.target.value)} 
                          placeholder="Sara" 
                        />
                      </div>
                      <div className="col-md-1">
                        <label className="form-label" style={{ 
                          fontFamily: "BasisGrotesquePro", 
                          fontWeight: 400, 
                          fontSize: "16px", 
                          color: "#3B4A66" 
                        }}>
                          Middle Initial
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={dep.middleInitial} 
                          onChange={(e) => handleInputChange(index, 'middleInitial', e.target.value)} 
                          placeholder="M" 
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label" style={{ 
                          fontFamily: "BasisGrotesquePro", 
                          fontWeight: 400, 
                          fontSize: "16px", 
                          color: "#3B4A66" 
                        }}>
                          Last Name
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={dep.lastName} 
                          onChange={(e) => handleInputChange(index, 'lastName', e.target.value)} 
                          placeholder="Johnson" 
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label" style={{ 
                          fontFamily: "BasisGrotesquePro", 
                          fontWeight: 400, 
                          fontSize: "16px", 
                          color: "#3B4A66" 
                        }}>
                          Date of Birth
                        </label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={dep.dob} 
                          onChange={(e) => handleInputChange(index, 'dob', e.target.value)} 
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label" style={{ 
                          fontFamily: "BasisGrotesquePro", 
                          fontWeight: 400, 
                          fontSize: "16px", 
                          color: "#3B4A66" 
                        }}>
                          Social Security Number
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={dep.ssn} 
                          onChange={(e) => handleInputChange(index, 'ssn', e.target.value)} 
                          placeholder="123-45-6789" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  className="btn btn-outline-primary custom-btn-bg" 
                  onClick={handleAddDependent} 
                  style={{ 
                    border: "1px solid #E8F0FF", 
                    backgroundColor: "#F3F7FF", 
                    fontWeight: "500", 
                    fontSize: "13px", 
                    fontFamily: "BasisGrotesquePro" 
                  }}
                >
                  <FaPlus className="me-2" /> Add Another Dependent
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Income Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Income Information
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Select all income types that apply to you
          </p>
        </div>
        <div className="form-check mb-2">
          <input 
            className="form-check-input" 
            type="radio" 
            name="filingStatus" 
            value="w2" 
            checked={filingStatus === "w2"}
            onChange={e => setFilingStatus(e.target.value)} 
          />
          <label 
            className="form-check-label" 
            style={{ 
              color: "#3B4A66", 
              fontSize: "13px", 
              fontWeight: "400", 
              fontFamily: "BasisGrotesquePro" 
            }}
          >
            W-2
          </label>
        </div>
        <div className="form-check mb-2">
          <input 
            className="form-check-input" 
            type="radio" 
            name="filingStatus" 
            value="1099" 
            checked={filingStatus === "1099"}
            onChange={e => setFilingStatus(e.target.value)} 
          />
          <label 
            className="form-check-label" 
            style={{ 
              color: "#3B4A66", 
              fontSize: "13px", 
              fontWeight: "400", 
              fontFamily: "BasisGrotesquePro" 
            }}
          >
            1099
          </label>
        </div>
        <div className="form-check">
          <input 
            className="form-check-input" 
            type="radio" 
            name="filingStatus" 
            value="business" 
            checked={filingStatus === "business"}
            onChange={e => setFilingStatus(e.target.value)} 
          />
          <label 
            className="form-check-label" 
            style={{ 
              color: "#3B4A66", 
              fontSize: "13px", 
              fontWeight: "400", 
              fontFamily: "BasisGrotesquePro" 
            }}
          >
            Self-employed or business
          </label>
        </div>
      </div>

      {/* Other Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Other Information
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Additional information that may affect your tax return
          </p>
        </div>
        <div className="row">
          <div className="col-md-6 mb-2">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="ownHome" 
                checked={otherInfo.ownsHome}
                onChange={(e) => handleOtherInfoChange('ownsHome', e.target.checked)}
              />
              <label 
                className="form-check-label" 
                htmlFor="ownHome" 
                style={{ 
                  color: "#3B4A66", 
                  fontSize: "13px", 
                  fontWeight: "400", 
                  fontFamily: "BasisGrotesquePro" 
                }}
              >
                Do you own a home?
              </label>
            </div>
            <div className="form-check mt-2">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="inSchool" 
                checked={otherInfo.inSchool}
                onChange={(e) => handleOtherInfoChange('inSchool', e.target.checked)}
              />
              <label 
                className="form-check-label" 
                htmlFor="inSchool" 
                style={{ 
                  color: "#3B4A66", 
                  fontSize: "13px", 
                  fontWeight: "400", 
                  fontFamily: "BasisGrotesquePro" 
                }}
              >
                Are you in school?
              </label>
            </div>
          </div>
          <div className="col-md-6 mb-2">
            <label 
              className="form-label d-block" 
              style={{ 
                color: "#3B4A66", 
                fontSize: "13px", 
                fontWeight: "400", 
                fontFamily: "BasisGrotesquePro" 
              }}
            >
              Do you have other deductions or income your preparer should be aware of?
            </label>
            <div className="form-check form-check-inline">
              <input 
                className="form-check-input" 
                type="radio" 
                name="otherDeductions" 
                id="otherYes" 
                value="yes" 
                checked={otherInfo.otherDeductions === "yes"}
                onChange={(e) => handleOtherInfoChange('otherDeductions', e.target.value)}
              />
              <label className="form-check-label" htmlFor="otherYes">Yes</label>
            </div>
            <div className="form-check form-check-inline">
              <input 
                className="form-check-input" 
                type="radio" 
                name="otherDeductions" 
                id="otherNo" 
                value="no" 
                checked={otherInfo.otherDeductions === "no"}
                onChange={(e) => handleOtherInfoChange('otherDeductions', e.target.value)}
              />
              <label className="form-check-label" htmlFor="otherNo">No</label>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Additional Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Optional Additional Information
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Complete these sections if they apply to your situation
          </p>
        </div>
        <div className="list-group">
          <button className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            Business Information
            <span>&gt;</span>
          </button>
          <button className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mt-3">
            Rental Property Details
            <span>&gt;</span>
          </button>
          <button className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mt-3">
            Additional Deductions
            <span>&gt;</span>
          </button>
        </div>
      </div>

      {/* Direct Deposit */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Direct Deposit
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Provide your bank account information for direct deposit of your tax refund
          </p>
        </div>
        <div className="col-md-6">
          <label className="form-label" style={{ 
            fontFamily: "BasisGrotesquePro", 
            fontWeight: 400, 
            fontSize: "18px", 
            color: "#3B4A66" 
          }}>
            Bank Name
          </label>
          <input 
            type="text" 
            className="form-control" 
            value={bankInfo.bankName}
            onChange={(e) => handleBankInfoChange('bankName', e.target.value)}
          />
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Routing Number
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={bankInfo.routingNumber}
              onChange={(e) => handleBankInfoChange('routingNumber', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Confirm Routing Number
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={bankInfo.confirmRoutingNumber}
              onChange={(e) => handleBankInfoChange('confirmRoutingNumber', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Account Number
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={bankInfo.accountNumber}
              onChange={(e) => handleBankInfoChange('accountNumber', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontWeight: 400, 
              fontSize: "16px", 
              color: "#3B4A66" 
            }}>
              Confirm Account Number
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={bankInfo.confirmAccountNumber}
              onChange={(e) => handleBankInfoChange('confirmAccountNumber', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{ 
            color: "#3B4A66", 
            fontSize: "20px", 
            fontWeight: "500", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Document Upload
          </h5>
          <p className="mb-0" style={{ 
            color: "#4B5563", 
            fontSize: "14px", 
            fontWeight: "400", 
            fontFamily: "BasisGrotesquePro" 
          }}>
            Upload your tax documents
          </p>
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
                borderColor: "#ccc" 
              }}
            >
              <div style={{ fontSize: "2rem", color: "#00aaff" }}>
                <i className="bi bi-upload" />
              </div>
              <strong style={{ 
                color: "#3B4A66", 
                fontSize: "14px", 
                fontWeight: "500", 
                fontFamily: "BasisGrotesquePro" 
              }}>
                Drop files here or click to browse
              </strong>
              <small 
                className="mt-2" 
                style={{ 
                  color: "#4B5563", 
                  fontSize: "12px", 
                  fontWeight: "400", 
                  fontFamily: "BasisGrotesquePro" 
                }}
              >
                Supported formats: All file types (AVIF, JPG, PNG, PDF, DOC, DOCX, XLS, etc.) - Max 50MB per file
              </small>
            </label>
            <input 
              id="file-upload" 
              type="file" 
              onChange={handleFileChange} 
              accept="*/*"
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
                    {uploadedFile.isExistingFile ? (
                      <>Previously uploaded file</>
                    ) : (
                      <>Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</>
                    )}
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
                      cursor: 'pointer' 
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