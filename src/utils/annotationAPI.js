/**
 * Annotation API for PDF processing
 * Handles communication with Python backend for signature placement and PDF processing
 */

import { getApiBaseUrl } from '../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../ClientOnboarding/utils/userUtils';

const getAPIBaseUrl = () => {
  try {
    return getApiBaseUrl();
  } catch {
    return '/api';
  }
};

export const annotationAPI = {
  /**
   * Save annotations and send to Python script for processing
   * @param {Object} annotationData - Complete annotation data including PDF info and annotations
   * @returns {Promise} API response
   */
  saveAnnotations: async (annotationData) => {
    try {
      const API_BASE_URL = getAPIBaseUrl();
      const token = getAccessToken();
      
      const payload = {
        document_id: annotationData.requestId || annotationData.documentId,  // Backend expects document_id
        esign_document_id: annotationData.esign_document_id,  // E-signature request ID
          pdf_url: annotationData.pdfUrl || annotationData.document_url,
          annotations: annotationData.annotations || [],
          images: annotationData.images || [],
        spouse_annotations: annotationData.spouse_annotations || [],
        spouse_images: annotationData.spouse_images || [],
        pdf_scale: annotationData.pdf_scale || 1.5,
        zoom_percentage: annotationData.zoom_percentage || Math.round((annotationData.pdf_scale || 1.5) * 100), // Zoom percentage for backend processing
        canvas_info: annotationData.canvas_info || annotationData.metadata?.canvas_info,
          metadata: annotationData.metadata || {},
          // Backend processing instructions for Python script
          processing_options: {
            add_signatures: true,
            merge_images: true,
            preserve_quality: true,
            output_format: 'pdf'
          }
      };
      
      console.log('📤 Saving annotations to backend:', {
        url: `${API_BASE_URL}/taxpayer/pdf/annotations/save/`,
        document_id: payload.document_id,
        esign_document_id: payload.esign_document_id,
        annotations_count: payload.annotations.length,
        images_count: payload.images.length,
        spouse_annotations_count: payload.spouse_annotations.length,
        spouse_images_count: payload.spouse_images.length,
        pdf_scale: payload.pdf_scale
      });
      
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/save/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Backend error response:', {
          status: response.status,
          message: data.message || 'Unknown error',
          data: data
        });
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Annotations saved successfully:', data);
      return {
        success: true,
        data: data,
        message: data.message || 'Annotations saved and processed successfully'
      };
    } catch (error) {
      console.error('❌ Error saving annotations:', error);
      return {
        success: false,
        message: error.message || 'Failed to save annotations'
      };
    }
  },

  /**
   * Get processed PDF with annotations applied
   * @param {string} annotationId - ID of the annotation set
   * @returns {Promise} API response with processed PDF URL
   */
  getProcessedPDF: async (annotationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/${annotationId}/processed/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        processed_pdf_url: data.processed_pdf_url
      };
    } catch (error) {
      console.error('Error getting processed PDF:', error);
      return {
        success: false,
        message: error.message || 'Failed to get processed PDF'
      };
    }
  },

  /**
   * Upload image for annotation (signature, logo, etc.)
   * @param {File} imageFile - Image file to upload
   * @param {string} imageType - Type of image (signature, logo, stamp)
   * @returns {Promise} API response with image URL
   */
  uploadAnnotationImage: async (imageFile, imageType = 'signature') => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('image_type', imageType);

      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/upload-image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        image_url: data.image_url
      };
    } catch (error) {
      console.error('Error uploading annotation image:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload image'
      };
    }
  },

  /**
   * Get annotation history for a PDF
   * @param {string} pdfUrl - PDF URL
   * @returns {Promise} API response with annotation history
   */
  getAnnotationHistory: async (pdfUrl) => {
    try {
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/history/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ pdf_url: pdfUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        annotations: data.annotations || []
      };
    } catch (error) {
      console.error('Error getting annotation history:', error);
      return {
        success: false,
        message: error.message || 'Failed to get annotation history',
        annotations: []
      };
    }
  },

  /**
   * Delete annotation set
   * @param {string} annotationId - ID of annotation set to delete
   * @returns {Promise} API response
   */
  deleteAnnotations: async (annotationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/${annotationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        message: 'Annotations deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting annotations:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete annotations'
      };
    }
  },

  /**
   * Save annotations for tax preparer with A4 coordinate conversion
   * @param {Object} annotationData - Complete annotation data including PDF info and annotations
   * @returns {Promise} API response
   */
  savePreparerAnnotations: async (annotationData) => {
    try {
      const API_BASE_URL = getAPIBaseUrl();
      const token = getAccessToken();
      
      // A4 page dimensions in points (PDF standard)
      const A4_WIDTH = 595.276;  // 210mm
      const A4_HEIGHT = 841.890; // 297mm
      
      // Get canvas dimensions from annotation data
      const canvasWidth = annotationData.canvas_info?.width || annotationData.canvasWidth || 800;
      const canvasHeight = annotationData.canvas_info?.height || annotationData.canvasHeight || 600;
      const pdfScale = annotationData.pdf_scale || 1.5;
      
      // Convert coordinates from canvas to A4 page coordinates
      const convertToA4Coordinates = (x, y, width, height) => {
        // Calculate the actual PDF page dimensions at the current scale
        const pdfPageWidth = canvasWidth / pdfScale;
        const pdfPageHeight = canvasHeight / pdfScale;
        
        // Convert canvas coordinates to PDF page coordinates
        const pdfX = x / pdfScale;
        const pdfY = y / pdfScale;
        const pdfWidth = width / pdfScale;
        const pdfHeight = height / pdfScale;
        
        // Scale to A4 dimensions (assuming the PDF is A4 size)
        const a4X = (pdfX / pdfPageWidth) * A4_WIDTH;
        const a4Y = (pdfY / pdfPageHeight) * A4_HEIGHT;
        const a4Width = (pdfWidth / pdfPageWidth) * A4_WIDTH;
        const a4Height = (pdfHeight / pdfPageHeight) * A4_HEIGHT;
        
        return {
          x: Math.round(a4X * 100) / 100, // Round to 2 decimal places
          y: Math.round(a4Y * 100) / 100,
          width: Math.round(a4Width * 100) / 100,
          height: Math.round(a4Height * 100) / 100
        };
      };
      
      // Convert annotations (drawings) to A4 coordinates
      const convertAnnotations = (annotations) => {
        return annotations.map(ann => {
          if (ann.type === 'drawing' && ann.data && ann.data.path) {
            // Convert drawing path coordinates
            const convertedPath = ann.data.path.map(point => {
              const pdfX = point.x / pdfScale;
              const pdfY = point.y / pdfScale;
              const pdfPageWidth = canvasWidth / pdfScale;
              const pdfPageHeight = canvasHeight / pdfScale;
              
              const a4X = (pdfX / pdfPageWidth) * A4_WIDTH;
              const a4Y = (pdfY / pdfPageHeight) * A4_HEIGHT;
              
              return {
                x: Math.round(a4X * 100) / 100,
                y: Math.round(a4Y * 100) / 100
              };
            });
            
            return {
              id: ann.id,
              type: ann.type,
              page: ann.page,
              signer: ann.signer || 'preparer',
              data: {
                path: convertedPath,
                color: ann.data.color,
                width: ann.data.width ? Math.round((ann.data.width / pdfScale) * (A4_WIDTH / (canvasWidth / pdfScale)) * 100) / 100 : ann.data.width
              }
            };
          }
          return ann;
        });
      };
      
      // Convert images to A4 coordinates
      const convertImages = (images) => {
        return images.map(img => {
          const converted = convertToA4Coordinates(img.x, img.y, img.width, img.height);
          return {
            id: img.id,
            page: img.page,
            x: converted.x,
            y: converted.y,
            width: converted.width,
            height: converted.height,
            src: img.src,
            signer: img.signer || 'preparer'
          };
        });
      };
      
      const payload = {
        document_id: annotationData.requestId || annotationData.documentId,
        esign_document_id: annotationData.esign_document_id,
        pdf_url: annotationData.pdfUrl || annotationData.document_url,
        annotations: convertAnnotations(annotationData.annotations || []),
        images: convertImages(annotationData.images || []),
        pdf_scale: 1.0, // A4 coordinates are already normalized
        zoom_percentage: annotationData.zoom_percentage || Math.round((annotationData.pdf_scale || 1.5) * 100), // Zoom percentage for backend processing
        page_size: 'A4', // Specify A4 page size
        page_width: A4_WIDTH,
        page_height: A4_HEIGHT,
        canvas_info: {
          original_width: canvasWidth,
          original_height: canvasHeight,
          original_scale: pdfScale
        },
        metadata: {
          ...annotationData.metadata,
          coordinate_system: 'A4',
          timestamp: new Date().toISOString()
        },
        processing_options: {
          add_signatures: true,
          merge_images: true,
          preserve_quality: true,
          output_format: 'pdf'
        }
      };
      
      console.log('📤 Saving preparer annotations to backend:', {
        url: `${API_BASE_URL}/tax-preparer/pdf/annotations/save/`,
        document_id: payload.document_id,
        esign_document_id: payload.esign_document_id,
        annotations_count: payload.annotations.length,
        images_count: payload.images.length,
        page_size: payload.page_size,
        page_dimensions: `${payload.page_width}x${payload.page_height}`
      });
      
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
        console.error('❌ Backend error response:', {
          status: response.status,
          message: data.message || 'Unknown error',
          data: data
        });
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Preparer annotations saved successfully:', data);
      return {
        success: true,
        data: data,
        message: data.message || 'Preparer annotations saved and processed successfully'
      };
    } catch (error) {
      console.error('❌ Error saving preparer annotations:', error);
      return {
        success: false,
        message: error.message || 'Failed to save preparer annotations'
      };
    }
  }
};

