import React from 'react';

export default function GeneralTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Firm Information Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Firm Information
          </h3>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Basic information about your firm
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Firm Name
              </label>
              <input
                type="text"
                defaultValue="Tax Practice Pro"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55]  focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Legal Name
              </label>
              <input
                type="text"
                defaultValue="Tax Practice Pro LLC"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              EIN (Tax ID)
            </label>
            <input
              type="text"
              defaultValue="12-3456789"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Description
            </label>
            <textarea
              rows={3}
              defaultValue="Professional tax preparation and accounting services for individuals and businesses."
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Contact Information
          </h3>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            How clients can reach your firm
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Street Address
            </label>
            <input
              type="text"
              defaultValue="123 Main Street, Suite 100"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                City
              </label>
              <input
                type="text"
                defaultValue="New York"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                State
              </label>
              <input
                type="text"
                defaultValue="New York"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                defaultValue="1001"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Phone
              </label>
              <input
                type="text"
                defaultValue="(555) 123-4567"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue="info@taxpracticepro.com"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Website
            </label>
            <input
              type="url"
              defaultValue="www.taxpracticepro.com"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

