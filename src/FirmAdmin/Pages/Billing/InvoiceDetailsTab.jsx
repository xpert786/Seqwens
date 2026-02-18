import { SmIcon } from "../../Components/icons";
export default function InvoiceDetailsTab({ invoiceData }) {
  const getIcon = (iconName) => {
    const icons = {
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      building: (
        <SmIcon />
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
      <span className={`${config.color} text-white px-3 py-1 rounded-full inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest min-w-[90px]`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
      {/* Left: Invoice Items */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 border border-[#E8F0FF] flex flex-col">
        <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-6 font-[BasisGrotesquePro]">Invoice Items</h6>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#F8FAFC]">
                <th className="text-left py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Description</th>
                <th className="text-right py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items && invoiceData.items.length > 0 ? (
                invoiceData.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#F8FAFC] group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-2 sm:px-4 text-sm font-bold text-gray-700 font-[BasisGrotesquePro]">{item.description}</td>
                    <td className="py-4 px-2 sm:px-4 text-right text-sm font-black text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">${item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="py-8 px-4 text-center text-sm text-gray-400 font-[BasisGrotesquePro]">No items listed in this invoice</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50/50">
              <tr className="border-t border-[#E2E8F0]">
                <td className="py-3 px-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Subtotal</td>
                <td className="py-3 px-4 text-right text-sm font-bold text-gray-700 font-[BasisGrotesquePro]">${invoiceData.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
              </tr>
              {invoiceData.tax > 0 && (
                <tr className="border-t border-[#F1F5F9]">
                  <td className="py-3 px-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Tax</td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-700 font-[BasisGrotesquePro]">${invoiceData.tax?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                </tr>
              )}
              <tr className="border-t-2 border-[#E2E8F0]">
                <td className="py-5 px-4 text-right text-sm font-black text-gray-900 uppercase tracking-widest font-[BasisGrotesquePro]">Total Amount</td>
                <td className="py-5 px-4 text-right text-xl font-black text-gray-900 font-[BasisGrotesquePro]">${invoiceData.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Right: Client Info & Invoice Details */}
      <div className="space-y-4 sm:space-y-6">
        {/* Client Information */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 border border-[#E8F0FF]">
          <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-6 font-[BasisGrotesquePro]">Client Information</h6>
          <div className="space-y-5">
            <div>
              <p className="text-xl sm:text-2xl font-black text-gray-900 font-[BasisGrotesquePro] leading-tight">{invoiceData.clientInfo.name}</p>
              {invoiceData.clientInfo.company && <p className="text-sm font-bold text-gray-500 mt-1 font-[BasisGrotesquePro]">{invoiceData.clientInfo.company}</p>}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#F8FAFC]">
              {invoiceData.clientInfo.address && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    {getIcon('location')}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Billing Address</p>
                    <p className="text-sm sm:text-base font-bold text-gray-700 font-[BasisGrotesquePro] leading-relaxed">{invoiceData.clientInfo.address}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {invoiceData.clientInfo.email && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                      {getIcon('email')}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="text-sm font-bold text-gray-700 font-[BasisGrotesquePro] break-all">{invoiceData.clientInfo.email}</p>
                    </div>
                  </div>
                )}

                {invoiceData.clientInfo.phone && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                      {getIcon('phone')}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Phone</p>
                      <p className="text-sm font-bold text-gray-700 font-[BasisGrotesquePro]">{invoiceData.clientInfo.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 border border-[#E8F0FF]">
          <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-6 font-[BasisGrotesquePro]">Invoice Details</h6>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#F8FAFC]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Invoice Number</p>
              <p className="text-sm sm:text-base font-black text-gray-900 font-[BasisGrotesquePro]">{invoiceData.invoiceDetails.invoiceNumber}</p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#F8FAFC]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Created By</p>
              <p className="text-sm sm:text-base font-bold text-gray-700 font-[BasisGrotesquePro]">{invoiceData.invoiceDetails.assignedTo}</p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#F8FAFC]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Firm Provider</p>
              <p className="text-sm sm:text-base font-bold text-gray-700 font-[BasisGrotesquePro]">{invoiceData.rawData?.firm_name || 'N/A'}</p>
            </div>

            {/* Payment Summary */}
            <div className="py-4 bg-gray-50/50 rounded-xl px-4 mt-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Payment Status</p>
                {getStatusBadge(invoiceData.invoiceDetails.status.toLowerCase(), invoiceData.statusColor)}
              </div>
              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid Amount</p>
                  <p className="text-lg font-black text-green-500 font-[BasisGrotesquePro]">
                    {invoiceData.formattedPaidAmount || `$${invoiceData.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Balance Due</p>
                  <p className={`text-lg font-black font-[BasisGrotesquePro] ${invoiceData.remainingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ${invoiceData.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {invoiceData.rawData?.notes && (
              <div className="pt-4 mt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 font-[BasisGrotesquePro]">Internal Notes</p>
                <div className="p-3 bg-yellow-50/50 border border-yellow-100/50 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 font-[BasisGrotesquePro] leading-relaxed italic">"{invoiceData.rawData.notes}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
