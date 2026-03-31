import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  rectIntersection,
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

const DEFAULT_WIDTH = 140;
const DEFAULT_HEIGHT = 45;
const MIN_WIDTH = 80;
const MIN_HEIGHT = 30;

// Simple UI component for the field (used in sidebar, overlay, and on page)
// Simple UI component for the field (used in sidebar, overlay, and on page)
const FieldUI = ({ type, role, isDragging, isOverlay, scale = 1, onRemove, isSelected, width, height }) => {
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
      case FIELD_TYPES.SIGNATURE: return <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H4L14 10L10 6L14 2L22 10L18 14L20 20Z" /></svg>;
      case FIELD_TYPES.DATE: return <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
      case FIELD_TYPES.INITIALS: return <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17L10 3L17.5 17L2.5 17Z" /><path d="M11 12H19" /></svg>;
      default: return null;
    }
  };

  return (
    <div
      className={`px-3 py-2 rounded-xl border shadow-sm flex items-center gap-2 group select-none transition-all duration-200 ${getBackgroundColor(type)} ${isDragging ? 'opacity-40 scale-105' : ''} ${isOverlay ? 'cursor-grabbing shadow-2xl ring-2 ring-blue-400' : 'cursor-grab'} ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
      style={{
        width: width ? `${width * scale}px` : (isOverlay ? `${DEFAULT_WIDTH * scale}px` : 'auto'),
        height: height ? `${height * scale}px` : (isOverlay ? `${DEFAULT_HEIGHT * scale}px` : 'auto'),
        minWidth: !width && !isOverlay ? '120px' : 'none',
        fontSize: `${Math.max(8, 11 * scale)}px`
      }}
    >
      <div className="flex-shrink-0 opacity-80">{getIcon(type)}</div>
      <div className="flex flex-col min-w-0 overflow-hidden">
        <span className="font-bold uppercase tracking-tight leading-none truncate" style={{ fontSize: `${Math.max(7, 9 * scale)}px` }}>{type}</span>
        {role && <span className="opacity-70 leading-tight truncate font-medium mt-0.5" style={{ fontSize: `${Math.max(6, 8 * scale)}px` }}>{role}</span>}
      </div>
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
          {type === FIELD_TYPES.SIGNATURE && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H4L14 10L10 6L14 2L22 10L18 14L20 20Z" /></svg>}
          {type === FIELD_TYPES.DATE && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          {type === FIELD_TYPES.INITIALS && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 17L10 3L17.5 17L2.5 17Z" /><path d="M11 12H19" /></svg>}
        </div>
        <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">{type}</span>
      </div>
    </div>
  );
};

// Memoized React-PDF Page to prevent heavy re-renders during dragging
const MemoizedPage = React.memo(({ pageNumber, scale }) => (
  <Page
    pageNumber={pageNumber}
    scale={scale}
    devicePixelRatio={Math.min(2, window.devicePixelRatio || 1) * 1.5}
    loading={<div className="h-[800px] w-full bg-gray-100 animate-pulse flex items-center justify-center" style={{ minWidth: '600px' }}>Loading page...</div>}
    renderAnnotationLayer={false}
    renderTextLayer={false}
  />
));

// Droppable PDF Page
const PDFPageWrapper = React.memo(({ pageNumber, placedFields, onRemoveField, onUpdateField, scale = 1.0, selectedFieldId, onSelectField }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `page-${pageNumber}`,
    data: { pageNumber },
  });

  // Calculate fields for this page
  const pageFields = React.useMemo(() => placedFields.filter(field => field.page === pageNumber), [placedFields, pageNumber]);

  return (
    <div
      ref={setNodeRef}
      className={`relative mb-8 shadow-2xl transition-shadow mx-auto bg-white ${isOver ? 'ring-4 ring-blue-400 ring-opacity-100' : ''}`}
      style={{ width: 'fit-content' }}
    >
      <MemoizedPage pageNumber={pageNumber} scale={scale} />

      {/* Placed Fields Overlay */}
      <div className="absolute inset-0 z-10">
        {pageFields.map(field => (
          <PlacedField
            key={field.id}
            field={field}
            onRemove={onRemoveField}
            onUpdate={onUpdateField}
            scale={scale}
            isSelected={selectedFieldId === field.id}
            onSelect={onSelectField}
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.scale !== nextProps.scale) return false;
  if (prevProps.pageNumber !== nextProps.pageNumber) return false;
  if (prevProps.placedFields.length !== nextProps.placedFields.length) return false;
  if (prevProps.selectedFieldId !== nextProps.selectedFieldId) return false;

  const prevFields = prevProps.placedFields.filter(f => f.page === prevProps.pageNumber);
  const nextFields = nextProps.placedFields.filter(f => f.page === nextProps.pageNumber);

  if (prevFields.length !== nextFields.length) return false;
  for (let i = 0; i < prevFields.length; i++) {
    if (prevFields[i].id !== nextFields[i].id) return false;
    if (prevFields[i].x !== nextFields[i].x) return false;
    if (prevFields[i].y !== nextFields[i].y) return false;
    if (prevFields[i].width !== nextFields[i].width) return false;
    if (prevFields[i].height !== nextFields[i].height) return false;
    if (prevFields[i].role !== nextFields[i].role) return false;
  }
  return true;
});

// Component for a field placed on the PDF
// Component for a field placed on the PDF
const PlacedField = React.memo(({ field, onRemove, onUpdate, scale, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: field.id,
    data: { ...field, isSidebarItem: false },
  });

  const style = {
    position: 'absolute',
    left: `${field.x * scale}px`,
    top: `${field.y * scale}px`,
    width: `${(field.width || DEFAULT_WIDTH) * scale}px`,
    height: `${(field.height || DEFAULT_HEIGHT) * scale}px`,
    zIndex: isDragging ? 0 : 100,
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const handleResizePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(field.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = field.width || DEFAULT_WIDTH;
    const startHeight = field.height || DEFAULT_HEIGHT;

    const handlePointerMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      onUpdate(field.id, {
        width: Math.max(MIN_WIDTH, startWidth + deltaX),
        height: Math.max(MIN_HEIGHT, startHeight + deltaY)
      });
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onPointerDown={() => onSelect(field.id)}
    >
      <FieldUI
        type={field.type}
        role={field.role}
        isSelected={isSelected}
        width={field.width || DEFAULT_WIDTH}
        height={field.height || DEFAULT_HEIGHT}
        scale={scale}
        isDragging={isDragging}
      />

      {/* Primary Delete Button (Cross) - Increased Size and better touch target */}
      {isSelected && !isDragging && (
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            onRemove(field.id);
          }}
          className="absolute top-[-12px] right-[-12px] w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-xl hover:bg-red-600 transition-all z-[130] border-2 border-white hover:scale-110 active:scale-95 cursor-pointer"
          title="Remove field"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Resize Handle - Slightly larger for touch */}
      {isSelected && !isDragging && (
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-[-8px] right-[-8px] w-5 h-5 bg-blue-600 rounded-lg border-2 border-white cursor-nwse-resize z-[120] shadow-md flex items-center justify-center transition-transform hover:scale-125 hover:bg-blue-700 shadow-lg"
          title="Drag to resize"
        >
          <svg width="8" height="8" viewBox="0 0 6 6" fill="white">
            <path d="M6 6H0L6 0V6Z" />
          </svg>
        </div>
      )}
    </div>
  );
});

const PDFRenderer = React.memo(({ pdfFile, onDocumentLoadSuccess, numPages, placedFields, removeField, updateField, scale, selectedFieldId, onSelectField }) => {
  return (
    <Document
      file={pdfFile}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={
        <div className="flex flex-col items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-300 mb-4"></div>
          <p className="text-slate-500 font-medium font-[BasisGrotesquePro]">Preparing document content...</p>
        </div>
      }
      onLoadError={(error) => console.error('PDF error:', error)}
    >
      {Array.from({ length: numPages || 0 }, (_, i) => (
        <PDFPageWrapper
          key={`page_${i + 1}`}
          pageNumber={i + 1}
          placedFields={placedFields}
          onRemoveField={removeField}
          onUpdateField={updateField}
          scale={scale}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      ))}
    </Document>
  );
});

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
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const containerRef = useRef(null);

  const GRID_SIZE = 10;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  );

  // Arrow nudge support
  useEffect(() => {
    if (!selectedFieldId) return;

    const handleKeyDown = (e) => {
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const isDeleteKey = ['Delete', 'Backspace'].includes(e.key);

      if (!isArrowKey && !isDeleteKey) return;

      // Prevent scrolling when nudging
      if (isArrowKey) e.preventDefault();

      if (isDeleteKey) {
        removeField(selectedFieldId);
        setSelectedFieldId(null);
        return;
      }

      const nudge = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp': dy = -nudge; break;
        case 'ArrowDown': dy = nudge; break;
        case 'ArrowLeft': dx = -nudge; break;
        case 'ArrowRight': dx = nudge; break;
        default: break;
      }

      setPlacedFields(prev => prev.map(f => {
        if (f.id !== selectedFieldId) return f;
        
        let newX = f.x + (dx / scale);
        let newY = f.y + (dy / scale);

        if (snapToGrid) {
          newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
          newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }

        return {
          ...f,
          x: newX,
          y: newY
        };
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, scale]);

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
    if (!pageData?.pageNumber) return;

    const fieldData = active.data.current;
    const pageRect = over.rect;

    // Correct pointer-based drop position
    const dragRect = active.rect.current.translated;

    let x = (dragRect.left - pageRect.left) / scale;
    let y = (dragRect.top - pageRect.top) / scale;

    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }

    if (fieldData.isSidebarItem) {
      const newField = {
        id: `field-${Date.now()}`,
        type: fieldData.type,
        page: pageData.pageNumber,
        x,
        y,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        role: selectedRole,
      };

      setPlacedFields(prev => [...prev, newField]);
      setSelectedFieldId(newField.id);
    } else {
      setPlacedFields(prev =>
        prev.map(field => {
          if (field.id !== active.id) return field;
          return {
            ...field,
            page: pageData.pageNumber,
            x,
            y,
          };
        })
      );
      setSelectedFieldId(active.id);
    }
  };

  const removeField = useCallback((id) => {
    setPlacedFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateField = useCallback((id, updates) => {
    setPlacedFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

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
      collisionDetection={rectIntersection}
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

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Available Fields</label>
            <div className="space-y-2">
              <DraggableField type={FIELD_TYPES.SIGNATURE} />
              <DraggableField type={FIELD_TYPES.DATE} />
              <DraggableField type={FIELD_TYPES.INITIALS} />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Snap to Grid</span>
              </label>
              <p className="text-[10px] text-gray-400 mt-1 pl-6">Aligns fields to a 10px grid for precision</p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-3">
            <button
              onClick={onCancel}
              className="w-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors" style={{ borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(placedFields)}
              className="w-full px-6 py-2.5 text-sm font-medium text-white bg-firm-primary hover:brightness-95 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--firm-primary-color, #3AD6F2)', borderRadius: '10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Save Placement
            </button>
          </div>
        </div>

        {/* Builder Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-8 z-40 flex items-center bg-white rounded-lg shadow-xl border border-gray-100 p-1">
            <button onClick={zoomOut} className="p-2 rounded-md transition-colors text-gray-600" title="Zoom Out">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <span className="px-3 text-sm font-bold text-gray-700 w-16 text-center">{Math.round(scale * 100)}%</span>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button onClick={zoomIn} className="p-2 rounded-md transition-colors text-gray-600" title="Zoom In">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </button>
          </div>

          {/* Document Display */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-12 pt-16 scroll-smooth bg-gray-100"
            onClick={() => setSelectedFieldId(null)}
          >
            <div className="max-w-fit mx-auto">
              <PDFRenderer
                pdfFile={pdfFile}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
                numPages={numPages}
                placedFields={placedFields}
                removeField={removeField}
                updateField={updateField}
                scale={scale}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
              />
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
