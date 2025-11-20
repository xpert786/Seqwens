import {SmIcon} from "../../Components/icons";
export default function InvoiceDetailsTab({ invoiceData }) {
  const getIcon = (iconName) => {
    const icons = {
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      building: (
       <SmIcon/>
      ),
      location: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      email: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      phone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  const getStatusBadge = (status, statusColor) => {
    const statusLower = (status || '').toLowerCase();
    // Use API status_color if available, otherwise fallback to default colors
    const colorMap = {
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      gray: 'bg-gray-500'
    };
    
    const configs = {
      paid: { color: statusColor === 'green' ? colorMap.green : 'bg-green-500', text: 'Paid' },
      sent: { color: statusColor === 'blue' ? colorMap.blue : 'bg-blue-500', text: 'Sent' },
      overdue: { color: statusColor === 'red' ? colorMap.red : 'bg-red-500', text: 'Overdue' },
      draft: { color: statusColor === 'gray' ? colorMap.gray : 'bg-gray-500', text: 'Draft' },
      pending: { color: statusColor === 'yellow' ? colorMap.yellow : 'bg-yellow-500', text: 'Pending' },
      partial: { color: statusColor === 'orange' ? colorMap.orange : 'bg-orange-500', text: 'Partially Paid' },
      cancelled: { color: statusColor === 'gray' ? colorMap.gray : 'bg-gray-500', text: 'Cancelled' }
    };
    
    const config = configs[statusLower] || { color: colorMap[statusColor] || 'bg-gray-500', text: status };
    return (
      <span className={`${config.color} text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Invoice Items */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h6 className="text-lg font-bold mb-4 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Invoice Items</h6>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="text-left py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Description</th>
                <th className="text-right py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items && invoiceData.items.length > 0 ? (
                invoiceData.items.map((item, idx) => (
                  <tr key={idx} className="border-b" style={{ borderColor: '#F3F4F6' }}>
                    <td className="py-4 px-4 text-sm font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{item.description}</td>
                    <td className="py-4 px-4 text-right text-sm font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>${item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="py-4 px-4 text-center text-sm text-gray-500 font-[BasisGrotesquePro]">No items found</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: '#E5E7EB' }}>
                <td className="py-4 px-4 text-left text-sm font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Subtotal:</td>
                <td className="py-4 px-4 text-right text-sm font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>${invoiceData.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
              </tr>
              {invoiceData.tax > 0 && (
                <tr className="border-t" style={{ borderColor: '#E5E7EB' }}>
                  <td className="py-4 px-4 text-left text-sm font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Tax:</td>
                  <td className="py-4 px-4 text-right text-sm font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>${invoiceData.tax?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                </tr>
              )}
              <tr>
                <td className="py-4 px-4 text-left text-lg font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Total:</td>
                <td className="py-4 px-4 text-right text-lg font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>${invoiceData.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Right: Client Info & Invoice Details */}
      <div className="space-y-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h6 className="text-lg font-bold mb-4 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Client Information</h6>
          <div className="space-y-3">
            <p className="text-lg font-bold font-[BasisGrotesquePro] mb-3" style={{ color: '#1F2937' }}>{invoiceData.clientInfo.name}</p>
            {invoiceData.clientInfo.address && (
              <div className="flex items-center gap-3">
                <div style={{ color: '#3AD6F2' }}>
                  {getIcon('location')}
                </div>
                <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.clientInfo.address}</p>
              </div>
            )}
            {invoiceData.clientInfo.email && (
              <div className="flex items-center gap-3">
                <div style={{ color: '#3AD6F2' }}>
                  {getIcon('email')}
                </div>
                <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.clientInfo.email}</p>
              </div>
            )}
            {invoiceData.clientInfo.phone && (
              <div className="flex items-center gap-3">
                <div style={{ color: '#3AD6F2' }}>
                  {getIcon('phone')}
                </div>
                <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.clientInfo.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h6 className="text-lg font-bold mb-4 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Invoice Details</h6>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Invoice Number:</p>
              <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.invoiceDetails.invoiceNumber}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Assigned To:</p>
              <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.invoiceDetails.assignedTo}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Firm:</p>
              <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.rawData?.firm_name || 'N/A'}</p>
            </div>
            {/* Partial Payment Information */}
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Partial Payment:</p>
              <div className="text-right">
                {invoiceData.paidAmount > 0 ? (
                  <>
                    <p className="text-base font-bold font-[BasisGrotesquePro]" style={{ color: '#10B981' }}>
                      Paid: {invoiceData.formattedPaidAmount || `$${invoiceData.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                    {invoiceData.remainingAmount > 0 && (
                      <p className="text-sm font-[BasisGrotesquePro]" style={{ color: '#EF4444' }}>
                        Remaining: ${invoiceData.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-base font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>No payment received</p>
                )}
              </div>
            </div>
            {invoiceData.rawData?.notes && (
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Notes:</p>
                <p className="text-base font-[BasisGrotesquePro] text-right flex-1 ml-4" style={{ color: '#1F2937' }}>{invoiceData.rawData.notes}</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Status:</p>
              {getStatusBadge(invoiceData.invoiceDetails.status.toLowerCase(), invoiceData.statusColor)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

