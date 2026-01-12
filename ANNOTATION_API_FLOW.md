# 📊 PDF Annotation API Flow Diagram

## 🔄 Complete Flow: From Request to Save

```
┌─────────────────────────────────────────────────────────────────────┐
│                     1. FETCH SIGNATURE REQUESTS                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ GET /taxpayer/signatures/requests/
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Response:                                                           │
│  {                                                                   │
│    "requests": [                                                     │
│      {                                                               │
│        "id": 25,              ← E-signature request ID               │
│        "document": 129,       ← ✅ Document ID (IMPORTANT!)          │
│        "document_name": "signature_form.pdf",                        │
│        "document_url": "https://...",                                │
│        "status": "ready"                                             │
│      }                                                               │
│    ]                                                                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User clicks "Annotate PDF" button
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   2. OPEN ANNOTATION MODAL                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    setSelectedDocumentForAnnotation({
                      id: 25,              ← E-signature request ID
                      document_id: 129,    ← ✅ Document ID
                      url: "https://...",
                      name: "signature_form.pdf"
                    })
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   3. USER ANNOTATES PDF                              │
│                                                                       │
│  • Draw with pen tool                                                │
│  • Erase annotations                                                 │
│  • Upload & place images                                             │
│  • Move images                                                       │
│  • Clear all                                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User clicks "Submit" button
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   4. PREPARE ANNOTATION DATA                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    Collect from PdfAnnotationModal:
                    {
                      annotations: [...],
                      images: [...],
                      pdf_scale: 1.5,
                      canvas_info: {
                        width: 800,
                        height: 600,
                        pdfWidth: 918,
                        pdfHeight: 1188,
                        scale: 1.5
                      }
                    }
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   5. FORMAT FOR BACKEND                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
            annotationAPI.saveAnnotations({
              requestId: 129,              ← ✅ Document ID
              esign_document_id: 25,       ← E-signature request ID
              pdfUrl: "https://...",
              annotations: [...],
              images: [...],
              pdf_scale: 1.5,
              canvas_info: {...},
              metadata: {...}
            })
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   6. BUILD API PAYLOAD                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    Final Payload:
                    {
                      "document_id": 129,          ✅ REQUIRED
                      "esign_document_id": 25,
                      "pdf_url": "https://...",
                      "annotations": [...],
                      "images": [...],
                      "pdf_scale": 1.5,
                      "canvas_info": {...},
                      "metadata": {...},
                      "processing_options": {...}
                    }
                                    │
                                    │ POST /taxpayer/pdf/annotations/save/
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   7. BACKEND PROCESSING                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    Backend receives:
                    • Validates document_id (129)
                    • Processes annotations
                    • Merges images into PDF
                    • Updates signature status
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   8. BACKEND RESPONSE                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    Success:
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
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   9. FRONTEND UPDATES                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    • Show success toast
                    • Close annotation modal
                    • Refresh signature requests list
                    • Update document status
                                    │
                                    ↓
                              ✅ COMPLETE
```

---

## 🔑 Key ID Relationships

```
┌──────────────────────┐
│ Signature Request    │
│ (E-Sign Request)     │
│                      │
│  id: 25              │ ← Used for e-signature tracking
│  document: 129       │ ← ✅ Used for PDF annotation
│  status: "ready"     │
│  taxpayer_signed: ❌ │
│  preparer_signed: ❌  │
└──────────────────────┘
           │
           ├─── id (25) ────────────► esign_document_id in payload
           │
           └─── document (129) ─────► document_id in payload ✅ REQUIRED
```

---

## 📝 Data Transformation

### Input (From Signature Requests API):
```javascript
{
  id: 25,
  document: 129,
  document_name: "signature_form.pdf",
  document_url: "https://seqwens-s3.s3.amazonaws.com/.../signature_form.pdf"
}
```

### Stored in State:
```javascript
selectedDocumentForAnnotation = {
  id: 25,              // E-signature request ID
  document_id: 129,    // Document ID
  name: "signature_form.pdf",
  url: "https://seqwens-s3.s3.amazonaws.com/.../signature_form.pdf"
}
```

### Sent to Backend:
```javascript
{
  document_id: 129,           // From request.document
  esign_document_id: 25,      // From request.id
  pdf_url: "https://...",
  annotations: [...],
  images: [...]
}
```

---

## 🎯 Critical Points

### ✅ DO:
- Use `request.document` as `document_id` in API payload
- Use `request.id` as `esign_document_id` for tracking
- Include both IDs for complete context
- Log all ID transformations for debugging

### ❌ DON'T:
- Don't use `request.id` as `document_id` (this was the bug!)
- Don't skip the signature requests API call
- Don't assume ID structure without verification

---

## 🐛 Common Errors & Solutions

### Error: `"document_id is required"`
**Cause:** Sending `request.id` instead of `request.document`  
**Solution:** Use `request.document` field from signature requests API

### Error: `"Document not found"`
**Cause:** Using wrong document ID  
**Solution:** Verify `document_id` matches the `document` field from signature requests

### Error: Annotations not saving
**Cause:** Missing or incorrect payload structure  
**Solution:** Ensure payload includes all required fields (see payload structure above)

---

## 🧪 Testing Checklist

- [ ] Signature requests API returns correct structure
- [ ] `document_id` is extracted from `request.document`
- [ ] `esign_document_id` is extracted from `request.id`
- [ ] Console shows correct IDs before save
- [ ] API payload includes `document_id`
- [ ] Backend returns success response
- [ ] Document status updates correctly
- [ ] Toast notifications display properly

---

## 📞 API Endpoints Summary

| Endpoint | Method | Purpose | Key Fields |
|----------|--------|---------|------------|
| `/taxpayer/signatures/requests/` | GET | Fetch documents | `id`, `document`, `document_url` |
| `/taxpayer/pdf/annotations/save/` | POST | Save annotations | `document_id`, `esign_document_id` |

---

## 🎨 Console Output Examples

### Opening Modal:
```
📄 Opening annotation modal for: {
  esign_request_id: 25,
  document_id: 129,
  document_name: "signature_form.pdf"
}
```

### Saving Annotations:
```
💾 Preparing to save annotations: {
  esign_request_id: 25,
  document_id: 129,
  annotations_count: 3,
  images_count: 2,
  pdf_scale: 1.5
}
```

### API Call:
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

### Success:
```
✅ Annotations saved successfully: {
  success: true,
  data: {
    annotation_id: 789,
    status: "taxpayer_signed"
  }
}
```


