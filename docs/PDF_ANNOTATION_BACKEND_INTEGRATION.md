# PDF Annotation Backend Integration

This document explains how the frontend annotation tool integrates with the Python backend for PDF processing.

## Frontend Data Structure

When annotations are saved, the frontend sends the following data structure to the backend:

```json
{
  "pdf_url": "https://example.com/document.pdf",
  "annotations": [
    {
      "type": "image",
      "x": 150,
      "y": 200,
      "width": 120,
      "height": 80,
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "imageType": "signature",
      "relative_x": 0.1875,
      "relative_y": 0.3333,
      "relative_width": 0.15,
      "relative_height": 0.1333
    }
  ],
  "metadata": {
    "canvasWidth": 800,
    "canvasHeight": 600,
    "timestamp": "2026-01-12T12:00:00.000Z"
  },
  "processedAnnotations": {
    "annotations": [...],
    "metadata": {...},
    "processing_instructions": {
      "merge_annotations": true,
      "preserve_original_pdf": true,
      "output_format": "pdf",
      "quality": "high"
    }
  }
}
```

## Python Backend Processing

### Required Dependencies

```python
pip install PyPDF2 Pillow reportlab requests
```

### Example Python Script

```python
import json
import base64
import io
from PIL import Image
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import requests

class PDFAnnotationProcessor:
    def __init__(self):
        self.supported_image_types = ['signature', 'logo', 'stamp', 'seal']
    
    def process_annotations(self, annotation_data):
        """
        Process PDF annotations and merge them into the PDF
        
        Args:
            annotation_data (dict): Annotation data from frontend
            
        Returns:
            dict: Processed PDF information
        """
        try:
            # Download original PDF
            pdf_content = self.download_pdf(annotation_data['pdf_url'])
            
            # Load PDF
            pdf_reader = PdfReader(io.BytesIO(pdf_content))
            pdf_writer = PdfWriter()
            
            # Process each page
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                
                # Get annotations for this page
                page_annotations = self.get_page_annotations(
                    annotation_data['annotations'], 
                    page_num + 1
                )
                
                # Apply annotations to page
                if page_annotations:
                    annotated_page = self.apply_annotations_to_page(
                        page, 
                        page_annotations,
                        annotation_data['metadata']
                    )
                    pdf_writer.add_page(annotated_page)
                else:
                    pdf_writer.add_page(page)
            
            # Save processed PDF
            output_buffer = io.BytesIO()
            pdf_writer.write(output_buffer)
            
            return {
                'success': True,
                'processed_pdf': output_buffer.getvalue(),
                'annotations_applied': len(annotation_data['annotations']),
                'message': 'PDF processed successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to process PDF'
            }
    
    def download_pdf(self, pdf_url):
        """Download PDF from URL"""
        response = requests.get(pdf_url)
        response.raise_for_status()
        return response.content
    
    def get_page_annotations(self, annotations, page_number):
        """Get annotations for specific page"""
        return [
            ann for ann in annotations 
            if ann.get('page_number', 1) == page_number
        ]
    
    def apply_annotations_to_page(self, page, annotations, metadata):
        """Apply annotations to a PDF page"""
        # Create a canvas for annotations
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        
        # Get page dimensions
        page_width = float(page.mediabox[2])
        page_height = float(page.mediabox[3])
        
        for annotation in annotations:
            if annotation['type'] == 'image':
                self.apply_image_annotation(can, annotation, page_width, page_height)
            elif annotation['type'] == 'text':
                self.apply_text_annotation(can, annotation, page_width, page_height)
        
        can.save()
        
        # Merge annotation layer with original page
        annotation_reader = PdfReader(packet)
        annotation_page = annotation_reader.pages[0]
        
        # Merge pages
        page.merge_page(annotation_page)
        return page
    
    def apply_image_annotation(self, can, annotation, page_width, page_height):
        """Apply image annotation to canvas"""
        try:
            # Convert base64 to image
            image_data = base64.b64decode(annotation['image'].split(',')[1])
            image = Image.open(io.BytesIO(image_data))
            
            # Calculate position and size
            x = annotation['relative_x'] * page_width
            y = page_height - (annotation['relative_y'] * page_height) - (annotation['relative_height'] * page_height)
            width = annotation['relative_width'] * page_width
            height = annotation['relative_height'] * page_height
            
            # Draw image on canvas
            can.drawImage(
                ImageReader(image),
                x, y, width, height,
                preserveAspectRatio=True
            )
            
        except Exception as e:
            print(f"Error applying image annotation: {e}")
    
    def apply_text_annotation(self, can, annotation, page_width, page_height):
        """Apply text annotation to canvas"""
        x = annotation['relative_x'] * page_width
        y = page_height - (annotation['relative_y'] * page_height)
        
        can.setFont("Helvetica", annotation.get('font_size', 12))
        can.setFillColor(annotation.get('color', '#000000'))
        can.drawString(x, y, annotation['text'])

# Flask API Endpoint Example
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)
processor = PDFAnnotationProcessor()

@app.route('/api/taxpayer/pdf/annotations/save', methods=['POST'])
def save_annotations():
    try:
        data = request.get_json()
        
        # Process annotations
        result = processor.process_annotations(data)
        
        if result['success']:
            # Save processed PDF to storage
            output_path = f"processed_pdfs/{data['requestId']}_annotated.pdf"
            with open(output_path, 'wb') as f:
                f.write(result['processed_pdf'])
            
            return jsonify({
                'success': True,
                'message': 'Annotations processed successfully',
                'processed_pdf_url': f"/api/taxpayer/pdf/annotations/{data['requestId']}/processed",
                'annotations_applied': result['annotations_applied']
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message'],
                'error': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Server error',
            'error': str(e)
        }), 500

@app.route('/api/taxpayer/pdf/annotations/<request_id>/processed', methods=['GET'])
def get_processed_pdf(request_id):
    """Serve processed PDF"""
    try:
        pdf_path = f"processed_pdfs/{request_id}_annotated.pdf"
        return send_file(pdf_path, as_attachment=True, download_name='annotated_document.pdf')
    except FileNotFoundError:
        return jsonify({'error': 'Processed PDF not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
```

