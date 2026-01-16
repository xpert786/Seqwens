import React, { useState, useEffect, useRef } from "react";
import { Accordion } from "react-bootstrap";
import PhoneInput from 'react-phone-input-2';
import "../styles/Dataintake.css";
import { FaPlus, FaTrash, FaTrashAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { dataIntakeAPI, handleAPIError } from "../utils/apiUtils";
import { getAccessToken, getUserData } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";
import { toast } from "react-toastify";
import SignatureModal from "../components/SignatureModal";
import ComprehensiveBusinessForm from "../components/ComprehensiveBusinessForm";
import RentalPropertyForm from "../components/RentalPropertyForm";

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
    businessType: "individual",
  });

  // Phone country codes state
  const [personalPhoneCountry, setPersonalPhoneCountry] = useState('us');
  const [spousePhoneCountry, setSpousePhoneCountry] = useState('us');
  // Track if country has been explicitly selected
  const [personalPhoneCountrySelected, setPersonalPhoneCountrySelected] = useState(false);
  const [spousePhoneCountrySelected, setSpousePhoneCountrySelected] = useState(false);

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
  });

  // Business Information State
  const [businesses, setBusinesses] = useState([]);
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState(null);

  // Comprehensive Business Data State
  const [businessData, setBusinessData] = useState({
    workDescription: '',
    businessName: '',
    businessNameType: 'same',
    differentBusinessName: '',
    startedDuringYear: false,
    homeBased: false,
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
    totalIncome: '',
    taxFormsReceived: [], // Array of selected forms: ['1099NEC', '1099MISC', '1099K']
    issuedRefunds: false,
    totalRefunded: '',
    otherBusinessIncome: false,
    otherBusinessIncomeAmount: '',
    advertising: '',
    officeSupplies: '',
    cleaningRepairs: '',
    insurance: '',
    legalProfessional: '',
    phoneInternetUtilities: '',
    paidContractors: false,
    totalPaidContractors: '',
    otherExpenses: [],
    otherExpenseDescription: '',
    otherExpenseAmount: '',
    usedVehicle: false,
    businessMiles: '',
    parkingTollsTravel: '',
    businessMeals: '',
    travelExpenses: '',
    homeOfficeUse: false,
    homeOfficeSize: '',
    sellProducts: false,
    costItemsResold: '',
    inventoryLeftEnd: '',
    healthInsuranceBusiness: false,
    selfEmployedRetirement: false,
    retirementAmount: '',
    isAccurate: false
  });

  // Rental Property Data State
  const [rentalData, setRentalData] = useState({
    isRentalProperty: false,
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    propertyType: 'single',
    ownershipType: '',
    rentedOutDuringYear: false,
    daysRentedOut: '',
    familyUse: false,
    familyUseDays: '',
    totalRentReceived: '',
    taxFormsReceived: 'none',
    advertising: '',
    cleaningMaintenance: '',
    repairs: '',
    propertyManagementFees: '',
    insurance: '',
    mortgageInterest: '',
    propertyTaxes: '',
    utilities: '',
    legalProfessional: '',
    supplies: '',
    otherExpenses: [],
    otherExpenseDescription: '',
    otherExpenseAmount: '',
    soldOrStoppedRenting: false,
    boughtMajorItems: false,
    hasRentalLosses: false,
    isComplete: false
  });

  // Rental Properties List State
  const [rentalProperties, setRentalProperties] = useState([]);
  const [isAddingRentalProperty, setIsAddingRentalProperty] = useState(false);
  const [editingRentalPropertyId, setEditingRentalPropertyId] = useState(null);

  const navigate = useNavigate();
  const firstDependentFirstNameRef = useRef(null);

  // Field errors state - maps field paths to error messages
  const [fieldErrors, setFieldErrors] = useState({});

  // General/top-level errors state (for errors like tax_documents)
  const [generalErrors, setGeneralErrors] = useState([]);

  // Refs for scrolling to error fields
  const fieldRefs = useRef({});

  // Track if user has existing data (to determine POST vs PATCH)
  const [hasExistingData, setHasExistingData] = useState(false);
  const [hasExistingBusinessData, setHasExistingBusinessData] = useState(false);
  const [hasExistingRentalData, setHasExistingRentalData] = useState(false);

  // Signature state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Submit loading state
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Handle Rental Property Save (Local State Only)
  const handleSaveRentalProperty = (rentalData) => {
    // Basic validation

    // Create a complete rental object
    const newRentalProperty = {
      id: editingRentalPropertyId || Date.now(), // Preserve ID if editing, else new
      ...rentalData,
      // Ensure numeric fields are strings or numbers as needed, but the form likely handles this.
      // We'll keep the data as is for now, matching the form state.
    };

    if (editingRentalPropertyId) {
      // Update existing
      setRentalProperties(prev => prev.map(rp =>
        rp.id === editingRentalPropertyId ? newRentalProperty : rp
      ));
      toast.success('Rental property updated locally');
    } else {
      // Add new
      setRentalProperties(prev => [...prev, newRentalProperty]);
      toast.success('Rental property added locally');
    }

    // Reset form
    handleCancelRentalProperty();
  };

  const handleCancelRentalProperty = () => {
    setRentalData({
      isRentalProperty: false,
      propertyAddress: '',
      propertyCity: '',
      propertyState: '',
      propertyZip: '',
      propertyType: 'single',
      ownershipType: '',
      rentedOutDuringYear: false,
      daysRentedOut: '',
      familyUse: false,
      familyUseDays: '',
      totalRentReceived: '',
      taxFormsReceived: 'none',
      advertising: '',
      cleaningMaintenance: '',
      repairs: '',
      propertyManagementFees: '',
      insurance: '',
      mortgageInterest: '',
      propertyTaxes: '',
      utilities: '',
      legalProfessional: '',
      supplies: '',
      otherExpenses: [],
      otherExpenseDescription: '',
      otherExpenseAmount: '',
      soldOrStoppedRenting: false,
      boughtMajorItems: false,
      hasRentalLosses: false,
      isComplete: false
    });
    setIsAddingRentalProperty(false);
    setEditingRentalPropertyId(null);
  };

  const handleEditRentalProperty = (rentalPropertyId) => {
    const rentalProperty = rentalProperties.find(rp => rp.id === rentalPropertyId);
    if (rentalProperty) {
      setRentalData(rentalProperty);
      setEditingRentalPropertyId(rentalPropertyId);
      setIsAddingRentalProperty(true);
    }
  };

  const handleRemoveRentalProperty = (rentalPropertyId) => {
    setRentalProperties(prev => prev.filter(rp => rp.id !== rentalPropertyId));
  };

  // Handle Business Info Save (Local State Only)
  const handleSaveBusiness = (businessData) => {
    // Check for business name - basic validation
    // if (!businessData.businessName) {
    //   toast.error('Business name is required');
    //   return;
    // }

    const calculateTotalExpenses = (data) => {
      let total = 0;
      total += parseFloat(data.advertising || 0);
      total += parseFloat(data.officeSupplies || 0);
      total += parseFloat(data.cleaningRepairs || 0);
      total += parseFloat(data.insurance || 0);
      total += parseFloat(data.legalProfessional || 0);
      total += parseFloat(data.phoneInternetUtilities || 0);
      total += parseFloat(data.totalPaidContractors || 0);
      total += parseFloat(data.parkingTollsTravel || 0);
      total += parseFloat(data.businessMeals || 0);
      total += parseFloat(data.travelExpenses || 0);
      total += parseFloat(data.costItemsResold || 0);
      total += parseFloat(data.retirementAmount || 0);

      // Add other expenses
      if (data.otherExpenses && Array.isArray(data.otherExpenses)) {
        data.otherExpenses.forEach(exp => {
          total += parseFloat(exp.amount || 0);
        });
      }

      return total.toFixed(2);
    };

    // Store full business data for editing and display
    const businessForDisplay = {
      id: editingBusinessId || Date.now(),
      businessName: businessData.businessName || "",
      businessType: "Self-Employment",
      totalIncome: businessData.totalIncome || "0",
      totalExpenses: calculateTotalExpenses(businessData),
      address: `${businessData.businessAddress || ""} ${businessData.businessCity || ""} ${businessData.businessState || ""} ${businessData.businessZip || ""}`.trim(),
      ...businessData, // Spread all fields
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setBusinesses(prev => {
      const existingIndex = prev.findIndex(b => b.id === businessForDisplay.id);
      if (existingIndex >= 0) {
        // Update existing business
        const updated = [...prev];
        updated[existingIndex] = businessForDisplay;
        return updated;
      } else {
        // Add new business
        return [...prev, businessForDisplay];
      }
    });

    // Reset form state after save
    setIsAddingBusiness(false);
    setEditingBusinessId(null);
    setHasExistingBusinessData(true); // Treat as having data since we have local data

    toast.success('Business information updated locally');
  };

  const handleEditBusiness = (businessId) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      // Load full business data into businessData state for editing
      setBusinessData({
        workDescription: business.workDescription || '',
        businessName: business.businessName || '',
        businessNameType: business.businessNameType || 'same',
        differentBusinessName: business.differentBusinessName || '',
        startedDuringYear: business.startedDuringYear || false,
        homeBased: business.homeBased || false,
        businessAddress: business.businessAddress || '',
        businessCity: business.businessCity || '',
        businessState: business.businessState || '',
        businessZip: business.businessZip || '',
        totalIncome: business.totalIncome || '',
        taxFormsReceived: Array.isArray(business.taxFormsReceived)
          ? business.taxFormsReceived
          : (business.taxFormsReceived === 'none' ? [] : (business.taxFormsReceived ? [business.taxFormsReceived] : [])),
        issuedRefunds: business.issuedRefunds || false,
        totalRefunded: business.totalRefunded || '',
        otherBusinessIncome: business.otherBusinessIncome || false,
        otherBusinessIncomeAmount: business.otherBusinessIncomeAmount || '',
        advertising: business.advertising || '',
        officeSupplies: business.officeSupplies || '',
        cleaningRepairs: business.cleaningRepairs || '',
        insurance: business.insurance || '',
        legalProfessional: business.legalProfessional || '',
        phoneInternetUtilities: business.phoneInternetUtilities || '',
        paidContractors: business.paidContractors || false,
        totalPaidContractors: business.totalPaidContractors || '',
        otherExpenses: business.otherExpenses || [],
        otherExpenseDescription: business.otherExpenseDescription || '',
        otherExpenseAmount: business.otherExpenseAmount || '',
        usedVehicle: business.usedVehicle || false,
        businessMiles: business.businessMiles || '',
        parkingTollsTravel: business.parkingTollsTravel || '',
        businessMeals: business.businessMeals || '',
        travelExpenses: business.travelExpenses || '',
        homeOfficeUse: business.homeOfficeUse || false,
        homeOfficeSize: business.homeOfficeSize || '',
        sellProducts: business.sellProducts || false,
        costItemsResold: business.costItemsResold || '',
        inventoryLeftEnd: business.inventoryLeftEnd || '',
        healthInsuranceBusiness: business.healthInsuranceBusiness || false,
        selfEmployedRetirement: business.selfEmployedRetirement || false,
        retirementAmount: business.retirementAmount || '',
        isAccurate: business.isAccurate || false,
        id: business.id || null
      });
      setEditingBusinessId(businessId);
      setIsAddingBusiness(true);
    }
  };

  const handleRemoveBusiness = (businessId) => {
    setBusinesses(prev => prev.filter(b => b.id !== businessId));
  };

  const handleCancelBusiness = () => {
    setIsAddingBusiness(false);
    setEditingBusinessId(null);
  };

  // Check if user already has data intake data and pre-fill form
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          console.log("No access token found");
          return;
        }

        console.log("Checking for existing data intake data via Consolidated API...");

        // Call Consolidated API
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/taxpayer/consolidated-data-intake/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Consolidated data found:", result);

          if (result.success && result.data) {
            const data = result.data;
            const personalInfoData = data.personal_info || {};
            const bankInfoData = data.bank_info || {};
            const businessInfoData = data.business_info || [];
            const rentalPropertyInfoData = data.rental_property_info || [];
            const documentsData = data.documents || [];

            // Mark that user has existing data (will use PATCH instead of POST)
            setHasExistingData(true);

            // ---------------------------------------------------------
            // 1. Personal Info Population
            // ---------------------------------------------------------
            let phoneValue = personalInfoData.phone_number || "";
            setPersonalInfo({
              firstName: personalInfoData.first_name || "",
              middleInitial: personalInfoData.middle_initial || "",
              lastName: personalInfoData.last_name || "",
              dateOfBirth: formatDateToYYYYMMDD(personalInfoData.dateOfBirth),
              ssn: personalInfoData.ssn || "",
              email: personalInfoData.email || "",
              phone: phoneValue,
              address: personalInfoData.address || "",
              city: personalInfoData.city || "",
              state: personalInfoData.state || "",
              zip: personalInfoData.zip || "",
              filingStatus: personalInfoData.filing_status || "",
              businessType: personalInfoData.business_type || "individual",
            });
            if (phoneValue) setPersonalPhoneCountrySelected(true);

            // Spouse Info
            const spouseData = personalInfoData.spouse_info || {};
            let spousePhoneValue = "";
            if (spouseData.spouse_phone_number) {
              const phoneMatch = spouseData.spouse_phone_number.match(/^\+(\d{1,3})/);
              if (phoneMatch) spousePhoneValue = `+${phoneMatch[1]}`;
            }
            setSpouseInfo({
              firstName: spouseData.spouse_first_name || "",
              middleInitial: spouseData.spouse_middle_name || "",
              lastName: spouseData.spouse_last_name || "",
              dateOfBirth: formatDateToYYYYMMDD(spouseData.spouse_dateOfBirth),
              ssn: spouseData.spouse_ssn || "",
              email: spouseData.spouse_email || "",
              phone: spousePhoneValue,
            });
            if (spousePhoneValue) setSpousePhoneCountrySelected(true);

            // Other Info
            setOtherInfo({
              ownsHome: personalInfoData.does_own_a_home || false,
              inSchool: personalInfoData.in_school || false,
              otherDeductions: personalInfoData.other_deductions ? "yes" : "no"
            });

            // Filing Status / Income Info
            if (personalInfoData.income_information) {
              if (Array.isArray(personalInfoData.income_information)) {
                setFilingStatus(personalInfoData.income_information);
              } else {
                setFilingStatus([personalInfoData.income_information]);
              }
            } else {
              setFilingStatus(["w2"]);
            }

            // Dependents
            if (personalInfoData.dependents && Array.isArray(personalInfoData.dependents) && personalInfoData.dependents.length > 0) {
              setHasDependents(true);
              const formattedDependents = personalInfoData.dependents.map((dep) => ({
                firstName: dep.dependent_first_name || '',
                middleInitial: dep.dependent_middle_name || '',
                lastName: dep.dependent_last_name || '',
                dob: formatDateToYYYYMMDD(dep.dependent_dateOfBirth),
                ssn: dep.dependent_ssn || ''
              }));
              setDependents(formattedDependents);
            } else if (personalInfoData.no_of_dependents > 0) {
              setHasDependents(true);
              const emptyDependents = Array(personalInfoData.no_of_dependents).fill().map(() => ({
                firstName: '',
                middleInitial: '',
                lastName: '',
                dob: '',
                ssn: ''
              }));
              setDependents(emptyDependents);
            }

            // ---------------------------------------------------------
            // 2. Bank Info Population
            // ---------------------------------------------------------
            setBankInfo({
              bankName: bankInfoData.bank_name || "",
              routingNumber: bankInfoData.routing_number || "",
              confirmRoutingNumber: bankInfoData.routing_number || "",
              accountNumber: bankInfoData.account_number || "",
              confirmAccountNumber: bankInfoData.account_number || "",
            });

            // ---------------------------------------------------------
            // 3. Document / File Population
            // ---------------------------------------------------------
            if (documentsData && documentsData.length > 0) {
              const firstFile = documentsData[0];
              const filename = firstFile.filename || "uploaded_document";
              const mockFile = {
                name: filename,
                size: firstFile.size || 1024 * 1024,
                type: "application/pdf", // defaulting to pdf or infer from filename
                lastModified: new Date().getTime(),
                url: firstFile.url,
                isExistingFile: true,
                created_at: new Date().toISOString() // Using current time as fallback if not provided
              };
              setUploadedFile(mockFile);
            } else {
              setUploadedFile(null);
            }

            // ---------------------------------------------------------
            // 4. Business Info Population
            // ---------------------------------------------------------
            if (Array.isArray(businessInfoData) && businessInfoData.length > 0) {
              const calculateTotalExpensesFromAPI = (data) => {
                let total = 0;
                total += parseFloat(data.advertising || 0);
                total += parseFloat(data.office_supplies || 0);
                total += parseFloat(data.cleaning_repairs || 0);
                total += parseFloat(data.insurance || 0);
                total += parseFloat(data.legal_professional || 0);
                total += parseFloat(data.phone_internet_utilities || 0);
                total += parseFloat(data.total_paid_contractors || 0);
                total += parseFloat(data.parking_tolls_travel || 0);
                total += parseFloat(data.business_meals || 0);
                total += parseFloat(data.travel_expenses || 0);
                total += parseFloat(data.cost_items_resold || 0);
                total += parseFloat(data.retirement_amount || 0);
                if (data.other_expenses && Array.isArray(data.other_expenses)) {
                  data.other_expenses.forEach(exp => {
                    total += parseFloat(exp.amount || 0);
                  });
                }
                return total.toFixed(2);
              };

              const businessList = businessInfoData.map(bData => ({
                id: bData.id || Date.now(),
                businessName: bData.business_name || "",
                businessType: "Self-Employment",
                totalIncome: bData.total_income || "0",
                totalExpenses: calculateTotalExpensesFromAPI(bData),
                address: `${bData.business_address || ""} ${bData.business_city || ""} ${bData.business_state || ""} ${bData.business_zip || ""}`.trim(),
                workDescription: bData.work_description || "",
                businessNameType: bData.business_name_type || 'same',
                differentBusinessName: bData.different_business_name || '',
                startedDuringYear: bData.started_during_year || false,
                homeBased: bData.home_based || false,
                businessAddress: bData.business_address || '',
                businessCity: bData.business_city || '',
                businessState: bData.business_state || '',
                businessZip: bData.business_zip || '',
                taxFormsReceived: (() => {
                  const forms = bData.tax_forms_received;
                  if (Array.isArray(forms)) return forms;
                  if (typeof forms === 'string') return forms === 'none' ? [] : [forms];
                  return [];
                })(),
                issuedRefunds: bData.issued_refunds || false,
                totalRefunded: bData.total_refunded || '',
                otherBusinessIncome: bData.other_business_income || false,
                otherBusinessIncomeAmount: bData.other_business_income_amount || '',
                advertising: bData.advertising || '',
                officeSupplies: bData.office_supplies || '',
                cleaningRepairs: bData.cleaning_repairs || '',
                insurance: bData.insurance || '',
                legalProfessional: bData.legal_professional || '',
                phoneInternetUtilities: bData.phone_internet_utilities || '',
                paidContractors: bData.paid_contractors || false,
                totalPaidContractors: bData.total_paid_contractors || '',
                otherExpenses: bData.other_expenses || [],
                usedVehicle: bData.used_vehicle || false,
                businessMiles: bData.business_miles || '',
                parkingTollsTravel: bData.parking_tolls_travel || '',
                businessMeals: bData.business_meals || '',
                travelExpenses: bData.travel_expenses || '',
                homeOfficeUse: bData.home_office_use || false,
                homeOfficeSize: bData.home_office_size || '',
                sellProducts: bData.sell_products || false,
                costItemsResold: bData.cost_items_resold || '',
                inventoryLeftEnd: bData.inventory_left_end || '',
                healthInsuranceBusiness: bData.health_insurance_business || false,
                selfEmployedRetirement: bData.self_employed_retirement || false,
                retirementAmount: bData.retirement_amount || '',
                isAccurate: bData.is_accurate || false
              }));
              setBusinesses(businessList);
              setHasExistingBusinessData(true);
            } else {
              setBusinesses([]);
              setHasExistingBusinessData(false);
            }

            // ---------------------------------------------------------
            // 5. Rental Property Info Population
            // ---------------------------------------------------------
            if (Array.isArray(rentalPropertyInfoData) && rentalPropertyInfoData.length > 0) {
              const rentalList = rentalPropertyInfoData.map(rData => ({
                id: rData.id || Date.now(),
                isRentalProperty: rData.is_rental_property || false,
                propertyAddress: rData.property_address || "",
                propertyCity: rData.property_city || "",
                propertyState: rData.property_state || "",
                propertyZip: rData.property_zip || "",
                propertyType: rData.property_type || "single_family",
                ownershipType: rData.ownership_type || "",
                rentedOutDuringYear: rData.rented_out_during_year || false,
                daysRentedOut: rData.days_rented_out || 0,
                familyUse: rData.family_use || false,
                familyUseDays: rData.family_use_days || 0,
                totalRentReceived: rData.total_rent_received || "0.00",
                taxFormsReceived: (() => {
                  const forms = rData.tax_forms_received;
                  if (Array.isArray(forms)) return forms;
                  if (typeof forms === 'string') return forms === 'none' ? [] : [forms];
                  return [];
                })(),
                advertising: rData.advertising || "0.00",
                cleaningMaintenance: rData.cleaning_maintenance || "0.00",
                repairs: rData.repairs || "0.00",
                propertyManagementFees: rData.property_management_fees || "0.00",
                insurance: rData.insurance || "0.00",
                mortgageInterest: rData.mortgage_interest || "0.00",
                propertyTaxes: rData.property_taxes || "0.00",
                utilities: rData.utilities || "0.00",
                legalProfessional: rData.legal_professional || "0.00",
                supplies: rData.supplies || "0.00",
                otherExpenses: rData.other_expenses || [],
                soldOrStoppedRenting: rData.sold_or_stopped_renting || false,
                boughtMajorItems: rData.bought_major_items || false,
                hasRentalLosses: rData.has_rental_losses || false,
                isComplete: rData.is_complete || false
              }));
              setRentalProperties(rentalList);
              setHasExistingRentalData(true);
            } else {
              setRentalProperties([]);
              setHasExistingRentalData(false);
            }

            // Signature status
            setIsSigned(personalInfoData.is_signed || false);
            if (personalInfoData.is_signed && personalInfoData.signature_type) {
              setSignatureType(personalInfoData.signature_type);
            }

            console.log("Form pre-filled with Consolidated API data");

          } else {
            // Success=true but no data?
            console.log("No existing consolidated data found in response");
            setFilingStatus(["w2"]);
            setHasExistingData(false);
          }
        } else {
          console.log("Consolidated API call failed or no data found (404)");
          setFilingStatus(["w2"]);
          setHasExistingData(false);
        }
      } catch (error) {
        console.error("Error checking existing data:", error);
        setFilingStatus(["w2"]);
      }
    };

    checkExistingData();
  }, []);

  // Initialize phone fields - keep empty initially, only show code when country selected
  useEffect(() => {
    // Don't set any initial value - field should be empty
    if (!personalInfo.phone) {
      handlePersonalInfoChange('phone', '');
      setPersonalPhoneCountrySelected(false);
    }
    if (!spouseInfo.phone) {
      handleSpouseInfoChange('phone', '');
      setSpousePhoneCountrySelected(false);
    }
  }, []);

  // Format date to YYYY-MM-DD format
  const formatDateToYYYYMMDD = (dateValue) => {
    if (!dateValue) return "";

    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // If it's in MM/DD/YYYY format, convert it to YYYY-MM-DD
    if (typeof dateValue === 'string' && /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(dateValue)) {
      const [month, day, year] = dateValue.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return "";
    }
  };

  // Validate date format - must be MM/DD/YYYY
  const validateDateFormat = (dateString) => {
    if (!dateString || dateString.trim() === '') {
      return { valid: true }; // Empty dates are handled by required field validation
    }

    // Check if format matches MM/DD/YYYY
    const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!datePattern.test(dateString)) {
      return {
        valid: false,
        error: 'Date must be in MM/DD/YYYY format (e.g., 01/15/1990)'
      };
    }

    // Validate the actual date values
    const [month, day, year] = dateString.split('/').map(Number);

    // Check if it's a valid date
    const date = new Date(year, month - 1, day);
    const isValidDate = date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!isValidDate) {
      return {
        valid: false,
        error: 'Please enter a valid date'
      };
    }

    // Check reasonable date ranges (not in future, not too far in past)
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()); // 120 years ago
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()); // 18 years ago for taxpayer

    if (date < minDate) {
      return {
        valid: false,
        error: 'Date appears to be too far in the past'
      };
    }

    if (date > maxDate) {
      return {
        valid: false,
        error: 'Taxpayers must be at least 18 years old'
      };
    }

    return { valid: true };
  };

  // Validate phone number - extract number part (without country code) and check if exactly 10 digits
  // Handles country codes of 1, 2, or 3 digits
  const validatePhoneNumber = (phoneValue) => {
    if (!phoneValue) return { valid: false, error: 'Phone number is required' };

    // Extract all digits from the phone value (react-phone-input-2 includes country code)
    const digitsOnly = phoneValue.replace(/\D/g, '');

    // Determine country code length by checking the phone value format
    // react-phone-input-2 formats phone as: +[countryCode][phoneNumber]
    const phoneWithPlus = phoneValue.startsWith('+') ? phoneValue : `+${phoneValue}`;

    let countryCodeLength = 1; // Default to 1 digit

    // Check for 3-digit country codes (mostly African countries starting with +2)
    // Pattern: +2XX where XX is 12-99 (but not 20 which is Egypt with 2 digits)
    // Examples: +212 (Morocco), +234 (Nigeria), +254 (Kenya), etc.
    if (/^\+2(1[2-9]|2[1-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-7])/.test(phoneWithPlus)) {
      countryCodeLength = 3;
    }
    // Check for 2-digit country codes (most countries)
    // Pattern: +[3-9]X or +20 (Egypt) or +27 (South Africa)
    else if (/^\+([3-9]\d|20|27)/.test(phoneWithPlus)) {
      countryCodeLength = 2;
    }
    // 1-digit country codes (US, Canada, etc. starting with +1)
    else if (phoneWithPlus.startsWith('+1')) {
      countryCodeLength = 1;
    }

    // Total digits should be: countryCodeLength + 10 (phone number)
    const expectedTotalDigits = countryCodeLength + 10;

    if (digitsOnly.length < expectedTotalDigits) {
      return { valid: false, error: `Phone number must be exactly 10 digits (excluding country code)` };
    }

    // Extract the last 10 digits (phone number without country code)
    // This works for all country code lengths: 
    // - 1 digit: 11 total (1 + 10) -> last 10 = phone number ✓
    // - 2 digits: 12 total (2 + 10) -> last 10 = phone number ✓
    // - 3 digits: 13 total (3 + 10) -> last 10 = phone number ✓
    const numberPart = digitsOnly.slice(-10);

    if (numberPart.length !== 10) {
      return { valid: false, error: 'Phone number must be exactly 10 digits' };
    }

    return { valid: true, error: null };
  };

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
      'business_type': 'personalInfo.businessType',
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
      'confirm_routing_number': 'bankInfo.confirmRoutingNumber',
      'account_number': 'bankInfo.accountNumber',
      'confirm_account_number': 'bankInfo.confirmAccountNumber',

      // Dependent fields (array)
      'dependents': 'dependents',
      'dependent_first_name': 'dependents',
      'dependent_last_name': 'dependents',
      'dependent_dateOfBirth': 'dependents',
      'dependent_ssn': 'dependents',

      // File upload
      'tax_documents': 'uploadedFile',
    };

    // Handle nested fields (e.g., personal_info.first_name, personal_info.spouse_info.spouse_dateOfBirth, bank_info.routing_number)
    let fieldKey = apiField;
    if (apiField.includes('.')) {
      const parts = apiField.split('.');
      // Remove known prefixes (personal_info, spouse_info, bank_info)
      // Extract the last part which is the actual field name
      // For example: personal_info.spouse_info.spouse_dateOfBirth -> spouse_dateOfBirth
      const prefixes = ['personal_info', 'spouse_info', 'bank_info'];
      // Find the last part that's not a prefix
      for (let i = parts.length - 1; i >= 0; i--) {
        if (!prefixes.includes(parts[i])) {
          fieldKey = parts[i];
          break;
        }
      }
    }

    return fieldMappings[fieldKey] || apiField;
  };

  // Parse error message string that contains a dictionary (e.g., from Django validation errors)
  const parseErrorMessage = (message) => {
    if (!message || typeof message !== 'string') return null;

    // Look for dictionary pattern in message: {...}
    // Match the entire dictionary including nested structures
    const dictMatch = message.match(/\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/);
    if (!dictMatch) return null;

    try {
      const dictStr = dictMatch[0];

      // Extract ErrorDetail objects: ErrorDetail(string='message', code='invalid')
      // Replace with just the string value wrapped in quotes
      const cleanedStr = dictStr.replace(/ErrorDetail\(string='([^']+)',\s*code='[^']+'\)/g, "'$1'");

      // Now we have a Python dict-like string, convert it to JSON
      // Replace single quotes with double quotes for JSON, but be careful with nested quotes
      // First, handle keys
      let jsonStr = cleanedStr.replace(/'([^']+)':/g, '"$1":');
      // Then handle string values (they're already in single quotes from ErrorDetail replacement)
      jsonStr = jsonStr.replace(/: '([^']+)'/g, ': "$1"');
      // Handle array brackets
      jsonStr = jsonStr.replace(/\[/g, '[').replace(/\]/g, ']');

      const parsed = JSON.parse(jsonStr);

      // Convert to our error format
      const result = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          result[key] = value.map(item => String(item));
        } else {
          result[key] = [String(value)];
        }
      });

      return result;
    } catch (e) {
      console.error('Error parsing error message:', e, 'Original message:', message);
      // Fallback: try to extract field names and messages manually
      try {
        const result = {};
        // Extract confirm_routing_number errors
        const routingMatch = message.match(/confirm_routing_number['"]:\s*\[ErrorDetail\(string='([^']+)'/);
        if (routingMatch) {
          result['confirm_routing_number'] = [routingMatch[1]];
        }
        // Extract confirm_account_number errors
        const accountMatch = message.match(/confirm_account_number['"]:\s*\[ErrorDetail\(string='([^']+)'/);
        if (accountMatch) {
          result['confirm_account_number'] = [accountMatch[1]];
        }
        if (Object.keys(result).length > 0) {
          return result;
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
      }
      return null;
    }
  };

  // Parse API error response and set field errors
  const parseAndSetFieldErrors = (errorData, source) => {
    const errors = {};
    const generalErrorMessages = [];

    // First, check if errors are in the errors object
    if (errorData.errors) {
      // Check for tax_documents errors first (these should be shown at top)
      if (errorData.errors.tax_documents) {
        const taxDocErrors = Array.isArray(errorData.errors.tax_documents)
          ? errorData.errors.tax_documents.map(item => {
            if (typeof item === 'object' && item !== null && item.string) {
              return item.string;
            }
            return String(item);
          })
          : [String(errorData.errors.tax_documents)];
        generalErrorMessages.push(...taxDocErrors);

        // Check if the error message indicates tax documents are required
        const hasRequiredError = taxDocErrors.some(error =>
          error.toLowerCase().includes('tax documents are required') ||
          error.toLowerCase().includes('supporting document') ||
          error.toLowerCase().includes('upload at least one')
        );

        if (hasRequiredError) {
          // Clear the uploaded file when tax documents are required
          setUploadedFile(null);
          setUploadStatus(null);
          setUploadProgress(0);
          setUploadError(null);
        }
      }

      // Helper function to recursively parse nested error objects
      const parseNestedErrors = (errorObj, prefix = '') => {
        Object.entries(errorObj).forEach(([key, value]) => {
          // Skip tax_documents as we handle it separately
          if (key === 'tax_documents') {
            return;
          }

          if (Array.isArray(value)) {
            // This is a field with error messages
            const fieldPath = prefix ? `${prefix}.${key}` : key;
            const formFieldPath = mapApiFieldToFormField(fieldPath, source);
            // Extract string from ErrorDetail objects if present
            const errorMessages = value.map(item => {
              if (typeof item === 'object' && item !== null && item.string) {
                return item.string;
              }
              return String(item);
            });
            errors[formFieldPath] = errorMessages;
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
          ? errorMessages.map(item => {
            if (typeof item === 'object' && item !== null && item.string) {
              return item.string;
            }
            return String(item);
          })
          : [String(errorMessages)];
        errors[formFieldPath] = messages;
      });
    }

    // If no errors found in errors object, try parsing from message string
    if (Object.keys(errors).length === 0 && errorData.message) {
      const parsedErrors = parseErrorMessage(errorData.message);
      if (parsedErrors) {
        Object.entries(parsedErrors).forEach(([field, errorMessages]) => {
          // Handle nested fields like bank_info.confirm_routing_number
          let fieldPath = field;
          if (field.includes('_') && !field.includes('.')) {
            // Check if it's a bank_info field
            if (field.startsWith('confirm_') || field === 'bank_name' || field === 'routing_number' || field === 'account_number') {
              fieldPath = `bank_info.${field}`;
            }
          }
          const formFieldPath = mapApiFieldToFormField(fieldPath, source);
          errors[formFieldPath] = Array.isArray(errorMessages) ? errorMessages : [errorMessages];
        });
      }
    }

    console.log('Parsed field errors:', errors);
    setFieldErrors(errors);
    setGeneralErrors(generalErrorMessages);

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

  // Validate required fields before submission
  const validateRequiredFields = () => {
    const errors = {};

    // Personal Information - Required fields
    if (!personalInfo.firstName || personalInfo.firstName.trim() === '') {
      errors['personalInfo.firstName'] = ['First name is required'];
    }
    if (!personalInfo.lastName || personalInfo.lastName.trim() === '') {
      errors['personalInfo.lastName'] = ['Last name is required'];
    }
    if (!personalInfo.dateOfBirth || personalInfo.dateOfBirth.trim() === '') {
      errors['personalInfo.dateOfBirth'] = ['Date of birth is required'];
    } else {
      const dateValidation = validateDateFormat(personalInfo.dateOfBirth);
      if (!dateValidation.valid) {
        errors['personalInfo.dateOfBirth'] = [dateValidation.error];
      }
    }
    if (!personalInfo.ssn || personalInfo.ssn.trim() === '') {
      errors['personalInfo.ssn'] = ['SSN is required'];
    }
    if (!personalInfo.email || personalInfo.email.trim() === '') {
      errors['personalInfo.email'] = ['Email is required'];
    }
    if (!personalInfo.phone || personalInfo.phone.trim() === '') {
      errors['personalInfo.phone'] = ['Phone number is required'];
    } else {
      const phoneValidation = validatePhoneNumber(personalInfo.phone);
      if (!phoneValidation.valid) {
        errors['personalInfo.phone'] = [phoneValidation.error];
      }
    }
    if (!personalInfo.address || personalInfo.address.trim() === '') {
      errors['personalInfo.address'] = ['Address is required'];
    }
    if (!personalInfo.city || personalInfo.city.trim() === '') {
      errors['personalInfo.city'] = ['City is required'];
    }
    if (!personalInfo.state || personalInfo.state.trim() === '') {
      errors['personalInfo.state'] = ['State is required'];
    }
    if (!personalInfo.zip || personalInfo.zip.trim() === '') {
      errors['personalInfo.zip'] = ['ZIP code is required'];
    }
    if (!personalInfo.filingStatus || personalInfo.filingStatus.trim() === '') {
      errors['personalInfo.filingStatus'] = ['Filing status is required'];
    }

    // Spouse Information - Required if filing status is "Married Filing Jointly" or "Married Filing Separately"
    if (personalInfo.filingStatus === 'Married Filing Jointly' || personalInfo.filingStatus === 'Married Filing Separately') {
      if (!spouseInfo.firstName || spouseInfo.firstName.trim() === '') {
        errors['spouseInfo.firstName'] = ['Spouse first name is required'];
      }
      if (!spouseInfo.lastName || spouseInfo.lastName.trim() === '') {
        errors['spouseInfo.lastName'] = ['Spouse last name is required'];
      }
      if (!spouseInfo.dateOfBirth || spouseInfo.dateOfBirth.trim() === '') {
        errors['spouseInfo.dateOfBirth'] = ['Spouse date of birth is required'];
      } else {
        const dateValidation = validateDateFormat(spouseInfo.dateOfBirth);
        if (!dateValidation.valid) {
          errors['spouseInfo.dateOfBirth'] = [dateValidation.error];
        }
      }
      if (!spouseInfo.ssn || spouseInfo.ssn.trim() === '') {
        errors['spouseInfo.ssn'] = ['Spouse SSN is required'];
      }
      if (!spouseInfo.phone || spouseInfo.phone.trim() === '') {
        errors['spouseInfo.phone'] = ['Spouse phone number is required'];
      } else {
        const phoneValidation = validatePhoneNumber(spouseInfo.phone);
        if (!phoneValidation.valid) {
          errors['spouseInfo.phone'] = [phoneValidation.error];
        }
      }
    }

    // Dependents - Validate if hasDependents is true
    if (hasDependents) {
      dependents.forEach((dep, index) => {
        if (!dep.firstName || dep.firstName.trim() === '') {
          errors[`dependents.${index}.firstName`] = ['Dependent first name is required'];
        }
        if (!dep.lastName || dep.lastName.trim() === '') {
          errors[`dependents.${index}.lastName`] = ['Dependent last name is required'];
        }
        if (!dep.dob || dep.dob.trim() === '') {
          errors[`dependents.${index}.dob`] = ['Dependent date of birth is required'];
        } else {
          const dateValidation = validateDateFormat(dep.dob);
          if (!dateValidation.valid) {
            errors[`dependents.${index}.dob`] = [dateValidation.error];
          }
        }
        if (!dep.ssn || dep.ssn.trim() === '') {
          errors[`dependents.${index}.ssn`] = ['Dependent SSN is required'];
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      console.log("Validation failed with errors:", errors);
    }
    return errors;
  };

  const handleSubmit = async () => {
    // Clear previous general errors
    setGeneralErrors([]);

    // Set loading state to true
    setIsSubmitting(true);

    // Validate required fields first
    const validationErrors = validateRequiredFields();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      // Scroll to first error
      setTimeout(() => {
        scrollToFirstError(validationErrors);
      }, 100);
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
      });
      setIsSubmitting(false);
      return;
    }

    console.log("Submit button clicked - Initializing submission...");
    console.log("Using Consolidated API Endpoint");

    try {
      // Reset upload states if file exists
      if (uploadedFile && !uploadedFile.isExistingFile) {
        setUploadProgress(0);
        setUploadStatus(null);
        setUploadError(null);
      }

      // ---------------------------------------------------------
      // 1. Prepare Consolidated Data Payload
      // ---------------------------------------------------------

      const consolidatedPayload = {
        personal_info: {
          first_name: personalInfo.firstName || "",
          middle_initial: personalInfo.middleInitial || "",
          last_name: personalInfo.lastName || "",
          dateOfBirth: personalInfo.dateOfBirth ? formatDateToYYYYMMDD(personalInfo.dateOfBirth) : "",
          ssn: personalInfo.ssn || "",
          email: personalInfo.email || "",
          phone_number: personalInfo.phone || "",
          address: personalInfo.address || "",
          city: personalInfo.city || "",
          state: personalInfo.state || "",
          zip: personalInfo.zip || "",
          filing_status: personalInfo.filingStatus || "",
          business_type: personalInfo.businessType || "",
          income_information: filingStatus.length > 0 ? filingStatus : ["w2"],
          no_of_dependents: hasDependents ? dependents.length : 0,
          other_deductions: otherInfo.otherDeductions === "yes",
          does_own_a_home: otherInfo.ownsHome,
          in_school: otherInfo.inSchool,
          spouse_info: {
            spouse_first_name: spouseInfo.firstName || "",
            spouse_middle_name: spouseInfo.middleInitial || "",
            spouse_last_name: spouseInfo.lastName || "",
            spouse_dateOfBirth: spouseInfo.dateOfBirth ? formatDateToYYYYMMDD(spouseInfo.dateOfBirth) : "",
            spouse_ssn: spouseInfo.ssn || "",
            spouse_email: spouseInfo.email || "",
            spouse_phone_number: spouseInfo.phone || ""
          },
          dependents: hasDependents ? dependents.map(dep => ({
            dependent_first_name: dep.firstName || "",
            dependent_middle_name: dep.middleInitial || "",
            dependent_last_name: dep.lastName || "",
            dependent_dateOfBirth: dep.dob ? formatDateToYYYYMMDD(dep.dob) : "",
            dependent_ssn: dep.ssn || ""
          })) : []
        },
        bank_info: {
          bank_name: bankInfo.bankName || "",
          routing_number: bankInfo.routingNumber || "",
          confirm_routing_number: bankInfo.confirmRoutingNumber || "",
          account_number: bankInfo.accountNumber || "",
          confirm_account_number: bankInfo.confirmAccountNumber || ""
        },
        // Map businesses to API structure
        business_info: businesses.map(b => ({
          id: b.id !== undefined && String(b.id).length < 15 ? b.id : undefined, // Only send valid DB IDs if possible, else let backend create
          business_name: b.businessName || "",
          business_address: b.businessAddress || "",
          business_city: b.businessCity || "",
          business_state: b.businessState || "",
          business_zip: b.businessZip || "",
          work_description: b.workDescription || "",
          business_name_type: b.businessNameType || "same",
          different_business_name: b.differentBusinessName || "",
          started_during_year: b.startedDuringYear || false,
          home_based: b.homeBased || false,
          total_income: b.totalIncome || "",
          tax_forms_received: Array.isArray(b.taxFormsReceived) ? b.taxFormsReceived : [],
          issued_refunds: b.issuedRefunds || false,
          total_refunded: b.totalRefunded || "",
          other_business_income: b.otherBusinessIncome || false,
          other_business_income_amount: b.otherBusinessIncomeAmount || "",
          advertising: b.advertising || "",
          office_supplies: b.officeSupplies || "",
          cleaning_repairs: b.cleaningRepairs || "",
          insurance: b.insurance || "",
          legal_professional: b.legalProfessional || "",
          phone_internet_utilities: b.phoneInternetUtilities || "",
          paid_contractors: b.paidContractors || false,
          total_paid_contractors: b.totalPaidContractors || "",
          other_expenses: b.otherExpenses || [],
          used_vehicle: b.usedVehicle || false,
          business_miles: b.businessMiles || "",
          parking_tolls_travel: b.parkingTollsTravel || "",
          business_meals: b.businessMeals || "",
          travel_expenses: b.travelExpenses || "",
          home_office_use: b.homeOfficeUse || false,
          home_office_size: b.homeOfficeSize || "",
          sell_products: b.sellProducts || false,
          cost_items_resold: b.costItemsResold || "",
          inventory_left_end: b.inventoryLeftEnd || "",
          health_insurance_business: b.healthInsuranceBusiness || false,
          self_employed_retirement: b.selfEmployedRetirement || false,
          retirement_amount: b.retirementAmount || "",
          is_accurate: b.isAccurate || false
        })),
        // Map rental properties to API structure
        rental_property_info: rentalProperties.map(r => ({
          id: r.id !== undefined && String(r.id).length < 15 ? r.id : undefined,
          is_rental_property: r.isRentalProperty || false,
          property_address: r.propertyAddress || "",
          property_city: r.propertyCity || "",
          property_state: r.propertyState || "",
          property_zip: r.propertyZip || "",
          property_type: r.propertyType || "single_family",
          ownership_type: r.ownershipType || "",
          rented_out_during_year: r.rentedOutDuringYear || false,
          days_rented_out: r.daysRentedOut || 0,
          family_use: r.familyUse || false,
          family_use_days: r.familyUseDays || 0,
          total_rent_received: r.totalRentReceived || "0.00",
          tax_forms_received: Array.isArray(r.taxFormsReceived) ? r.taxFormsReceived : [],
          advertising: r.advertising || "0.00",
          cleaning_maintenance: r.cleaningMaintenance || "0.00",
          repairs: r.repairs || "0.00",
          property_management_fees: r.propertyManagementFees || "0.00",
          insurance: r.insurance || "0.00",
          mortgage_interest: r.mortgageInterest || "0.00",
          property_taxes: r.propertyTaxes || "0.00",
          utilities: r.utilities || "0.00",
          legal_professional: r.legalProfessional || "0.00",
          supplies: r.supplies || "0.00",
          other_expenses: r.otherExpenses || [],
          sold_or_stopped_renting: r.soldOrStoppedRenting || false,
          bought_major_items: r.boughtMajorItems || false,
          has_rental_losses: r.hasRentalLosses || false,
          is_complete: r.isComplete || false
        }))
      };

      console.log("Full Consolidated Payload:", JSON.stringify(consolidatedPayload, null, 2));

      // ---------------------------------------------------------
      // 2. Prepare File Upload Payload (Separate API)
      // ---------------------------------------------------------
      const fileFormData = new FormData();
      const hasFileToUpload = uploadedFile && !uploadedFile.isExistingFile;

      if (hasFileToUpload) {
        fileFormData.append("tax_documents", uploadedFile);
      }

      const incomeTypes = filingStatus.length > 0 ? filingStatus : ["w2"];
      const primaryIncomeType = incomeTypes[0] || "w2";

      if (incomeTypes.length > 0) {
        fileFormData.append("income_information", primaryIncomeType);
      }

      incomeTypes.forEach(type => {
        fileFormData.append("income_information_types", type);
      });

      // ---------------------------------------------------------
      // 3. Authenticate and Submit
      // ---------------------------------------------------------
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please login again.", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const apiBaseUrl = getApiBaseUrl();
      console.log(`Submitting to: ${apiBaseUrl}/taxpayer/consolidated-data-intake/`);

      // Use Promise.all to handle both Data and File upload in parallel
      const [consolidatedResult, fileUploadResult] = await Promise.all([
        // API 1: Consolidated Data Intake
        // Logic: Use POST usually, or PATCH if updating. User says "both works".
        // Let's use POST by default or toggle based on hasExistingData if preferred.
        fetch(`${apiBaseUrl}/taxpayer/consolidated-data-intake/`, {
          method: hasExistingData ? "PATCH" : "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(consolidatedPayload)
        }),
        setIsSubmitting(false),

        // API 2: File Upload (if needed)
        // Only run if we have a fil to upload OR if we need to update income types even without file?
        // The previous code always ran it. Let's keep it consistent.
        // If we strictly only upload file when present, we might skip income types update if they are tied to this endpoint.
        // Assuming income types are also stored in consolidated, but keeping this for file.
        (hasFileToUpload || true) ? (() => { // Always running to ensure income types update if needed by legacy
          // ... Same XHR logic as before ...
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (hasFileToUpload && e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setUploadProgress(Math.round(percentComplete));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setIsSubmitting(false);
                if (hasFileToUpload) setUploadProgress(100);
                if (hasFileToUpload) setUploadStatus('success');
                resolve({ ok: true, json: () => { try { return JSON.parse(xhr.responseText); } catch (e) { return {}; } } });
              } else {
                setIsSubmitting(false);
                if (hasFileToUpload) setUploadStatus('error');
                if (hasFileToUpload) setUploadError(`Upload failed: ${xhr.status}`);
                resolve({ ok: false, status: xhr.status, statusText: xhr.statusText, text: () => Promise.resolve(xhr.responseText) });
              }
            });

            xhr.addEventListener('error', () => {
              setIsSubmitting(false);
              if (hasFileToUpload) setUploadStatus('error');
              reject(new Error('Network error'));
            });

          });
        })() : Promise.resolve({ ok: true, json: () => Promise.resolve({}) })

      ]);

      // ---------------------------------------------------------
      // 4. Handle Responses
      // ---------------------------------------------------------

      // Check Consolidated API Response
      if (!consolidatedResult.ok) {
        try {
          const errorData = await consolidatedResult.json();
          if (errorData.errors || errorData.message) {
            parseAndSetFieldErrors(errorData, 'personal'); // Using 'personal' source map as fallback
            return;
          }
        } catch (e) { }
        throw new Error(`Data submission failed: ${consolidatedResult.status}`);
      }

      const consolidatedResponse = await consolidatedResult.json();
      console.log("Consolidated submission success:", consolidatedResponse);

      // Check File Upload Response
      // Note: XHR wrapper returns object with ok/json similar to fetch
      if (!fileUploadResult.ok) {
        try {
          const errorText = await fileUploadResult.text();
          const errorData = JSON.parse(errorText);
          if (errorData.errors) {
            parseAndSetFieldErrors(errorData, 'file');
            return;
          }
        } catch (e) { }
        console.warn("File upload failed or returned non-200");
        // We might not want to block success if data saved but file failed? 
        // But usually it's critical. Let's throw.
        throw new Error("File upload failed.");
      }

      const fileResultData = await fileUploadResult.json();
      console.log("File upload success:", fileResultData);

      // ---------------------------------------------------------
      // 5. Cleanup and Notify
      // ---------------------------------------------------------
      if (consolidatedResponse.success) {
        setHasExistingData(true);
      }

      toast.success("Data intake form updated successfully!", {
        position: "top-right",
        autoClose: 3000
      });

      setFieldErrors({});

    } catch (err) {
      console.error("Submission error:", err);
      const errorMessage = handleAPIError(err);
      toast.error(`Submission failed: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setIsSubmitting(false);
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
    setGeneralErrors([]); // Clear general errors when file is selected

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

  // Helper function to format date input with slashes
  const formatDateInput = (value) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');

    // Add slashes at appropriate positions
    if (numericValue.length >= 2 && numericValue.length < 4) {
      return `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
    } else if (numericValue.length >= 4) {
      return `${numericValue.slice(0, 2)}/${numericValue.slice(2, 4)}/${numericValue.slice(4, 8)}`;
    }

    return numericValue;
  };

  const handleInputChange = (index, field, value) => {
    // Format date fields with slashes
    const formattedValue = field === 'dob' ? formatDateInput(value) : value;

    const updated = [...dependents];
    updated[index][field] = formattedValue;
    setDependents(updated);
    // Clear error when user starts typing
    clearFieldError(`dependents.${index}.${field}`);
  };

  const handlePersonalInfoChange = (field, value) => {
    // Format date fields with slashes
    const formattedValue = field === 'dateOfBirth' ? formatDateInput(value) : value;

    setPersonalInfo(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    // Clear error when user starts typing
    clearFieldError(`personalInfo.${field}`);
  };

  const handleSpouseInfoChange = (field, value) => {
    // Format date fields with slashes
    const formattedValue = field === 'dateOfBirth' ? formatDateInput(value) : value;

    setSpouseInfo(prev => ({
      ...prev,
      [field]: formattedValue
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

  // Handle manual signature submission
  const handleManualSign = () => {
    setShowSignatureModal(true);
  };

  // Handle signature submission
  const handleSubmitSignature = async (signatureData) => {
    try {
      setSignatureLoading(true);
      const response = await dataIntakeAPI.submitSignature(signatureData);

      if (response.success) {
        // Update signature status
        setIsSigned(true);
        setShowSignatureModal(false);

        toast.success(response.message || 'Signature submitted successfully!', {
          position: 'top-right',
          autoClose: 3000
        });

        // Redirect to dashboard after successful signature
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to submit signature');
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to submit signature. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setSignatureLoading(false);
    }
  };

  return (
    <div className="data-intake-page row g-0 lg:px-4 md:px-2 px-1">
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

      {/* General Error Display */}
      {generalErrors.length > 0 && (
        <div className="alert alert-danger mb-4" role="alert" style={{
          borderRadius: "8px",
          border: "1px solid #EF4444",
          backgroundColor: "#FEF2F2",
          padding: "16px",
          fontFamily: "BasisGrotesquePro"
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px"
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginTop: "2px", flexShrink: 0 }}>
              <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 6.66667V10" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 13.3333H10.0083" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ flex: 1 }}>
              <strong style={{
                color: "#DC2626",
                fontSize: "16px",
                fontWeight: "500",
                display: "block",
                marginBottom: "8px"
              }}>
                Validation Error
              </strong>
              <ul style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#991B1B",
                fontSize: "14px"
              }}>
                {generalErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
              type="text"
              className={`form-control ${getFieldError('personalInfo.dateOfBirth') ? 'is-invalid' : ''}`}
              placeholder="MM/DD/YYYY"
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
              disabled={true}
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
                // Clear error when user starts typing
                if (getFieldError('personalInfo.phone')) {
                  clearFieldError('personalInfo.phone');
                }
              }}
              onCountryChange={(countryCode) => {
                setPersonalPhoneCountry(countryCode.toLowerCase());
              }}
              inputClass={`form-control ${getFieldError('personalInfo.phone') ? 'is-invalid' : ''}`}
              containerClass="w-100 phone-input-container"
              inputStyle={{
                height: '45px',
                paddingLeft: '48px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                width: '100%',
                fontSize: '1rem',
                border: getFieldError('personalInfo.phone') ? '1px solid #EF4444' : '1px solid #ced4da',
                borderRadius: '0.375rem',
                backgroundColor: '#fff'
              }}
              enableSearch={true}
              countryCodeEditable={false}
              data-field="personalInfo.phone"
              ref={(el) => {
                if (el && el.inputElement) {
                  if (!fieldRefs.current['personalInfo.phone']) {
                    fieldRefs.current['personalInfo.phone'] = el.inputElement;
                  }
                }
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
          <div className="col-md-4">
            <label className="form-label" style={{
              fontFamily: "BasisGrotesquePro",
              fontWeight: 400,
              fontSize: "16px",
              color: "#3B4A66"
            }}>
              Business Type
            </label>
            <select
              className={`form-select mt-2 ${getFieldError('personalInfo.businessType') ? 'is-invalid' : ''}`}
              value={personalInfo.businessType}
              onChange={(e) => handlePersonalInfoChange('businessType', e.target.value)}
              data-field="personalInfo.businessType"
              ref={(el) => {
                if (!fieldRefs.current['personalInfo.businessType']) {
                  fieldRefs.current['personalInfo.businessType'] = el;
                }
              }}
            >
              <option value="individual">Individual</option>
              <option value="small_business">Small Business</option>
              <option value="medium_business">Medium Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
            {getFieldError('personalInfo.businessType') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('personalInfo.businessType')}
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
              className={`form-control ${getFieldError('spouseInfo.firstName') ? 'is-invalid' : ''}`}
              placeholder="Sara"
              value={spouseInfo.firstName}
              onChange={(e) => handleSpouseInfoChange('firstName', e.target.value)}
              data-field="spouseInfo.firstName"
              ref={(el) => {
                if (!fieldRefs.current['spouseInfo.firstName']) {
                  fieldRefs.current['spouseInfo.firstName'] = el;
                }
              }}
            />
            {getFieldError('spouseInfo.firstName') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('spouseInfo.firstName')}
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
              className={`form-control ${getFieldError('spouseInfo.lastName') ? 'is-invalid' : ''}`}
              placeholder="Johnson"
              value={spouseInfo.lastName}
              onChange={(e) => handleSpouseInfoChange('lastName', e.target.value)}
              data-field="spouseInfo.lastName"
              ref={(el) => {
                if (!fieldRefs.current['spouseInfo.lastName']) {
                  fieldRefs.current['spouseInfo.lastName'] = el;
                }
              }}
            />
            {getFieldError('spouseInfo.lastName') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('spouseInfo.lastName')}
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
              type="text"
              className={`form-control ${getFieldError('spouseInfo.dateOfBirth') ? 'is-invalid' : ''}`}
              placeholder="MM/DD/YYYY"
              value={spouseInfo.dateOfBirth}
              onChange={(e) => handleSpouseInfoChange('dateOfBirth', e.target.value)}
              data-field="spouseInfo.dateOfBirth"
              ref={(el) => {
                if (!fieldRefs.current['spouseInfo.dateOfBirth']) {
                  fieldRefs.current['spouseInfo.dateOfBirth'] = el;
                }
              }}
            />
            {getFieldError('spouseInfo.dateOfBirth') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('spouseInfo.dateOfBirth')}
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
              Social Security Number
            </label>
            <input
              type="text"
              className={`form-control ${getFieldError('spouseInfo.ssn') ? 'is-invalid' : ''}`}
              value={spouseInfo.ssn}
              onChange={(e) => handleSpouseInfoChange('ssn', e.target.value)}
              data-field="spouseInfo.ssn"
              ref={(el) => {
                if (!fieldRefs.current['spouseInfo.ssn']) {
                  fieldRefs.current['spouseInfo.ssn'] = el;
                }
              }}
            />
            {getFieldError('spouseInfo.ssn') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('spouseInfo.ssn')}
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
              className="form-control"
              placeholder="sara@example.com"
              style={{ height: '45px' }}
              value={spouseInfo.email}
              onChange={(e) => handleSpouseInfoChange('email', e.target.value)}
              disabled={true}
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
                // Clear error when user starts typing
                if (getFieldError('spouseInfo.phone')) {
                  clearFieldError('spouseInfo.phone');
                }
              }}
              onCountryChange={(countryCode) => {
                setSpousePhoneCountry(countryCode.toLowerCase());
              }}
              inputClass={`form-control ${getFieldError('spouseInfo.phone') ? 'is-invalid' : ''}`}
              containerClass="w-100 phone-input-container"
              inputStyle={{
                height: '45px',
                paddingLeft: '48px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                width: '100%',
                fontSize: '1rem',
                border: getFieldError('spouseInfo.phone') ? '1px solid #EF4444' : '1px solid #ced4da',
                borderRadius: '0.375rem',
                backgroundColor: '#fff'
              }}
              enableSearch={true}
              countryCodeEditable={false}
              data-field="spouseInfo.phone"
              ref={(el) => {
                if (el && el.inputElement) {
                  if (!fieldRefs.current['spouseInfo.phone']) {
                    fieldRefs.current['spouseInfo.phone'] = el.inputElement;
                  }
                }
              }}
            />
            {getFieldError('spouseInfo.phone') && (
              <div className="invalid-feedback d-block" style={{
                fontSize: "12px",
                color: "#EF4444",
                marginTop: "4px"
              }}>
                {getFieldError('spouseInfo.phone')}
              </div>
            )}
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
                          ref={(el) => {
                            if (index === 0) {
                              firstDependentFirstNameRef.current = el;
                            }
                            if (!fieldRefs.current[`dependents.${index}.firstName`]) {
                              fieldRefs.current[`dependents.${index}.firstName`] = el;
                            }
                          }}
                          type="text"
                          className={`form-control ${getFieldError(`dependents.${index}.firstName`) ? 'is-invalid' : ''}`}
                          value={dep.firstName}
                          onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                          placeholder="Sara"
                          data-field={`dependents.${index}.firstName`}
                        />
                        {getFieldError(`dependents.${index}.firstName`) && (
                          <div className="invalid-feedback d-block" style={{
                            fontSize: "12px",
                            color: "#EF4444",
                            marginTop: "4px"
                          }}>
                            {getFieldError(`dependents.${index}.firstName`)}
                          </div>
                        )}
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
                          className={`form-control ${getFieldError(`dependents.${index}.lastName`) ? 'is-invalid' : ''}`}
                          value={dep.lastName}
                          onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                          placeholder="Johnson"
                          data-field={`dependents.${index}.lastName`}
                          ref={(el) => {
                            if (!fieldRefs.current[`dependents.${index}.lastName`]) {
                              fieldRefs.current[`dependents.${index}.lastName`] = el;
                            }
                          }}
                        />
                        {getFieldError(`dependents.${index}.lastName`) && (
                          <div className="invalid-feedback d-block" style={{
                            fontSize: "12px",
                            color: "#EF4444",
                            marginTop: "4px"
                          }}>
                            {getFieldError(`dependents.${index}.lastName`)}
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
                          Date of Birth
                        </label>
                        <input
                          type="text"
                          className={`form-control ${getFieldError(`dependents.${index}.dob`) ? 'is-invalid' : ''}`}
                          placeholder="MM/DD/YYYY"
                          value={dep.dob}
                          onChange={(e) => handleInputChange(index, 'dob', e.target.value)}
                          data-field={`dependents.${index}.dob`}
                          ref={(el) => {
                            if (!fieldRefs.current[`dependents.${index}.dob`]) {
                              fieldRefs.current[`dependents.${index}.dob`] = el;
                            }
                          }}
                        />
                        {getFieldError(`dependents.${index}.dob`) && (
                          <div className="invalid-feedback d-block" style={{
                            fontSize: "12px",
                            color: "#EF4444",
                            marginTop: "4px"
                          }}>
                            {getFieldError(`dependents.${index}.dob`)}
                          </div>
                        )}
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
                          className={`form-control ${getFieldError(`dependents.${index}.ssn`) ? 'is-invalid' : ''}`}
                          value={dep.ssn}
                          onChange={(e) => handleInputChange(index, 'ssn', e.target.value)}
                          placeholder="123-45-6789"
                          data-field={`dependents.${index}.ssn`}
                          ref={(el) => {
                            if (!fieldRefs.current[`dependents.${index}.ssn`]) {
                              fieldRefs.current[`dependents.${index}.ssn`] = el;
                            }
                          }}
                        />
                        {getFieldError(`dependents.${index}.ssn`) && (
                          <div className="invalid-feedback d-block" style={{
                            fontSize: "12px",
                            color: "#EF4444",
                            marginTop: "4px"
                          }}>
                            {getFieldError(`dependents.${index}.ssn`)}
                          </div>
                        )}
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
            <div className="flex items-center space-x-3 mt-2 gap-3">
              <button
                type="button"
                onClick={() => handleOtherInfoChange('otherDeductions', otherInfo.otherDeductions === "yes" ? "no" : "yes")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F56D2D] focus:ring-offset-2 ${otherInfo.otherDeductions === "yes" ? 'bg-[#F56D2D]' : 'bg-gray-200'
                  }`}
                style={{ borderRadius: "9999px" }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${otherInfo.otherDeductions === "yes" ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                {otherInfo.otherDeductions === "yes" ? 'Yes' : 'No'}
              </span>
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
                {/* Add Another Business Button */}
                {businesses.length > 0 && !isAddingBusiness && (
                  <div className="mb-3 text-center">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingBusinessId(null);
                        setBusinessData({
                          workDescription: '',
                          businessName: '',
                          businessNameType: 'same',
                          differentBusinessName: '',
                          startedDuringYear: false,
                          homeBased: false,
                          businessAddress: '',
                          businessCity: '',
                          businessState: '',
                          businessZip: '',
                          totalIncome: '',
                          taxFormsReceived: 'none',
                          issuedRefunds: false,
                          totalRefunded: '',
                          otherBusinessIncome: false,
                          otherBusinessIncomeAmount: '',
                          advertising: '',
                          officeSupplies: '',
                          cleaningRepairs: '',
                          insurance: '',
                          legalProfessional: '',
                          phoneInternetUtilities: '',
                          paidContractors: false,
                          totalPaidContractors: '',
                          otherExpenses: [],
                          otherExpenseDescription: '',
                          otherExpenseAmount: '',
                          usedVehicle: false,
                          businessMiles: '',
                          parkingTollsTravel: '',
                          businessMeals: '',
                          travelExpenses: '',
                          homeOfficeUse: false,
                          homeOfficeSize: '',
                          sellProducts: false,
                          costItemsResold: '',
                          inventoryLeftEnd: '',
                          healthInsuranceBusiness: false,
                          selfEmployedRetirement: false,
                          retirementAmount: '',
                          isAccurate: false,
                          id: null
                        });
                        setIsAddingBusiness(true);
                      }}
                      style={{
                        fontFamily: "BasisGrotesquePro",
                        fontWeight: 500,
                        background: "#3B4A66",
                        borderColor: "#3B4A66"
                      }}
                    >
                      Add Another Business
                    </button>
                  </div>
                )}

                {/* List of existing businesses */}
                {businesses.length > 0 && (
                  <div className="mb-4">
                    <h6 style={{
                      color: "#3B4A66",
                      fontSize: "16px",
                      fontWeight: "600",
                      fontFamily: "BasisGrotesquePro",
                      marginBottom: "12px"
                    }}>
                      Your Businesses
                    </h6>
                    {businesses.map((business) => {
                      const totalIncome = parseFloat(business.totalIncome || business.income || 0);
                      const totalExpenses = parseFloat(business.totalExpenses || 0);
                      const netIncome = totalIncome - totalExpenses;

                      return (
                        <div
                          key={business.id}
                          className="p-3 mb-3 rounded border"
                          style={{
                            borderColor: "#E5E7EB",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6
                                className="mb-2"
                                style={{
                                  fontFamily: "BasisGrotesquePro",
                                  fontWeight: 600,
                                  color: "#3B4A66",
                                  fontSize: "16px"
                                }}
                              >
                                {business.businessName || "Unnamed Business"}
                              </h6>
                              {business.workDescription && (
                                <div
                                  className="mb-2"
                                  style={{
                                    fontFamily: "BasisGrotesquePro",
                                    fontSize: "14px",
                                    color: "#6B7280"
                                  }}
                                >
                                  {business.workDescription}
                                </div>
                              )}
                              <div className="d-flex flex-wrap gap-3 mt-2">
                                <div>
                                  <span
                                    style={{
                                      fontFamily: "BasisGrotesquePro",
                                      fontSize: "12px",
                                      color: "#6B7280",
                                      fontWeight: 500
                                    }}
                                  >
                                    Total Income:
                                  </span>
                                  <span
                                    className="ms-1"
                                    style={{
                                      fontFamily: "BasisGrotesquePro",
                                      fontSize: "14px",
                                      color: "#059669",
                                      fontWeight: 600
                                    }}
                                  >
                                    ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span
                                    style={{
                                      fontFamily: "BasisGrotesquePro",
                                      fontSize: "12px",
                                      color: "#6B7280",
                                      fontWeight: 500
                                    }}
                                  >
                                    Total Expenses:
                                  </span>
                                  <span
                                    className="ms-1"
                                    style={{
                                      fontFamily: "BasisGrotesquePro",
                                      fontSize: "14px",
                                      color: "#DC2626",
                                      fontWeight: 600
                                    }}
                                  >
                                    ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span
                                    style={{
                                      fontFamily: "BasisGrotesquePro",
                                      fontSize: "12px",
                                      color: "#6B7280",
                                      fontWeight: 500
                                    }}
                                  >
                                    Net Income:
                                  </span>
                                  <span
                                    className="ms-1"
                                    style={{
                                      fontFamily: "BasisGrotesquePro",
                                      fontSize: "14px",
                                      color: netIncome >= 0 ? "#059669" : "#DC2626",
                                      fontWeight: 600
                                    }}
                                  >
                                    ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              {business.address && business.address.trim() && (
                                <div
                                  className="mt-2"
                                  style={{
                                    fontFamily: "BasisGrotesquePro",
                                    fontSize: "12px",
                                    color: "#9CA3AF"
                                  }}
                                >
                                  📍 {business.address}
                                </div>
                              )}
                              {business.updated_at && (
                                <div
                                  className="mt-1"
                                  style={{
                                    fontFamily: "BasisGrotesquePro",
                                    fontSize: "11px",
                                    color: "#9CA3AF"
                                  }}
                                >
                                  Last updated: {new Date(business.updated_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="d-flex gap-2 ms-3" style={{ flexShrink: 0 }}>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleEditBusiness(business.id)}
                                style={{
                                  fontFamily: "BasisGrotesquePro",
                                  backgroundColor: "#F3F4F6",
                                  borderColor: "#E5E7EB",
                                  color: "#3B4A66",
                                  fontWeight: 500,
                                  fontSize: "13px"
                                }}
                              >
                                Edit
                              </button>

                              {/* <button
                                className="btn btn-sm" */}

                              {/* >
                                <FaTrash className="me-1" style={{ fontSize: "11px" }} />
                              </button> */}
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleRemoveRentalProperty(property.id)}
                                style={{
                                  fontFamily: "BasisGrotesquePro",
                                  fontSize: "12px"
                                }}
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}



                {/* Business Form */}
                {isAddingBusiness && (
                  <ComprehensiveBusinessForm
                    onSave={handleSaveBusiness}
                    onCancel={() => {
                      setIsAddingBusiness(false);
                      setEditingBusinessId(null);
                      // Reset business data if canceling
                      if (!editingBusinessId) {
                        setBusinessData({
                          workDescription: '',
                          businessName: '',
                          businessNameType: 'same',
                          differentBusinessName: '',
                          startedDuringYear: false,
                          homeBased: false,
                          businessAddress: '',
                          businessCity: '',
                          businessState: '',
                          businessZip: '',
                          totalIncome: '',
                          taxFormsReceived: 'none',
                          issuedRefunds: false,
                          totalRefunded: '',
                          otherBusinessIncome: false,
                          otherBusinessIncomeAmount: '',
                          advertising: '',
                          officeSupplies: '',
                          cleaningRepairs: '',
                          insurance: '',
                          legalProfessional: '',
                          phoneInternetUtilities: '',
                          paidContractors: false,
                          totalPaidContractors: '',
                          otherExpenses: [],
                          otherExpenseDescription: '',
                          otherExpenseAmount: '',
                          usedVehicle: false,
                          businessMiles: '',
                          parkingTollsTravel: '',
                          businessMeals: '',
                          travelExpenses: '',
                          homeOfficeUse: false,
                          homeOfficeSize: '',
                          sellProducts: false,
                          costItemsResold: '',
                          inventoryLeftEnd: '',
                          healthInsuranceBusiness: false,
                          selfEmployedRetirement: false,
                          retirementAmount: '',
                          isAccurate: false,
                          id: null
                        });
                      }
                    }}
                    initialData={editingBusinessId ? businessData : null}
                  />
                )}
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
                color: "#3B4A66",
                fontSize: "14px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro"
              }}>
                Rental Property Information
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
                {/* Add Rental Property Button */}
                {!isAddingRentalProperty && (
                  <div className="mb-3 text-center">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingRentalPropertyId(null);
                        setIsAddingRentalProperty(true);
                        setRentalData({
                          isRentalProperty: false,
                          propertyAddress: '',
                          propertyCity: '',
                          propertyState: '',
                          propertyZip: '',
                          propertyType: 'single',
                          ownershipType: '',
                          rentedOutDuringYear: false,
                          daysRentedOut: '',
                          familyUse: false,
                          familyUseDays: '',
                          totalRentReceived: '',
                          taxFormsReceived: 'none',
                          advertising: '',
                          cleaningMaintenance: '',
                          repairs: '',
                          propertyManagementFees: '',
                          insurance: '',
                          mortgageInterest: '',
                          propertyTaxes: '',
                          utilities: '',
                          legalProfessional: '',
                          supplies: '',
                          otherExpenses: [],
                          otherExpenseDescription: '',
                          otherExpenseAmount: '',
                          soldOrStoppedRenting: false,
                          boughtMajorItems: false,
                          hasRentalLosses: false,
                          isComplete: false
                        });
                      }}
                      style={{
                        fontFamily: "BasisGrotesquePro",
                        fontWeight: 500,
                        background: "#3B4A66",
                        borderColor: "#3B4A66"
                      }}
                    >
                      Add a Rental Property
                    </button>
                  </div>
                )}

                {/* Rental Properties List */}
                {rentalProperties.length > 0 && (
                  <div className="mb-3">
                    <h6 style={{
                      color: "#3B4A66",
                      fontSize: "16px",
                      fontWeight: "600",
                      fontFamily: "BasisGrotesquePro",
                      marginBottom: "12px"
                    }}>
                      Your Rental Properties
                    </h6>
                    {rentalProperties.map((property, index) => (
                      <div key={property.id} className="border rounded p-3 mb-2" style={{
                        borderColor: "#E8F0FF",
                        backgroundColor: "#F9FAFF"
                      }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 style={{
                              color: "#3B4A66",
                              fontSize: "14px",
                              fontWeight: "600",
                              fontFamily: "BasisGrotesquePro",
                              marginBottom: "4px"
                            }}>
                              {property.propertyAddress || `Property ${index + 1}`}
                            </h6>
                            <p style={{
                              color: "#4B5563",
                              fontSize: "12px",
                              fontFamily: "BasisGrotesquePro",
                              marginBottom: "0"
                            }}>
                              {property.propertyCity && property.propertyState ?
                                `${property.propertyCity}, ${property.propertyState} ${property.propertyZip}` :
                                'Address not specified'
                              }
                            </p>
                            {property.totalRentReceived && (
                              <p style={{
                                color: "#F56D2D",
                                fontSize: "14px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro",
                                marginBottom: "0"
                              }}>
                                Rent: ${property.totalRentReceived}
                              </p>
                            )}
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleEditRentalProperty(property.id)}
                              style={{
                                fontFamily: "BasisGrotesquePro",
                                backgroundColor: "#F3F4F6",
                                borderColor: "#E5E7EB",
                                color: "#3B4A66",
                                fontWeight: 500,
                                fontSize: "13px"
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRemoveRentalProperty(property.id)}
                              style={{
                                fontFamily: "BasisGrotesquePro",
                                fontSize: "12px"
                              }}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rental Property Form */}
                {isAddingRentalProperty && (
                  <RentalPropertyForm
                    onSave={handleSaveRentalProperty}
                    onCancel={handleCancelRentalProperty}
                    initialData={editingRentalPropertyId ? rentalProperties.find(rp => rp.id === editingRentalPropertyId) : null}
                  />
                )}
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
              ref={(el) => {
                if (!fieldRefs.current['bankInfo.confirmRoutingNumber']) {
                  fieldRefs.current['bankInfo.confirmRoutingNumber'] = el;
                }
              }}
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
              ref={(el) => {
                if (!fieldRefs.current['bankInfo.confirmAccountNumber']) {
                  fieldRefs.current['bankInfo.confirmAccountNumber'] = el;
                }
              }}
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
      <div className="bg-white lg:p-4 md:p-2 px-1 rounded-4 shadow-sm mb-4">
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
        <div className="row align-items-start upload-responsive">
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
                      {uploadedFile.created_at && (
                        <> • {new Date(uploadedFile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</>
                      )}
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
          onClick={(e) => {
            console.log("Submit button onClick triggered");
            handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
                style={{
                  width: '16px',
                  height: '16px',
                  borderWidth: '2px'
                }}
              ></span>
              Submitting...
            </>
          ) : (
            'Save & Submit Information'
          )}
        </button>
      </div>

      {/* Signature Section - Show after form is submitted */}
      {hasExistingData && (
        <div className=" p-4 rounded-lg border" style={{
          borderColor: '#E8F0FF',
          backgroundColor: '#F3F7FF',
          fontFamily: 'BasisGrotesquePro',
          marginTop: "12px"
        }}>
          <div className="d-flex flex-column align-items-start gap-3">
            <div>
              <h6 className="mb-1" style={{
                color: '#3B4A66',
                fontSize: '18px',
                fontWeight: '600',
                fontFamily: 'BasisGrotesquePro'
              }}>
                Sign Your Data Entry Form
              </h6>
              <p className="mb-0" style={{
                color: '#4B5563',
                fontSize: '14px',
                fontFamily: 'BasisGrotesquePro'
              }}>
                {isSigned
                  ? 'Your form has been signed successfully!'
                  : 'Sign your completed data entry form to create a professionally signed PDF document for your records.'}
              </p>
            </div>

            {isSigned ? (
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ color: '#22C55E', fontFamily: 'BasisGrotesquePro', fontWeight: '500' }}>
                  Form Signed Successfully
                </span>
              </div>
            ) : (
              <div className="w-100 d-flex justify-content-center">
                <button
                  className="btn text-white"
                  style={{
                    backgroundColor: '#F56D2D',
                    borderRadius: '8px',
                    fontFamily: 'BasisGrotesquePro'
                  }}
                  onClick={handleManualSign}
                  disabled={signatureLoading}
                >
                  {signatureLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
                        <path d="M8 2L10 6L14 7L10 8L8 12L6 8L2 7L6 6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                      Sign Form
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSubmit={handleSubmitSignature}
        loading={signatureLoading}
      />
    </div >
  );
}