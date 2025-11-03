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
            ×
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

