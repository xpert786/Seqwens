import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentUpload, DocumentBrowseFolder, DocumentMoreIcon } from '../../Components/icons';

// Search icon
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Chevron down icon
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// File icon (light blue)
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.83333 2.5H11.6667L15 5.83333V15.8333C15 16.2754 14.8244 16.6993 14.5118 17.0118C14.1993 17.3244 13.7754 17.5 13.3333 17.5H5.83333C5.39131 17.5 4.96738 17.3244 4.65482 17.0118C4.34226 16.6993 4.16667 16.2754 4.16667 15.8333V4.16667C4.16667 3.72464 4.34226 3.30072 4.65482 2.98816C4.96738 2.67559 5.39131 2.5 5.83333 2.5Z" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.6667 2.5V5.83333H15" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FolderContents() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [openActionsMenu, setOpenActionsMenu] = useState(null);

  // Folder names mapping
  const folderNames = {
    '1': 'Client Documents',
    '2': 'Firm Compliance',
    '3': 'Training Materials',
    '4': 'Tax Returns',
    '5': 'Receipts & Expenses'
  };

  const folderName = folderNames[folderId] || 'Folder';
  console.log(folderId);
  console.log(folderName);

  // Debug: Log folderId to verify it's being received
  useEffect(() => {
    console.log('FolderContents - Received folderId:', folderId);
    console.log('FolderContents - Folder Name:', folderName);
  }, [folderId, folderName]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu-container')) {
        setOpenActionsMenu(null);
      }
    };

    if (openActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionsMenu]);

  // Sample documents - same static data for all folders (can be made folder-specific later)
  const documents = [
    {
      id: 1,
      name: '2023_Tax_Return_Johnson_LLC.Pdf',
      type: 'PDF',
      client: 'Johnson & Associates LLC',
      category: 'Tax Returns',
      uploadedBy: 'Michael Chen',
      uploadDate: 'Mar 1, 2024',
      status: 'Approved',
      statusColor: 'bg-green-500',
      textColor: 'text-white',
      size: '2.4 MB'
    },
    {
      id: 2,
      name: 'W2_Smith_Corp_2023.Pdf',
      type: 'PDF',
      client: 'Smith Corporation',
      category: 'W-2 Forms',
      uploadedBy: 'Sarah Martinez',
      uploadDate: 'Feb 28, 2024',
      status: 'Reviewed',
      statusColor: 'bg-amber-700',
      textColor: 'text-white',
      size: '1.2 MB'
    },
    {
      id: 3,
      name: 'Receipt_Office_Supplies.Jpg',
      type: 'IMAGE',
      client: 'Wilson Enterprises',
      category: 'Receipts',
      uploadedBy: 'David Rodriguez',
      uploadDate: 'Feb 25, 2024',
      status: 'Pending',
      statusColor: 'bg-amber-400',
      textColor: 'text-gray-900',
      size: '856 KB'
    },
    {
      id: 4,
      name: '1099_Davis_Inc_2023.Pdf',
      type: 'PDF',
      client: 'Davis Inc',
      category: '1099 Forms',
      uploadedBy: 'Lisa Thompson',
      uploadDate: 'Feb 20, 2024',
      status: 'Approved',
      statusColor: 'bg-green-500',
      textColor: 'text-white',
      size: '945 KB'
    }
  ];

  const toggleActionsMenu = (id) => {
    setOpenActionsMenu(openActionsMenu === id ? null : id);
  };

  return (
    <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Document Management
            </h1>
            <p className="text-gray-600 text-base" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Manage all firm documents and client files
            </p>
            <p className="text-sm text-blue-600 mt-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Current Folder: {folderName} (ID: {folderId})
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
              <DocumentBrowseFolder />
              <span>Browse Folders</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
              <DocumentUpload />
              <span>Upload Documents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Total Documents</p>
          <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>4</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Pending Review</p>
          <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>1</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Approved</p>
          <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>2</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>IRS Required</p>
          <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>2</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Total Storage</p>
          <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>5.4 MB</p>
        </div>
      </div>

      {/* Document List Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
            All Documents (4)
          </h2>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Complete list of documents with review status and metadata
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search documents by name, client, or uploader..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ fontFamily: 'BasisGrotesquePro' }}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'All Categories' ? null : 'All Categories')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              style={{ fontFamily: 'BasisGrotesquePro' }}
            >
              <span>{selectedCategory}</span>
              <ChevronDown />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'All Status' ? null : 'All Status')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              style={{ fontFamily: 'BasisGrotesquePro' }}
            >
              <span>{selectedStatus}</span>
              <ChevronDown />
            </button>
          </div>
        </div>

        {/* Document Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Document</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Client</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Uploaded By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Upload Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Size</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.id} className={`border-b border-gray-100 ${index < documents.length - 1 ? '' : ''}`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <FileIcon />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.name}</p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.client}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.uploadedBy}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.uploadDate}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${doc.statusColor} ${doc.textColor}`} style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.size}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative actions-menu-container">
                      <button
                        onClick={() => toggleActionsMenu(doc.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                      >
                        <DocumentMoreIcon />
                      </button>
                      {openActionsMenu === doc.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                          <button 
                            onClick={() => setOpenActionsMenu(null)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" 
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => setOpenActionsMenu(null)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" 
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            Download
                          </button>
                          <button 
                            onClick={() => setOpenActionsMenu(null)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50" 
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