/**
 * Helper function to prepare annotation data for Python backend
 * @param {Object} annotations - Raw annotation data
 * @param {Object} canvasInfo - Canvas dimensions and metadata
 * @returns {Object} Processed annotation data ready for backend
 */
export const prepareAnnotationDataForPython = (annotations, canvasInfo) => {
  return {
    annotations: annotations.map(annotation => ({
      type: annotation.type,
      // Convert pixel coordinates to relative coordinates (0-1 scale)
      relative_x: annotation.x / canvasInfo.width,
      relative_y: annotation.y / canvasInfo.height,
      relative_width: annotation.width / canvasInfo.width,
      relative_height: annotation.height / canvasInfo.height,
      // Additional metadata for Python processing
      page_number: annotation.page_number || 1,
      z_index: annotation.z_index || 0,
      // Type-specific data
      ...(annotation.type === 'image' && {
        image_type: annotation.imageType || 'signature',
        image_data: annotation.image, // Base64 or URL
        opacity: annotation.opacity || 1.0,
        rotation: annotation.rotation || 0
      }),
      ...(annotation.type === 'text' && {
        text_content: annotation.text,
        font_family: annotation.fontFamily || 'Arial',
        font_size: annotation.fontSize || 16,
        color: annotation.color || '#000000',
        alignment: annotation.alignment || 'left'
      })
    })),
    metadata: {
      canvas_width: canvasInfo.width,
      canvas_height: canvasInfo.height,
      pdf_original_width: canvasInfo.pdfWidth,
      pdf_original_height: canvasInfo.pdfHeight,
      scale_factor: canvasInfo.scale || 1.0,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    },
    processing_instructions: {
      merge_annotations: true,
      preserve_original_pdf: true,
      output_format: 'pdf',
      quality: 'high',
      compression: 'medium'
    }
  };
};

export default annotationAPI;
