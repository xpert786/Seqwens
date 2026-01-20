import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { firmAdminClientsAPI } from "../../../ClientOnboarding/utils/apiUtils";

const IntakeFormTab = ({ onOpenFillModal }) => {
    const { clientId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!data) return;
        setDownloading(true);

        try {
            // dynamic import to avoid load on initial render if not needed
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            let currentY = 20;

            // Title
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text("Client Intake Form", margin, currentY);
            currentY += 10;

            // Helper to check page break
            const checkPageBreak = (heightNeeded) => {
                if (currentY + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    currentY = 20;
                    return true;
                }
                return false;
            };

            // Section 1: Personal Information
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            checkPageBreak(15);
            doc.text("Personal Information", margin, currentY);
            currentY += 8;

            const personalInfo = [
                ["Full Name", `${data.personal_info?.first_name || ''} ${data.personal_info?.middle_name || ''} ${data.personal_info?.last_name || ''}`],
                ["Date of Birth", data.personal_info?.dateOfBirth || "N/A"],
                ["SSN", data.personal_info?.ssn || "N/A"],
                ["Email", data.taxpayer_email || "N/A"],
                ["Address", formatAddress(data.personal_info)],
                ["Filing Status", formatFilingStatus(data.personal_info?.filling_status)]
            ];

            autoTable(doc, {
                startY: currentY,
                body: personalInfo,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
                margin: { left: margin },
            });
            currentY = doc.lastAutoTable.finalY + 10;

            // Section 2: Dependents
            if (data.personal_info?.dependents?.length > 0) {
                checkPageBreak(25);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Dependents", margin, currentY);
                currentY += 6;

                const dependentRows = data.personal_info.dependents.map(dep => [
                    `${dep.first_name || ''} ${dep.middle_name || ''} ${dep.last_name || ''}`,
                    dep.dateOfBirth || "N/A",
                    dep.ssn || "N/A",
                    dep.relationship || "N/A"
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: [["Name", "Date of Birth", "SSN", "Relationship"]],
                    body: dependentRows,
                    theme: 'striped',
                    headStyles: { fillColor: [0, 192, 198] }, // Teal color matching UI
                    styles: { fontSize: 10 },
                    margin: { left: margin },
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // Section 3: Business Incomes
            if (data.business_incomes?.length > 0) {
                checkPageBreak(20);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Business Incomes", margin, currentY);
                currentY += 8;

                data.business_incomes.forEach((bus, index) => {
                    checkPageBreak(40);
                    // Sub-header for business
                    doc.setFontSize(11);
                    doc.setFont("helvetica", "bold");
                    doc.text(`${index + 1}. ${bus.business_name || "Business"}`, margin, currentY);
                    currentY += 6;

                    const businessInfo = [
                        ["Type", bus.business_type || "N/A", "Formation Date", bus.business_formation_date || "N/A"],
                        ["EIN", bus.ein || "N/A", "Home Based", bus.home_based ? "Yes" : "No"],
                        ["Description", bus.work_description || "N/A", "Total Income", formatCurrency(bus.total_income)],
                        ["Advertising", formatCurrency(bus.advertising), "Office Supplies", formatCurrency(bus.office_supplies)],
                        ["Contractor Pay", formatCurrency(bus.total_paid_contractors), "", ""]
                    ];

                    autoTable(doc, {
                        startY: currentY,
                        body: businessInfo,
                        theme: 'plain',
                        styles: { fontSize: 10, cellPadding: 1 },
                        columnStyles: {
                            0: { fontStyle: 'bold', width: 30 },
                            2: { fontStyle: 'bold', width: 30 }
                        },
                        margin: { left: margin + 2 },
                    });
                    currentY = doc.lastAutoTable.finalY + 8;
                });
            }

            // Section 4: Rental Properties
            if (data.rental_properties?.length > 0) {
                checkPageBreak(20);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Rental Properties", margin, currentY);
                currentY += 8;

                data.rental_properties.forEach((prop, index) => {
                    checkPageBreak(30);
                    // Sub-header
                    doc.setFontSize(11);
                    doc.setFont("helvetica", "bold");
                    doc.text(`${index + 1}. ${prop.property_address || "Property"}`, margin, currentY);
                    currentY += 6;

                    const rentalInfo = [
                        ["Address", `${prop.property_address}, ${prop.property_city}, ${prop.property_state} ${prop.property_zip}`],
                        ["Type", prop.property_type || "N/A"],
                        ["Ownership", prop.ownership_type || "N/A"],
                        ["Rent Received", formatCurrency(prop.total_rent_received)]
                    ];

                    autoTable(doc, {
                        startY: currentY,
                        body: rentalInfo,
                        theme: 'plain',
                        styles: { fontSize: 10, cellPadding: 1 },
                        columnStyles: { 0: { fontStyle: 'bold', width: 30 } },
                        margin: { left: margin + 2 },
                    });
                    currentY = doc.lastAutoTable.finalY + 8;
                });
            }

            // Section 5: Bank Info
            if (data.bank_info) {
                checkPageBreak(30);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Bank Information", margin, currentY);
                currentY += 8;

                const bankInfo = [
                    ["Bank Name", data.bank_info.bank_name || "N/A"],
                    ["Routing Number", data.bank_info.routing_number || "N/A"],
                    ["Account Number", data.bank_info.account_number || "N/A"]
                ];

                autoTable(doc, {
                    startY: currentY,
                    body: bankInfo,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
                    margin: { left: margin },
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // Section 6: Signature
            if (data.signature_details) {
                checkPageBreak(40);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Signature", margin, currentY);
                currentY += 8;

                const sigInfo = [
                    ["Signed At", data.signature_details.signed_at ? new Date(data.signature_details.signed_at).toLocaleString() : 'N/A'],
                    ["IP Address", data.signature_details.ip_address || "N/A"]
                ];

                autoTable(doc, {
                    startY: currentY,
                    body: sigInfo,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
                    margin: { left: margin },
                });
                currentY = doc.lastAutoTable.finalY + 10;

                if (data.signature_details.signature_image) {
                    checkPageBreak(40);
                    doc.text("Signature Image:", margin, currentY);
                    currentY += 5;

                    // Add image - maintaining aspect ratio if needed, but fitting within width
                    // simple approximate dimensions: 50mm width, 20mm height
                    doc.addImage(data.signature_details.signature_image, 'PNG', margin, currentY, 60, 25);
                }
            }

            const filename = `Intake_Form_${data?.personal_info?.first_name || 'Client'}_${data?.personal_info?.last_name || ''}.pdf`;
            doc.save(filename);

        } catch (err) {
            console.error("Error generating PDF:", err);
            setError("Failed to generate PDF");
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!clientId) return;
            try {
                setLoading(true);
                const response = await firmAdminClientsAPI.getSignedDataEntryForm(clientId);
                if (response.success) {
                    setData(response.data);
                } else {
                    // Try to handle case where no form exists gracefully
                    if (response.message && response.message.includes("not found")) {
                        setData(null);
                        setError(null);
                    } else {
                        setError(response.message || "Failed to load intake form data");
                    }
                }
            } catch (err) {
                console.error("Error fetching intake form data:", err);
                // If 404, it might just mean no form yet
                if (err.message && err.message.includes('404')) {
                    setError(null);
                    setData(null);
                } else {
                    setError(err.message || "An error occurred while loading data");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clientId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    // Check for empty data or data with essential fields missing (incomplete/unsigned form)
    const isDataEmpty = !data || (
        !data.signature_details &&
        !data.personal_info?.ssn &&
        (!data.business_incomes || data.business_incomes.length === 0) &&
        (!data.rental_properties || data.rental_properties.length === 0)
    );

    if (isDataEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl mt-6 border border-gray-100">
                <div className="text-gray-400 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Data Intake Form</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">This client has not submitted a data intake form yet.</p>
                {onOpenFillModal && (
                    <button
                        onClick={onOpenFillModal}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        style={{ backgroundColor: "var(--Palette2-TealBlue-900, #00C0C6)" }}
                    >
                        Fill Intake Form
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloading ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem', borderTopColor: 'currentColor', borderRightColor: 'transparent', borderRadius: '50%', borderWidth: '2px', borderStyle: 'solid' }}></span>
                                <span>Downloading...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Download PDF</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoItem label="Full Name" value={`${data.personal_info?.first_name || ''} ${data.personal_info?.middle_name || ''} ${data.personal_info?.last_name || ''}`} />
                    <InfoItem label="Date of Birth" value={data.personal_info?.dateOfBirth} />
                    <InfoItem label="SSN" value={data.personal_info?.ssn} />
                    <InfoItem label="Email" value={data.taxpayer_email} />
                    <InfoItem label="Address" value={formatAddress(data.personal_info)} />
                    <InfoItem label="Filing Status" value={formatFilingStatus(data.personal_info?.filling_status)} />
                </div>
            </div>

            {/* Dependents */}
            {data.personal_info?.dependents?.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Dependents</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SSN</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.personal_info.dependents.map((dep, idx) => (
                                    <tr key={dep.id || idx}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{dep.first_name} {dep.middle_name} {dep.last_name}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{dep.dateOfBirth}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{dep.ssn}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{dep.relationship}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Business Incomes */}
            {data.business_incomes?.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Business Incomes</h3>
                    {data.business_incomes.map((bus, idx) => (
                        <div key={bus.id || idx} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                            <h4 className="font-medium text-md text-gray-700 mb-3">{bus.business_name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoItem label="Type" value={bus.business_type} />
                                <InfoItem label="Description" value={bus.work_description} />
                                <InfoItem label="EIN" value={bus.ein} />
                                <InfoItem label="Formation Date" value={bus.business_formation_date} />
                                <InfoItem label="Home Based" value={bus.home_based ? "Yes" : "No"} />
                                <InfoItem label="Total Income" value={formatCurrency(bus.total_income)} />
                                <InfoItem label="Advertising" value={formatCurrency(bus.advertising)} />
                                <InfoItem label="Office Supplies" value={formatCurrency(bus.office_supplies)} />
                                <InfoItem label="Contractor Pay" value={formatCurrency(bus.total_paid_contractors)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rental Properties */}
            {data.rental_properties?.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Rental Properties</h3>
                    {/* Implemented basic list for rentals if structure is similar */}
                    {data.rental_properties.map((prop, idx) => (
                        <div key={prop.id || idx} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                            <h4 className="font-medium text-md text-gray-700 mb-3">{prop.property_address || "Rental Property"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoItem label="Address" value={`${prop.property_address}, ${prop.property_city}, ${prop.property_state} ${prop.property_zip}`} />
                                <InfoItem label="Type" value={prop.property_type} />
                                <InfoItem label="Ownership" value={prop.ownership_type} />
                                <InfoItem label="Rent Received" value={formatCurrency(prop.total_rent_received)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bank Info */}
            {data.bank_info && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Bank Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoItem label="Bank Name" value={data.bank_info.bank_name} />
                        <InfoItem label="Routing Number" value={data.bank_info.routing_number} />
                        <InfoItem label="Account Number" value={data.bank_info.account_number} />
                    </div>
                </div>
            )}

            {/* Signature Details */}
            {data.signature_details && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Signature</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoItem label="Signed At" value={data.signature_details.signed_at ? new Date(data.signature_details.signed_at).toLocaleString() : 'N/A'} />
                        <InfoItem label="IP Address" value={data.signature_details.ip_address} />
                    </div>
                    {data.signature_details.signature_image && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">Signature Image</p>
                            <div className="border border-gray-200 rounded p-4 inline-block bg-gray-50">
                                <img src={data.signature_details.signature_image} alt="Signature" className="max-h-24 object-contain" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value || "N/A"}</p>
    </div>
);

const formatFilingStatus = (status) => {
    if (!status) return "N/A";
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatAddress = (info) => {
    if (!info) return "N/A";
    const parts = [info.address, info.city, info.state, info.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : "N/A";
};

const formatCurrency = (amount) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount));
};

export default IntakeFormTab;
