import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { DocumentUpload, DocumentBrowseFolder, DocumentDownload, DocumentMoreIcon} from '../Components/icons';

// Search icon
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function DocumentManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Folder');
  const [openActionsMenu, setOpenActionsMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if we're in a nested route (folder contents)
  const isNestedRoute = location.pathname.includes('/folder/');
  const isViewingDocument = location.pathname.includes('/document/');

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

  const folders = [
    {
      id: 1,
      name: 'Client Documents',
      description: 'Personal Documents, IDs, And Client-Specific File',
      documentCount: 136,
      modified: 'Modified 2 hours ago',
      date: '03/06/2004',
      badges: ['System', 'Admin']
    },
    {
      id: 2,
      name: 'Firm Compliance',
      description: 'Regulatory Documents, Licenses, And Compliance Materials',
      documentCount: 55,
      modified: 'Modified 1 hours ago',
      date: '03/06/2004',
      badges: ['System', 'Admin']
    },
    {
      id: 3,
      name: 'Training Materials',
      description: 'Educational Content, Guides And Training Resources',
      documentCount: 30,
      modified: 'Modified 3 hours ago',
      date: '03/06/2004',
      badges: ['System', 'Admin']
    },
    {
      id: 4,
      name: 'Tax Returns',
      description: 'Completed Tax Returns And Related Forms',
      documentCount: 256,
      modified: 'Modified 2 hours ago',
      date: '03/06/2004',
      badges: ['System', 'Admin']
    },
    {
      id: 5,
      name: 'Receipts & Expenses',
      description: 'Business Receipts, Expense Reports, And Deductible Items',
      documentCount: 456,
      modified: 'Modified 0.30 hours ago',
      date: '03/06/2004',
      badges: ['System', 'Admin']
    }
  ];

  const handleFolderClick = (folderId) => {
    navigate(`folder/${folderId}`);
  };

  const toggleActionsMenu = (folderId, event) => {
    event.stopPropagation();
    setOpenActionsMenu(openActionsMenu === folderId ? null : folderId);
  };

  const handleOpenFolder = (folderId) => {
    setOpenActionsMenu(null);
    handleFolderClick(folderId);
  };

  // Filter folders based on search
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
      {/* Header Section */}
      {!isViewingDocument && (
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Document {isNestedRoute ? 'Management' : 'Center'}
            </h1>
            <p className="text-gray-600 text-base" style={{ fontFamily: 'BasisGrotesquePro' }}>
             {isNestedRoute ? 'Manage all firm documents and client files' : 'Comprehensive document management with OCR, auto-tagging, AI-powered search, and compliance tracking'}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium rounded-lg" style={{ fontFamily: 'BasisGrotesquePro',borderRadius: '10px' }}>
              <DocumentBrowseFolder />
              <span>Browse Folders</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro',borderRadius: '10px' }}>
              <DocumentUpload />
              <span>Upload Documents</span>
            </button>
          </div>
        </div>
      </div>
      )}
    

      {/* Navigation Tabs - Show tabs when NOT in nested route */}
      {!isNestedRoute && (
        <div className="mb-6">
          <div className="flex gap-1 bg-white rounded-lg p-1 w-fit border border-blue-50">
            <button
              onClick={() => setActiveTab('Folder')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'Folder'
                  ? 'text-white bg-[#3AD6F2] rounded-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro',borderRadius: '10px' }}
            >
              Folder
            </button>
            <button
              onClick={() => setActiveTab('Compliance')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'Compliance'
                 ? 'text-white bg-[#3AD6F2] rounded-lg '
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro',borderRadius: '10px'  }}
            >
              Compliance
            </button>
            <button
              onClick={() => setActiveTab('Security')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'Security'
                  ? 'text-white bg-[#3AD6F2] rounded-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro',borderRadius: '10px' }}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('Audit Trail')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'Audit Trail'
                 ? 'text-white bg-[#3AD6F2] rounded-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro',borderRadius: '10px'  }}
            >
              Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* Document Folders Section - Only show if NOT in nested route */}
      {!isNestedRoute && activeTab === 'Folder' && (
        <div className='bg-white rounded-lg p-5 border border-gray-100'>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Document Folders
            </h2>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Organize documents by category and access level
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search Folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-1/2 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-blue-50"
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
            </div>
          </div>

          {/* Folder Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className="bg-white rounded-lg p-5 border border-blue-200 transition-shadow cursor-pointer relative"
              >
                {/* Header with icon, badges, and menu */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DocumentDownload />
                    <div className="flex gap-1.5">
                      {folder.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-gray-800"
                          style={{ fontFamily: 'BasisGrotesquePro' }}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="relative actions-menu-container">
                    <button
                      onClick={(e) => toggleActionsMenu(folder.id, e)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <DocumentMoreIcon />
                    </button>
                    {openActionsMenu === folder.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg  border border-gray-200 z-10 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder(folder.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          style={{ fontFamily: 'BasisGrotesquePro' }}
                        >
                          Open Folder
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionsMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                          style={{ fontFamily: 'BasisGrotesquePro' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Folder Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  {folder.name}
                </h3>

                {/* Folder Description */}
                <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  {folder.description}
                </p>

                {/* Footer with document count and date */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span style={{ fontFamily: 'BasisGrotesquePro' }}>{folder.documentCount} documents</span>
                  <div className="flex flex-col items-end">
                    <span style={{ fontFamily: 'BasisGrotesquePro' }}>{folder.modified}</span>
                    <span style={{ fontFamily: 'BasisGrotesquePro' }}>{folder.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs content (Compliance, Security, Audit Trail) */}
      {!isNestedRoute && activeTab !== 'Folder' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {activeTab} content coming soon...
          </p>
        </div>
      )}

      {/* Render nested routes - Always render Outlet, it will show FolderContents when route matches */}
      <Outlet />
    </div>
  );
}
