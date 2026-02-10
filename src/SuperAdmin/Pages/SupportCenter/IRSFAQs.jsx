import React, { useState, useEffect } from "react";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function IRSFAQs({ onAddFAQModalToggle, showAddFAQModal, userType }) {
    const [faqData, setFaqData] = useState([]);
    const [expandedItems, setExpandedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [newFAQ, setNewFAQ] = useState({ title: "", description: "", answer: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 30,
        total_count: 0,
        total_pages: 1
    });
    const [saving, setSaving] = useState(false);
    const [reordering, setReordering] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Helper function to refetch FAQs
    const fetchFAQs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getFAQs(
                pagination.page,
                pagination.page_size,
                searchTerm,
                true
            );

            if (response.success && response.data) {
                setFaqData(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
                // Keep all items closed by default
                setExpandedItems([]);
            } else {
                setFaqData([]);
            }
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            toast.error(errorMessage, {
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
            setFaqData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch FAQs from API on mount and when pagination changes
    useEffect(() => {
        fetchFAQs();
    }, [pagination.page, pagination.page_size]);

    // Debounce search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            // Reset to page 1 when searching
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                fetchFAQs();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const toggleExpanded = (index) => {
        setExpandedItems(prev =>
            prev.includes(index)
                ? prev.filter(item => item !== index)
                : [...prev, index]
        );
    };


    const handleCloseModal = () => {
        onAddFAQModalToggle(false);
        setNewFAQ({ title: "", description: "", answer: "" });
    };

    const handleSubmitFAQ = async () => {
        if (!newFAQ.title.trim() || !newFAQ.description.trim() || !newFAQ.answer.trim()) {
            toast.error('Please fill in title, description, and answer', {
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
            return;
        }

        try {
            setSaving(true);
            const faqPayload = {
                title: newFAQ.title.trim(),
                description: newFAQ.description.trim(),
                answer: newFAQ.answer.trim(),
                is_active: true,
                is_published: true,
                order: faqData.length > 0 ? Math.max(...faqData.map(f => f.order || 0)) + 1 : 0
            };

            const response = await superAdminAPI.createFAQ(faqPayload);

            if (response.success) {
                toast.success(response.message || 'FAQ created successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    icon: false,
                    className: "custom-toast-success",
                    bodyClassName: "custom-toast-body",
                });

                // Refresh FAQs list
                const refreshedResponse = await superAdminAPI.getFAQs(
                    pagination.page,
                    pagination.page_size,
                    searchTerm,
                    true
                );

                if (refreshedResponse.success && refreshedResponse.data) {
                    setFaqData(refreshedResponse.data);
                    if (refreshedResponse.pagination) {
                        setPagination(refreshedResponse.pagination);
                    }
                    // Keep all items closed by default
                    setExpandedItems([]);
                }

                onAddFAQModalToggle(false);
                setNewFAQ({ title: "", description: "", answer: "" });
            }
        } catch (err) {
            console.error('Error creating FAQ:', err);
            const errorMessage = handleAPIError(err);
            toast.error(errorMessage, {
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
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFAQ = (faqId, e) => {
        e.stopPropagation(); // Prevent toggling expanded state
        setFaqToDelete(faqId);
        setShowDeleteModal(true);
    };

    const confirmDeleteFAQ = async () => {
        if (!faqToDelete) return;

        try {
            setDeleting(true);
            const response = await superAdminAPI.deleteFAQ(faqToDelete);

            if (response.success) {
                toast.success('FAQ deleted successfully', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    icon: false,
                    className: "custom-toast-success",
                    bodyClassName: "custom-toast-body",
                });

                // Refresh FAQs
                fetchFAQs();
                setShowDeleteModal(false);
                setFaqToDelete(null);
            } else {
                toast.error(response.message || 'Failed to delete FAQ', {
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
            }
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            const errorMessage = handleAPIError(err);
            toast.error(errorMessage, {
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
        } finally {
            setDeleting(false);
        }
    };

    const togglePublished = async (faqId, currentStatus, e) => {
        e.stopPropagation();
        try {
            const response = await superAdminAPI.updateFAQ(faqId, { is_published: !currentStatus });
            if (response.success) {
                setFaqData(prev => prev.map(f => f.id === faqId ? { ...f, is_published: !currentStatus } : f));
                toast.success(`FAQ ${!currentStatus ? 'published' : 'unpublished'} successfully`);
            }
        } catch (err) {
            toast.error(handleAPIError(err));
        }
    };

    const handleMove = async (index, direction, e) => {
        e.stopPropagation();
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === faqData.length - 1) return;

        const newFaqData = [...faqData];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFaqData[index], newFaqData[targetIndex]] = [newFaqData[targetIndex], newFaqData[index]];

        // Update orders locally first for snappy UI
        const reordered = newFaqData.map((f, i) => ({ ...f, order: i }));
        setFaqData(reordered);

        try {
            setReordering(true);
            const orderPayload = reordered.map(f => ({ id: f.id, order: f.order }));
            const response = await superAdminAPI.reorderFAQs(orderPayload);
            if (!response.success) {
                throw new Error(response.message || 'Failed to save new order');
            }
        } catch (err) {
            toast.error(handleAPIError(err));
            // Revert on error
            fetchFAQs();
        } finally {
            setReordering(false);
        }
    };


    return (
        <div className=" min-h-screen ">
            <div className="w-full">
                {/* Main Container */}
                <div className="bg-white rounded-lg  border border-gray-200">
                    {/* Header Section */}
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-[#3B4A66] mb-2">
                                    Frequently Asked Questions
                                </h3>
                                <p className="text-gray-500 text-lg mb-6">
                                    Find quick answers to common questions
                                </p>

                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ borderRadius: '7px' }}>
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search FAQs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">Loading FAQs...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="p-8 text-center">
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}

                    {/* FAQ Items */}
                    {!loading && !error && (
                        <div>
                            {faqData.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500">No FAQs found</p>
                                </div>
                            ) : (
                                faqData.map((faq, index) => (
                                    <div key={faq.id || index} className="p-4 last:border-b-0">
                                        <div className=" border-2  border-[#E8F0FF] p-3 rounded-lg ">
                                            <div
                                                className="flex justify-between items-start cursor-pointer"
                                                onClick={() => toggleExpanded(index)}
                                            >
                                                <h5 className="text-xs font-semibold text-gray-800 ">
                                                    {faq.title || faq.question}
                                                </h5>
                                                <div className="flex items-center gap-3">
                                                    {/* Reordering Controls */}
                                                    <div className="flex flex-col gap-1 mr-2">
                                                        <button
                                                            onClick={(e) => handleMove(index, 'up', e)}
                                                            disabled={index === 0 || reordering}
                                                            className={`p-0.5 rounded hover:bg-gray-100 ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500'}`}
                                                            title="Move Up"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleMove(index, 'down', e)}
                                                            disabled={index === faqData.length - 1 || reordering}
                                                            className={`p-0.5 rounded hover:bg-gray-100 ${index === faqData.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500'}`}
                                                            title="Move Down"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* Published Toggle */}
                                                    <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                                                        <span className={`text-[10px] font-medium ${faq.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {faq.is_published ? 'Published' : 'Hidden'}
                                                        </span>
                                                        <div
                                                            onClick={(e) => togglePublished(faq.id, faq.is_published, e)}
                                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${faq.is_published ? 'bg-[#F56D2D]' : 'bg-gray-200'}`}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${faq.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>

                                                    {userType !== 'billing_admin' && (
                                                        <button
                                                            onClick={(e) => handleDeleteFAQ(faq.id, e)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                            title="Delete FAQ"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <div className="flex-shrink-0">
                                                        <svg
                                                            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedItems.includes(index) ? 'rotate-180' : ''
                                                                }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedItems.includes(index) && (
                                                <div className="mt-4">
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        {faq.answer || faq.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add FAQ Modal */}
            {
                showAddFAQModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                        {/* Backdrop with blur effect */}
                        <div className="absolute inset-0 bg-[#00000099]"></div>

                        {/* Modal */}
                        <div className="relative bg-white rounded-lg  w-[450px] p-2">
                            {/* Header */}
                            <div className="flex items-center justify-between pt-3 pl-3 ">
                                <h4 className="text-xl font-semibold text-gray-800">Add New FAQs</h4>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                        <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66" />
                                    </svg>

                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-3 space-y-2">
                                {/* Title Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={newFAQ.title}
                                        onChange={(e) => setNewFAQ(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter title"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Description Field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newFAQ.description}
                                        onChange={(e) => setNewFAQ(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter description (brief guide/overview)..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Answer Field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Answer
                                    </label>
                                    <textarea
                                        value={newFAQ.answer}
                                        onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                                        placeholder="Enter detailed answer..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end space-x-3 p-3  gap-2">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    style={{ borderRadius: '7px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitFAQ}
                                    disabled={saving}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderRadius: '7px' }}
                                >
                                    {saving ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDeleteFAQ}
                title="Delete FAQ"
                message="Are you sure you want to delete this FAQ? "
                confirmText="Delete"
                isDestructive={true}
                isLoading={deleting}
            />
        </div >
    );
}
