import React, { useState, useEffect } from 'react';
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';
import { toast } from 'react-toastify';
import { superToastOptions } from '../../utils/toastConfig';

export default function UsagePerformance() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    uptime: null,
    avg_response_time: null,
    error_rate: null,
    api_calls_24h: null,
    data_processed: null,
    active_connections: null,
  });

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getPerformanceMetrics();
      
      if (response.success && response.data) {
        setMetrics({
          uptime: response.data.uptime || null,
          avg_response_time: response.data.avg_response_time || null,
          error_rate: response.data.error_rate || null,
          api_calls_24h: response.data.api_calls_24h || null,
          data_processed: response.data.data_processed || null,
          active_connections: response.data.active_connections || null,
        });
      } else {
        // If API doesn't return success, try to use the data directly
        if (response.uptime !== undefined || response.avg_response_time !== undefined) {
          setMetrics({
            uptime: response.uptime || null,
            avg_response_time: response.avg_response_time || null,
            error_rate: response.error_rate || null,
            api_calls_24h: response.api_calls_24h || null,
            data_processed: response.data_processed || null,
            active_connections: response.active_connections || null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to load performance metrics', superToastOptions);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract value from object or return as is
  const getValue = (data) => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'object' && data.value !== undefined) {
      return data.value;
    }
    return data;
  };

  // Helper function to get formatted display value from object
  const getFormattedValue = (data, defaultFormat) => {
    if (data === null || data === undefined) return 'N/A';
    
    // If it's an object with value, unit, and label structure
    if (typeof data === 'object' && data.value !== undefined) {
      const value = data.value;
      const unit = data.unit || '';
      const label = data.label || '';
      
      // Format based on label or unit type
      const labelLower = label.toLowerCase();
      
      // Percentage formatting
      if (labelLower.includes('percentage') || labelLower.includes('uptime') || labelLower.includes('error rate') || unit === '%') {
        return formatPercentage(value, '%');
      }
      
      // Time formatting
      if (labelLower.includes('time') || labelLower.includes('response') || unit === 'ms' || unit === 's') {
        return formatTime(value, unit || 'ms');
      }
      
      // Number formatting
      if (typeof value === 'number') {
        // Handle decimal values (like data_processed with TB)
        if (value % 1 !== 0 || (value === 0 && unit && unit.toLowerCase().includes('tb'))) {
          // For decimal numbers, show appropriate precision
          if (unit && unit.trim()) {
            return `${value.toFixed(2)}${unit}`;
          }
          return value.toFixed(2);
        }
        
        // Integer values
        if (unit && unit.trim()) {
          // Add space before unit if it's not empty
          return formatNumber(value, ` ${unit}`);
        }
        return formatNumber(value);
      }
      
      return value;
    }
    
    // Fallback to default format
    return defaultFormat ? defaultFormat(data) : data;
  };

  // Helper function to get label from object
  const getMetricLabel = (data, defaultLabel) => {
    if (data === null || data === undefined) return defaultLabel;
    if (typeof data === 'object' && data.label) {
      return data.label;
    }
    return defaultLabel;
  };

  // Format number with commas and optional unit
  const formatNumber = (num, unit = '') => {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num === 'number') {
      const formatted = num.toLocaleString();
      // Handle decimal places for large numbers
      if (num >= 1000 && num % 1 === 0) {
        return unit ? `${formatted}${unit}` : formatted;
      }
      return unit ? `${formatted}${unit}` : formatted;
    }
    return num;
  };

  // Format percentage
  const formatPercentage = (num, unit = '%') => {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num === 'number') {
      // For percentages, show 2 decimal places
      return `${num.toFixed(2)}${unit}`;
    }
    return num;
  };

  // Format time with unit
  const formatTime = (num, unit = 'ms') => {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num === 'number') {
      return `${num}${unit}`;
    }
    return num;
  };

  return (
    <div className="transition-all duration-500 ease-in-out h-fit mb-8">
      {/* System Performance Metrics */}
      <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>System Performance Metrics</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Real-time platform health and performance indicators</p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B4A66]"></div>
            <p className="text-sm text-[#6B7280] mt-2" style={{fontFamily: 'BasisGrotesquePro'}}>Loading metrics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Uptime */}
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="text-3xl font-bold mb-1" style={{color: '#22C55E'}}>
                {getFormattedValue(metrics.uptime, formatPercentage)}
              </div>
              <div className="text-sm font-medium" style={{color: '#3B4A66'}}>
                {getMetricLabel(metrics.uptime, 'Uptime')}
              </div>
            </div>
            
            {/* Avg Response Time */}
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="text-3xl font-bold mb-1" style={{color: '#3AD6F2'}}>
                {getFormattedValue(metrics.avg_response_time, formatTime)}
              </div>
              <div className="text-sm font-medium" style={{color: '#3B4A66'}}>
                {getMetricLabel(metrics.avg_response_time, 'Avg Response Time')}
              </div>
            </div>
            
            {/* Error Rate */}
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="text-3xl font-bold mb-1" style={{color: '#EF4444'}}>
                {getFormattedValue(metrics.error_rate, formatPercentage)}
              </div>
              <div className="text-sm font-medium" style={{color: '#3B4A66'}}>
                {getMetricLabel(metrics.error_rate, 'Error Rate')}
              </div>
            </div>
            
            {/* API Calls (24h) */}
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="text-3xl font-bold mb-1" style={{color: '#1E40AF'}}>
                {getFormattedValue(metrics.api_calls_24h, formatNumber)}
              </div>
              <div className="text-sm font-medium" style={{color: '#3B4A66'}}>
                {getMetricLabel(metrics.api_calls_24h, 'API Calls (24h)')}
              </div>
            </div>
            
            {/* Data Processed */}
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="text-3xl font-bold mb-1" style={{color: '#F49C2D'}}>
                {getFormattedValue(metrics.data_processed, formatNumber)}
              </div>
              <div className="text-sm font-medium" style={{color: '#3B4A66'}}>
                {getMetricLabel(metrics.data_processed, 'Data Processed')}
              </div>
            </div>
            
            {/* Active Connections */}
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="text-3xl font-bold mb-1" style={{color: '#22C55E'}}>
                {getFormattedValue(metrics.active_connections, formatNumber)}
              </div>
              <div className="text-sm font-medium" style={{color: '#3B4A66'}}>
                {getMetricLabel(metrics.active_connections, 'Active Connections')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

