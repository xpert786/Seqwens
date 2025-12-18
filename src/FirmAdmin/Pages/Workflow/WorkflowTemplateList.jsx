import React, { useState } from 'react';
import { workflowAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const WorkflowTemplateList = ({ templates, onViewTemplate, onEditTemplate, onCreateTemplate, onRefresh, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredTemplates = templates.filter(template =>
    !searchTerm ||
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tax_form_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (templateId) => {
    try {
      setDeleting(true);
      const response = await workflowAPI.deleteTemplate(templateId);
      if (response.success) {
        toast.success('Workflow template deleted successfully');
        onRefresh();
        setShowDeleteConfirm(null);
      } else {
        throw new Error(response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(handleAPIError(error) || 'Failed to delete workflow template');
    } finally {
      setDeleting(false);
    }
  };

  const handleClone = async (template) => {
    try {
      const response = await workflowAPI.cloneTemplate(template.id, `${template.name} (Copy)`);
      if (response.success) {
        toast.success('Workflow template cloned successfully');
        onRefresh();
      } else {
        throw new Error(response.message || 'Failed to clone template');
      }
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error(handleAPIError(error) || 'Failed to clone workflow template');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
          <span className="ml-3 text-gray-600">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E8F0FF] p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 font-[BasisGrotesquePro]">
              Workflow Templates
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">
              Create and manage workflow templates for your firm
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
            />
            <button
              onClick={onCreateTemplate}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] flex items-center gap-2"
              style={{ borderRadius: '8px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New
            </button>
          </div>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <p className="text-gray-500 text-lg">No workflow templates found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm 
              ? 'Try adjusting your search'
              : 'Create your first workflow template to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateTemplate}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro]"
              style={{ borderRadius: '8px' }}
            >
              Create Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-[#E8F0FF] rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="font-semibold text-[#3B4A66] mb-1 font-[BasisGrotesquePro]">
                    {template.name}
                  </h5>
                  <p className="text-xs text-gray-500 mb-2 font-[BasisGrotesquePro]">
                    {template.description || 'No description'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  template.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {template.stage_count || 0} stages
                </span>
                {template.active_instances_count !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {template.active_instances_count} active
                  </span>
                )}
              </div>

              {template.tax_form_type && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-[#E8F0FF] text-[#3B4A66] rounded text-xs font-[BasisGrotesquePro]">
                    {template.tax_form_type}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-[#E8F0FF]">
                <button
                  onClick={() => onViewTemplate(template)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                  style={{ borderRadius: '8px' }}
                >
                  View
                </button>
                <button
                  onClick={() => onEditTemplate(template)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                  style={{ borderRadius: '8px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleClone(template)}
                  className="px-3 py-2 text-xs font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                  title="Clone"
                  style={{ borderRadius: '8px' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(template.id)}
                  className="px-3 py-2 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-[BasisGrotesquePro]"
                  title="Delete"
                  style={{ borderRadius: '8px' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6" style={{ borderRadius: '12px' }}>
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Delete Workflow Template
            </h3>
            <p className="text-sm text-gray-600 mb-4 font-[BasisGrotesquePro]">
              Are you sure you want to delete this workflow template? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-[BasisGrotesquePro] disabled:opacity-50"
                style={{ borderRadius: '8px' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplateList;

