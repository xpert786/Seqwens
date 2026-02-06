import React from 'react';
import '../styles/Pagination.css';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, startIndex, endIndex }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-container mt-4 pt-3" style={{ borderTop: '1px solid #E8F0FF' }}>
      <div className="pagination-showing text-muted" style={{ fontSize: '14px', fontFamily: 'BasisGrotesquePro' }}>
        Showing {startIndex + 1} to {endIndex} of {totalItems} items
      </div>
      <div className="pagination-controls d-flex align-items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn "
          style={{
            backgroundColor: currentPage === 1 ? '#F3F4F6' : '#FFFFFF',
            color: currentPage === 1 ? '#9CA3AF' : '#3B4A66',
            border: '1px solid #E8F0FF',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '14px',
            fontFamily: 'BasisGrotesquePro',
            fontWeight: '500',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.6 : 1
          }}
        >
          Previous
        </button>
        <div className="d-flex align-items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className="btn "
                  style={{
                    backgroundColor: currentPage === page ? '#00C0C6' : '#FFFFFF',
                    color: currentPage === page ? '#FFFFFF' : '#3B4A66',
                    border: '1px solid #E8F0FF',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontFamily: 'BasisGrotesquePro',
                    fontWeight: '500',
                    minWidth: '36px'
                  }}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span key={page} className="px-2" style={{ color: '#6B7280', fontSize: '14px' }}>
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn "
          style={{
            backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#FFFFFF',
            color: currentPage === totalPages ? '#9CA3AF' : '#3B4A66',
            border: '1px solid #E8F0FF',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '14px',
            fontFamily: 'BasisGrotesquePro',
            fontWeight: '500',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.6 : 1
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

