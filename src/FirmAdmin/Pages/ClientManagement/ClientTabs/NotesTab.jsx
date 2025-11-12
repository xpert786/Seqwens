import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

export default function NotesTab({ client }) {
  const API_BASE_URL = getApiBaseUrl();
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('staff_only');
  const [creatingNote, setCreatingNote] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notes from API
  const fetchNotes = useCallback(async () => {
    if (!client?.id) return;

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      
      if (visibilityFilter !== 'all') {
        queryParams.append('visibility', visibilityFilter);
      }
      
      if (debouncedSearchQuery.trim()) {
        queryParams.append('search', debouncedSearchQuery.trim());
      }

      const url = `${API_BASE_URL}/user/firm-admin/clients/${client.id}/notes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setNotes(result.data.notes || []);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load notes. Please try again.');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [client?.id, visibilityFilter, debouncedSearchQuery, API_BASE_URL]);

  // Fetch notes on mount and when filters change
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create new note
  const createNote = async () => {
    if (!client?.id || !noteContent.trim()) {
      setError('Note content is required');
      return;
    }

    try {
      setCreatingNote(true);
      setError('');

      const token = getAccessToken();
      const url = `${API_BASE_URL}/user/firm-admin/clients/${client.id}/notes/`;

      const response = await fetchWithCors(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: noteContent.trim(),
          visibility: noteVisibility
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Close modal and reset form
        setShowAddNoteModal(false);
        setNoteContent('');
        setNoteVisibility('staff_only');
        // Refresh notes list
        fetchNotes();
      } else {
        throw new Error('Failed to create note');
      }
    } catch (err) {
      console.error('Error creating note:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to create note. Please try again.');
    } finally {
      setCreatingNote(false);
    }
  };

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
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-4 py-2 text-sm bg-white border border-gray-300 !rounded-lg hover:bg-gray-50 appearance-none font-[BasisGrotesquePro] pr-8 cursor-pointer"
          >
            <option value="all">All Notes</option>
            <option value="staff_only">Staff Only</option>
            <option value="client_visible">Client Visible</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
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

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500 font-[BasisGrotesquePro]">Loading notes...</div>
        </div>
      ) : (
        /* Notes List */
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 font-[BasisGrotesquePro]">
                {debouncedSearchQuery || visibilityFilter !== 'all' 
                  ? 'No notes found matching your filters.' 
                  : 'No notes yet. Add your first note above.'}
              </div>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white !rounded-lg p-4 !border border-[#E8F0FF]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                      {note.created_by_name || 'Unknown'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium text-[#3B4A66] !rounded-full font-[BasisGrotesquePro] bg-[#E8F0FF]`}>
                      {note.visibility_display || note.visibility}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                    {note.formatted_datetime || note.formatted_date || 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-[BasisGrotesquePro] whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ml-30"
          onClick={() => {
            setShowAddNoteModal(false);
            setNoteContent('');
            setNoteVisibility('staff_only');
            setError('');
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
                  setNoteVisibility('staff_only');
                  setError('');
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
                    <option value="staff_only">Staff Only</option>
                    <option value="client_visible">Client Visible</option>
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
                    setNoteVisibility('staff_only');
                    setError('');
                  }}
                  disabled={creatingNote}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={createNote}
                  disabled={creatingNote || !noteContent.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
