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
      
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: annotationData.requestId,
          pdf_url: annotationData.pdfUrl || annotationData.document_url,
          annotations: annotationData.annotations || [],
          images: annotationData.images || [],
          metadata: annotationData.metadata || {},
          // Backend processing instructions for Python script
          processing_options: {
            add_signatures: true,
            merge_images: true,
            preserve_quality: true,
            output_format: 'pdf'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        message: 'Annotations saved and processed successfully'
      };
    } catch (error) {
      console.error('Error saving annotations:', error);
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
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/${annotationId}/processed`, {
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

      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/upload-image`, {
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
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/history`, {
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
      const response = await fetch(`${API_BASE_URL}/taxpayer/pdf/annotations/${annotationId}`, {
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
