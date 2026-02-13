import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import DateInput from "../../../components/DateInput";
import SlideSwitch from "../../../components/SlideSwitch";
import ComprehensiveBusinessForm from "../../../ClientOnboarding/components/ComprehensiveBusinessForm";
import RentalPropertyForm from "../../../ClientOnboarding/components/RentalPropertyForm";
import { toast } from "react-toastify";
import { firmAdminClientsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { formatDateInput, formatDateForAPI } from "../../../ClientOnboarding/utils/dateUtils";

const FillIntakeFormModal = ({ isOpen, onClose, clientId, clientData, onSuccess }) => {
    // Refs for scrolling to errors
    const fieldRefs = useRef({});

    // --- State Management (Mirrors DataIntake.jsx) ---
    const [filingStatus, setFilingStatus] = useState([]); // For income sources checkboxes
    const [hasDependents, setHasDependents] = useState("no");
    const [dependents, setDependents] = useState([]);

    const [personalInfo, setPersonalInfo] = useState({
        firstName: "", middleInitial: "", lastName: "",
        dateOfBirth: "", ssn: "", email: "", phone: "",
        address: "", city: "", state: "", zip: "",
        filingStatus: "", businessType: "individual"
    });
    const [personalPhoneCountry, setPersonalPhoneCountry] = useState('us');

    const [spouseInfo, setSpouseInfo] = useState({
        firstName: "", middleInitial: "", lastName: "",
        dateOfBirth: "", ssn: "", email: "", phone: ""
    });
    const [spousePhoneCountry, setSpousePhoneCountry] = useState('us');

    const [bankInfo, setBankInfo] = useState({
        bankName: "", routingNumber: "", confirmRoutingNumber: "",
        accountNumber: "", confirmAccountNumber: ""
    });

    const [otherInfo, setOtherInfo] = useState({
        ownsHome: "no", inSchool: "no", otherDeductions: "no"
    });

    // Business & Rental State
    const [businesses, setBusinesses] = useState([]);
    const [isAddingBusiness, setIsAddingBusiness] = useState(false);
    const [editingBusinessId, setEditingBusinessId] = useState(null);
    const [businessData, setBusinessData] = useState({}); // Temp state for form

    const [rentalProperties, setRentalProperties] = useState([]);
    const [isAddingRental, setIsAddingRental] = useState(false);
    const [editingRentalId, setEditingRentalId] = useState(null);
    const [rentalData, setRentalData] = useState({}); // Temp state for form

    // Dropdowns (Accordions)
    const [openDropdowns, setOpenDropdowns] = useState({
        businessInfo: false,
        rentalProperty: false,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Initialize data from clientData prop
    useEffect(() => {
        if (isOpen && clientData) {
            setPersonalInfo(prev => ({
                ...prev,
                firstName: clientData.first_name || clientData.name?.split(' ')[0] || "",
                lastName: clientData.last_name || clientData.name?.split(' ').slice(1).join(' ') || "",
                email: clientData.email || "",
                phone: clientData.phone_number || "",
                filingStatus: clientData.filing_status || "",
            }));
            // If data exists from a previous partial save, we might want to load it here
            // But for now we just use the basic client profile info
        }
    }, [isOpen, clientData]);

    if (!isOpen) return null;

    // --- Handlers ---

    const handlePersonalInfoChange = (field, value) => {
        setPersonalInfo(prev => ({ ...prev, [field]: value }));
        if (errors[`personalInfo.${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`personalInfo.${field}`];
                return newErrors;
            });
        }
    };

    const handleSpouseInfoChange = (field, value) => {
        setSpouseInfo(prev => ({ ...prev, [field]: value }));
        if (errors[`spouseInfo.${field}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`spouseInfo.${field}`];
                return newErrors;
            });
        }
    };

    const handleDependentsCheckbox = (val) => {
        setHasDependents(val);
        if (val === "no") setDependents([]);
    };

    const handleAddDependent = () => {
        setDependents([...dependents, { firstName: '', middleInitial: '', lastName: '', dob: '', ssn: '', relationship: '' }]);
    };

    const handleRemoveDependent = (index) => {
        const updated = [...dependents];
        updated.splice(index, 1);
        setDependents(updated);
    };

    const handleDependentChange = (index, field, value) => {
        let formatted = value;
        if (field === 'dob') formatted = formatDateInput(value);
        const updated = [...dependents];
        updated[index][field] = formatted;
        setDependents(updated);
    };

    const handleOtherInfoChange = (field, value) => {
        setOtherInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleBankInfoChange = (field, value) => {
        setBankInfo(prev => ({ ...prev, [field]: value }));
    };

    const toggleDropdown = (key) => {
        setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Business Handlers
    const handleSaveBusiness = (data) => {
        if (editingBusinessId !== null) {
            setBusinesses(businesses.map(b => b.id === editingBusinessId ? { ...data, id: editingBusinessId } : b));
            setEditingBusinessId(null);
        } else {
            setBusinesses([...businesses, { ...data, id: Date.now() }]);
        }
        setIsAddingBusiness(false);
        setBusinessData({});
    };

    const handleRemoveBusiness = (id) => {
        setBusinesses(businesses.filter(b => b.id !== id));
    };

    // Rental Handlers
    const handleSaveRental = (data) => {
        if (editingRentalId !== null) {
            setRentalProperties(rentalProperties.map(r => r.id === editingRentalId ? { ...data, id: editingRentalId } : r));
            setEditingRentalId(null);
        } else {
            setRentalProperties([...rentalProperties, { ...data, id: Date.now() }]);
        }
        setIsAddingRental(false);
        setRentalData({});
    };

    const handleRemoveRental = (id) => {
        setRentalProperties(rentalProperties.filter(r => r.id !== id));
    };

    // --- Submission ---

    const getFieldError = (fieldPath) => {
        return errors[fieldPath] ? errors[fieldPath][0] : null;
    };

    // --- Submission ---

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({}); // Clear previous errors
        try {
            // Construct payload matching DataIntake.jsx structure
            const payload = {
                personal_info: {
                    first_name: personalInfo.firstName,
                    middle_initial: personalInfo.middleInitial,
                    last_name: personalInfo.lastName,
                    dateOfBirth: personalInfo.dateOfBirth,
                    ssn: personalInfo.ssn,
                    email: personalInfo.email,
                    phone_number: personalInfo.phone,
                    address: personalInfo.address,
                    city: personalInfo.city,
                    state: personalInfo.state,
                    zip: personalInfo.zip,
                    filing_status: personalInfo.filingStatus,
                    business_type: personalInfo.businessType,
                    income_information: filingStatus.length > 0 ? filingStatus : ["w2"],
                    no_of_dependents: hasDependents === "yes" ? dependents.length : 0,
                    other_deductions: otherInfo.otherDeductions === "yes",
                    does_own_a_home: otherInfo.ownsHome === "yes",
                    in_school: otherInfo.inSchool === "yes",
                    spouse_info: {
                        spouse_first_name: spouseInfo.firstName,
                        spouse_middle_name: spouseInfo.middleInitial,
                        spouse_last_name: spouseInfo.lastName,
                        spouse_dateOfBirth: spouseInfo.dateOfBirth,
                        spouse_ssn: spouseInfo.ssn,
                        spouse_email: spouseInfo.email,
                        spouse_phone_number: spouseInfo.phone
                    },
                    dependents: dependents.map(dep => ({
                        dependent_first_name: dep.firstName,
                        dependent_middle_name: dep.middleInitial,
                        dependent_last_name: dep.lastName,
                        dependent_dateOfBirth: dep.dob,
                        dependent_ssn: dep.ssn,
                        dependent_relationship: dep.relationship
                    }))
                },
                bank_info: {
                    bank_name: bankInfo.bankName,
                    routing_number: bankInfo.routingNumber,
                    confirm_routing_number: bankInfo.confirmRoutingNumber,
                    account_number: bankInfo.accountNumber,
                    confirm_account_number: bankInfo.confirmAccountNumber
                },
                business_info: businesses.map(b => ({
                    ...b,
                    business_formation_date: b.businessFormationDate,
                    business_type: b.businessType,
                    business_name: b.businessName,
                    business_address: b.businessAddress,
                    business_city: b.businessCity,
                    business_state: b.businessState,
                    business_zip: b.businessZip,
                    work_description: b.workDescription,
                    business_name_type: b.businessNameType,
                    different_business_name: b.differentBusinessName,
                    started_during_year: b.startedDuringYear,
                    home_based: b.homeBased,
                    total_income: b.totalIncome,
                    tax_forms_received: b.taxFormsReceived,
                    issued_refunds: b.issuedRefunds,
                    total_refunded: b.totalRefunded,
                    other_business_income: b.otherBusinessIncome,
                    other_business_income_amount: b.otherBusinessIncomeAmount,
                    advertising: b.advertising,
                    office_supplies: b.officeSupplies,
                    cleaning_repairs: b.cleaningRepairs,
                    insurance: b.insurance,
                    legal_professional: b.legalProfessional,
                    phone_internet_utilities: b.phoneInternetUtilities,
                    paid_contractors: b.paidContractors,
                    total_paid_contractors: b.totalPaidContractors,
                    other_expenses: b.otherExpenses,
                    used_vehicle: b.usedVehicle,
                    business_miles: b.businessMiles,
                    parking_tolls_travel: b.parkingTollsTravel,
                    business_meals: b.businessMeals,
                    travel_expenses: b.travelExpenses,
                    home_office_use: b.homeOfficeUse,
                    home_office_size: b.homeOfficeSize,
                    sell_products: b.sellProducts,
                    cost_items_resold: b.costItemsResold,
                    inventory_left_end: b.inventoryLeftEnd,
                    health_insurance_business: b.healthInsuranceBusiness,
                    self_employed_retirement: b.selfEmployedRetirement,
                    retirement_amount: b.retirementAmount,
                    is_accurate: b.isAccurate
                })),
                rental_property_info: rentalProperties.map(r => ({
                    ...r,
                    property_address: r.propertyAddress,
                    property_city: r.propertyCity,
                    property_state: r.propertyState,
                    property_zip: r.propertyZip,
                    property_type: r.propertyType,
                    ownership_type: r.ownershipType,
                    rented_out_during_year: r.rentedOutDuringYear,
                    days_rented_out: r.daysRentedOut,
                    family_use: r.familyUse,
                    family_use_days: r.familyUseDays,
                    total_rent_received: r.totalRentReceived,
                    tax_forms_received: r.taxFormsReceived,
                    advertising: r.advertising,
                    cleaning_maintenance: r.cleaningMaintenance,
                    repairs: r.repairs,
                    property_management_fees: r.propertyManagementFees,
                    insurance: r.insurance,
                    mortgage_interest: r.mortgageInterest,
                    property_taxes: r.propertyTaxes,
                    utilities: r.utilities,
                    legal_professional: r.legalProfessional,
                    supplies: r.supplies,
                    other_expenses: r.otherExpenses,
                    sold_or_stopped_renting: r.soldOrStoppedRenting || r.sold_or_stopped_renting || 'no',
                    bought_major_items: r.boughtMajorItems || r.bought_major_items || 'no',
                    has_rental_losses: r.hasRentalLosses || r.has_rental_losses || 'no',
                    is_complete: r.isComplete
                }))
            };

            const response = await firmAdminClientsAPI.fillDataIntake(clientId, payload);
            if (response.success || response.id) {
                toast.success("Intake form submitted successfully");
                onSuccess && onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);

            // Handle validation errors returned by apiUtils
            const rawErrors = err.errors || err.response?.data?.errors;

            if (rawErrors) {
                const flatErrors = {};

                // Helper to map snake_case API keys to camelCase state keys
                const mapKey = (key) => {
                    const map = {
                        'first_name': 'firstName',
                        'middle_initial': 'middleInitial',
                        'last_name': 'lastName',
                        'filing_status': 'filingStatus',
                        'phone_number': 'phone',
                        'property_address': 'propertyAddress',
                        'property_city': 'propertyCity',
                        'property_state': 'propertyState',
                        'property_zip': 'propertyZip',
                        'business_name': 'businessName',
                        'business_city': 'businessCity',
                        'business_state': 'businessState',
                        'business_zip': 'businessZip'
                    };
                    return map[key] || key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                };

                // Generic recursive flattener
                const flatten = (obj, prefix = '') => {
                    if (!obj) return;

                    if (Array.isArray(obj)) {
                        obj.forEach((item, idx) => {
                            // If it's a list of strings (simple errors), join them
                            if (typeof item === 'string') {
                                const key = prefix.slice(0, -1);
                                if (!flatErrors[key]) flatErrors[key] = [];
                                flatErrors[key].push(item);
                            } else {
                                // Nested objects/arrays
                                flatten(item, `${prefix}${idx}.`);
                            }
                        });
                    } else if (typeof obj === 'object') {
                        Object.keys(obj).forEach(key => {
                            const camelKey = mapKey(key);
                            flatten(obj[key], `${prefix}${camelKey}.`);
                        });
                    }
                };

                // Specific top-level mappings to match our state structure
                if (rawErrors.personal_info) flatten(rawErrors.personal_info, 'personalInfo.');
                if (rawErrors.bank_info) flatten(rawErrors.bank_info, 'bankInfo.');
                if (rawErrors.rental_property_info) flatten(rawErrors.rental_property_info, 'rentalProperties.');
                if (rawErrors.business_info) flatten(rawErrors.business_info, 'businesses.');

                // Catch-all for any other errors
                Object.keys(rawErrors).forEach(key => {
                    if (!['personal_info', 'bank_info', 'rental_property_info', 'business_info'].includes(key)) {
                        flatten(rawErrors[key], `${mapKey(key)}.`);
                    }
                });

                setErrors(flatErrors);

                // Open relevant accordions if errors found
                const hasRentalErrors = Object.keys(flatErrors).some(k => k.startsWith('rentalProperties.'));
                const hasBusinessErrors = Object.keys(flatErrors).some(k => k.startsWith('businesses.'));
                if (hasRentalErrors || hasBusinessErrors) {
                    setOpenDropdowns(prev => ({
                        ...prev,
                        rentalProperty: hasRentalErrors ? true : prev.rentalProperty,
                        businessInfo: hasBusinessErrors ? true : prev.businessInfo
                    }));

                    // If there's a specific rental property or business with an error, open it for editing
                    if (hasRentalErrors && !isAddingRental) {
                        const errorKey = Object.keys(flatErrors).find(key => key.startsWith('rentalProperties.'));
                        if (errorKey) {
                            const match = errorKey.match(/rentalProperties\.(\d+)\./);
                            if (match) {
                                const index = parseInt(match[1]);
                                if (rentalProperties[index]) {
                                    setRentalData(rentalProperties[index]);
                                    setEditingRentalId(rentalProperties[index].id);
                                    setIsAddingRental(true);
                                }
                            }
                        }
                    }

                    if (hasBusinessErrors && !isAddingBusiness) {
                        const errorKey = Object.keys(flatErrors).find(key => key.startsWith('businesses.'));
                        if (errorKey) {
                            const match = errorKey.match(/businesses\.(\d+)\./);
                            if (match) {
                                const index = parseInt(match[1]);
                                if (businesses[index]) {
                                    setBusinessData(businesses[index]);
                                    setEditingBusinessId(businesses[index].id);
                                    setIsAddingBusiness(true);
                                }
                            }
                        }
                    }
                }

                // Scroll to top to show errors
                const modalBody = document.querySelector('.overflow-y-auto');
                if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Formatting error message to be cleaner if it comes from apiUtils default error construction
                const message = err.message || "An error occurred";
                // If the message is the long "Validation failed. field: error..." string, we might want to suppress it if we couldn't parse specific errors, 
                // but usually err.errors should be present if that message was generated.
                // For other errors, show toast.
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Styling helpers (copied from DataIntake.jsx/components)
    const labelStyle = { fontFamily: "BasisGrotesquePro", fontWeight: 400, fontSize: "16px", color: "#3B4A66" };
    const headerStyle = { color: "#3B4A66", fontSize: "20px", fontWeight: "500", fontFamily: "BasisGrotesquePro" };
    const subHeaderStyle = { color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" };
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 rounded-t-xl z-20">
                    <h5 className="font-semibold text-xl text-gray-800">Fill Client Intake Form</h5>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                {/* ERROR SUMMARY */}
                {Object.keys(errors).length > 0 && (
                    <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-red-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-lg">Please correct the following errors:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {Object.entries(errors).map(([field, messages]) => {
                                const message = Array.isArray(messages) ? messages[0] : messages;

                                const getDisplayName = (path) => {
                                    const parts = path.split('.');
                                    const lastPart = parts[parts.length - 1]
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/^./, str => str.toUpperCase())
                                        .replace(/property /i, '')
                                        .replace(/business /i, '');

                                    if (path.startsWith('rentalProperties')) {
                                        const match = path.match(/\.(\d+)\./);
                                        const idx = match ? parseInt(match[1]) + 1 : '';
                                        return `Rental Property #${idx} - ${lastPart}`;
                                    }
                                    if (path.startsWith('businesses')) {
                                        const match = path.match(/\.(\d+)\./);
                                        const idx = match ? parseInt(match[1]) + 1 : '';
                                        return `Business #${idx} - ${lastPart}`;
                                    }
                                    if (path.startsWith('personalInfo')) return `Personal Info - ${lastPart}`;
                                    if (path.startsWith('bankInfo')) return `Bank Info - ${lastPart}`;

                                    return lastPart;
                                };

                                return (
                                    <li key={field} className="ml-2">
                                        <span className="font-medium">{getDisplayName(field)}</span>: {message}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto bg-gray-50 flex-1">

                    {/* PERSONAL INFO */}
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                        <div className="align-items-center mb-3">
                            <h5 className="mb-0 me-3" style={headerStyle}>Personal Information</h5>
                            <p className="mb-0" style={subHeaderStyle}>Your basic personal and contact information</p>
                        </div>
                        <div className="row g-3">
                            <div className="col-md-5">
                                <label className="form-label" style={labelStyle}>First Name</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.firstName') ? 'is-invalid' : ''}`}
                                    value={personalInfo.firstName}
                                    onChange={e => handlePersonalInfoChange('firstName', e.target.value)}
                                />
                                {getFieldError('personalInfo.firstName') && <div className="invalid-feedback">{getFieldError('personalInfo.firstName')}</div>}
                            </div>
                            <div className="col-md-2">
                                <label className="form-label" style={labelStyle}>MI</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.middleInitial') ? 'is-invalid' : ''}`}
                                    value={personalInfo.middleInitial}
                                    onChange={e => handlePersonalInfoChange('middleInitial', e.target.value)}
                                />
                                {getFieldError('personalInfo.middleInitial') && <div className="invalid-feedback">{getFieldError('personalInfo.middleInitial')}</div>}
                            </div>
                            <div className="col-md-5">
                                <label className="form-label" style={labelStyle}>Last Name</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.lastName') ? 'is-invalid' : ''}`}
                                    value={personalInfo.lastName}
                                    onChange={e => handlePersonalInfoChange('lastName', e.target.value)}
                                />
                                {getFieldError('personalInfo.lastName') && <div className="invalid-feedback">{getFieldError('personalInfo.lastName')}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Date of Birth</label>
                                <DateInput
                                    className={`form-control ${getFieldError('personalInfo.dateOfBirth') ? 'is-invalid' : ''}`}
                                    value={personalInfo.dateOfBirth}
                                    onChange={e => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                                    placeholder="MM/DD/YYYY"
                                />
                                {getFieldError('personalInfo.dateOfBirth') && <div className="d-block invalid-feedback">{getFieldError('personalInfo.dateOfBirth')}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Filing Status</label>
                                <select
                                    className={`form-select ${getFieldError('personalInfo.filingStatus') ? 'is-invalid' : ''}`}
                                    value={personalInfo.filingStatus}
                                    onChange={e => handlePersonalInfoChange('filingStatus', e.target.value)}
                                >
                                    <option value="">Select Status</option>
                                    <option value="single">Single</option>
                                    <option value="married_joint">Married Filing Jointly</option>
                                    <option value="married_separate">Married Filing Separately</option>
                                    <option value="head_household">Head of Household</option>
                                    <option value="widow">Qualifying Widow</option>
                                    <option value="not_sure">Not Sure</option>
                                </select>
                                {getFieldError('personalInfo.filingStatus') && <div className="invalid-feedback">{getFieldError('personalInfo.filingStatus')}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>SSN / ITIN</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.ssn') ? 'is-invalid' : ''}`}
                                    value={personalInfo.ssn}
                                    onChange={e => handlePersonalInfoChange('ssn', e.target.value)}
                                    maxLength={11}
                                />
                                {getFieldError('personalInfo.ssn') && <div className="invalid-feedback">{getFieldError('personalInfo.ssn')}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    className={`form-control ${getFieldError('personalInfo.email') ? 'is-invalid' : ''}`}
                                    value={personalInfo.email}
                                    onChange={e => handlePersonalInfoChange('email', e.target.value)}
                                />
                                {getFieldError('personalInfo.email') && <div className="invalid-feedback">{getFieldError('personalInfo.email')}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Phone</label>
                                <PhoneInput
                                    country={personalPhoneCountry}
                                    value={personalInfo.phone}
                                    onChange={(phone) => handlePersonalInfoChange('phone', phone)}
                                    inputClass={`form-control w-100 ${getFieldError('personalInfo.phone') ? 'is-invalid' : ''}`}
                                    inputStyle={{ height: '45px', width: '100%' }}
                                />
                                {getFieldError('personalInfo.phone') && <div className="d-block invalid-feedback">{getFieldError('personalInfo.phone')}</div>}
                            </div>
                            <div className="col-md-12">
                                <label className="form-label" style={labelStyle}>Address</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.address') ? 'is-invalid' : ''}`}
                                    value={personalInfo.address}
                                    onChange={e => handlePersonalInfoChange('address', e.target.value)}
                                />
                                {getFieldError('personalInfo.address') && <div className="invalid-feedback">{getFieldError('personalInfo.address')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" style={labelStyle}>City</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.city') ? 'is-invalid' : ''}`}
                                    value={personalInfo.city}
                                    onChange={e => handlePersonalInfoChange('city', e.target.value)}
                                />
                                {getFieldError('personalInfo.city') && <div className="invalid-feedback">{getFieldError('personalInfo.city')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" style={labelStyle}>State</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.state') ? 'is-invalid' : ''}`}
                                    value={personalInfo.state}
                                    onChange={e => handlePersonalInfoChange('state', e.target.value)}
                                />
                                {getFieldError('personalInfo.state') && <div className="invalid-feedback">{getFieldError('personalInfo.state')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" style={labelStyle}>ZIP Code</label>
                                <input
                                    type="text"
                                    className={`form-control ${getFieldError('personalInfo.zip') ? 'is-invalid' : ''}`}
                                    value={personalInfo.zip}
                                    onChange={e => handlePersonalInfoChange('zip', e.target.value)}
                                />
                                {getFieldError('personalInfo.zip') && <div className="invalid-feedback">{getFieldError('personalInfo.zip')}</div>}
                            </div>
                        </div>
                    </div>

                    {/* SPOUSE INFO */}
                    {['married_joint', 'married_separate', 'widow', 'not_sure'].includes(personalInfo.filingStatus) && (
                        <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                            <div className="align-items-center mb-3">
                                <h5 className="mb-0 me-3" style={headerStyle}>Spouse Information</h5>
                            </div>
                            <div className="row g-3">
                                <div className="col-md-5">
                                    <label className="form-label" style={labelStyle}>First Name</label>
                                    <input type="text" className="form-control" value={spouseInfo.firstName} onChange={e => handleSpouseInfoChange('firstName', e.target.value)} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label" style={labelStyle}>MI</label>
                                    <input type="text" className="form-control" value={spouseInfo.middleInitial} onChange={e => handleSpouseInfoChange('middleInitial', e.target.value)} />
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label" style={labelStyle}>Last Name</label>
                                    <input type="text" className="form-control" value={spouseInfo.lastName} onChange={e => handleSpouseInfoChange('lastName', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label" style={labelStyle}>Date of Birth</label>
                                    <DateInput className="form-control" value={spouseInfo.dateOfBirth} onChange={e => handleSpouseInfoChange('dateOfBirth', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label" style={labelStyle}>SSN / ITIN</label>
                                    <input type="text" className="form-control" value={spouseInfo.ssn} onChange={e => handleSpouseInfoChange('ssn', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label" style={labelStyle}>Phone</label>
                                    <PhoneInput
                                        country={spousePhoneCountry}
                                        value={spouseInfo.phone}
                                        onChange={(phone) => handleSpouseInfoChange('phone', phone)}
                                        inputClass="form-control w-100"
                                        inputStyle={{ height: '45px', width: '100%' }}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label" style={labelStyle}>Email</label>
                                    <input type="email" className="form-control" value={spouseInfo.email} onChange={e => handleSpouseInfoChange('email', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DEPENDENTS */}
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                        <div className="align-items-center mb-3">
                            <h5 className="mb-0 me-3" style={headerStyle}>Dependents Information</h5>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <span style={labelStyle}>Do you have dependents?</span>
                            <SlideSwitch value={hasDependents === "yes"} onChange={(v) => handleDependentsCheckbox(v ? "yes" : "no")} />
                            <span className="text-sm font-medium">{hasDependents === "yes" ? 'Yes' : 'No'}</span>
                        </div>

                        {hasDependents === "yes" && (
                            <>
                                {dependents.map((dep, idx) => (
                                    <div key={idx} className="p-4 mb-3 border rounded-xl bg-white relative">
                                        <button onClick={() => handleRemoveDependent(idx)} className="absolute top-3 right-3 text-red-500 hover:text-red-700">
                                            <FaTrash />
                                        </button>
                                        <h6 className="mb-3 font-medium text-gray-700">Dependent #{idx + 1}</h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label text-sm">First Name</label>
                                                <input type="text" className="form-control" value={dep.firstName} onChange={e => handleDependentChange(idx, 'firstName', e.target.value)} />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label text-sm">MI</label>
                                                <input type="text" className="form-control" value={dep.middleInitial} onChange={e => handleDependentChange(idx, 'middleInitial', e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label text-sm">Last Name</label>
                                                <input type="text" className="form-control" value={dep.lastName} onChange={e => handleDependentChange(idx, 'lastName', e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-sm">Date of Birth</label>
                                                <DateInput className="form-control" value={dep.dob} onChange={e => handleDependentChange(idx, 'dob', e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-sm">SSN / ITIN</label>
                                                <input type="text" className="form-control" value={dep.ssn} onChange={e => handleDependentChange(idx, 'ssn', e.target.value)} />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label text-sm">Relationship</label>
                                                <select className="form-select" value={dep.relationship} onChange={e => handleDependentChange(idx, 'relationship', e.target.value)}>
                                                    <option value="">Select...</option>
                                                    <option value="Child">Child</option>
                                                    <option value="Spouse">Spouse</option>
                                                    <option value="Parent">Parent</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleAddDependent} className="btn btn-light w-full border-dashed border-2 flex items-center justify-center gap-2">
                                    <FaPlus /> Add Dependent
                                </button>
                            </>
                        )}
                    </div>

                    {/* INCOME INFO */}
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                        <div className="align-items-center mb-3">
                            <h5 className="mb-0 me-3" style={headerStyle}>Income Information</h5>
                        </div>
                        {["w2", "1099", "business"].map(type => (
                            <div className="form-check mb-2" key={type}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`income-${type}`}
                                    checked={filingStatus.includes(type)}
                                    onChange={(e) => {
                                        if (e.target.checked) setFilingStatus([...filingStatus, type]);
                                        else setFilingStatus(filingStatus.filter(t => t !== type));
                                    }}
                                />
                                <label className="form-check-label capitalize" htmlFor={`income-${type}`} style={labelStyle}>
                                    {type === 'w2' ? 'W-2 (Employee wages)' : type === '1099' ? 'Self-Employment (1099)' : 'Other Income'}
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* ADDITIONAL INFO (Business/Rental) */}
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                        <div className="align-items-center mb-3">
                            <h5 className="mb-0 me-3" style={headerStyle}>Additional Information</h5>
                        </div>

                        {/* Business Dropdown */}
                        <div className="mb-3">
                            <button onClick={() => toggleDropdown('businessInfo')} className="w-full flex justify-between items-center p-3 bg-blue-50 rounded-lg text-left">
                                <span className="font-medium text-gray-700">Business Information</span>
                                {openDropdowns.businessInfo ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {openDropdowns.businessInfo && (
                                <div className="p-4 border rounded-b-lg border-t-0">
                                    {isAddingBusiness ? (
                                        <ComprehensiveBusinessForm
                                            initialData={businessData}
                                            externalErrors={(() => {
                                                if (editingBusinessId === null) return {};
                                                const index = businesses.findIndex(b => b.id === editingBusinessId);
                                                if (index === -1) return {};
                                                const prefix = `businesses.${index}.`;
                                                const relevantErrors = {};
                                                Object.keys(errors).forEach(key => {
                                                    if (key.startsWith(prefix)) relevantErrors[key.replace(prefix, '')] = errors[key];
                                                });
                                                return relevantErrors;
                                            })()}
                                            onSave={handleSaveBusiness}
                                            onCancel={() => { setIsAddingBusiness(false); setBusinessData({}); setEditingBusinessId(null); }}
                                        />
                                    ) : (
                                        <>
                                            {businesses.map((b, idx) => {
                                                const hasErrors = Object.keys(errors).some(k => k.startsWith(`businesses.${idx}.`));
                                                return (
                                                    <div key={b.id} className={`p-3 mb-2 border rounded flex justify-between items-center ${hasErrors ? 'border-red-500 bg-red-50' : 'bg-gray-50'}`}>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{b.businessName}</p>
                                                            <p className="text-sm text-gray-500">{b.businessType}</p>
                                                            {hasErrors && <p className="text-xs text-red-600 font-medium">Contains validation errors</p>}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button className="text-blue-600 px-2" onClick={() => { setBusinessData(b); setEditingBusinessId(b.id); setIsAddingBusiness(true); }}>Edit</button>
                                                            <button className="text-red-600 px-2" onClick={() => handleRemoveBusiness(b.id)}><FaTrash /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => setIsAddingBusiness(true)} className="btn btn-primary w-full mt-2">Add Business Info</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Rental Dropdown */}
                        <div>
                            <button onClick={() => toggleDropdown('rentalProperty')} className="w-full flex justify-between items-center p-3 bg-blue-50 rounded-lg text-left">
                                <span className="font-medium text-gray-700">Rental Property</span>
                                {openDropdowns.rentalProperty ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {openDropdowns.rentalProperty && (
                                <div className="p-4 border rounded-b-lg border-t-0">
                                    {isAddingRental ? (
                                        <RentalPropertyForm
                                            initialData={rentalData}
                                            externalErrors={(() => {
                                                if (editingRentalId === null) return {};
                                                const index = rentalProperties.findIndex(r => r.id === editingRentalId);
                                                if (index === -1) return {};
                                                const prefix = `rentalProperties.${index}.`;
                                                const relevantErrors = {};
                                                Object.keys(errors).forEach(key => {
                                                    if (key.startsWith(prefix)) relevantErrors[key.replace(prefix, '')] = errors[key];
                                                });
                                                return relevantErrors;
                                            })()}
                                            onSave={handleSaveRental}
                                            onCancel={() => { setIsAddingRental(false); setRentalData({}); setEditingRentalId(null); }}
                                        />
                                    ) : (
                                        <>
                                            {rentalProperties.map((r, idx) => {
                                                const hasErrors = Object.keys(errors).some(k => k.startsWith(`rentalProperties.${idx}.`));
                                                return (
                                                    <div key={r.id} className={`p-3 mb-2 border rounded flex justify-between items-center ${hasErrors ? 'border-red-500 bg-red-50' : 'bg-gray-50'}`}>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{r.propertyAddress}</p>
                                                            <p className="text-sm text-gray-500">{r.propertyType}</p>
                                                            {hasErrors && <p className="text-xs text-red-600 font-medium">Contains validation errors</p>}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button className="text-blue-600 px-2" onClick={() => { setRentalData(r); setEditingRentalId(r.id); setIsAddingRental(true); }}>Edit</button>
                                                            <button className="text-red-600 px-2" onClick={() => handleRemoveRental(r.id)}><FaTrash /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => setIsAddingRental(true)} className="btn btn-primary w-full mt-2">Add Rental Property</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BANK INFORMATION */}
                    <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
                        <div className="align-items-center mb-3">
                            <h5 className="mb-0 me-3" style={headerStyle}>Bank Information</h5>
                        </div>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label" style={labelStyle}>Bank Name</label>
                                <input type="text" className="form-control" value={bankInfo.bankName} onChange={e => handleBankInfoChange('bankName', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Routing Number</label>
                                <input type="text" className="form-control" value={bankInfo.routingNumber} onChange={e => handleBankInfoChange('routingNumber', e.target.value)} maxLength={9} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Confirm Routing</label>
                                <input type="text" className="form-control" value={bankInfo.confirmRoutingNumber} onChange={e => handleBankInfoChange('confirmRoutingNumber', e.target.value)} maxLength={9} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Account Number</label>
                                <input type="text" className="form-control" value={bankInfo.accountNumber} onChange={e => handleBankInfoChange('accountNumber', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" style={labelStyle}>Confirm Account</label>
                                <input type="text" className="form-control" value={bankInfo.confirmAccountNumber} onChange={e => handleBankInfoChange('confirmAccountNumber', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-end gap-3 z-20">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                        style={{ borderRadius: '12px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 bg-[#3B4A66] text-white font-medium hover:bg-[#2c374d] transition flex items-center gap-2"
                        style={{ borderRadius: '12px' }}
                    >
                        {loading ? 'Submitting...' : 'Submit Form'}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default FillIntakeFormModal;
