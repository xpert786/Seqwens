import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FixedLayout from "../components/FixedLayout";
import ESignatureModal from "../components/ESignatureModal";
import { signatureRequestsAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";
import SimplePDFViewer from "../../components/SimplePDFViewer";
import { useFirmPortalColors } from "../../FirmAdmin/Context/FirmPortalColorsContext";

const PublicESignature = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { updateBranding } = useFirmPortalColors();

    useEffect(() => {
        const fetchPublicRequest = async () => {
            if (!token) {
                toast.error("Invalid link: Missing token");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await signatureRequestsAPI.getSignatureRequestPublic(token);
                if (response.success && response.data) {
                    setRequest(response.data);
                    if (response.data.branding) {
                        updateBranding(response.data.branding);
                    }
                } else {
                    toast.error(response.message || "Failed to load signature request");
                }
            } catch (error) {
                console.error("Error fetching public eSign request:", error);
                toast.error(handleAPIError(error));
            } finally {
                setLoading(false);
            }
        };

        fetchPublicRequest();
    }, [token, updateBranding]);

    const handleSignatureComplete = async (signatureData) => {
        try {
            setSubmitting(true);
            const response = await signatureRequestsAPI.submitSignatureRequestPublic(token, signatureData);
            if (response.success) {
                toast.success("Document signed successfully!");
                // Optionally redirect to a thank you page or a summary page
                setTimeout(() => {
                    navigate("/");
                }, 3000);
            } else {
                toast.error(response.message || "Failed to submit signature");
            }
        } catch (error) {
            console.error("Error submitting signature publicly:", error);
            toast.error(handleAPIError(error));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <FixedLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AD6F2]"></div>
                    <p className="mt-4 text-gray-600 font-[BasisGrotesquePro]">Loading signature request...</p>
                </div>
            </FixedLayout>
        );
    }

    if (!request) {
        return (
            <FixedLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h5 className="text-xl font-bold font-[BasisGrotesquePro] text-gray-900">Request Not Found</h5>
                    <p className="mt-2 text-gray-600 font-[BasisGrotesquePro] max-w-md">This signature request might have expired or doesn't exist.</p>
                </div>
            </FixedLayout>
        );
    }

    return (
        <FixedLayout>
            <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl">
                    {/* Header */}
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-white to-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2 tracking-tight">
                                Review & Sign Document
                            </h2>
                            <p className="text-gray-600 font-[BasisGrotesquePro] text-sm sm:text-base leading-relaxed">
                                {request.firm_name} is requesting your signature on <strong>{request.document_name}</strong>.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#3AD6F2] bg-opacity-10 text-[#3AD6F2] px-4 py-2 rounded-full text-sm font-semibold">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                                <path d="M9 12L11 14L15 10" />
                            </svg>
                            Secure Signature
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 sm:p-8 space-y-8">
                        {/* Summary Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sent By</p>
                                <p className="text-gray-800 font-semibold">{request.sender_name || request.firm_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                                <p className="text-gray-800 font-semibold">{request.due_date || "No due date"}</p>
                            </div>
                        </div>

                        {/* PDF Preview Area */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#3AD6F2] to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-inner">
                                <SimplePDFViewer 
                                    pdfUrl={request.document_url} 
                                    height="450px" 
                                    className="w-full"
                                />
                                {/* Overlay to encourage signing */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex flex-col items-center gap-4 pt-4">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full sm:w-auto px-10 py-4 bg-[#3AD6F2] text-white rounded-xl font-bold text-lg shadow-lg hover:brightness-95 transform hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3"
                                style={{ boxShadow: '0 10px 20px -5px rgba(58, 214, 242, 0.4)' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                                    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                                </svg>
                                Start Signing Now
                            </button>
                            <p className="text-xs text-gray-400 font-[BasisGrotesquePro]">
                                By clicking above, you agree to our electronic signature terms and conditions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Secure Trust Indicators */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-60">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <p className="text-xs font-bold font-[BasisGrotesquePro] text-gray-800">Bank-Level Security</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </div>
                        <p className="text-xs font-bold font-[BasisGrotesquePro] text-gray-800">UETA/eSign Compliant</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <p className="text-xs font-bold font-[BasisGrotesquePro] text-gray-800">Encrypted Audit Trail</p>
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {showModal && (
                <ESignatureModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    requestId={request.id}
                    signatureRequest={request}
                    onSignatureComplete={handleSignatureComplete}
                    pages={
                        <SimplePDFViewer 
                            pdfUrl={request.document_url} 
                            height="500px" 
                            className="w-full"
                        />
                    }
                />
            )}
        </FixedLayout>
    );
};

export default PublicESignature;
