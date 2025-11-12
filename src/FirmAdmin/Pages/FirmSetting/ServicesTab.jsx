import React, { useState } from 'react';

const services = [
  { id: 1, name: 'Individual Tax Returns', price: 250, active: true },
  { id: 2, name: 'Business Tax Returns', price: 500, active: true },
  { id: 3, name: 'Tax Planning', price: 150, active: true },
  { id: 4, name: 'Bookkeeping', price: 100, active: true },
  { id: 5, name: 'Payroll Services', price: 75, active: false },
  { id: 6, name: 'Audit Support', price: 200, active: true }
];

export default function ServicesTab() {
  const [serviceStates, setServiceStates] = useState(
    services.reduce((acc, service) => {
      acc[service.id] = service.active;
      return acc;
    }, {})
  );

  const toggleService = (id) => {
    setServiceStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Service Pricing Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Service Pricing
          </h5>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Manage your firm's services and pricing
          </p>
        </div>

        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 !border border-[#E8F0FF] rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={serviceStates[service.id]}
                    onChange={() => toggleService(service.id)}
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                    serviceStates[service.id] ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      serviceStates[service.id] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </label>
                <div className="flex-1">
                  <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                    {service.name}
                  </h6>
                  <p className="text-[16px] text-[#4B5563] font-[BasisGrotesquePro]">
                    {serviceStates[service.id] ? 'Active service' : 'Inactive service'}
                  </p>
                </div>
                <div className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                  ${service.price}<br />Base price
                </div>
                <button className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Default Late Fee ($)
            </label>
            <select className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro] cursor-pointer">
              <option>25</option>
              <option>50</option>
              <option>75</option>
              <option>100</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Interest Rate (%)
            </label>
            <input
              type="number"
              defaultValue="1.5"
              step="0.1"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55]  focus:outline-none font-[BasisGrotesquePro]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Payment Terms
            </label>
            <select className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55]  focus:outline-none font-[BasisGrotesquePro] cursor-pointer">
              <option>Net 30</option>
              <option>Net 15</option>
              <option>Net 45</option>
              <option>Net 60</option>
              <option>Due on Receipt</option>
            </select>
          </div>
        </div>
      </div>

      
    </div>
  );
}

