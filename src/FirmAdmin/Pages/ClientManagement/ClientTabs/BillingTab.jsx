import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BillingTab({ client, billingHistory = [] }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRefs = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown !== null) {
        const dropdownElement = dropdownRefs.current[showDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setShowDropdown(null);
        }
      }
    };

    if (showDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Get status color based on invoice status
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'paid':
        return 'bg-[#22C55E] text-white';
      case 'overdue':
        return 'bg-[#EF4444] text-white';
      case 'pending':
        return 'bg-[#F59E0B] text-white';
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'partial':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleDropdownToggle = (invoiceId) => {
    setShowDropdown(showDropdown === invoiceId ? null : invoiceId);
  };

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Billing History</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">All invoices and payments for this client</p>
      </div>

      {billingHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No billing history available</p>
        </div>
      ) : (
        <>
          {/* Table Headers */}
          <div className="grid grid-cols-7 gap-4 pb-4 mb-4 border-b border-gray-200 font-[BasisGrotesquePro]">
            <div className="text-sm text-[#4B5563]">Invoice ID</div>
            <div className="text-sm text-[#4B5563]">Description</div>
            <div className="text-sm text-[#4B5563]">Amount</div>
            <div className="text-sm text-[#4B5563]">Date</div>
            <div className="text-sm text-[#4B5563]">Due Date</div>
            <div className="text-sm text-[#4B5563]">Status</div>
            <div className="text-sm text-[#4B5563] text-center">Action</div>
          </div>

          {/* Invoice Rows */}
          <div className="space-y-3">
            {billingHistory.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-7 gap-4 items-center bg-white !rounded-lg p-4 !border border-[#E8F0FF] font-[BasisGrotesquePro]"
              >
                <div className="text-sm font-medium text-gray-900">{invoice.invoice_id || `INV-${invoice.id}`}</div>
                <div className="text-sm text-gray-900">{invoice.description || 'N/A'}</div>
                <div className="text-sm font-medium text-gray-900">{invoice.formatted_amount || `$${invoice.amount || '0.00'}`}</div>
                <div className="text-sm text-gray-900">{invoice.formatted_date || invoice.issue_date || 'N/A'}</div>
                <div className="text-sm text-gray-900">{invoice.formatted_due_date || invoice.due_date || 'N/A'}</div>
                <div>
                  <span className={`px-3 py-1 text-xs font-medium !rounded-[20px] ${getStatusColor(invoice.status)} font-[BasisGrotesquePro]`}>
                    {invoice.status_display || invoice.status || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-center relative">
                  <div
                    ref={(el) => { dropdownRefs.current[invoice.id] = el; }}
                  >
                    <button
                      onClick={() => handleDropdownToggle(invoice.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8 8.66667C8.73638 8.66667 9.33333 8.06971 9.33333 7.33333C9.33333 6.59695 8.73638 6 8 6C7.26362 6 6.66667 6.59695 6.66667 7.33333C6.66667 8.06971 7.26362 8.66667 8 8.66667Z"
                          fill="currentColor"
                        />
                        <path
                          d="M8 4C8.73638 4 9.33333 3.40305 9.33333 2.66667C9.33333 1.93029 8.73638 1.33333 8 1.33333C7.26362 1.33333 6.66667 1.93029 6.66667 2.66667C6.66667 3.40305 7.26362 4 8 4Z"
                          fill="currentColor"
                        />
                        <path
                          d="M8 14.6667C8.73638 14.6667 9.33333 14.0697 9.33333 13.3333C9.33333 12.597 8.73638 12 8 12C7.26362 12 6.66667 12.597 6.66667 13.3333C6.66667 14.0697 7.26362 14.6667 8 14.6667Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    {showDropdown === invoice.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate(`/firmadmin/billing/${invoice.id}`);
                              setShowDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => setShowDropdown(null)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
                          >
                            Download Invoice
                          </button>
                          <button
                            onClick={() => setShowDropdown(null)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
