import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { handleAPIError } from '../../utils/apiUtils';
import { tasksAPI } from '../../utils/apiUtils';
import { Modal, Button } from 'react-bootstrap';
import { FiFileText, FiCheckCircle, FiClock, FiMessageSquare } from 'react-icons/fi';

const ReviewRequests = () => {
    const [reviewRequests, setReviewRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewComment, setReviewComment] = useState('');
    const [uploadFiles, setUploadFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Fetch review requests
    const fetchReviewRequests = async () => {
        try {
            setLoading(true);
            const response = await tasksAPI.getMyTasks();

            if (response.success && response.data) {
                // Filter for review_request type tasks
                const reviewTasks = response.data.filter(task =>
                    task.task_type === 'review_request'
                );
                setReviewRequests(reviewTasks);
            }
        } catch (error) {
            console.error('Error fetching review requests:', error);
            handleAPIError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewRequests();
    }, []);
    const handleOpenReviewModal = (request) => {
        setSelectedRequest(request);
        setReviewComment('');
        setUploadFiles([]);
        setShowReviewModal(true);
    };

    const handleCompleteTask = async (request) => {
        try {
            setSubmitting(true);
            const updateResponse = await tasksAPI.updateTaskStatus(request.id, 'completed');

            if (updateResponse.success) {
                toast.success('Task marked as completed!', {
                    position: 'top-right',
                    autoClose: 3000
                });
                fetchReviewRequests();
            }
        } catch (error) {
            console.error('Error completing task:', error);
            handleAPIError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewComment('');
        setUploadFiles([]);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setUploadFiles(Array.from(e.target.files));
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) {
            toast.error('Please provide your review comments', {
                position: 'top-right',
                autoClose: 3000
            });
            return;
        }

        try {
            setSubmitting(true);

            // Use FormData for file upload support
            const formData = new FormData();
            formData.append('status', 'completed');
            formData.append('description', `${selectedRequest.description || ''}\n\n--- Client Review ---\n${reviewComment}`);

            if (uploadFiles.length > 0) {
                uploadFiles.forEach(file => {
                    formData.append('files', file);
                });
            }

            const updateResponse = await tasksAPI.updateTask(selectedRequest.id, formData);

            if (updateResponse.success) {
                toast.success('Review submitted successfully!', {
                    position: 'top-right',
                    autoClose: 3000
                });

                handleCloseReviewModal();
                fetchReviewRequests(); // Refresh the list
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            handleAPIError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            'to_do': { bg: '#FEF3C7', color: '#92400E', text: 'To Do' },
            'pending': { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
            'submitted': { bg: '#DBEAFE', color: '#1E40AF', text: 'Submitted' },
            'in_progress': { bg: '#DBEAFE', color: '#1E40AF', text: 'In Progress' },
            'waiting_for_client': { bg: '#FEF3C7', color: '#92400E', text: 'Waiting' },
            'completed': { bg: '#D1FAE5', color: '#065F46', text: 'Completed' },
            'cancelled': { bg: '#FEE2E2', color: '#991B1B', text: 'Cancelled' }
        };

        const style = statusStyles[status] || { bg: '#F3F4F6', color: '#374151', text: status };

        return (
            <span
                className="px-3 py-1 rounded-pill"
                style={{
                    backgroundColor: style.bg,
                    color: style.color,
                    fontSize: '12px',
                    fontWeight: '500',
                    fontFamily: 'BasisGrotesquePro'
                }}
            >
                {style.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3" style={{ fontFamily: 'BasisGrotesquePro', color: '#6B7280' }}>
                    Loading tasks...
                </p>
            </div>
        );
    }

    if (reviewRequests.length === 0) {
        return (
            <div className="bg-white p-4 rounded">
                <div className="text-center py-5">
                    <FiFileText size={48} style={{ color: '#D1D5DB', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                    <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                        No Review Requests
                    </h6>
                    <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                        You don't have any pending review requests at this time.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-4 rounded">
                <h5
                    className="mb-4"
                    style={{
                        color: '#3B4A66',
                        fontSize: '20px',
                        fontWeight: '500',
                        fontFamily: 'BasisGrotesquePro'
                    }}
                >
                    Review Requests
                </h5>

                <div className="row g-3">
                    {reviewRequests.map((request) => (
                        <div key={request.id} className="col-12">
                            <div
                                className="p-4 rounded border"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#E5E7EB',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#00C0C6';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="flex-grow-1">
                                        <h6
                                            className="mb-2"
                                            style={{
                                                color: '#1F2937',
                                                fontWeight: '600',
                                                fontSize: '16px',
                                                fontFamily: 'BasisGrotesquePro'
                                            }}
                                        >
                                            {request.task_title}
                                        </h6>
                                        {request.description && (
                                            <p
                                                className="mb-2"
                                                style={{
                                                    color: '#6B7280',
                                                    fontSize: '14px',
                                                    fontFamily: 'BasisGrotesquePro'
                                                }}
                                            >
                                                {request.description}
                                            </p>
                                        )}
                                        <div className="d-flex align-items-center gap-3 flex-wrap">
                                            <span
                                                style={{
                                                    color: '#9CA3AF',
                                                    fontSize: '13px',
                                                    fontFamily: 'BasisGrotesquePro'
                                                }}
                                            >
                                                <FiClock size={14} className="me-1" />
                                                Due: {formatDate(request.due_date)}
                                            </span>
                                            {request.assigned_to_name && (
                                                <span
                                                    style={{
                                                        color: '#9CA3AF',
                                                        fontSize: '13px',
                                                        fontFamily: 'BasisGrotesquePro'
                                                    }}
                                                >
                                                    From: {request.assigned_to_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        {getStatusBadge(request.status)}
                                    </div>
                                </div>

                                {/* Task Files */}
                                {request.files && request.files.length > 0 && (
                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '12px',
                                                fontFamily: 'BasisGrotesquePro'
                                            }}
                                        >
                                            Documents for Review:
                                        </h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {request.files.map((file) => (
                                                <a
                                                    key={file.id}
                                                    href={file.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border bg-light"
                                                    style={{
                                                        textDecoration: 'none',
                                                        color: '#4B5563',
                                                        fontSize: '13px',
                                                        borderColor: '#E5E7EB',
                                                        transition: 'all 0.2s ease',
                                                        fontFamily: 'BasisGrotesquePro'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#00C0C6';
                                                        e.currentTarget.style.backgroundColor = '#F0FDFA';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                                        e.currentTarget.style.backgroundColor = '#F8F9FA';
                                                    }}
                                                >
                                                    <FiFileText size={16} style={{ color: '#00C0C6' }} />
                                                    <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {file.file_name}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {request.status !== 'completed' && request.status !== 'cancelled' && (
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-sm d-flex align-items-center gap-2"
                                            onClick={() => handleCompleteTask(request)}
                                            disabled={submitting}
                                            style={{
                                                backgroundColor: '#F3F4F6',
                                                color: '#374151',
                                                border: '1px solid #E5E7EB',
                                                fontFamily: 'BasisGrotesquePro',
                                                fontWeight: '500',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <FiCheckCircle size={14} />
                                            {submitting ? 'Completing...' : 'Mark as Completed'}
                                        </button>
                                        <button
                                            className="btn btn-sm d-flex align-items-center gap-2"
                                            onClick={() => handleOpenReviewModal(request)}
                                            style={{
                                                backgroundColor: '#00C0C6',
                                                color: 'white',
                                                border: 'none',
                                                fontFamily: 'BasisGrotesquePro',
                                                fontWeight: '500',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <FiMessageSquare size={14} />
                                            Review &amp; Submit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Review Modal */}
            <Modal
                show={showReviewModal}
                onHide={handleCloseReviewModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', color: '#1F2937' }}>
                        Submit Document Review
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '24px' }}>
                    {selectedRequest && (
                        <>
                            <div className="mb-4">
                                <h6
                                    style={{
                                        fontFamily: 'BasisGrotesquePro',
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}
                                >
                                    {selectedRequest.task_title}
                                </h6>
                                {selectedRequest.description && (
                                    <p
                                        style={{
                                            fontFamily: 'BasisGrotesquePro',
                                            color: '#6B7280',
                                            fontSize: '14px',
                                            marginBottom: '0'
                                        }}
                                    >
                                        {selectedRequest.description}
                                    </p>
                                )}
                            </div>

                            {/* Show original documents in the modal too */}
                            {selectedRequest.files && selectedRequest.files.length > 0 && (
                                <div className="mb-4">
                                    <h6 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '10px' }}>
                                        Documents to Review:
                                    </h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedRequest.files.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="d-flex align-items-center gap-2 px-2 py-1 rounded border text-decoration-none"
                                                style={{ fontSize: '12px', color: '#4B5563', backgroundColor: '#F9FAFB' }}
                                            >
                                                <FiFileText size={14} style={{ color: '#00C0C6' }} />
                                                {file.file_name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-3">
                                <label
                                    htmlFor="reviewComment"
                                    className="form-label"
                                    style={{
                                        fontFamily: 'BasisGrotesquePro',
                                        fontWeight: '500',
                                        color: '#374151'
                                    }}
                                >
                                    Your Review Comments *
                                </label>
                                <textarea
                                    id="reviewComment"
                                    className="form-control"
                                    rows="6"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Please provide your comments, feedback, or approval for this document review..."
                                    style={{
                                        fontFamily: 'BasisGrotesquePro',
                                        fontSize: '14px',
                                        borderColor: '#E5E7EB'
                                    }}
                                />
                            </div>

                            <div className="mb-3">
                                <label
                                    className="form-label"
                                    style={{
                                        fontFamily: 'BasisGrotesquePro',
                                        fontWeight: '500',
                                        color: '#374151'
                                    }}
                                >
                                    Upload Documents (Optional)
                                </label>
                                <div
                                    className="p-3 border rounded text-center"
                                    style={{
                                        borderStyle: 'dashed !important',
                                        borderColor: '#D1D5DB',
                                        backgroundColor: '#F9FAFB'
                                    }}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        className="form-control"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="review-file-upload"
                                    />
                                    <label
                                        htmlFor="review-file-upload"
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    >
                                        <div className="mb-2">
                                            <FiFileText size={24} style={{ color: '#00C0C6' }} />
                                        </div>
                                        <span style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#4B5563' }}>
                                            Click to upload or drag and drop
                                        </span>
                                    </label>
                                </div>
                                {uploadFiles.length > 0 && (
                                    <div className="mt-3">
                                        <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Selected Files:</h6>
                                        <ul className="list-unstyled mb-0">
                                            {uploadFiles.map((file, index) => (
                                                <li key={index} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '13px', color: '#6B7280' }}>
                                                    <FiFileText size={14} />
                                                    {file.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div
                                className="alert"
                                style={{
                                    backgroundColor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    color: '#1E40AF',
                                    fontFamily: 'BasisGrotesquePro',
                                    fontSize: '13px'
                                }}
                            >
                                <FiCheckCircle size={16} className="me-2" />
                                Once submitted, this review request will be marked as completed and your tax preparer will be notified.
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #E5E7EB' }}>
                    <Button
                        variant="secondary"
                        onClick={handleCloseReviewModal}
                        disabled={submitting}
                        style={{
                            fontFamily: 'BasisGrotesquePro',
                            backgroundColor: '#F3F4F6',
                            border: 'none',
                            color: '#374151'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitReview}
                        disabled={submitting}
                        style={{
                            fontFamily: 'BasisGrotesquePro',
                            backgroundColor: '#00C0C6',
                            border: 'none'
                        }}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <FiCheckCircle size={16} className="me-2" />
                                Submit Review
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ReviewRequests;
