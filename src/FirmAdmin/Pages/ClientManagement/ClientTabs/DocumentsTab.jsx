import React, { useState } from 'react';

export default function DocumentsTab({ client }) {
  const [selectedCard, setSelectedCard] = useState(1); // Default to first card

  const documents = [
    {
      id: 1,
      title: 'Tax Year 2023',
      description: 'All documents related to 2023 tax year',
      count: 2,
      lastModified: '12/03/2025',
      isTemplate: true
    },
    {
      id: 2,
      title: 'Tax Year 2022',
      description: 'Archived documents from 2022 tax year',
      count: 5,
      lastModified: '15/11/2024',
      isTemplate: true
    },
    {
      id: 3,
      title: 'Business Expenses',
      description: 'Business-related receipts and documentation',
      count: 12,
      lastModified: '20/01/2025',
      isTemplate: true
    },
    {
      id: 4,
      title: 'Investment Documents',
      description: 'Investment statements and tax forms',
      count: 8,
      lastModified: '10/02/2025',
      isTemplate: true
    },
    {
      id: 5,
      title: 'Banking',
      description: 'Bank statements and financial records',
      count: 15,
      lastModified: '05/03/2025',
      isTemplate: true
    },
    {
      id: 6,
      title: 'Medical',
      description: 'Medical expenses and insurance documents',
      count: 6,
      lastModified: '18/02/2025',
      isTemplate: true
    }
  ];

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Documents</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Client documents and supporting materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => {
          const isSelected = selectedCard === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => setSelectedCard(doc.id)}
              className={`!rounded-lg p-6 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#FFF4E6] !border border-[#F49C2D]'
                  : 'bg-white !border border-[#E8F0FF]'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {/* Folder Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12.7071 7.70711C12.8946 7.89464 13.149 8 13.4142 8H19C20.1046 8 21 8.89543 21 10V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                    fill="#FBBF24"
                    stroke="#FBBF24"
                    strokeWidth="1.5"
                  />
                </svg>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-nowrap">
                    <h6 className="text-base font-bold text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">{doc.title}</h6>
                    {doc.isTemplate && (
                      <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-[#FFFFFF] !border border-[#E8F0FF] !rounded-lg font-[BasisGrotesquePro] whitespace-nowrap flex-shrink-0">
                        Template
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{doc.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">{doc.count} Documents</span>
                <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">Last: {doc.lastModified}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
