import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FIELD_TYPES = {
  SIGNATURE: 'Signature',
  DATE: 'Date',
  INITIALS: 'Initials',
  TEXT: 'Text',
};

// Simple UI component for the field (used in sidebar, overlay, and on page)
const FieldUI = ({ type, role, isDragging, isOverlay, scale = 1, onRemove }) => {
  const getBackgroundColor = (type) => {
    switch (type) {
      case FIELD_TYPES.SIGNATURE: return 'bg-pink-100 border-pink-300 text-pink-700';
      case FIELD_TYPES.DATE: return 'bg-blue-100 border-blue-300 text-blue-700';
      case FIELD_TYPES.INITIALS: return 'bg-purple-100 border-purple-300 text-purple-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case FIELD_TYPES.SIGNATURE: return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H4L14 10L10 6L14 2L22 10L18 14L20 20Z"/></svg>;
      case FIELD_TYPES.DATE: return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
      case FIELD_TYPES.INITIALS: return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17L10 3L17.5 17L2.5 17Z"/><path d="M11 12H19"/></svg>;
      default: return null;
    }
  };

  return (
    <div
      className={`px-3 py-2 rounded border-2 shadow-sm flex items-center gap-2 group min-w-[120px] select-none ${getBackgroundColor(type)} ${isDragging ? 'opacity-50' : ''} ${isOverlay ? 'cursor-grabbing shadow-xl ring-2 ring-blue-400' : 'cursor-grab'}`}
      style={isOverlay ? { transform: `scale(${scale})` } : {}}
    >
      <div className="flex-shrink-0 opacity-70">{getIcon(type)}</div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase leading-none">{type}</span>
        {role && <span className="text-[9px] opacity-60 leading-tight">{role}</span>}
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="ml-auto hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-white bg-opacity-50 hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Draggable Sidebar Item
const DraggableField = ({ type }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${type}`,
    data: { type, isSidebarItem: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`mb-3 ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors shadow-sm">
        <div className="text-gray-500">
          {type === FIELD_TYPES.SIGNATURE && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H4L14 10L10 6L14 2L22 10L18 14L20 20Z"/></svg>}
          {type === FIELD_TYPES.DATE && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          {type === FIELD_TYPES.INITIALS && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 17L10 3L17.5 17L2.5 17Z"/><path d="M11 12H19"/></svg>}
        </div>
        <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">{type}</span>
      </div>
    </div>
  );
};

// Droppable PDF Page
const PDFPageWrapper = ({ pageNumber, placedFields, onRemoveField, onUpdateField, scale = 1.0 }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `page-${pageNumber}`,
    data: { pageNumber },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative mb-8 shadow-2xl transition-all mx-auto bg-white ${isOver ? 'ring-4 ring-blue-400 ring-opacity-100 scale-[1.01]' : ''}`}
      style={{ width: 'fit-content' }}
    >
      <Page 
        pageNumber={pageNumber} 
        scale={scale}
        loading={<div className="h-[800px] w-[600px] bg-gray-100 animate-pulse flex items-center justify-center">Loading page...</div>}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
      
      {/* Placed Fields Overlay */}
      <div className="absolute inset-0 z-10">
        {placedFields
          .filter(field => field.page === pageNumber)
          .map(field => (
            <PlacedField 
              key={field.id} 
              field={field} 
              onRemove={onRemoveField}
              onUpdate={onUpdateField}
              scale={scale}
            />
          ))}
      </div>
    </div>
  );
};

// Component for a field placed on the PDF
const PlacedField = ({ field, onRemove, scale }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: field.id,
    data: { ...field, isSidebarItem: false },
  });

  const style = {
    position: 'absolute',
    left: `${field.x * scale}px`,
    top: `${field.y * scale}px`,
    zIndex: isDragging ? 0 : 100, // Hide while dragging (overlay handles it)
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
    >
      <FieldUI 
        type={field.type} 
        role={field.role} 
        onRemove={() => onRemove(field.id)}
      />
    </div>
  );
};

export default function SignatureBuilder({ 
  pdfFile, 
  onSave, 
  onCancel,
  availableRoles = ['Taxpayer', 'Spouse', 'Preparer']
}) {
  const [numPages, setNumPages] = useState(null);
  const [placedFields, setPlacedFields] = useState([]);
  const [selectedRole, setSelectedRole] = useState(availableRoles[0]);
  const [scale, setScale] = useState(1.0);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const containerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleDragStart = (event) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const pageData = over.data.current;
    if (!pageData || !pageData.pageNumber) return;

    const fieldData = active.data.current;
    const pageRect = over.rect;
    
    // Calculate coordinates relative to the page
    const x = (event.activatorEvent.clientX + event.delta.x - pageRect.left) / scale;
    const y = (event.activatorEvent.clientY + event.delta.y - pageRect.top) / scale;

    if (fieldData.isSidebarItem) {
      const newField = {
        id: `field-${Date.now()}`,
        type: fieldData.type,
        page: pageData.pageNumber,
        x: x - 60, // approximate half width
        y: y - 20, // approximate half height
        role: selectedRole,
      };
      setPlacedFields([...placedFields, newField]);
    } else {
      setPlacedFields(prev => prev.map(field => {
        if (field.id === active.id) {
          return {
            ...field,
            page: pageData.pageNumber,
            x: x - 60,
            y: y - 20,
          };
        }
        return field;
      }));
    }
  };

  const removeField = (id) => {
    setPlacedFields(prev => prev.filter(f => f.id !== id));
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full bg-white overflow-hidden font-[BasisGrotesquePro]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-6 pt-10 shadow-sm z-30 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Signature Builder</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">Drag fields onto the document to place signature locations.</p>
            
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Current Signer Role</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm font-medium transition-all"
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Available Fields</label>
            <DraggableField type={FIELD_TYPES.SIGNATURE} />
            <DraggableField type={FIELD_TYPES.DATE} />
            <DraggableField type={FIELD_TYPES.INITIALS} />
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-3">
            <button
              onClick={onCancel}
              className="w-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(placedFields)}
              className="w-full px-6 py-2.5 text-sm font-medium text-white bg-firm-primary hover:brightness-95 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--firm-primary-color, #3AD6F2)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Save Placement
            </button>
          </div>
        </div>

        {/* Builder Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-8 z-40 flex items-center bg-white rounded-lg shadow-xl border border-gray-100 p-1">
            <button onClick={zoomOut} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600" title="Zoom Out">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <span className="px-3 text-sm font-bold text-gray-700 w-16 text-center">{Math.round(scale * 100)}%</span>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600" title="Zoom In">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>

          {/* Document Display */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto p-12 pt-16 scroll-smooth bg-gray-100"
          >
            <div className="max-w-fit mx-auto">
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center pt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p className="text-white font-medium">Preparing document content...</p>
                  </div>
                }
                onLoadError={(error) => console.error('PDF error:', error)}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <PDFPageWrapper
                    key={`page_${i + 1}`}
                    pageNumber={i + 1}
                    placedFields={placedFields}
                    onRemoveField={removeField}
                    onUpdateField={(id, updates) => setPlacedFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))}
                    scale={scale}
                  />
                ))}
              </Document>
            </div>
          </div>
        </div>

        {/* Drag Overlay for smooth portal-based dragging */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem ? (
            <FieldUI 
              type={activeDragItem.type} 
              role={activeDragItem.isSidebarItem ? selectedRole : activeDragItem.role} 
              isOverlay 
              scale={scale}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
