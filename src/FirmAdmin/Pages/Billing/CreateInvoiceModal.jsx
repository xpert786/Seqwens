import React, { useState } from 'react';

export default function CreateInvoiceModal({ onClose }) {
  const [invoiceData, setInvoiceData] = useState({
    clientName: '',
    invoiceNumber: 'INV-2024-005',
    issueDate: '',
    dueDate: ''
  });

  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 0, price: 0 }
  ]);

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = field === 'quantity' || field === 'price' ? Number(value) : value;
    setInvoiceItems(updatedItems);
  };

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 0, price: 0 }]);
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSaveInvoice = () => {
    // Handle invoice saving logic here
    console.log('Invoice saved:', { ...invoiceData, items: invoiceItems, total: calculateTotal() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ml-20 mt-10" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h4 className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Create Invoice</h4>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 text-xl leading-none transition-colors shadow-sm"
          >
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="24" height="24" rx="12" fill="#E8F0FF"/>
<path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66"/>
</svg>

          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Client Name
              </label>
              <input
                type="text"
                value={invoiceData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                placeholder="Enter Client name"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                placeholder="INV-2024-005"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Issue Date
              </label>
              <input
                type="text"
                value={invoiceData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Due Date
              </label>
              <input
                type="text"
                value={invoiceData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                placeholder="mm-dd-yyyyy"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <h6 className="text-lg mb-4 text-[#3B4A66] font-[BasisGrotesquePro]" >Invoice Items</h6>
            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="0"
                    className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                    <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="0"
                    className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="0"
                    className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
              ))}
              <button
                onClick={handleAddItem}
                className="px-4 py-2 text-black !rounded-lg text-sm font-medium !border border-[#E8F0FF]"
               
              >
                + Add item
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <span className="text-lg font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Total:</span>
            <span className="text-lg font-medium font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              ${calculateTotal().toLocaleString()}
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border !rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              style={{ borderColor: '#D1D5DB', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveInvoice}
              className="px-6 py-2 text-white !rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#F97316' }}
            >
              Save Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

