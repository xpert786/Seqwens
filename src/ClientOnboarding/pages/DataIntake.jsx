import React, { useState, useEffect, useRef } from "react";
import { Accordion } from "react-bootstrap";
import PhoneInput from 'react-phone-input-2';
import "../styles/Dataintake.css";
import { FaPlus, FaTrash, FaTrashAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { dataIntakeAPI, handleAPIError } from "../utils/apiUtils";
import { getAccessToken, getUserData } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";

export default function DataIntakeForm() {
  const [filingStatus, setFilingStatus] = useState([]);
  const [hasDependents, setHasDependents] = useState(false);
  const [dependents, setDependents] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
  const [uploadError, setUploadError] = useState(null);

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

  // Phone country codes state
  const [personalPhoneCountry, setPersonalPhoneCountry] = useState('us');
  const [spousePhoneCountry, setSpousePhoneCountry] = useState('us');

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

  // Additional Information Dropdowns State
  const [openDropdowns, setOpenDropdowns] = useState({
    businessInfo: false,
    rentalProperty: false,
    additionalDeductions: false,
  });

  const navigate = useNavigate();
  const firstDependentFirstNameRef = useRef(null);

  // Field errors state - maps field paths to error messages
  const [fieldErrors, setFieldErrors] = useState({});

  // Refs for scrolling to error fields
  const fieldRefs = useRef({});

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

            // Set filing status - handle both array and string formats
            if (data.income_information) {
              if (Array.isArray(data.income_information)) {
                setFilingStatus(data.income_information);
              } else {
                // If it's a string, convert to array
                setFilingStatus([data.income_information]);
              }
            } else {
              setFilingStatus(["w2"]); // Default to w2 if no data
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
          setFilingStatus(["w2"]);
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
        setFilingStatus(["w2"]);
      }
    };

    checkExistingData();
  }, []);

  // Initialize phone fields with country code if empty (only on mount, before data loads)
  useEffect(() => {
    // Only initialize if no existing data is present
    if (!personalInfo.phone) {
      handlePersonalInfoChange('phone', '+1');
    }
    if (!spouseInfo.phone) {
      handleSpouseInfoChange('phone', '+1');
    }
  }, []);

  // Map API field names to form field paths
  const mapApiFieldToFormField = (apiField, source) => {
    // Mapping from API field names to form field paths
    const fieldMappings = {
      // Personal info fields
      'first_name': 'personalInfo.firstName',
      'middle_initial': 'personalInfo.middleInitial',
      'middle_name': 'personalInfo.middleInitial',
      'last_name': 'personalInfo.lastName',
      'dateOfBirth': 'personalInfo.dateOfBirth',
      'ssn': 'personalInfo.ssn',
      'email': 'personalInfo.email',
      'phone': 'personalInfo.phone',
      'phone_number': 'personalInfo.phone',
      'address': 'personalInfo.address',
      'city': 'personalInfo.city',
      'state': 'personalInfo.state',
      'zip': 'personalInfo.zip',
      'filing_status': 'personalInfo.filingStatus',
      'income_information': 'filingStatus',

      // Spouse info fields (nested in personal_info.spouse_info)
      'spouse_first_name': 'spouseInfo.firstName',
      'spouse_middle_name': 'spouseInfo.middleInitial',
      'spouse_last_name': 'spouseInfo.lastName',
      'spouse_dateOfBirth': 'spouseInfo.dateOfBirth',
      'spouse_ssn': 'spouseInfo.ssn',
      'spouse_email': 'spouseInfo.email',
      'spouse_phone_number': 'spouseInfo.phone',

      // Bank info fields (nested in bank_info)
      'bank_name': 'bankInfo.bankName',
      'routing_number': 'bankInfo.routingNumber',
      'account_number': 'bankInfo.accountNumber',

      // Dependent fields (array)
      'dependents': 'dependents',
      'dependent_first_name': 'dependents',
      'dependent_last_name': 'dependents',
      'dependent_dateOfBirth': 'dependents',
      'dependent_ssn': 'dependents',

      // File upload
      'tax_documents': 'uploadedFile',
    };

    // Handle nested fields (e.g., personal_info.first_name, bank_info.routing_number)
    let fieldKey = apiField;
    if (apiField.includes('.')) {
      const parts = apiField.split('.');
      // Remove known prefixes (personal_info, spouse_info, bank_info)
      const prefixes = ['personal_info', 'spouse_info', 'bank_info'];
      if (prefixes.includes(parts[0])) {
        fieldKey = parts.slice(1).join('.');
      } else {
        fieldKey = parts[parts.length - 1];
      }
    }

    return fieldMappings[fieldKey] || apiField;
  };

  // Parse API error response and set field errors
  const parseAndSetFieldErrors = (errorData, source) => {
    const errors = {};

    if (errorData.errors) {
      // Helper function to recursively parse nested error objects
      const parseNestedErrors = (errorObj, prefix = '') => {
        Object.entries(errorObj).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // This is a field with error messages
            const fieldPath = prefix ? `${prefix}.${key}` : key;
            const formFieldPath = mapApiFieldToFormField(fieldPath, source);
            errors[formFieldPath] = value;
          } else if (typeof value === 'object' && value !== null) {
            // This is a nested object (e.g., personal_info, spouse_info, bank_info)
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            parseNestedErrors(value, newPrefix);
          } else if (typeof value === 'string') {
            // Single error message as string
            const fieldPath = prefix ? `${prefix}.${key}` : key;
            const formFieldPath = mapApiFieldToFormField(fieldPath, source);
            errors[formFieldPath] = [value];
          }
        });
      };

      parseNestedErrors(errorData.errors);
    }

    // Also check for non-nested errors at root level (e.g., {errors: {"field": ["error"]}})
    if (Object.keys(errors).length === 0 && errorData.errors) {
      Object.entries(errorData.errors).forEach(([field, errorMessages]) => {
        const formFieldPath = mapApiFieldToFormField(field, source);
        const messages = Array.isArray(errorMessages)
          ? errorMessages
          : [errorMessages];
        errors[formFieldPath] = messages;
      });
    }

    console.log('Parsed field errors:', errors);
    setFieldErrors(errors);

    // Scroll to first error after a short delay to ensure DOM is updated
    setTimeout(() => {
      scrollToFirstError(errors);
    }, 100);
  };

  // Scroll to the first error field
  const scrollToFirstError = (errors) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length === 0) return;

    const firstErrorField = errorFields[0];

    // Try to find the field element
    let fieldElement = null;

    // Check if we have a ref for this field
    if (fieldRefs.current[firstErrorField]) {
      fieldElement = fieldRefs.current[firstErrorField].current || fieldRefs.current[firstErrorField];
    }

    // If not found via ref, try to find by data attribute
    if (!fieldElement) {
      fieldElement = document.querySelector(`[data-field="${firstErrorField}"]`);
    }

    // If still not found, try to find by field name
    if (!fieldElement) {
      const fieldName = firstErrorField.split('.').pop();
      // Try different selectors
      fieldElement = document.querySelector(`input[name="${fieldName}"]`) ||
        document.querySelector(`select[name="${fieldName}"]`) ||
        document.querySelector(`textarea[name="${fieldName}"]`);
    }

    if (fieldElement) {
      // Scroll to the field with offset for header
      const offset = 100;
      const elementPosition = fieldElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Focus the field if it's focusable
      setTimeout(() => {
        if (fieldElement && typeof fieldElement.focus === 'function') {
          try {
            fieldElement.focus();
          } catch (e) {
            console.log('Could not focus element:', e);
          }
        }
      }, 500);
    } else {
      // If field not found, scroll to the form section
      const formSection = document.querySelector('.data-intake-page');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Get error message for a field
  const getFieldError = (fieldPath) => {
    return fieldErrors[fieldPath] ? fieldErrors[fieldPath][0] : null;
  };

  // Clear error for a specific field
  const clearFieldError = (fieldPath) => {
    if (fieldErrors[fieldPath]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Reset upload states if file exists
      if (uploadedFile && !uploadedFile.isExistingFile) {
        setUploadProgress(0);
        setUploadStatus(null);
        setUploadError(null);
      }

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
          income_information: filingStatus.length > 0 ? filingStatus : ["w2"],
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
      const hasFileToUpload = uploadedFile && !uploadedFile.isExistingFile;

      if (hasFileToUpload) {
        fileFormData.append("tax_documents", uploadedFile);
      }
      // Send selected income types as comma-separated string, or default to "w2"
      const incomeInfo = filingStatus.length > 0 ? filingStatus.join(",") : "w2";
      fileFormData.append("income_information", incomeInfo);

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

        // Second API: File upload with progress tracking
        hasFileToUpload ? (() => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setUploadProgress(Math.round(percentComplete));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadProgress(100);
                setUploadStatus('success');
                resolve(xhr);
              } else {
                setUploadStatus('error');
                setUploadError(`Upload failed: ${xhr.status} ${xhr.statusText}`);
                reject(new Error(`Upload failed: ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              setUploadStatus('error');
              setUploadError('Upload failed: Network error');
              reject(new Error('Network error'));
            });

            xhr.open('POST', `${apiBaseUrl}/taxpayer/income-data-intake/`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Cookie', 'csrftoken=ixFCvQ0kTg9v34Ddg81rTDl4v1Q1AOLv');
            xhr.send(fileFormData);
          });
        })() : fetch(`${apiBaseUrl}/taxpayer/income-data-intake/`, {
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
        // Try to parse error response for field-level errors
        try {
          const errorData = await personalDataResult.json();
          if (errorData.errors || errorData.message) {
            parseAndSetFieldErrors(errorData, 'personal');
            return; // Don't proceed if there are validation errors
          }
        } catch (parseErr) {
          // If parsing fails, throw generic error
        }
        throw new Error(`Personal data API failed: ${personalDataResult.status} ${personalDataResult.statusText}`);
      }

      // Handle file upload response (could be XMLHttpRequest or Response)
      if (hasFileToUpload) {
        // fileUploadResult is an XMLHttpRequest object when uploading
        if (fileUploadResult.status < 200 || fileUploadResult.status >= 300) {
          try {
            const errorData = JSON.parse(fileUploadResult.responseText || '{}');
            if (errorData.errors || errorData.message) {
              parseAndSetFieldErrors(errorData, 'file');
              return;
            }
          } catch (parseErr) {
            // If parsing fails, throw generic error
          }
          throw new Error(`File upload API failed: ${fileUploadResult.status} ${fileUploadResult.statusText}`);
        }
      } else {
        // fileUploadResult is a Response object when no file to upload
        if (!fileUploadResult.ok) {
          try {
            const errorData = await fileUploadResult.json();
            if (errorData.errors || errorData.message) {
              parseAndSetFieldErrors(errorData, 'file');
              return;
            }
          } catch (parseErr) {
            // If parsing fails, throw generic error
          }
          throw new Error(`File upload API failed: ${fileUploadResult.status} ${fileUploadResult.statusText}`);
        }
      }

      const personalDataResponse = await personalDataResult.json();
      let fileUploadResponse;
      if (hasFileToUpload) {
        try {
          fileUploadResponse = JSON.parse(fileUploadResult.responseText);
        } catch (e) {
          fileUploadResponse = { success: true, message: "File uploaded successfully" };
        }
      } else {
        fileUploadResponse = await fileUploadResult.json();
      }

      console.log("Personal data submission successful:", personalDataResponse);
      console.log("File upload successful:", fileUploadResponse);

      // Clear any previous errors on success
      setFieldErrors({});
      localStorage.setItem("userStatus", "new");
      navigate("/dashboard-first");
    } catch (err) {
      console.error("Dual API submission error:", err);

      // Try to extract field errors from error message or response
      if (err.response) {
        try {
          const errorData = await err.response.json();
          if (errorData.errors) {
            parseAndSetFieldErrors(errorData, 'personal');
            return;
          }
        } catch (parseErr) {
          console.error("Error parsing error response:", parseErr);
        }
      }

      // If no field errors found, show generic error
      const errorMessage = handleAPIError(err);
      alert(`Submission failed: ${errorMessage}`);
    }
  };

  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 50MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
    }
    return { valid: true, error: null };
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadStatus('error');
      setUploadError(validation.error);
      setUploadProgress(0);
      return;
    }

    // Reset states and set file
    setUploadError(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setUploadedFile(file);

    // Show success state after a brief moment to indicate file is ready
    setTimeout(() => {
      setUploadStatus('success');
    }, 300);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadStatus(null);
    setUploadError(null);
    setUploadProgress(0);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only activate if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Set dropEffect to indicate a copy operation
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only deactivate if we're actually leaving the drop zone
    // (not just moving to a child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Only process if it's actually a file (not a directory)
      if (file.size !== undefined) {
        handleFileSelect(file);
      } else {
        setUploadStatus('error');
        setUploadError('Folders cannot be uploaded. Please select individual files.');
      }
    }
  };

  const handleAddDependent = () => {
    setDependents([
      ...dependents,
      { firstName: '', middleInitial: '', lastName: '', dob: '', ssn: '' }
    ]);
  };

  // Handle checkbox change
  const handleDependentsCheckbox = (checked) => {
    setHasDependents(checked);
    if (!checked) {
      // Clear dependents when unchecked
      setDependents([]);
    }
  };

  // Auto-focus first input when first dependent is added
  useEffect(() => {
    if (dependents.length === 1 && firstDependentFirstNameRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        firstDependentFirstNameRef.current?.focus();
      }, 100);
    }
  }, [dependents.length]);

  const handleRemoveDependent = (index) => {
    const updated = [...dependents];
    updated.splice(index, 1);
    setDependents(updated);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...dependents];
    updated[index][field] = value;
    setDependents(updated);
    // Clear error when user starts typing
    clearFieldError(`dependents.${index}.${field}`);
  };

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    clearFieldError(`personalInfo.${field}`);
  };

  const handleSpouseInfoChange = (field, value) => {
    setSpouseInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    clearFieldError(`spouseInfo.${field}`);
  };

  const handleBankInfoChange = (field, value) => {
    setBankInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    clearFieldError(`bankInfo.${field}`);
  };

  const handleOtherInfoChange = (field, value) => {
    setOtherInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    clearFieldError(`otherInfo.${field}`);
  };

  // Toggle dropdown handler
  const toggleDropdown = (dropdownName) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownName]: !prev[dropdownName]
    }));
  };

  return (
    <div className="data-intake-page row g-0 px-4">
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
          <div className="col-md-5">
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
              className={`form-control ${getFieldError('personalInfo.firstName') ? 'is-invalid' : ''}`}
              placeholder="Michael"
              value={personalInfo.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
              data-field="personalInfo.firstName"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.firstName']) {
                  fieldRefs.current['personalInfo.firstName'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.firstName') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.firstName')}
              </div>
            )}
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
          <div className="col-md-5">
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
              className={`form-control ${getFieldError('personalInfo.lastName') ? 'is-invalid' : ''}`}
              placeholder="Brown"
              value={personalInfo.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
              data-field="personalInfo.lastName"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.lastName']) {
                  fieldRefs.current['personalInfo.lastName'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.lastName') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.lastName')}
              </div>
            )}
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
              className={`form-control ${getFieldError('personalInfo.dateOfBirth') ? 'is-invalid' : ''}`}
              value={personalInfo.dateOfBirth}
              onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
              data-field="personalInfo.dateOfBirth"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.dateOfBirth']) {
                  fieldRefs.current['personalInfo.dateOfBirth'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.dateOfBirth') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.dateOfBirth')}
              </div>
            )}
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
              className={`form-control ${getFieldError('personalInfo.ssn') ? 'is-invalid' : ''}`}
              value={personalInfo.ssn}
              onChange={(e) => handlePersonalInfoChange('ssn', e.target.value)}
              data-field="personalInfo.ssn"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.ssn']) {
                  fieldRefs.current['personalInfo.ssn'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.ssn') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.ssn')}
              </div>
            )}
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
              className={`form-control ${getFieldError('personalInfo.email') ? 'is-invalid' : ''}`}
              placeholder="michael@example.com"
              style={{ height: '45px' }}
              value={personalInfo.email}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              data-field="personalInfo.email"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.email']) {
                  fieldRefs.current['personalInfo.email'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.email') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.email')}
              </div>
            )}
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
              country={personalPhoneCountry}
              value={personalInfo.phone || ''}
              onChange={(phone) => {
                handlePersonalInfoChange('phone', phone);
              }}
              onCountryChange={(countryCode, countryData) => {
                setPersonalPhoneCountry(countryCode.toLowerCase());
                // Extract the number part (without country code)
                const currentPhone = personalInfo.phone || '';
                const numberPart = currentPhone.replace(/^\+\d{1,4}\s*/, '').trim();
                // Update phone with new country code + existing number part
                if (numberPart) {
                  handlePersonalInfoChange('phone', `+${countryData.dialCode}${numberPart}`);
                } else {
                  // Always show the dial code when country changes
                  handlePersonalInfoChange('phone', `+${countryData.dialCode}`);
                }
              }}
              inputClass="form-control"
              containerClass="w-100 phone-input-container"
              inputStyle={{
                height: '45px',
                paddingLeft: '48px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
                backgroundColor: '#fff',
                width: '100%',
              }}
              enableSearch={true}
              countryCodeEditable={false}
              disabled={false}
              specialLabel=""
              containerProps={{
                'data-field': 'personalInfo.phone'
              }}
            />
            {getFieldError('personalInfo.phone') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.phone')}
              </div>
            )}
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
              className={`form-control ${getFieldError('personalInfo.address') ? 'is-invalid' : ''}`}
              placeholder="123 Main St"
              value={personalInfo.address}
              onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
              data-field="personalInfo.address"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.address']) {
                  fieldRefs.current['personalInfo.address'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.address') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.address')}
              </div>
            )}
          </div>
          <div className="col-md-4">
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
              className={`form-control ${getFieldError('personalInfo.city') ? 'is-invalid' : ''}`}
              placeholder="Anytown"
              value={personalInfo.city}
              onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
              data-field="personalInfo.city"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.city']) {
                  fieldRefs.current['personalInfo.city'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.city') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.city')}
              </div>
            )}
          </div>
          <div className="col-md-4">
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
              className={`form-control ${getFieldError('personalInfo.state') ? 'is-invalid' : ''}`}
              placeholder="California"
              value={personalInfo.state}
              onChange={(e) => handlePersonalInfoChange('state', e.target.value)}
              data-field="personalInfo.state"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.state']) {
                  fieldRefs.current['personalInfo.state'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.state') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.state')}
              </div>
            )}
          </div>
          <div className="col-md-4">
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
              className={`form-control ${getFieldError('personalInfo.zip') ? 'is-invalid' : ''}`}
              placeholder="12345"
              value={personalInfo.zip}
              onChange={(e) => handlePersonalInfoChange('zip', e.target.value)}
              data-field="personalInfo.zip"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.zip']) {
                  fieldRefs.current['personalInfo.zip'] = el;
                }
              }}
            />
            {getFieldError('personalInfo.zip') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.zip')}
              </div>
            )}
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
              className={`form-select mt-2 ${getFieldError('personalInfo.filingStatus') ? 'is-invalid' : ''}`}
              value={personalInfo.filingStatus}
              onChange={(e) => handlePersonalInfoChange('filingStatus', e.target.value)}
              data-field="personalInfo.filingStatus"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.filingStatus']) {
                  fieldRefs.current['personalInfo.filingStatus'] = el;
                }
              }}
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_household">Head of Household</option>
              <option value="widow">Qualifying Widow</option>
            </select>
            {getFieldError('personalInfo.filingStatus') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.filingStatus')}
              </div>
            )}
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
          <div className="col-md-5">
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
          <div className="col-md-5">
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
              country={spousePhoneCountry}
              value={spouseInfo.phone || ''}
              onChange={(phone) => {
                handleSpouseInfoChange('phone', phone);
              }}
              onCountryChange={(countryCode, countryData) => {
                setSpousePhoneCountry(countryCode.toLowerCase());
                // Extract the number part (without country code)
                const currentPhone = spouseInfo.phone || '';
                const numberPart = currentPhone.replace(/^\+\d{1,4}\s*/, '').trim();
                // Update phone with new country code + existing number part
                if (numberPart) {
                  handleSpouseInfoChange('phone', `+${countryData.dialCode}${numberPart}`);
                } else {
                  // Always show the dial code when country changes
                  handleSpouseInfoChange('phone', `+${countryData.dialCode}`);
                }
              }}
              inputClass="form-control"
              containerClass="w-100 phone-input-container"
              inputStyle={{
                height: '45px',
                paddingLeft: '48px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                width: '100%',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
                backgroundColor: '#fff'
              }}
              enableSearch={true}
              countryCodeEditable={false}
              disabled={false}
              specialLabel=""
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
            onChange={(e) => handleDependentsCheckbox(e.target.checked)}
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
              <div className="text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                    fontFamily: "BasisGrotesquePro",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                    margin: "0 auto"
                  }}
                  onClick={handleAddDependent}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M0.75 5.70833H10.6667M5.70833 0.75V10.6667" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Add First Dependent</span>
                </button>
              </div>
            ) : (
              <div className="dependent-list">
                {dependents.map((dep, index) => (
                  <div key={index} className="bg-white p-4 rounded-4  mb-4" style={{
                    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)"
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="mb-0" style={{
                        color: "#3B4A66",
                        fontSize: "18px",
                        fontWeight: "500",
                        fontFamily: "BasisGrotesquePro"
                      }}>
                        Dependent #{index + 1}
                      </h3>
                      <button
                        className="btn btn-sm p-0"
                        onClick={() => handleRemoveDependent(index)}
                        title="Remove"
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: "4px"
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" rx="4" fill="#E8F0FF" />
                          <g clip-path="url(#clip0_588_2122)">
                            <path d="M7.4165 9.08366H16.5832M11.0623 14.3962V11.2712M12.9373 14.3962V11.2712M12.9373 7.41699H11.0623C10.8966 7.41699 10.7376 7.48284 10.6204 7.60005C10.5032 7.71726 10.4373 7.87623 10.4373 8.04199V9.08366H13.5623V8.04199C13.5623 7.87623 13.4965 7.71726 13.3793 7.60005C13.2621 7.48284 13.1031 7.41699 12.9373 7.41699ZM14.8582 16.0087C14.8466 16.1652 14.7761 16.3116 14.6609 16.4183C14.5457 16.525 14.3944 16.5841 14.2373 16.5837H9.76234C9.60532 16.5841 9.45398 16.525 9.33878 16.4183C9.22359 16.3116 9.15309 16.1652 9.1415 16.0087L8.56234 9.08366H15.4373L14.8582 16.0087Z" stroke="#EF4444" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" />
                          </g>
                          <defs>
                            <clipPath id="clip0_588_2122">
                              <rect width="10" height="10" fill="white" transform="translate(7 7)" />
                            </clipPath>
                          </defs>
                        </svg>

                      </button>
                    </div>
                    <div className="row align-items-end">
                      <div className="col-md-3">
                        <label className="form-label" style={{
                          fontFamily: "BasisGrotesquePro",
                          fontWeight: 400,
                          fontSize: "16px",
                          color: "#3B4A66"
                        }}>
                          First Name
                        </label>
                        <input
                          ref={index === 0 ? firstDependentFirstNameRef : null}
                          type="text"
                          className="form-control"
                          value={dep.firstName}
                          onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                          placeholder="Sara"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label" style={{
                          fontFamily: "BasisGrotesquePro",
                          fontWeight: 400,
                          fontSize: "16px",
                          color: "#3B4A66",
                          whiteSpace: "nowrap"
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
                      <button
                        className="btn"
                        onClick={handleAddDependent}
                        style={{
                          border: "1px solid #E8F0FF",
                          backgroundColor: "#F3F7FF",
                          fontWeight: "500",
                          fontSize: "13px",
                          fontFamily: "BasisGrotesquePro",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          justifyContent: "center",
                          marginTop: "16px",
                          width: "auto"
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <path d="M0.75 5.70833H10.6667M5.70833 0.75V10.6667" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Add Another Dependent</span>
                      </button>
                    </div>
                  </div>
                ))}


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
            type="checkbox"
            id="incomeW2"
            value="w2"
            checked={filingStatus.includes("w2")}
            onChange={e => {
              if (e.target.checked) {
                if (!filingStatus.includes("w2")) {
                  setFilingStatus([...filingStatus, "w2"]);
                }
              } else {
                setFilingStatus(filingStatus.filter(item => item !== "w2"));
              }
            }}
          />
          <label
            className="form-check-label"
            htmlFor="incomeW2"
            style={{
              color: "#3B4A66",
              fontSize: "13px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro"
            }}
          >
            W-2 (Employee wages)
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="income1099"
            value="1099"
            checked={filingStatus.includes("1099")}
            onChange={e => {
              if (e.target.checked) {
                if (!filingStatus.includes("1099")) {
                  setFilingStatus([...filingStatus, "1099"]);
                }
              } else {
                setFilingStatus(filingStatus.filter(item => item !== "1099"));
              }
            }}
          />
          <label
            className="form-check-label"
            htmlFor="income1099"
            style={{
              color: "#3B4A66",
              fontSize: "13px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro"
            }}
          >
            Self-Employment
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="incomeBusiness"
            value="business"
            checked={filingStatus.includes("business")}
            onChange={e => {
              if (e.target.checked) {
                if (!filingStatus.includes("business")) {
                  setFilingStatus([...filingStatus, "business"]);
                }
              } else {
                setFilingStatus(filingStatus.filter(item => item !== "business"));
              }
            }}
          />
          <label
            className="form-check-label"
            htmlFor="incomeBusiness"
            style={{
              color: "#3B4A66",
              fontSize: "13px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro"
            }}
          >
            Other Income
          </label>
        </div>
        {filingStatus.length > 0 && (
          <div
            className="mt-2 p-3 rounded d-flex align-items-center"
            style={{
              background: " var(--Color-yellow-100, #FEF3C7)",
              border: "0.4px solid #F56D2D",
              gap: "12px",
              width: "fit-content"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_587_2011)">
                <path d="M4.99968 3.33301V4.99968M9.16634 4.99968C9.16634 7.30086 7.30086 9.16634 4.99968 9.16634C2.69849 9.16634 0.833008 7.30086 0.833008 4.99968C0.833008 2.69849 2.69849 0.833008 4.99968 0.833008C7.30086 0.833008 9.16634 2.69849 9.16634 4.99968Z" stroke="#F56D2D" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M5 6.66699H5.01042" stroke="#F56D2D" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_587_2011">
                  <rect width="10" height="10" fill="white" />
                </clipPath>
              </defs>
            </svg>

            <span style={{
              color: "#F56D2D",
              fontSize: "13px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro"
            }}>
              Please upload your income documents in the Document Upload section below.
            </span>
          </div>
        )}
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
            <div className={otherInfo.ownsHome ? "form-check radio-item-checked" : "form-check"}>
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
              >
                Do you own a home?
              </label>
            </div>
            <div className={otherInfo.inSchool ? "form-check mt-2 radio-item-checked" : "form-check mt-2"}>
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
            <div className={`form-check mt-2 ${otherInfo.otherDeductions === "yes" ? "radio-item-checked" : ""}`}>
              <input
                className="form-check-input"
                type="radio"
                name="otherDeductions"
                id="otherYes"
                value="yes"
                checked={otherInfo.otherDeductions === "yes"}
                onChange={(e) => handleOtherInfoChange('otherDeductions', e.target.value)}
              />
              <label
                className="form-check-label"
                htmlFor="otherYes"
                style={{
                  color: "#3B4A66",
                  fontSize: "13px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                  cursor: "pointer"
                }}
              >
                Yes
              </label>
            </div>
            <div className={`form-check mt-2 ${otherInfo.otherDeductions === "no" ? "radio-item-checked" : ""}`}>
              <input
                className="form-check-input"
                type="radio"
                name="otherDeductions"
                id="otherNo"
                value="no"
                checked={otherInfo.otherDeductions === "no"}
                onChange={(e) => handleOtherInfoChange('otherDeductions', e.target.value)}
              />
              <label
                className="form-check-label"
                htmlFor="otherNo"
                style={{
                  color: "#3B4A66",
                  fontSize: "13px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                  cursor: "pointer"
                }}
              >
                No
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
        <div className="align-items-center mb-3">
          <h5 className="mb-0 me-3" style={{
            color: "#3B4A66",
            fontSize: "20px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro"
          }}>
            Additional Information
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
          {/* Business Information Dropdown */}
          <div>
            <button
              onClick={() => toggleDropdown('businessInfo')}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              style={{
                background: "var(--Palette2-Dark-blue-50, #F3F7FF)",
                borderRadius: "8px",
                border: "none",
                padding: "14px 16px",
                width: "100%",
                cursor: "pointer"
              }}
            >
              <span style={{
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "500",
                color: "#3B4A66"
              }}>
                Business Information
              </span>
              {openDropdowns.businessInfo ? (
                <FaChevronUp style={{ color: "#3B4A66" }} />
              ) : (
                <FaChevronDown style={{ color: "#3B4A66" }} />
              )}
            </button>
            {openDropdowns.businessInfo && (
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "8px"
              }}>
                <p style={{
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  color: "#4B5563",
                  margin: 0
                }}>
                  Business Information form will be displayed here. This is static data for now.
                </p>
              </div>
            )}
          </div>

          {/* Rental Property Details Dropdown */}
          <div style={{ marginTop: "12px" }}>
            <button
              onClick={() => toggleDropdown('rentalProperty')}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              style={{
                background: "var(--Palette2-Dark-blue-50, #F3F7FF)",
                borderRadius: "8px",
                border: "none",
                padding: "14px 16px",
                width: "100%",
                cursor: "pointer"
              }}
            >
              <span style={{
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "500",
                color: "#3B4A66"
              }}>
                Rental Property Details
              </span>
              {openDropdowns.rentalProperty ? (
                <FaChevronUp style={{ color: "#3B4A66" }} />
              ) : (
                <FaChevronDown style={{ color: "#3B4A66" }} />
              )}
            </button>
            {openDropdowns.rentalProperty && (
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "8px"
              }}>
                <p style={{
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  color: "#4B5563",
                  margin: 0
                }}>
                  Rental Property Details form will be displayed here. This is static data for now.
                </p>
              </div>
            )}
          </div>

          {/* Additional Deductions Dropdown */}
          <div style={{ marginTop: "12px" }}>
            <button
              onClick={() => toggleDropdown('additionalDeductions')}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              style={{
                background: "var(--Palette2-Dark-blue-50, #F3F7FF)",
                borderRadius: "8px",
                border: "none",
                padding: "14px 16px",
                width: "100%",
                cursor: "pointer"
              }}
            >
              <span style={{
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                fontWeight: "500",
                color: "#3B4A66"
              }}>
                Additional Deductions
              </span>
              {openDropdowns.additionalDeductions ? (
                <FaChevronUp style={{ color: "#3B4A66" }} />
              ) : (
                <FaChevronDown style={{ color: "#3B4A66" }} />
              )}
            </button>
            {openDropdowns.additionalDeductions && (
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "8px"
              }}>
                <p style={{
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "14px",
                  color: "#4B5563",
                  margin: 0
                }}>
                  Additional Deductions form will be displayed here. This is static data for now.
                </p>
              </div>
            )}
          </div>
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
        <div className="col-md-12">
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
            className={`form-control ${getFieldError('bankInfo.bankName') ? 'is-invalid' : ''}`}
            value={bankInfo.bankName}
            onChange={(e) => handleBankInfoChange('bankName', e.target.value)}
            data-field="bankInfo.bankName"
            ref={(el) => {
              if (!fieldRefs.current['bankInfo.bankName']) {
                fieldRefs.current['bankInfo.bankName'] = el;
              }
            }}
          />
          {getFieldError('bankInfo.bankName') && (
            <div className="invalid-feedback d-block" style={{
              fontSize: "12px",
              color: "#EF4444",
              marginTop: "4px"
            }}>
              {getFieldError('bankInfo.bankName')}
            </div>
          )}
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
              className={`form-control ${getFieldError('bankInfo.routingNumber') ? 'is-invalid' : ''}`}
              value={bankInfo.routingNumber}
              onChange={(e) => handleBankInfoChange('routingNumber', e.target.value)}
              data-field="bankInfo.routingNumber"
              ref={(el) => {
                if (!fieldRefs.current['bankInfo.routingNumber']) {
                  fieldRefs.current['bankInfo.routingNumber'] = el;
                }
              }}
            />
            {getFieldError('bankInfo.routingNumber') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('bankInfo.routingNumber')}
              </div>
            )}
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
              className={`form-control ${getFieldError('bankInfo.confirmRoutingNumber') ? 'is-invalid' : ''}`}
              value={bankInfo.confirmRoutingNumber}
              onChange={(e) => handleBankInfoChange('confirmRoutingNumber', e.target.value)}
              data-field="bankInfo.confirmRoutingNumber"
            />
            {getFieldError('bankInfo.confirmRoutingNumber') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('bankInfo.confirmRoutingNumber')}
              </div>
            )}
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
              className={`form-control ${getFieldError('bankInfo.accountNumber') ? 'is-invalid' : ''}`}
              value={bankInfo.accountNumber}
              onChange={(e) => handleBankInfoChange('accountNumber', e.target.value)}
              data-field="bankInfo.accountNumber"
              ref={(el) => {
                if (!fieldRefs.current['bankInfo.accountNumber']) {
                  fieldRefs.current['bankInfo.accountNumber'] = el;
                }
              }}
            />
            {getFieldError('bankInfo.accountNumber') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('bankInfo.accountNumber')}
              </div>
            )}
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
              className={`form-control ${getFieldError('bankInfo.confirmAccountNumber') ? 'is-invalid' : ''}`}
              value={bankInfo.confirmAccountNumber}
              onChange={(e) => handleBankInfoChange('confirmAccountNumber', e.target.value)}
              data-field="bankInfo.confirmAccountNumber"
            />
            {getFieldError('bankInfo.confirmAccountNumber') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('bankInfo.confirmAccountNumber')}
              </div>
            )}
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
                backgroundColor: isDragging ? "#e8f0ff" : "#f9fcff",
                border: isDragging ? "1.5px dashed #3B4A66" : "1.5px dashed #E8F0FF",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: "2rem", color: isDragging ? "#3B4A66" : "#00aaff", transition: "color 0.3s ease" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="#00C0C6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

              </div>
              <strong style={{
                color: "#3B4A66",
                fontSize: "14px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
                marginTop: "8px"
              }}>
                {isDragging ? "Drop file here" : "Drop files here or click to browse"}
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
            {/* Error Message */}
            {uploadError && (
              <div className="mt-3 p-3 rounded" style={{
                backgroundColor: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#991B1B"
              }}>
                <div style={{
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33334 11.6819 1.33334 8C1.33334 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {uploadError}
                </div>
              </div>
            )}
          </div>
          {/* Uploaded File Preview */}
          {uploadedFile && (
            <div className="col-md-6 mt-3 mt-md-0">
              <div className="border rounded p-3" style={{
                borderColor: uploadStatus === 'success' ? "#6EE7B7" : uploadStatus === 'error' ? "#FCA5A5" : "#E5E7EB"
              }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                    {/* Document Icon */}
                    <div style={{ flexShrink: 0 }}>
                      <svg width="30" height="30" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="23" height="23" rx="11.5" fill="#E8F0FF" />
                        <path d="M12.5837 6.08398V8.25065C12.5837 8.53797 12.6978 8.81352 12.901 9.01668C13.1041 9.21985 13.3797 9.33398 13.667 9.33398H15.8337M10.417 9.87565H9.33366M13.667 12.0423H9.33366M13.667 14.209H9.33366M13.1253 6.08398H8.25033C7.96301 6.08398 7.68746 6.19812 7.48429 6.40129C7.28113 6.60445 7.16699 6.88 7.16699 7.16732V15.834C7.16699 16.1213 7.28113 16.3969 7.48429 16.6C7.68746 16.8032 7.96301 16.9173 8.25033 16.9173H14.7503C15.0376 16.9173 15.3132 16.8032 15.5164 16.6C15.7195 16.3969 15.8337 16.1213 15.8337 15.834V8.79232L13.1253 6.08398Z" stroke="#00C0C6" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {/* File Name and Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-semibold" style={{
                        fontFamily: "BasisGrotesquePro",
                        fontSize: "14px",
                        color: "#3B4A66",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {uploadedFile.name}
                      </div>
                      <div className="text-muted" style={{
                        fontSize: "0.875rem",
                        fontFamily: "BasisGrotesquePro"
                      }}>
                        {uploadedFile.isExistingFile ? (
                          <>Previously uploaded file</>
                        ) : (
                          <>Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="btn p-0 m-0 d-flex align-items-center justify-content-center"

                    title="Remove file"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="18" height="18" rx="9" fill="#E8F0FF" />
                      <path d="M11.8401 6.90974C11.8901 6.86133 11.93 6.80342 11.9574 6.73939C11.9849 6.67535 11.9993 6.60648 12 6.53677C12.0006 6.46707 11.9874 6.39793 11.9611 6.33341C11.9348 6.26888 11.896 6.21025 11.8469 6.16093C11.7978 6.11162 11.7394 6.07261 11.6751 6.04619C11.6108 6.01976 11.5419 6.00644 11.4724 6.00702C11.4029 6.00759 11.3342 6.02204 11.2704 6.04952C11.2065 6.077 11.1487 6.11697 11.1004 6.16708L9.00296 8.27044L6.90619 6.16708C6.85828 6.11551 6.8005 6.07414 6.73631 6.04545C6.67212 6.01675 6.60282 6.00133 6.53255 6.00008C6.46229 5.99884 6.39249 6.0118 6.32733 6.03821C6.26216 6.06461 6.20297 6.10391 6.15328 6.15376C6.10358 6.20361 6.06441 6.26299 6.03809 6.32836C6.01177 6.39372 5.99884 6.46374 6.00008 6.53423C6.00132 6.60471 6.0167 6.67423 6.0453 6.73862C6.07391 6.80302 6.11515 6.86098 6.16656 6.90904L8.26194 9.01309L6.16517 11.1165C6.07273 11.216 6.0224 11.3476 6.02479 11.4836C6.02719 11.6196 6.08211 11.7494 6.17799 11.8455C6.27387 11.9417 6.40323 11.9968 6.5388 11.9992C6.67438 12.0016 6.80559 11.9511 6.90479 11.8584L9.00296 9.75505L11.0997 11.8591C11.1989 11.9518 11.3302 12.0023 11.4657 11.9999C11.6013 11.9975 11.7307 11.9424 11.8265 11.8462C11.9224 11.7501 11.9773 11.6203 11.9797 11.4843C11.9821 11.3483 11.9318 11.2167 11.8394 11.1172L9.74399 9.01309L11.8401 6.90974Z" fill="#131323" />
                    </svg>

                  </button>
                </div>
                {/* Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="progress" style={{ height: "6px", borderRadius: "3px" }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${uploadProgress}%`,
                          backgroundColor: "#F56D2D",
                          transition: "width 0.3s ease"
                        }}
                        aria-valuenow={uploadProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                    <small style={{
                      fontFamily: "BasisGrotesquePro",
                      fontSize: "11px",
                      color: "#6B7280",
                      marginTop: "4px",
                      display: "block"
                    }}>
                      Uploading: {uploadProgress}%
                    </small>
                  </div>
                )}
                {/* Status Badge */}
                <div className="mt-2">
                  {uploadStatus === 'success' ? (
                    <span className="badge" style={{
                      background: "#FBBF24",
                      border: "0.5px solid #E8F0FF",
                      color: "#FFFFFF",
                      fontFamily: "BasisGrotesquePro",
                      fontSize: "12px",
                      padding: "4px 8px"
                    }}>
                      Uncategorized
                    </span>
                  ) : uploadStatus === 'error' ? (
                    <span className="badge" style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF",
                      fontFamily: "BasisGrotesquePro",
                      fontSize: "12px",
                      padding: "4px 8px"
                    }}>
                      Error
                    </span>
                  ) : uploadedFile.isExistingFile ? (
                    <span className="badge bg-warning text-dark" style={{
                      fontFamily: "BasisGrotesquePro",
                      fontSize: "12px",
                      padding: "4px 8px"
                    }}>
                      Previously Uploaded
                    </span>
                  ) : (
                    <span className="badge bg-secondary" style={{
                      fontFamily: "BasisGrotesquePro",
                      fontSize: "12px",
                      padding: "4px 8px"
                    }}>
                      Ready to Upload
                    </span>
                  )}
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
    </div >
  );
}