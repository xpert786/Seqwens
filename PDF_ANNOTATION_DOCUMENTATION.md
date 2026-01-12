# PDF Annotation Modal - Complete Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Component Structure](#component-structure)
- [Tools & Functionality](#tools--functionality)
- [Data Flow](#data-flow)
- [API Integration](#api-integration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Technical Details](#technical-details)

---

## 🎯 Overview

The PDF Annotation Modal is a full-featured PDF annotation tool that allows users to:
- Draw freehand annotations
- Erase specific annotations
- Upload and place images
- Move/reposition images
- Clear all annotations
- Save annotations to backend

**Component Location:**
```
src/ClientOnboarding/components/PdfAnnotationModal.jsx
```

**Used By:**
```
src/ClientOnboarding/components/MyDocuments/ESignature.jsx
```

---

## ✨ Features

### 1. **Drawing Tool (Pen)** ✏️
- Freehand drawing on PDF
- Customizable color picker
- Adjustable pen width (1-10px)
- Real-time rendering
- Smooth line drawing

### 2. **Eraser Tool** 🗑️
- Click or drag to erase annotations
- Erases entire strokes (not partial)
- Adjustable eraser size (5-50px)
- Works on both annotations and images
- Visual feedback with cursor change

### 3. **Image Upload** 🖼️
- Upload any image format
- Click to place on PDF
- Auto-centered on click point
- Default size: 200px width (maintains aspect ratio)

### 4. **Select/Move Tool** 🔄
- Click and drag to reposition images
- Visual feedback with cursor change (grab ↔ grabbing)
- Real-time position updates
- Smooth dragging experience

### 5. **Clear All** 🗑️
- Remove all annotations and images at once
- Confirmation required
- Can be undone (via keyboard shortcuts)

### 6. **Zoom Controls** 🔍
- Zoom In / Zoom Out buttons
- Range: 50% - 300%
- Increment: 25%
- Live percentage display

### 7. **Multi-Page Support** 📄
- Navigate between PDF pages
- Previous / Next buttons
- Page counter (e.g., "Page 1 of 5")
- Independent annotations per page

---

## 🏗️ Component Structure

### **Props:**
```javascript
{
  isOpen: boolean,          // Modal visibility
  onClose: function,        // Close callback
  documentUrl: string,      // PDF URL
  documentName: string,     // Display name
  requestId: string,        // Request identifier
  onSave: function         // Save callback with data
}
```

### **State Management:**
```javascript
{
  pdfDoc: object,              // PDF.js document
  pdfPages: array,             // Page numbers [1,2,3,...]
  currentPage: number,         // Active page
  scale: number,               // Zoom level (1.5 default)
  activeTool: string,          // 'pen'|'trash'|'image'|'select'
  annotations: array,          // Drawing annotations
  images: array,               // Placed images
  penColor: string,            // Hex color (#000000)
  penWidth: number,            // 1-10
  eraserWidth: number,         // 5-50
  draggingImage: object|null,  // Currently dragging
  history: array,              // Undo/redo history
  historyIndex: number,        // Current history position
  saving: boolean,             // Save in progress
}
```

---

## 🛠️ Tools & Functionality

### **1. Pen Tool**

**Activation:**
```javascript
onClick={() => setActiveTool(TOOLS.PEN)}
```

**Properties:**
- **Color**: User-selectable via color picker
- **Width**: 1-10px (slider control)
- **Cursor**: Crosshair (➕)

**Data Structure:**
```javascript
{
  id: "annotation-0",
  type: "drawing",
  page: 1,
  color: "#FF0000",
  width: 3,
  path: [
    { x: 100, y: 150 },
    { x: 105, y: 152 },
    { x: 110, y: 155 }
  ]
}
```

**Usage:**
1. Click Pen tool button
2. Select color and width
3. Click and drag on PDF to draw
4. Release to finish stroke

---

### **2. Eraser Tool**

**Activation:**
```javascript
onClick={() => setActiveTool(TOOLS.TRASH)}
```

**Properties:**
- **Size**: 5-50px (slider control)
- **Cursor**: Not-allowed (🚫)
- **Behavior**: Removes entire annotation when crossed

**Algorithm:**
```javascript
// Check if eraser intersects with any annotation point
const isHit = annotation.path.some(point => {
  const dx = point.x - eraserX;
  const dy = point.y - eraserY;
  return (dx * dx + dy * dy) <= (eraserWidth * eraserWidth);
});

if (isHit) {
  removeAnnotation(annotation.id);
}
```

**Usage:**
1. Click Eraser tool button
2. Adjust size if needed
3. Click or drag over annotations to remove

---

### **3. Image Tool**

**Activation:**
```javascript
onClick={() => imageInputRef.current?.click()}
```

**Properties:**
- **Supported formats**: All image types (PNG, JPG, GIF, etc.)
- **Default size**: 200px width (aspect ratio maintained)
- **Storage**: Base64 encoded in state
- **Cursor**: Copy (📋)

**Data Structure:**
```javascript
{
  id: "image-1704123456789",
  page: 1,
  x: 250,              // Canvas coordinates
  y: 300,
  width: 200,
  height: 150,
  src: "data:image/png;base64,iVBORw0KG..."
}
```

**Usage:**
1. Click Image tool button
2. Select image from file dialog
3. Click on PDF where you want to place it
4. Image appears centered on click point

---

### **4. Select/Move Tool**

**Activation:**
```javascript
onClick={() => setActiveTool(TOOLS.SELECT)}
```

**Properties:**
- **Cursor (default)**: Pointer (👆)
- **Cursor (on image)**: Grab (✋)
- **Cursor (dragging)**: Grabbing (✊)

**Detection Algorithm:**
```javascript
const getImageAtPosition = (x, y, pageNum) => {
  const pageImages = images.filter(img => img.page === pageNum);
  
  for (let i = pageImages.length - 1; i >= 0; i--) {
    const img = pageImages[i];
    if (x >= img.x && x <= img.x + img.width &&
        y >= img.y && y <= img.y + img.height) {
      return img;
    }
  }
  return null;
};
```

**Usage:**
1. Click Select/Move tool button
2. Click on an image to select
3. Drag to new position
4. Release to place

---

### **5. Clear All**

**Activation:**
```javascript
onClick={handleClearAll}
```

**Behavior:**
```javascript
const handleClearAll = () => {
  if (annotations.length === 0 && images.length === 0) {
    toast.info('Nothing to clear');
    return;
  }
  
  saveToHistory([], []);  // Save to history before clearing
  setAnnotations([]);
  setImages([]);
  
  // Re-render all pages
  pdfPages.forEach(pageNum => {
    renderPage(pdfDoc, pageNum);
  });
  
  toast.success('All annotations cleared');
};
```

**Usage:**
1. Click Clear All button (red outline)
2. All annotations and images removed
3. Can be undone with Ctrl+Z

---

## 🔄 Data Flow

### **Complete Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Opens PDF Annotation Modal                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. PDF Loads via PDF.js                                     │
│     - Fetches PDF as blob (CORS handling)                   │
│     - Renders to canvas elements                            │
│     - Creates page wrappers                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. User Interacts with Tools                               │
│     - Draws annotations (stored in state)                   │
│     - Places images (stored in state)                       │
│     - Moves/erases items                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User Clicks "Save Annotations"                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Modal Prepares Data                                     │
│     {                                                        │
│       request_id: "req_123",                                │
│       document_url: "https://...",                          │
│       annotations: [...],                                   │
│       images: [...],                                        │
│       pdf_scale: 1.5                                        │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Parent Component (ESignature) Receives Data             │
│     - Adds metadata                                         │
│     - Adds canvas info                                      │
│     - Formats for backend                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  7. API Call to Backend                                     │
│     POST /api/annotations/save                              │
│     {                                                        │
│       pdfUrl: "...",                                        │
│       annotations: [...],                                   │
│       images: [...],                                        │
│       metadata: {...}                                       │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Backend Processes & Stores                              │
│     - Python script processes annotations                   │
│     - Saves to database                                     │
│     - Returns success response                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  9. UI Updates                                              │
│     - Success toast notification                            │
│     - Modal closes                                          │
│     - Signature requests refresh                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📤 API Integration

### **Step 1: Get Document ID from Signature Requests**

Before saving annotations, fetch the document ID from the signature requests API.

**API Endpoint:**
```
GET {API_BASE_URL}/taxpayer/signatures/requests/
Authorization: Bearer {token}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 25,                    // E-signature request ID
        "document": 129,             // ✅ DOCUMENT ID (use this for annotations)
        "document_name": "signature_form.pdf",
        "document_url": "https://seqwens-s3.s3.amazonaws.com/.../signature_form.pdf",
        "status": "ready",
        "taxpayer_signed": false,
        "preparer_signed": false,
        "preparer_must_sign": true
      }
    ]
  }
}
```

**Extract Document ID:**
```javascript
// When opening annotation modal
setSelectedDocumentForAnnotation({
  url: request.document_url,
  name: request.document_name,
  id: request.id,              // E-signature request ID
  document_id: request.document // ✅ Document ID for backend
});
```

---

### **Step 2: Save Annotations Endpoint**

**API Endpoint:**
```
POST {API_BASE_URL}/taxpayer/pdf/annotations/save/
Authorization: Bearer {token}
Content-Type: application/json
```

**Function Call:**
```javascript
const response = await annotationAPI.saveAnnotations({
  pdfUrl: selectedDocumentForAnnotation.url,
  annotations: annotationData.annotations || [],
  images: annotationData.images || [],
  pdf_scale: annotationData.pdf_scale || 1.5,
  canvas_info: annotationData.canvas_info,
  requestId: selectedDocumentForAnnotation.document_id,  // ✅ Document ID
  esign_document_id: selectedDocumentForAnnotation.id,   // E-signature request ID
  metadata: {
    request_id: selectedDocumentForAnnotation.id,
    document_id: selectedDocumentForAnnotation.document_id,
    document_url: selectedDocumentForAnnotation.url,
    document_name: selectedDocumentForAnnotation.name,
    timestamp: new Date().toISOString(),
    canvas_info: annotationData.canvas_info
  }
});
```

**Request Payload (Sent to Backend):**
```json
{
  "document_id": 129,
  "esign_document_id": 25,
  "pdf_url": "https://seqwens-s3.s3.amazonaws.com/.../signature_form.pdf",
  "annotations": [
    {
      "id": "annotation-0",
      "type": "drawing",
      "page": 1,
      "data": {
        "path": [{"x": 100, "y": 150}, {"x": 105, "y": 152}],
        "color": "#FF0000",
        "width": 3
      }
    }
  ],
  "images": [
    {
      "id": "image-1704123456789",
      "page": 1,
      "x": 250,
      "y": 300,
      "width": 200,
      "height": 150,
      "src": "data:image/png;base64,iVBORw0KG..."
    }
  ],
  "pdf_scale": 1.5,
  "canvas_info": {
    "width": 800,
    "height": 600,
    "pdfWidth": 918,
    "pdfHeight": 1188,
    "scale": 1.5
  },
  "metadata": {
    "request_id": 25,
    "document_id": 129,
    "document_url": "https://...",
    "document_name": "signature_form.pdf",
    "timestamp": "2026-01-12T10:30:00.000Z",
    "canvas_info": {...}
  },
  "processing_options": {
    "add_signatures": true,
    "merge_images": true,
    "preserve_quality": true,
    "output_format": "pdf"
  }
}
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "PDF annotations saved successfully",
  "data": {
    "annotation_id": 789,
    "status": "taxpayer_signed",
    "taxpayer_signed": true,
    "preparer_signed": false,
    "requires_preparer_signature": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "document_id is required"
}
```

---

### **Key Points:**

1. **`document_id` is REQUIRED** - The backend expects `document_id`, not `request_id`
2. **`document_id`** comes from the `request.document` field in signature requests
3. **`esign_document_id`** is the e-signature request ID (`request.id`)
4. **Payload includes:**
   - Annotations array with drawing data
   - Images array with base64 encoded images
   - Canvas info for coordinate transformation
   - PDF scale for proper rendering
   - Metadata for tracking

---

### **Console Logging:**

The implementation includes comprehensive logging:

```javascript
// Before sending
📤 Saving annotations to backend: {
  url: "http://168.231.121.7/seqwens/api/taxpayer/pdf/annotations/save/",
  document_id: 129,
  esign_document_id: 25,
  annotations_count: 3,
  images_count: 2,
  pdf_scale: 1.5
}

// On success
✅ Annotations saved successfully: {...}

// On error
❌ Backend error response: {
  status: 400,
  message: "document_id is required",
  data: {...}
}
```

---

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac | Function |
|--------|---------------|-----|----------|
| Undo | `Ctrl+Z` | `Cmd+Z` | Undo last action |
| Redo | `Ctrl+Shift+Z` or `Ctrl+Y` | `Cmd+Shift+Z` | Redo undone action |

**Implementation:**
```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    // Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    // Redo
    if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
        (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      handleRedo();
    }
  };

  if (isOpen) {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }
}, [isOpen, historyIndex, history]);
```

---

## 🔧 Technical Details

### **Dependencies:**

```json
{
  "pdfjs-dist": "^3.11.174",
  "react": "^18.x",
  "react-bootstrap": "^2.x",
  "react-icons": "^4.x",
  "react-toastify": "^9.x"
}
```

### **PDF.js Configuration:**

```javascript
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Use CDN for worker
GlobalWorkerOptions.workerSrc = 
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Load PDF with configuration
const loadingTask = getDocument({ 
  url: pdfBlobUrl,
  cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
});
```

### **Canvas Rendering:**

```javascript
const renderPage = async (pdf, pageNum) => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d');
  
  // Render PDF
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Draw annotations
  drawAnnotations(context, pageNum, viewport);
  
  // Draw images
  drawImages(context, pageNum, viewport);
};
```

### **Performance Optimizations:**

1. **Throttled Re-renders:**
   ```javascript
   // Limit eraser re-renders to 60fps
   if (now - lastEraseTimeRef.current >= 50) {
     lastEraseTimeRef.current = now;
     setTimeout(() => renderPage(pdfDoc, pageNum), 10);
   }
   ```

2. **Memoized Functions:**
   ```javascript
   const renderPage = useCallback(async (pdf, pageNum) => {
     // ... rendering logic
   }, [scale, activeTool, annotations, images, draggingImage]);
   ```

3. **History Limit:**
   ```javascript
   // Keep only last 50 states
   const trimmedHistory = newHistory.slice(-50);
   ```

4. **Change Detection:**
   ```javascript
   // Don't save if nothing changed
   if (JSON.stringify(currentState) === JSON.stringify(newState)) {
     return;
   }
   ```

### **Coordinate System:**

- **Canvas Coordinates**: Direct pixel coordinates on canvas
- **Mouse Coordinates**: Converted from screen to canvas space
- **Formula**: 
  ```javascript
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  ```

### **Image Detection:**

```javascript
// Z-order: Last drawn = on top
for (let i = pageImages.length - 1; i >= 0; i--) {
  const img = pageImages[i];
  if (x >= img.x && x <= img.x + img.width &&
      y >= img.y && y <= img.y + img.height) {
    return img;  // Found image at position
  }
}
```

---

## 🎨 UI/UX Features

### **Sticky Elements:**
- **Header**: Fixed at top (z-index: 1000)
- **Footer**: Fixed at bottom (z-index: 1000)
- **Toolbox**: Below header (sticky)

### **Visual Feedback:**
- **Tool Selection**: Blue highlight on active tool
- **Cursor Changes**: Different for each tool
- **Counter Display**: Shows "X annotations • Y images"
- **Loading States**: Spinner during save
- **Disabled States**: Grayed out when not applicable
- **Toast Notifications**: Success/error messages

### **Responsive Design:**
- **Fullscreen Modal**: Uses `fullscreen` prop
- **Scrollable Content**: PDF viewer area scrolls
- **Flexible Layout**: Adapts to content
- **Mobile Support**: Touch events supported

---

## 🧪 Testing Guide

### **Manual Testing Checklist:**

- [ ] PDF loads correctly
- [ ] All tools activate properly
- [ ] Drawing works smoothly
- [ ] Eraser removes annotations
- [ ] Images upload and place correctly
- [ ] Images can be moved
- [ ] Clear all removes everything
- [ ] Zoom in/out works
- [ ] Multi-page navigation works
- [ ] Save sends correct data
- [ ] Keyboard shortcuts work
- [ ] Error handling works
- [ ] Modal closes properly

### **Console Debug Commands:**

```javascript
// Check current state
console.log('Annotations:', annotations);
console.log('Images:', images);
console.log('Active tool:', activeTool);
console.log('History:', history);

// Verify image detection
const testImage = getImageAtPosition(x, y, pageNum);
console.log('Image at position:', testImage);
```

---

## 📝 Notes for Developers

### **Common Issues:**

1. **Eraser not working:**
   - Check console for detection logs
   - Verify eraserWidth is not 0
   - Ensure annotations have valid paths

2. **Images not appearing:**
   - Verify Base64 encoding
   - Check page number matches
   - Confirm coordinates are valid

3. **Drag not working:**
   - Ensure SELECT tool is active
   - Check draggingImage state
   - Verify getImageAtPosition returns image

4. **Save failing:**
   - Check network tab for API call
   - Verify payload structure
   - Check backend endpoint

### **Future Enhancements:**

- [ ] Text annotation tool
- [ ] Shape tools (rectangle, circle, arrow)
- [ ] Highlight tool
- [ ] Signature pad integration
- [ ] Annotation comments
- [ ] Export annotated PDF
- [ ] Annotation sharing
- [ ] Version history
- [ ] Collaborative editing

---

## 📞 Support

For issues or questions:
- Check console logs for debugging info
- Review this documentation
- Contact development team

---

**Last Updated:** January 12, 2026  
**Version:** 1.0.0  
**Author:** Development Team

