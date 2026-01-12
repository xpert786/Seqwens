# 🔧 API Fix Summary - Document ID Issue

## ❌ Problem

Backend returned error:
```json
{
  "success": false,
  "message": "document_id is required"
}
```

## 🔍 Root Cause

The frontend was sending `request_id` but the backend expects `document_id`.

**Key Insight:** 
- `request.id` = E-signature request ID (25, 17, etc.)
- `request.document` = Actual document ID (129, 128, etc.) ✅ **This is what backend needs!**

---

## ✅ Solution Implemented

### 1. **Fetch Signature Requests First**

**API:** `GET /taxpayer/signatures/requests/`

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 25,           // E-signature request ID
        "document": 129,    // ✅ Document ID (use this!)
        "document_name": "signature_form.pdf",
        "document_url": "https://..."
      }
    ]
  }
}
```

### 2. **Updated Frontend Code**

#### **ESignature.jsx** - When opening annotation modal:

```javascript
setSelectedDocumentForAnnotation({
  url: request.document_url,
  name: request.document_name,
  id: request.id,              // E-signature request ID (25)
  document_id: request.document // ✅ Document ID (129)
});

console.log('📄 Opening annotation modal for:', {
  esign_request_id: request.id,      // 25
  document_id: request.document,      // 129
  document_name: request.document_name
});
```

#### **ESignature.jsx** - Save handler:

```javascript
const response = await annotationAPI.saveAnnotations({
  pdfUrl: selectedDocumentForAnnotation.url,
  annotations: annotationData.annotations || [],
  images: annotationData.images || [],
  pdf_scale: annotationData.pdf_scale || 1.5,
  canvas_info: annotationData.canvas_info,
  requestId: selectedDocumentForAnnotation.document_id,  // ✅ 129 (document ID)
  esign_document_id: selectedDocumentForAnnotation.id,   // 25 (esign request ID)
  metadata: {...}
});
```

#### **annotationAPI.js** - Updated payload:

```javascript
const payload = {
  document_id: annotationData.requestId,        // ✅ 129 from document field
  esign_document_id: annotationData.esign_document_id, // 25 from id field
  pdf_url: annotationData.pdfUrl,
  annotations: annotationData.annotations || [],
  images: annotationData.images || [],
  pdf_scale: annotationData.pdf_scale || 1.5,
  canvas_info: annotationData.canvas_info,
  metadata: annotationData.metadata || {},
  processing_options: {
    add_signatures: true,
    merge_images: true,
    preserve_quality: true,
    output_format: 'pdf'
  }
};

console.log('📤 Saving annotations to backend:', {
  document_id: payload.document_id,           // 129
  esign_document_id: payload.esign_document_id, // 25
  annotations_count: payload.annotations.length,
  images_count: payload.images.length
});
```

---

## 📦 Final Payload Structure

**Sent to Backend:**
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

---

## 📊 Expected Backend Response

**Success:**
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

---

## 🧪 Testing & Debugging

### Check Browser Console for:

1. **When opening annotation modal:**
```
📄 Opening annotation modal for: {
  esign_request_id: 25,
  document_id: 129,
  document_name: "signature_form.pdf"
}
```

2. **When preparing to save:**
```
💾 Preparing to save annotations: {
  esign_request_id: 25,
  document_id: 129,
  annotations_count: 3,
  images_count: 2,
  pdf_scale: 1.5
}
```

3. **Before sending to backend:**
```
📤 Saving annotations to backend: {
  url: "http://168.231.121.7/seqwens/api/taxpayer/pdf/annotations/save/",
  document_id: 129,
  esign_document_id: 25,
  annotations_count: 3,
  images_count: 2,
  pdf_scale: 1.5
}
```

4. **On success:**
```
✅ Annotations saved successfully: {
  success: true,
  data: {...}
}
```

5. **On error:**
```
❌ Backend error response: {
  status: 400,
  message: "...",
  data: {...}
}
```

---

## 📁 Modified Files

1. **`src/ClientOnboarding/components/MyDocuments/ESignature.jsx`**
   - Updated annotation modal trigger to include `document_id`
   - Updated `onSave` handler to use `document_id`
   - Added comprehensive logging

2. **`src/utils/annotationAPI.js`**
   - Updated payload structure to include both IDs
   - Added `pdf_scale` and `canvas_info` to payload
   - Enhanced error handling and logging

3. **`PDF_ANNOTATION_DOCUMENTATION.md`**
   - Updated with complete API flow
   - Added signature requests API documentation
   - Included payload structure and examples

---

## ✅ Checklist

- [x] Fetch document ID from signature requests API
- [x] Pass `document_id` (from `request.document`) to save handler
- [x] Send `document_id` in payload to backend
- [x] Include `esign_document_id` for reference
- [x] Add comprehensive console logging
- [x] Update documentation

---

## 🎯 Result

The API call now correctly sends `document_id` to the backend, resolving the "document_id is required" error. The implementation maintains both IDs for proper tracking:

- **`document_id`**: For backend PDF processing (129, 128, etc.)
- **`esign_document_id`**: For e-signature request tracking (25, 17, etc.)


