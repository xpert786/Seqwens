# Tax Preparer PDF Annotations Save API

## Endpoint
```
POST /api/tax-preparer/pdf/annotations/save/
```

## Base URL
```
http://168.231.121.7/seqwens/api/tax-preparer/pdf/annotations/save/
```

## Description
This API endpoint allows tax preparers to save PDF annotations (drawings and images) with coordinates automatically converted to A4 page dimensions (595.276 x 841.890 points). The coordinates are normalized for easier PDF placement.

## Authentication
Requires Bearer token authentication.

**Header:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Request Body

### Payload Structure
```json
{
  "document_id": 141,
  "esign_document_id": 33,
  "pdf_url": "https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form.pdf",
  "annotations": [
    {
      "id": "annotation-0",
      "type": "drawing",
      "page": 1,
      "signer": "preparer",
      "data": {
        "path": [
          {
            "x": 150.25,
            "y": 300.50
          },
          {
            "x": 152.30,
            "y": 325.75
          }
        ],
        "color": "#000000",
        "width": 2.0
      }
    }
  ],
  "images": [
    {
      "id": "image-1234567890",
      "page": 1,
      "x": 200.50,
      "y": 400.75,
      "width": 150.25,
      "height": 75.50,
      "src": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "signer": "preparer"
    }
  ],
  "pdf_scale": 1.0,
  "page_size": "A4",
  "page_width": 595.276,
  "page_height": 841.890,
  "canvas_info": {
    "original_width": 1200,
    "original_height": 900,
    "original_scale": 1.5
  },
  "metadata": {
    "request_id": 33,
    "document_id": 141,
    "document_url": "https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form.pdf",
    "document_name": "signature_form.pdf",
    "timestamp": "2026-01-13T08:00:00.000Z",
    "canvas_info": {
      "width": 1200,
      "height": 900
    },
    "coordinate_system": "A4"
  },
  "processing_options": {
    "add_signatures": true,
    "merge_images": true,
    "preserve_quality": true,
    "output_format": "pdf"
  }
}
```

### Field Descriptions

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `document_id` | integer | The document ID from the e-signature request |
| `esign_document_id` | integer | The e-signature request ID |
| `pdf_url` | string | URL of the PDF document to annotate |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `annotations` | array | Array of drawing annotations (default: `[]`) |
| `images` | array | Array of image annotations (default: `[]`) |
| `pdf_scale` | float | PDF scale factor (default: `1.0` for A4 coordinates) |
| `page_size` | string | Page size identifier (default: `"A4"`) |
| `page_width` | float | Page width in points (default: `595.276` for A4) |
| `page_height` | float | Page height in points (default: `841.890` for A4) |
| `canvas_info` | object | Original canvas dimensions and scale |
| `metadata` | object | Additional metadata about the annotation |
| `processing_options` | object | Processing instructions for the backend |

#### Annotation Object Structure

**Drawing Annotation:**
```json
{
  "id": "string",           // Unique annotation ID
  "type": "drawing",       // Annotation type
  "page": 1,               // Page number (1-indexed)
  "signer": "preparer",    // Signer identifier
  "data": {
    "path": [              // Array of path points
      {
        "x": 150.25,       // X coordinate in A4 points
        "y": 300.50        // Y coordinate in A4 points
      }
    ],
    "color": "#000000",    // Stroke color (hex)
    "width": 2.0           // Stroke width in points
  }
}
```

**Image Annotation:**
```json
{
  "id": "string",          // Unique image ID
  "page": 1,               // Page number (1-indexed)
  "x": 200.50,             // X position in A4 points
  "y": 400.75,             // Y position in A4 points
  "width": 150.25,         // Width in A4 points
  "height": 75.50,         // Height in A4 points
  "src": "string",         // Base64 data URL or image URL
  "signer": "preparer"     // Signer identifier
}
```

#### Canvas Info Object
```json
{
  "original_width": 1200,   // Original canvas width in pixels
  "original_height": 900,   // Original canvas height in pixels
  "original_scale": 1.5     // Original PDF scale factor
}
```

#### Metadata Object
```json
{
  "request_id": 33,         // E-signature request ID
  "document_id": 141,      // Document ID
  "document_url": "string", // Document URL
  "document_name": "string", // Document filename
  "timestamp": "ISO8601",   // Timestamp
  "canvas_info": {},        // Canvas dimensions
  "coordinate_system": "A4"  // Coordinate system identifier
}
```

#### Processing Options Object
```json
{
  "add_signatures": true,      // Whether to add signatures to PDF
  "merge_images": true,       // Whether to merge images into PDF
  "preserve_quality": true,    // Whether to preserve image quality
  "output_format": "pdf"      // Output format (default: "pdf")
}
```

## Coordinate System

### A4 Page Dimensions
- **Width:** 595.276 points (210mm)
- **Height:** 841.890 points (297mm)

### Coordinate Conversion
The frontend automatically converts canvas coordinates to A4 page coordinates:
1. Canvas coordinates are divided by the PDF scale factor
2. Coordinates are normalized to the PDF page dimensions
3. Final coordinates are scaled to A4 dimensions (595.276 x 841.890 points)
4. All coordinates are rounded to 2 decimal places

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "annotation_id": 789,
    "status": "preparer_signed",
    "preparer_signed": true,
    "taxpayer_signed": false,
    "requires_preparer_signature": true,
    "processed_pdf_url": "https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form_annotated_abc123.pdf",
    "document_id": 141,
    "esign_document_id": 33,
    "created_at": "2026-01-13T08:00:00.000Z",
    "updated_at": "2026-01-13T08:00:05.000Z"
  },
  "message": "Preparer annotations saved and processed successfully"
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "document_id is required",
  "errors": {
    "document_id": ["This field is required."]
  }
}
```

### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Authentication credentials were not provided.",
  "detail": "Authentication credentials were not provided."
}
```

