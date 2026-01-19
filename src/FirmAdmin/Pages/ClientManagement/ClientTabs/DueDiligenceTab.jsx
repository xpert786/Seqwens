import React, { useState } from 'react';

export default function DueDiligenceTab({ client }) {
  const [checkedItems, setCheckedItems] = useState({
    1: true,
    2: false,
    3: true,
    4: false,
    5: false,
    6: true,
    7: true,
    8: false,
    9: true,
    10: true
  });

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const checklist = [
    {
      section: 'General (Applies To All Returns With EIC, CTC, ACTC/ODC, AOTC)',
      items: [
        {
          id: 1,
          title: 'Complete And File Form 8867 With Each Return.',
          description: 'Form 8867 must be completed and filed with every return claiming EIC, CTC/ACTC/ODC, or AOTC.',
          required: true,
          checked: true
        },
        {
          id: 2,
          title: 'Retain A Signed Preparer Declaration.',
          description: 'Keep a signed declaration from the preparer for compliance purposes.',
          required: true,
          checked: false
        }
      ]
    },
    {
      section: 'Earned Income Credit (EIC)',
      items: [
        {
          id: 3,
          title: 'Confirm Qualifying Child Tests (Age, Relationship, Residency, SSN).',
          description: 'Verify all qualifying child tests are met for EIC eligibility.',
          required: true,
          checked: true
        },
        {
          id: 4,
          title: 'Verify Child\'s Residency > 6 Months (School, Medical, Or Childcare Records)',
          description: 'Confirm child has lived with taxpayer for more than 6 months using supporting documentation.',
          required: true,
          checked: false
        }
      ]
    },
    {
      section: 'Child Tax Credit (CTC / ACTC / ODC)',
      items: [
        {
          id: 5,
          title: 'Verify Dependent Meets Qualifying Child/Other Dependent Rules',
          description: 'Ensure dependent meets all requirements for CTC/ACTC/ODC.',
          required: true,
          checked: false
        },
        {
          id: 6,
          title: 'Confirm Child Has Valid SSN / ITIN (Tax ID) As Required.',
          description: 'Verify child has a valid SSN / ITIN (Tax ID) as required.',
          required: true,
          checked: true
        }
      ]
    },
    {
      section: 'American Opportunity Tax Credit (AOTC)',
      items: [
        {
          id: 7,
          title: 'Retain Form 1098-T And Other Tuition Payment Documentation',
          description: 'Keep all forms and documentation related to tuition payments.',
          required: true,
          checked: true
        },
        {
          id: 8,
          title: 'Check Income Phaseouts',
          description: 'Verify income is within phaseout limits for AOTC eligibility.',
          required: true,
          checked: false
        }
      ]
    },
    {
      section: 'Documentation & Retention',
      items: [
        {
          id: 9,
          title: 'Keep Copies Of Signed E-Signatures (Digital Audit Trail + IP/Date/Time).',
          description: 'Maintain digital records of all e-signatures with IP addresses and timestamps.',
          required: true,
          checked: true
        },
        {
          id: 10,
          title: 'Maintain Proof Of ID Verification (Copy of ID, Verified Log, Or KBA Record)',
          description: 'Keep records of identity verification including ID copies and verification logs.',
          required: true,
          checked: true
        }
      ]
    }
  ];

  const summary = {
    overallCompletion: 85,
    requiredItems: '12/15',
    pendingItems: 3,
    optionalItems: '5/7'
  };

  return (
    <>
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
        <div className="mb-6">
          <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">IRS Due Diligence & Compliance Checklist</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Complete due diligence requirements for tax preparation and compliance</p>
        </div>

        <div className="space-y-6">
          {checklist.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h6 className="text-base font-bold text-gray-900 font-[BasisGrotesquePro] mb-4">{section.section}</h6>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 bg-white !rounded-lg !border border-[#E8F0FF]"
                  >
                    <div
                      onClick={() => toggleCheck(item.id)}
                      className="mt-0.5 cursor-pointer flex-shrink-0"
                    >
                      {checkedItems[item.id] ? (
                        <div className="w-5 h-5 border-2 border-[#3AD6F2] bg-white rounded flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="#3AD6F2"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 bg-white rounded"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1 mb-1 flex-nowrap">
                        <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">{item.title}</p>
                        {item.required && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-[#EF4444] text-white !rounded-[20px] font-[BasisGrotesquePro] whitespace-nowrap flex-shrink-0 -mt-0.5">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section - Separate Box */}
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF] mt-6">
        <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-4">Due Diligence Summary</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#F0FDF4] !border border-[#BBF7D0] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro] mb-1">{summary.overallCompletion}%</div>
            <div className="text-xs text-green-600 font-[BasisGrotesquePro]">Overall Completion</div>
          </div>
          <div className="bg-[#E8F0FF] !border border-[#E8F0FF] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro] mb-1">{summary.requiredItems}</div>
            <div className="text-xs text-blue-600 font-[BasisGrotesquePro]">Required Items</div>
          </div>
          <div className="bg-[#FEFCE8] !border border-[#FEF08A] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#CA8A04] font-[BasisGrotesquePro] mb-1">{summary.pendingItems}</div>
            <div className="text-xs !text-[#854D0E] font-[BasisGrotesquePro]">Pending Items</div>
          </div>
          <div className="bg-[#D9D9D9] !border border-[#969696] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-700 font-[BasisGrotesquePro] mb-1">{summary.optionalItems}</div>
            <div className="text-xs text-gray-600 font-[BasisGrotesquePro]">Optional items</div>
          </div>
        </div>
      </div>
    </>
  );
}
