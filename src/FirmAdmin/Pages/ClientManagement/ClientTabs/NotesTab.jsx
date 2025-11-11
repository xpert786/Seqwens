import React, { useState } from 'react';

export default function NotesTab({ client }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All Notes');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('Staff Only');

  const notes = [
    {
      id: 1,
      author: 'Michael Chen',
      visibility: 'Staff Only',
      content: 'Client prefers email communication over phone calls. Very responsive to messages.',
      timestamp: '1/10/2024 At 02:30 PM'
    },
    {
      id: 2,
      author: 'Sarah Martinez',
      visibility: 'Client Visible',
      content: 'Discussed tax planning strategies for 2024. Client interested in retirement planning.',
      timestamp: '1/8/2024 At 08:00 PM'
    },
    {
      id: 3,
      author: 'Michael Chen',
      visibility: 'Staff Only',
      content: 'Client has complex business structure with multiple LLCs. Requires careful attention to K-1 distributions.',
      timestamp: '1/5/2024 At 09:50 PM'
    }
  ];

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Staff Notes</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Internal notes and client communications</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F3F7FF] !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilter(filter === 'All Notes' ? 'Filter Notes' : 'All Notes')}
            className="px-4 py-2 text-sm bg-white border border-gray-300 !rounded-lg hover:bg-gray-50 flex items-center gap-2 font-[BasisGrotesquePro]"
          >
            <span>{filter}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Add Note Button */}
        <button 
          onClick={() => setShowAddNoteModal(true)}
          className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition flex items-center gap-2 font-[BasisGrotesquePro] text-sm font-medium whitespace-nowrap"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Note
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white !rounded-lg p-4 !border border-[#E8F0FF]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">{note.author}</span>
                <span className={`px-2 py-0.5 text-xs font-medium text-[#3B4A66] !rounded-full font-[BasisGrotesquePro] ${
                  note.visibility === 'Staff Only' ? 'bg-[#E8F0FF]' : 'bg-[#E8F0FF]'
                }`}>
                  {note.visibility}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">{note.timestamp}</span>
            </div>
            <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">{note.content}</p>
          </div>
        ))}
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ml-30"
          onClick={() => {
            setShowAddNoteModal(false);
            setNoteContent('');
            setNoteVisibility('Staff Only');
          }}
        >
          <div 
            className="bg-white !rounded-lg p-6 w-full max-w-2xl mx-4 !border border-[#E8F0FF]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Add Note</h5>
              <button
                onClick={() => {
                  setShowAddNoteModal(false);
                  setNoteContent('');
                  setNoteVisibility('Staff Only');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Notes Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-2">
                  Notes
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter your note..."
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent font-[BasisGrotesquePro] resize-none"
                />
              </div>
            </div>

            {/* Footer: Visibility + Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4">
              {/* Visibility Dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro] whitespace-nowrap">
                  Visibility:
                </label>
                <div className="relative">
                  <select
                    value={noteVisibility}
                    onChange={(e) => setNoteVisibility(e.target.value)}
                    className="px-4 py-2.5 text-sm !border border-[#E8F0FF] !rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:border-transparent font-[BasisGrotesquePro] bg-white pr-10 cursor-pointer min-w-[140px]"
                  >
                    <option value="Staff Only">Staff Only</option>
                    <option value="Client Visible">Client Visible</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setNoteContent('');
                    setNoteVisibility('Staff Only');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle add note logic here
                    console.log('Adding note:', { content: noteContent, visibility: noteVisibility });
                    setShowAddNoteModal(false);
                    setNoteContent('');
                    setNoteVisibility('Staff Only');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
