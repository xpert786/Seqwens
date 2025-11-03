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
      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
        Completed
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h6 className="text-lg font-bold mb-2 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Payment History</h6>
      <p className="text-sm mb-6 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>All payments received for this invoice</p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
              <th className="text-left py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Date</th>
              <th className="text-left py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Method</th>
              <th className="text-left py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Reference</th>
              <th className="text-center py-3 px-4 text-sm font-medium font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((payment, idx) => (
              <tr key={idx} className="border-b" style={{ borderColor: '#F3F4F6' }}>
                <td className="py-4 px-4 text-sm font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{payment.date}</td>
                <td className="py-4 px-4 text-sm font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>${payment.amount.toLocaleString()}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div style={{ color: '#3AD6F2' }}>
                      {getIcon('credit')}
                    </div>
                    <span className="text-sm font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{payment.method}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{payment.reference}</td>
                <td className="py-4 px-4 text-center">
                  {getStatusBadge()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

