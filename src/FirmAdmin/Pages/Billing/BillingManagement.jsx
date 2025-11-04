import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateInvoiceModal from "./CreateInvoiceModal";

export default function BillingManagement() {
  const navigate = useNavigate();
  const [invoices] = useState([
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      client: "Johnson & Associates LLC",
      amount: 2500,
      status: "paid",
      issueDate: "Feb 1, 2024",
      dueDate: "Mar 1, 2024",
      services: ["Tax Return Preparation", "Quarterly Filing"]
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      client: "Smith Corporation",
      amount: 1800,
      status: "sent",
      issueDate: "Feb 15, 2024",
      dueDate: "Mar 15, 2024",
      services: ["Annual Return Review", "Tax Planning"]
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      client: "Wilson Enterprises",
      amount: 950,
      status: "overdue",
      issueDate: "Jan 20, 2024",
      dueDate: "Feb 20, 2024",
      services: ["Document Review"]
    },
    {
      id: 4,
      invoiceNumber: "INV-2024-004",
      client: "Davis Inc",
      amount: 3200,
      status: "draft",
      issueDate: "Mar 1, 2024",
      dueDate: "Apr 1, 2024",
      services: ["Comprehensive Tax Service", "Business Consultation"]
    }
  ]);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const getStatusBadge = (status) => {
    const configs = {
      paid: { 
        color: "bg-[#22C55E]", 
        text: "Paid",
        iconColor: 'text-green-500',
        icon:<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_2311_1979)">
        <path d="M12.8334 6.46407V7.00073C12.8327 8.25865 12.4254 9.48263 11.6722 10.4901C10.919 11.4976 9.86033 12.2347 8.65404 12.5913C7.44775 12.948 6.15848 12.9052 4.97852 12.4692C3.79856 12.0333 2.79113 11.2276 2.10647 10.1724C1.42182 9.11709 1.09663 7.86877 1.17939 6.61358C1.26216 5.3584 1.74845 4.16359 2.56574 3.20736C3.38304 2.25113 4.48754 1.58471 5.71452 1.30749C6.94151 1.03027 8.22524 1.1571 9.37425 1.66907M5.25008 6.4174L7.00008 8.1674L12.8334 2.33407" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
        <clipPath id="clip0_2311_1979">
        <rect width="14" height="14" fill="white"/>
        </clipPath>
        </defs>
        </svg>
        
      },
      sent: { 
        color: "bg-[#1E40AF]", 
        text: "Sent",
        iconColor: 'text-blue-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8334 1.16797L9.16671 11.6443C9.01711 12.0717 8.42179 12.096 8.23787 11.6822L6.41675 7.58464M12.8334 1.16797L2.35711 4.83468C1.92969 4.98427 1.9054 5.57959 2.31922 5.76351L6.41675 7.58464M12.8334 1.16797L6.41675 7.58464" stroke="#1E40AF" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      },
      overdue: { 
        color: "bg-[#EF4444]", 
        text: "Overdue",
        iconColor: 'text-red-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2312_2064)">
            <path d="M7.00008 4.66797V7.0013M7.00008 9.33464H7.00592M12.8334 7.0013C12.8334 10.223 10.2217 12.8346 7.00008 12.8346C3.77842 12.8346 1.16675 10.223 1.16675 7.0013C1.16675 3.77964 3.77842 1.16797 7.00008 1.16797C10.2217 1.16797 12.8334 3.77964 12.8334 7.0013Z" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_2312_2064">
              <rect width="14" height="14" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      },
      draft: { 
        color: "bg-[#131323]", 
        text: "Draft",
        iconColor: 'text-gray-500',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      }
    };
    
    const config = configs[status] || configs.draft;
    
    return (
      <div className="flex items-center gap-2">
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <span className={`${config.color} text-white px-2 py-0.5 !rounded-[10px] text-xs font-medium whitespace-nowrap`}>
          {config.text}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h4 className="text-3xl font-bold mb-2" style={{ color: '#1F2937' }}>
            Billing & Invoicing
          </h4>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Manage invoices and track payments
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 !rounded-lg !border border-gray-300 bg-white flex items-center gap-2 hover:bg-gray-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2 !rounded-lg flex items-center gap-2 text-white font-medium" 
            style={{ backgroundColor: '#F97316' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Active Staff</h6>
          <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>$2,500</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Pending Payment</h6>
          <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>$1,800</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Overdue Amount</h6>
          <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>$950</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Total Invoices</h6>
          <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>4</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h5 className="text-xl font-bold mb-1" style={{ color: '#1F2937' }}>
            All Invoices ({invoices.length})
          </h5>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Complete list of invoices with payment status and details
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Invoice #</th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Amount</th>
                <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Issue Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Services</th>
                <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                  <td className="py-4 px-4 text-sm font-medium" style={{ color: '#1F2937' }}>
                    {invoice.invoiceNumber}
                  </td>
                  <td className="py-4 px-4 text-sm" style={{ color: '#1F2937' }}>
                    {invoice.client}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium" style={{ color: '#1F2937' }}>
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="py-4 px-4 text-sm" style={{ color: '#6B7280' }}>
                    {invoice.issueDate}
                  </td>
                  <td className="py-4 px-4 text-sm" style={{ color: '#6B7280' }}>
                    {invoice.dueDate}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {invoice.services.map((service, idx) => (
                        <span key={idx} className="px-2 py-1 !rounded-full text-xs font-medium" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                          {service}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === invoice.id ? null : invoice.id)}
                        className="p-2 hover:bg-gray-100 !rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                      {openDropdown === invoice.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10" style={{ borderColor: '#E5E7EB' }}>
                          <button 
                            onClick={() => navigate(`/firmadmin/billing/${invoice.id}`)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition rounded-t-lg" 
                            style={{ color: '#3B82F6' }}
                          >
                            View Details
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition rounded-b-lg" style={{ color: '#EF4444' }}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal 
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

