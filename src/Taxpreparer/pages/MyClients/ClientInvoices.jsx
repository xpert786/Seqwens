import React from "react";
import { useNavigate } from "react-router-dom";
import { File } from "../../component/icons";

export default function ClientInvoices() {
  const navigate = useNavigate();
  
  const invoices = [
    {
      id: 1,
      title: "March 2024 - Tax Preparation",
      client: "John Doe",
      amount: 1200,
      dueDate: "04/15/2024",
      status: "Paid"
    },
    {
      id: 2,
      title: "Q1 2024 - Business Consulting",
      client: "ABC Corp",
      amount: 3500,
      dueDate: "04/30/2024",
      status: "Pending"
    },
    {
      id: 3,
      title: "February 2024 - Tax Preparation",
      client: "Sarah Wilson",
      amount: 950,
      dueDate: "03/15/2024",
      status: "Overdue"
    },
    {
      id: 4,
      title: "Annual Tax Planning",
      client: "Mike Johnson",
      amount: 2500,
      dueDate: "05/01/2024",
      status: "Draft"
    }
  ];

  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>Client Invoices</h3>
            <p className="text-sm text-gray-500">Manage and track client invoices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((invoice, idx) => (
            <div
              key={invoice.id}
              className="document-card rounded-xl p-4 flex flex-col justify-between"
              style={{
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                cursor: "pointer"
              }}
              onClick={() => {
                // Navigate to invoice detail view
                navigate(`/taxdashboard/invoices/${invoice.id}`);
              }}
            >
              {/* Header row: title and status */}
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800">{invoice.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              
              {/* Client info */}
              <div className="text-gray-500 text-sm mb-2">{invoice.client}</div>
              
              {/* Amount and due date */}
              <div className="flex items-center justify-between text-gray-700 text-sm mt-2">
                <div className="font-medium">${invoice.amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Due: {invoice.dueDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
