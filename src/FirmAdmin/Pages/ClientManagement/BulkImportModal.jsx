import React from "react";
import { Browse, CrossesIcon, Folder } from "../../Components/icons";
 
export default function BulkImportModal({ isOpen, onClose }) {
  if (!isOpen) return null; // <-- hide modal when not open
 
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg p-3 max-w-2xl w-full mx-4"
        style={{ 
          borderRadius: '12px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3">
          <div className="flex justify-between items-center pb-2" style={{ borderBottom: '0.5px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
            <div>
              <h2 className="taxdashboardr-titler text-base font-bold" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Bulk Import Clients</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
                Import multiple clients from CSV or Excel files with field mapping and validation
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <CrossesIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>
 
        {/* Steps Navigation */}
        <div 
          className="flex items-center justify-between rounded-lg px-4 py-3 mb-4"
          style={{ 
            backgroundColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)',
            border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)'
          }}
        >
          {[
            { step: 1, label: "Upload File" },
            { step: 2, label: "Map Fields" },
            { step: 3, label: "Validate Data" },
            { step: 4, label: "Import" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <span
                className={`text-sm font-medium ${
                  s.step === 1 ? "text-orange-500" : ""
                }`}
                style={s.step !== 1 ? { color: 'var(--Palette2-Dark-blue-900, #3B4A66)' } : {}}
              >
                {s.step}. {s.label}
              </span>
              {i < 3 && (
                <span 
                  className={`mx-2 ${
                    s.step === 1 ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  &raquo;
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Upload and Download Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload Client Data */}
          <div>
            <h3 className="taxdashboardr-titler mb-2" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Upload Client Data</h3>
            <div 
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)' }}
            >
              <div className="text-blue-500 text-2xl mb-2"><Folder /></div>
              <div className="text-xs mb-3" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)', fontSize: '10px' }}>
                <p>Drop your file here or click to browse</p>
                <p>Supported formats: CSV, XLS, XLSX (Max 10MB)</p>
              </div>
              <button 
                className="px-4 py-2 text-black text-sm transition flex items-center gap-2"
                style={{ 
                  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                  borderRadius: '8px'
                }}
              >
               <Browse /> Browse Files
              </button>
            </div>
          </div>
 
          {/* Download Template */}
          <div>
          <h3 className="taxdashboardr-titler mb-2" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Download Template</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
              Use our template to ensure your data is formatted correctly
            </p>
             <div className=" rounded-lg p-4 mb-4"  style={{ 
             backgroundColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)',
             border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
             color: 'var(--Palette2-Dark-blue-900, #3B4A66)',
             fontSize: '12px'
           }}>
                 <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Template includes:</h4>
                <div className="flex flex-col space-y-1" style={{ fontSize: '12px' }}>
                  <div>• All required and optional fields</div>
                  <div>• Sample data for reference</div>
                  <div>• Proper formatting examples</div>
                  <div>• Field validation rules</div>
                </div>
              </div>
            <button 
                className="w-full px-4 py-2 text-black text-sm transition flex items-center gap-2"
                style={{ 
                  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                  borderRadius: '8px'
                }}
              > <span className="text-lg"><Browse />  </span>
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}