### Error Response (403 Forbidden)
```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "detail": "You do not have permission to perform this action."
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Document not found",
  "detail": "The specified document does not exist."
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Internal server error",
  "detail": "An error occurred while processing the request."
}
```

## Response Fields

### Success Response Data

| Field | Type | Description |
|-------|------|-------------|
| `annotation_id` | integer | Unique identifier for the saved annotation set |
| `status` | string | Current status of the e-signature request |
| `preparer_signed` | boolean | Whether the preparer has signed |
| `taxpayer_signed` | boolean | Whether the taxpayer has signed |
| `requires_preparer_signature` | boolean | Whether preparer signature is required |
| `processed_pdf_url` | string | URL of the processed PDF with annotations applied |
| `document_id` | integer | The document ID |
| `esign_document_id` | integer | The e-signature request ID |
| `created_at` | string | ISO 8601 timestamp of creation |
| `updated_at` | string | ISO 8601 timestamp of last update |

## Example cURL Request

```bash
curl -X POST "http://168.231.121.7/seqwens/api/tax-preparer/pdf/annotations/save/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 141,
    "esign_document_id": 33,
    "pdf_url": "https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form.pdf",
    "annotations": [
      {
        "id": "annotation-0",
        "type": "drawing",
        "page": 1,
        "signer": "preparer",
        "data": {
          "path": [
            {"x": 150.25, "y": 300.50},
            {"x": 152.30, "y": 325.75}
          ],
          "color": "#000000",
          "width": 2.0
        }
      }
    ],
    "images": [
      {
        "id": "image-1234567890",
        "page": 1,
        "x": 200.50,
        "y": 400.75,
        "width": 150.25,
        "height": 75.50,
        "src": "data:image/png;base64,iVBORw0KGgoAAAANS...",
        "signer": "preparer"
      }
    ],
    "pdf_scale": 1.0,
    "page_size": "A4",
    "page_width": 595.276,
    "page_height": 841.890,
    "canvas_info": {
      "original_width": 1200,
      "original_height": 900,
      "original_scale": 1.5
    },
    "metadata": {
      "request_id": 33,
      "document_id": 141,
      "document_url": "https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form.pdf",
      "document_name": "signature_form.pdf",
      "timestamp": "2026-01-13T08:00:00.000Z",
      "coordinate_system": "A4"
    },
    "processing_options": {
      "add_signatures": true,
      "merge_images": true,
      "preserve_quality": true,
      "output_format": "pdf"
    }
  }'
```

## Example JavaScript Request

```javascript
const savePreparerAnnotations = async (annotationData) => {
  const API_BASE_URL = 'http://168.231.121.7/seqwens/api';
  const token = 'YOUR_ACCESS_TOKEN';
  
  const payload = {
    document_id: 141,
    esign_document_id: 33,
    pdf_url: 'https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form.pdf',
    annotations: [
      {
        id: 'annotation-0',
        type: 'drawing',
        page: 1,
        signer: 'preparer',
        data: {
          path: [
            { x: 150.25, y: 300.50 },
            { x: 152.30, y: 325.75 }
          ],
          color: '#000000',
          width: 2.0
        }
      }
    ],
    images: [
      {
        id: 'image-1234567890',
        page: 1,
        x: 200.50,
        y: 400.75,
        width: 150.25,
        height: 75.50,
        src: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        signer: 'preparer'
      }
    ],
    pdf_scale: 1.0,
    page_size: 'A4',
    page_width: 595.276,
    page_height: 841.890,
    canvas_info: {
      original_width: 1200,
      original_height: 900,
      original_scale: 1.5
    },
    metadata: {
      request_id: 33,
      document_id: 141,
      document_url: 'https://seqwens-s3.s3.amazonaws.com/tax_documents/user_10/2026/signature_form.pdf',
      document_name: 'signature_form.pdf',
      timestamp: new Date().toISOString(),
      coordinate_system: 'A4'
    },
    processing_options: {
      add_signatures: true,
      merge_images: true,
      preserve_quality: true,
      output_format: 'pdf'
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/tax-preparer/pdf/annotations/save/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    console.log('Annotations saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving annotations:', error);
    throw error;
  }
};
```

## Notes

1. **Coordinate System**: All coordinates are automatically converted to A4 page dimensions (595.276 x 841.890 points) by the frontend before sending to the API.

2. **Image Format**: Images should be provided as base64 data URLs or accessible URLs. Base64 format: `data:image/png;base64,<base64_string>`.

3. **Page Numbers**: Page numbers are 1-indexed (first page is page 1).

4. **Signer Field**: The `signer` field identifies who created the annotation. For preparer annotations, this should be set to `"preparer"`.

5. **Processing**: The backend processes the annotations and merges them into the PDF. The processed PDF URL is returned in the response.

6. **Error Handling**: Always check the `success` field in the response. If `success` is `false`, check the `message` field for error details.

7. **Authentication**: The API requires a valid Bearer token. Tokens expire and may need to be refreshed.

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Annotations saved and processed |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - User doesn't have permission |
| 404 | Not Found - Document or request not found |
| 500 | Internal Server Error - Server error |

## Related Endpoints

- `POST /api/taxpayer/pdf/annotations/save/` - Save taxpayer annotations
- `GET /api/tax-preparer/pdf/annotations/{annotation_id}/` - Get annotation details
- `DELETE /api/tax-preparer/pdf/annotations/{annotation_id}/` - Delete annotations


