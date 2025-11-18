import React, { useState } from "react";

const billingOffices = ["Downtown Office", "Uptown Branch", "Brooklyn Office"];
const splitMethods = ["Percentage-based", "Usage-based", "Flat fee"];

const EnterpriseConsolidatedBilling = () => {
  const [primaryBillingOffice, setPrimaryBillingOffice] = useState(billingOffices[0]);
  const [costSplitMethod, setCostSplitMethod] = useState(splitMethods[0]);

  // ✅ toggle button states
  const [isConsolidated, setIsConsolidated] = useState(true);
  const [autoAllocate, setAutoAllocate] = useState(true);
  const [invoiceConsolidation, setInvoiceConsolidation] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
          Consolidated Billing
        </h3>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
          Manage billing across multiple office locations.
        </p>
      </div>

      {/* Toggle 1 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
            Enable Consolidated Billing
          </h4>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
            Enable consolidated billing for enterprise offices.
          </p>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isConsolidated}
            onChange={() => setIsConsolidated(!isConsolidated)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-[#F56D2D] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F56D2D]/30">
            <span
              className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isConsolidated ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </div>
        </label>
      </div>

      <div className="rounded-lg border border-[#E8F0FF] bg-white p-4 sm:p-6 space-y-6">
        <div className="rounded-lg border border-[#E8F0FF] bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                Primary Billing Office
              </p>
              <div className="relative">
                <select
                  value={primaryBillingOffice}
                  onChange={(e) => setPrimaryBillingOffice(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#E8F0FF] bg-white px-4 py-2.5 text-sm text-[#1E293B] font-[BasisGrotesquePro] focus:outline-none"
                >
                  {billingOffices.map((office) => (
                    <option key={office} value={office}>
                      {office}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="#97A6BA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                Cost Split Method
              </p>
              <div className="relative">
                <select
                  value={costSplitMethod}
                  onChange={(e) => setCostSplitMethod(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#E8F0FF] bg-white px-4 py-2.5 text-sm text-[#1E293B] font-[BasisGrotesquePro] focus:outline-none"
                >
                  {splitMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="#97A6BA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle 2 */}
        <div className="flex items-start justify-between px-4 py-4 sm:px-5">
          <div>
            <h4 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
              Auto-Allocate Costs
            </h4>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Automatically distribute costs based on selected method.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={autoAllocate}
              onChange={() => setAutoAllocate(!autoAllocate)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-[#F56D2D] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F56D2D]/30">
              <span
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoAllocate ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>

        {/* Toggle 3 */}
        <div className="flex items-start justify-between px-4 py-2 sm:px-5">
          <div>
            <h4 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
              Invoice Consolidation
            </h4>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Combine all charges into a single monthly invoice.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={invoiceConsolidation}
              onChange={() => setInvoiceConsolidation(!invoiceConsolidation)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-[#F56D2D] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F56D2D]/30">
              <span
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  invoiceConsolidation ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>

        <div>
          <button className="!rounded-lg bg-[#F56D2D] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#EA580C] font-[BasisGrotesquePro]">
            Save Billing Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseConsolidatedBilling;
