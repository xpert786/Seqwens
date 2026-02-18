export default function PaymentHistoryTab({ paymentHistory }) {
  const getIcon = (iconName) => {
    const icons = {
      credit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  const getStatusBadge = () => {
    return (
      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap inline-flex items-center justify-center min-w-[90px]">
        Completed
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 border border-[#E8F0FF]">
      <div className="mb-8">
        <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Financial History</h6>
        <p className="text-xl sm:text-2xl font-black text-gray-900 font-[BasisGrotesquePro] tracking-tight">Payment Records</p>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#F8FAFC]">
              <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Date</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Amount</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Method</th>
              <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Reference</th>
              <th className="text-center py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Status</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((payment, idx) => (
              <tr key={idx} className="border-b border-[#F8FAFC] group hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4 text-sm font-bold text-gray-700 font-[BasisGrotesquePro]">{payment.date}</td>
                <td className="py-4 px-4 text-sm font-black text-gray-900 font-[BasisGrotesquePro]">${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      {getIcon('credit')}
                    </div>
                    <span className="text-sm font-bold text-gray-700 font-[BasisGrotesquePro]">{payment.method}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm font-medium text-gray-500 font-[BasisGrotesquePro] font-mono">{payment.reference}</td>
                <td className="py-4 px-4 text-center">
                  {getStatusBadge()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Card List) */}
      <div className="md:hidden space-y-4">
        {paymentHistory.map((payment, idx) => (
          <div key={idx} className="p-4 rounded-2xl border border-[#F1F5F9] bg-white space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  {getIcon('credit')}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 font-[BasisGrotesquePro]">${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payment.date}</p>
                </div>
              </div>
              {getStatusBadge()}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F8FAFC]">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Method</p>
                <p className="text-xs font-bold text-gray-700 font-[BasisGrotesquePro]">{payment.method}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference</p>
                <p className="text-xs font-bold text-gray-500 font-mono truncate">{payment.reference}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {paymentHistory.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-400 font-[BasisGrotesquePro]">No payment history available</p>
        </div>
      )}
    </div>
  );
}