## API Endpoints

### POST /api/taxpayer/pdf/annotations/save

**Request Body:**
```json
{
  "pdf_url": "string",
  "annotations": [...],
  "metadata": {...},
  "requestId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Annotations processed successfully",
  "processed_pdf_url": "/api/taxpayer/pdf/annotations/123/processed",
  "annotations_applied": 2
}
```

### GET /api/taxpayer/pdf/annotations/<request_id>/processed

**Response:** Binary PDF file

## Integration Notes

1. **Coordinate System**: Frontend uses top-left origin (0,0), backend needs to convert to PDF coordinate system (bottom-left origin)

2. **Image Processing**: Images are sent as base64 data URLs, backend converts to PIL Images for processing

3. **Relative Coordinates**: Frontend sends both pixel and relative coordinates (0-1 scale) for better scaling

4. **Error Handling**: Backend should validate all annotations and return meaningful error messages

5. **Storage**: Processed PDFs should be stored securely with appropriate access controls

## Security Considerations

1. Validate all image uploads for size and format
2. Sanitize text annotations to prevent XSS
3. Implement rate limiting for annotation processing
4. Use secure storage for processed PDFs
5. Log all annotation processing activities

## Testing

```python
# Test the processor
test_data = {
    "pdf_url": "https://example.com/test.pdf",
    "annotations": [
        {
            "type": "image",
            "relative_x": 0.5,
            "relative_y": 0.5,
            "relative_width": 0.2,
            "relative_height": 0.1,
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            "imageType": "signature"
        }
    ],
    "metadata": {
        "canvasWidth": 800,
        "canvasHeight": 600
    }
}

processor = PDFAnnotationProcessor()
result = processor.process_annotations(test_data)
print(result)
```
