import React, { useState, useEffect } from "react";
import { EmailsIcon, LiveIcon, MobileIcon, TicketIcon } from "../icons";
import { supportTicketAPI, taxpayerFirmAPI, handleAPIError } from "../../utils/apiUtils";

const ContactSupport = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [supportInfo, setSupportInfo] = useState({
    email_support: {
      email: 'support@firm.com',
      description: 'Get help via email within 24 hours',
      availability: 'Support 24/7'
    },
    phone_support: {
      phone: '+01 (555) 123-4567',
      description: 'Speak directly with our support team',
      availability: 'Mon-Fri 9AM-6PM'
    }
  });
  const [loadingSupportInfo, setLoadingSupportInfo] = useState(true);

  // Fetch office support information
  useEffect(() => {
    const fetchSupportInfo = async () => {
      try {
        setLoadingSupportInfo(true);
        const response = await taxpayerFirmAPI.getOfficeSupport();
        if (response.success && response.data) {
          setSupportInfo(response.data);
        }
      } catch (error) {
        console.error('Error fetching support info:', error);
        // Keep default values on error
      } finally {
        setLoadingSupportInfo(false);
      }
    };
    fetchSupportInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.subject.trim()) {
      setErrorMessage('Please enter a subject');
      return;
    }
    if (!formData.category) {
      setErrorMessage('Please select a category');
      return;
    }
    if (!formData.priority) {
      setErrorMessage('Please select a priority');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Please enter a description');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      console.log('🔄 Creating support ticket...', formData);
      const response = await supportTicketAPI.createSupportTicket(formData);
      console.log('📋 Support ticket creation response:', response);

      if (response.success) {
        setSuccessMessage(`Support ticket created successfully! Ticket number: ${response.data.ticket_number}`);
        // Reset form
        setFormData({
          subject: '',
          category: '',
          priority: '',
          description: ''
        });
        
        // Refresh support tickets list
        if (window.refreshSupportTickets) {
          console.log('🔄 Refreshing support tickets list...');
          window.refreshSupportTickets();
        }
      } else {
        setErrorMessage(response.message || 'Failed to create support ticket');
      }
    } catch (err) {
      console.error('💥 Error creating support ticket:', err);
      const errorMsg = handleAPIError(err);
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
    >


      {/* Top 3 Support Cards */}
      <div className="row g-3 mb-4">
        {/* Email Support */}
        <div className="col-md-4">
          <div className="p-3 rounded-4  text-center h-100" style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
            <div className="fs-2 mb-2 text-primary">
              <EmailsIcon />
            </div>
            <h6 className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Email Support</h6>
            {loadingSupportInfo ? (
              <div className="text-center py-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>
                  {supportInfo.email_support?.description || 'Get help via email within 24 hours'}
                </p>
                <p className="mb-0" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>
                  {supportInfo.email_support?.email || 'support@firm.com'}
                </p>
                <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>
                  {supportInfo.email_support?.availability || 'Support 24/7'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Phone Support */}
        <div className="col-md-4">
          <div className="p-3 rounded-4  text-center h-100 " style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
            <div className="fs-2 mb-2 text-primary">
              <MobileIcon />
            </div>
            <h6 className=" mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Phone Support</h6>
            {loadingSupportInfo ? (
              <div className="text-center py-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>
                  {supportInfo.phone_support?.description || 'Speak directly with our support team'}
                </p>
                <p className="mb-0" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>
                  {supportInfo.phone_support?.phone || '+01 (555) 123-4567'}
                </p>
                <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>
                  {supportInfo.phone_support?.availability || 'Mon-Fri 9AM-6PM'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Live Chat */}
        <div className="col-md-4">
          <div className="p-3 rounded-4 text-center h-100" style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
            <div className="fs-2 mb-2 text-primary">
              <LiveIcon />
            </div>
            <h6 className="fw-semibold mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Live Chat</h6>
            <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Chat with a support representative</p>
            <p className="mb-0" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Available in portal</p>
            <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Mon-Fri 9AM-6PM</p>
          </div>
        </div>
      </div>

      {/* Support Ticket Form */}
      <div className="p-4 rounded-4 " style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
        <h6 className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Submit A Support Ticket</h6>
        <p className="mb-4" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#4B5563" }}>Can't find what you're looking for? Send us a message</p>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success mb-3" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="alert alert-danger mb-3" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitTicket}>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter Subject"
                className="form-control rounded-3 border-light-subtle"
                style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66" }}
                disabled={loading}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label " style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select rounded-3 border-light-subtle"
                style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66", height: "45px", }}
                disabled={loading}
              >
                <option value="">Select Category</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="form-select rounded-3 border-light-subtle"
                style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66", height: "45px", }}
                disabled={loading}
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="col-md-12">
              <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="form-control rounded-3 border-light-subtle"
                placeholder="Please provide detailed information about your issue..."
                style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66" }}
                disabled={loading}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="btn text-white d-flex align-items-center gap-2"
            style={{
              backgroundColor: "#F56D2D",
              fontSize: "14px",
              padding: "10px 20px",
              borderRadius: "8px"
            }}
            disabled={loading}
          >
            <TicketIcon /> 
            {loading ? 'Creating Ticket...' : 'Submit Ticket'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default ContactSupport;
