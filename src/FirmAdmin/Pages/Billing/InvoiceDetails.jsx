import React, { useState } from 'react';
import InvoiceDetailsTab from './InvoiceDetailsTab';
import PaymentHistoryTab from './PaymentHistoryTab';
import ActivityLogTab from './ActivityLogTab';

export default function InvoiceDetails() {
  const [activeTab, setActiveTab] = useState('details');

  // Mock data for invoice
  const invoiceData = {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    client: 'John Smith',
    amount: 2500,
    status: 'paid',
    issueDate: '01-02-2025',
    dueDate: '01-03-2025',
    paymentDate: '28-02-2025',
    items: [
      { description: 'Individual Tax Return Preparation', qty: 1, rate: 750, amount: 750 },
      { description: 'Schedule C - Business Income', qty: 1, rate: 400, amount: 400 },
      { description: 'Schedule E - Rental Property', qty: 1, rate: 300, amount: 300 },
      { description: 'Tax Planning Consultation', qty: 2, rate: 200, amount: 400 },
      { description: 'Document Review And Filing', qty: 1, rate: 450, amount: 450 }
    ],
    subtotal: 2300,
    total: 2500,
    clientInfo: {
      name: 'John Smith',
      company: 'Smith Enterprises',
      address: '123 Main St, New York, NY 10001',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567'
    },
    invoiceDetails: {
      invoiceNumber: 'INV-2024-001',
      assignedTo: 'Michael Chen',
      office: 'Main Office - Manhattan',
      paymentTerms: 'Net 30',
      status: 'Paid'
    },
    paymentHistory: [
      {
        date: '28-02-2024',
        amount: 2500,
        method: 'Credit Card',
        reference: 'ch_1234567890',
        status: 'Completed'
      }
    ],
    activityLog: [
      {
        icon: 'payment',
        description: 'Payment Received Via Credit Card',
        by: 'System',
        date: '28-02-2025 3:45 PM'
      },
      {
        icon: 'send',
        description: 'Invoice Sent To Client Via Email',
        by: 'Michael Chen',
        date: '01-02-2025 10:30 AM'
      },
      {
        icon: 'document',
        description: 'Invoice Created And Reviewed',
        by: 'Michael Chen',
        date: '01-02-2025 9:15 AM'
      }
    ]
  };

  const getStatusBadge = (status) => {
    const configs = {
      paid: { color: 'bg-green-500', text: 'Paid' },
      sent: { color: 'bg-blue-500', text: 'Sent' },
      overdue: { color: 'bg-red-500', text: 'Overdue' },
      draft: { color: 'bg-gray-500', text: 'Draft' }
    };
    const config = configs[status] || configs.draft;
    return (
      <span className={`${config.color} text-white px-2 py-0.5 !rounded-[10px] text-xs font-medium whitespace-nowrap`}>
        {config.text}
      </span>
    );
  };

  const getIcon = (iconName) => {
    const icons = {
      send: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.5 1.5L11.4166 16.0239C11.3568 16.1948 11.1187 16.2045 11.0451 16.039L8.25 9.75M16.5 1.5L1.97614 6.58335C1.80518 6.64319 1.79546 6.88132 1.96099 6.95488L8.25 9.75M16.5 1.5L8.25 9.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      edit: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.7813 1.9699C14.0797 1.67153 14.4844 1.50391 14.9063 1.50391C15.3283 1.50391 15.733 1.67153 16.0313 1.9699C16.3297 2.26826 16.4973 2.67294 16.4973 3.0949C16.4973 3.51685 16.3297 3.92153 16.0313 4.2199L9.27157 10.9804C9.09348 11.1583 8.87347 11.2886 8.63182 11.3591L6.47707 11.9891C6.41253 12.008 6.34412 12.0091 6.279 11.9924C6.21388 11.9757 6.15444 11.9418 6.10691 11.8943C6.05937 11.8468 6.02549 11.7873 6.0088 11.7222C5.99212 11.6571 5.99325 11.5887 6.01207 11.5241L6.64207 9.3694C6.71297 9.12793 6.84347 8.90819 7.02157 8.7304L13.7813 1.9699Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      download: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  return (
    <div className="p-6" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-3xl font-bold font-[BasisGrotesquePro] mb-2" style={{ color: '#1F2937' }}>
              {invoiceData.invoiceNumber}
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-base font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                {invoiceData.client} • ${invoiceData.amount.toLocaleString()}
              </span>
              {getStatusBadge(invoiceData.status)}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 !rounded-lg !border border-gray-300 bg-white flex items-center gap-2 hover:bg-gray-50 transition">
              {getIcon('send')}
              Send to Client
            </button>
            <button className="px-4 py-2 !rounded-lg !border border-gray-300 bg-white flex items-center gap-2 hover:bg-gray-50 transition">
              {getIcon('download')}
              Download PDF
            </button>
            <button className="px-5 py-2 !rounded-lg flex items-center gap-2  !border border-gray-300 bg-white font-medium">
              {getIcon('edit')}
              Edit Invoice
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Total Amount</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>${invoiceData.total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Issue Date</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.issueDate}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Due Date</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.dueDate}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Payment Date</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.paymentDate}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 !border border-[#E8F0FF] rounded-lg p-3 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-2 !rounded-lg font-medium font-[BasisGrotesquePro] ${activeTab === 'details' ? 'bg-[#3AD6F2] text-white' : 'bg-white text-gray-700'}`}
          >
            Invoice Details
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-6 py-2 !rounded-lg font-medium font-[BasisGrotesquePro] ${activeTab === 'payment' ? 'bg-[#3AD6F2] text-white' : 'bg-white text-gray-700'}`}
          >
            Payment history
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-2 !rounded-lg font-medium font-[BasisGrotesquePro] ${activeTab === 'activity' ? 'bg-[#3AD6F2] text-white' : 'bg-white text-gray-700'}`}
          >
            Activity Log
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && <InvoiceDetailsTab invoiceData={invoiceData} />}
        {activeTab === 'payment' && <PaymentHistoryTab paymentHistory={invoiceData.paymentHistory} />}
        {activeTab === 'activity' && <ActivityLogTab activityLog={invoiceData.activityLog} />}
      </div>
    </div>
  );
}
