import React from 'react';

export default function BillingTab({ client }) {
  const invoices = [
    {
      id: 'INV-001',
      description: 'Tax Preparation 2024',
      amount: '$750',
      date: '01-03-2025',
      dueDate: '15-03-2025',
      status: 'Paid',
      statusColor: 'bg-[#22C55E] text-white'
    },
    {
      id: 'INV-002',
      description: 'Quarterly Business Review',
      amount: '$300',
      date: '01-02-2025',
      dueDate: '15-02-2025',
      status: 'Paid',
      statusColor: 'bg-[#22C55E] text-white'
    },
    {
      id: 'INV-003',
      description: 'Amendment Filing',
      amount: '$200',
      date: '15-07-2025',
      dueDate: '15-08-2025',
      status: 'Overdue',
      statusColor: 'bg-[#EF4444] text-white'
    }
  ];

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Billing History</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">All invoices and payments for this client</p>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-7 gap-4 pb-4 mb-4 border-b border-gray-200 font-[BasisGrotesquePro]">
        <div className="text-sm  text-[#4B5563]">Invoice ID</div>
        <div className="text-sm  text-[#4B5563]">Description</div>
        <div className="text-sm  text-[#4B5563]">Amount</div>
        <div className="text-sm  text-[#4B5563]">Date</div>
        <div className="text-sm  text-[#4B5563]">Due Date</div>
        <div className="text-sm  text-[#4B5563]">Status</div>
        <div className="text-sm  text-[#4B5563] text-center">Action</div>
      </div>

      {/* Invoice Rows */}
      <div className="space-y-3">
        {invoices.map((invoice, index) => (
          <div
            key={invoice.id}
            className="grid grid-cols-7 gap-4 items-center bg-white !rounded-lg p-4 !border border-[#E8F0FF] font-[BasisGrotesquePro]"
          >
            <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
            <div className="text-sm text-gray-900">{invoice.description}</div>
            <div className="text-sm font-medium text-gray-900">{invoice.amount}</div>
            <div className="text-sm text-gray-900">{invoice.date}</div>
            <div className="text-sm text-gray-900">{invoice.dueDate}</div>
            <div>
              <span className={`px-3 py-1 text-xs font-medium !rounded-[20px] ${invoice.statusColor} font-[BasisGrotesquePro]`}>
                {invoice.status}
              </span>
            </div>
            <div className="flex justify-center">
              <button className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
