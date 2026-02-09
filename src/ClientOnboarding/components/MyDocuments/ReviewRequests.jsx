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
    const [submitting, setSubmitting] = useState(false);

    // Fetch review requests
    const fetchReviewRequests = async () => {
        try {
            setLoading(true);
            const response = await tasksAPI.getMyTasks();

            if (response.success && response.data) {
                // Filter for review_request type tasks
                const reviewTasks = response.data.filter(task => task.task_type === 'review_request');
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
        setShowReviewModal(true);
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewComment('');
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

            // Update task with review comment and mark as completed
            const updateData = {
                status: 'completed',
                description: `${selectedRequest.description || ''}\n\n--- Client Review ---\n${reviewComment}`
            };

            const updateResponse = await tasksAPI.updateTask(selectedRequest.id, updateData);

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
                    Loading review requests...
                </p>
            </div>
        );
    }

    if (reviewRequests.length === 0) {
        return (
            <div className="text-center py-5">
                <FiFileText size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
                <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                    No Review Requests
                </h6>
                <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                    You don't have any pending document review requests at this time.
                </p>
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
                    Document Review Requests
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

                                {request.status !== 'completed' && request.status !== 'cancelled' && (
                                    <div className="d-flex justify-content-end gap-2">
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
