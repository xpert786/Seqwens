import React, { useState, useEffect, useRef } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { useFirmPortalColors } from '../../Context/FirmPortalColorsContext';
import { toast } from 'react-toastify';

export default function SubdomainTab() {
  const { refreshColors } = useFirmPortalColors();
  const [formData, setFormData] = useState({
    subdomain: '',
    portal_enabled: false,
    portal_title: '',
    portal_description: '',
    primary_color: '#32B582',
    secondary_color: '#F56D2D',
    support_email: ''
  });

  const [portalUrl, setPortalUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [savingAssets, setSavingAssets] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null);

  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  // Fetch subdomain settings and support email on mount
  useEffect(() => {
    const fetchSubdomainSettings = async () => {
      try {
        setLoading(true);
        setError('');

        const [subdomainResponse, supportEmailResponse] = await Promise.all([
          firmAdminSettingsAPI.getSubdomainSettings(),
          firmAdminSettingsAPI.getSupportEmail().catch(() => ({ success: false, data: { support_email: '' } })) // Gracefully handle if endpoint doesn't exist yet
        ]);

        if (subdomainResponse.success && subdomainResponse.data) {
          setFormData(prev => ({
            ...prev,
            subdomain: subdomainResponse.data.subdomain || '',
            portal_enabled: subdomainResponse.data.portal_enabled || false,
            portal_title: subdomainResponse.data.portal_title || '',
            portal_description: subdomainResponse.data.portal_description || '',
            primary_color: subdomainResponse.data.primary_color || '#1a73e8',
            secondary_color: subdomainResponse.data.secondary_color || '#34a853',
            support_email: supportEmailResponse.success && supportEmailResponse.data ? (supportEmailResponse.data.support_email || '') : ''
          }));
          setPortalUrl(subdomainResponse.data.portal_url || '');
          if (subdomainResponse.data.logo_url) {
            setLogoUrl(subdomainResponse.data.logo_url);
            setLogoPreview(subdomainResponse.data.logo_url);
          }
          if (subdomainResponse.data.favicon_url) {
            setFaviconUrl(subdomainResponse.data.favicon_url);
            setFaviconPreview(subdomainResponse.data.favicon_url);
          }
        } else {
          throw new Error(subdomainResponse.message || 'Failed to load subdomain settings');
        }
      } catch (err) {
        console.error('Error fetching subdomain settings:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load subdomain settings');
        toast.error(errorMsg || 'Failed to load subdomain settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSubdomainSettings();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear availability status when subdomain changes
    if (name === 'subdomain') {
      setAvailabilityStatus(null);
    }
  };

  // Check subdomain availability
  const handleCheckAvailability = async () => {
    const subdomain = formData.subdomain.trim();
    if (!subdomain) {
      toast.error('Please enter a subdomain');
      return;
    }

    try {
      setCheckingAvailability(true);
      setAvailabilityStatus(null);

      const response = await firmAdminSettingsAPI.checkSubdomainAvailability(subdomain);

      if (response.success) {
        setAvailabilityStatus({
          available: response.available,
          message: response.message
        });

        if (response.available) {
          toast.success(response.message || 'Subdomain is available');
        } else {
          toast.warning(response.message || 'Subdomain is already taken');
        }
      } else {
        throw new Error(response.message || 'Failed to check availability');
      }
    } catch (err) {
      console.error('Error checking subdomain availability:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to check subdomain availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Handle logo file selection
  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle favicon file selection
  const handleFaviconSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error('Favicon file size must be less than 500KB');
        return;
      }
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle apply colors only
  const handleApplyColors = async () => {
    try {
      setSavingColors(true);
      setError('');

      const colorData = {
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color
      };

      const response = await firmAdminSettingsAPI.updateSubdomainSettings(colorData, {});

      if (response.success && response.data) {
        toast.success('Portal colors updated successfully');

        // Refresh portal colors to apply new colors immediately
        refreshColors();
      } else {
        throw new Error(response.message || 'Failed to update portal colors');
      }
    } catch (err) {
      console.error('Error updating portal colors:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update portal colors');
      toast.error(errorMsg || 'Failed to update portal colors');
    } finally {
      setSavingColors(false);
    }
  };

  // Handle apply assets only
  const handleApplyAssets = async () => {
    try {
      setSavingAssets(true);
      setError('');

      // Check if there are files to upload
      if (!logoFile && !faviconFile) {
        toast.warning('Please select a logo or favicon to upload');
        setSavingAssets(false);
        return;
      }

      const files = {};
      if (logoFile) files.logo = logoFile;
      if (faviconFile) files.favicon = faviconFile;

      // Send empty data object, only files
      const response = await firmAdminSettingsAPI.updateSubdomainSettings({}, files);

      if (response.success && response.data) {
        toast.success('Portal assets updated successfully');

        // Update previews if new URLs are returned
        if (response.data.logo_url) {
          setLogoUrl(response.data.logo_url);
          setLogoPreview(response.data.logo_url);
        }
        if (response.data.favicon_url) {
          setFaviconUrl(response.data.favicon_url);
          setFaviconPreview(response.data.favicon_url);
        }

        // Clear file selections after successful upload
        setLogoFile(null);
        setFaviconFile(null);
      } else {
        throw new Error(response.message || 'Failed to update portal assets');
      }
    } catch (err) {
      console.error('Error updating portal assets:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update portal assets');
      toast.error(errorMsg || 'Failed to update portal assets');
    } finally {
      setSavingAssets(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const subdomainData = {
        subdomain: formData.subdomain.trim(),
        portal_enabled: formData.portal_enabled,
        portal_title: formData.portal_title,
        portal_description: formData.portal_description,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color
      };

      const files = {};
      if (logoFile) files.logo = logoFile;
      if (faviconFile) files.favicon = faviconFile;

      // Update subdomain settings and support email in parallel
      const [subdomainResponse, supportEmailResponse] = await Promise.all([
        firmAdminSettingsAPI.updateSubdomainSettings(subdomainData, files),
        formData.support_email ? firmAdminSettingsAPI.updateSupportEmail({ support_email: formData.support_email }) : Promise.resolve({ success: true })
      ]);

      if (subdomainResponse.success && subdomainResponse.data) {
        // Show success message for subdomain settings
        toast.success('Subdomain settings updated successfully');

        // Show success message for support email if it was updated
        if (formData.support_email && supportEmailResponse.success) {
          toast.success('Support email updated successfully');
        }

        // Update portal URL if returned
        if (subdomainResponse.data.portal_url) {
          setPortalUrl(subdomainResponse.data.portal_url);
        }

        // Update previews if new URLs are returned
        if (subdomainResponse.data.logo_url) {
          setLogoUrl(subdomainResponse.data.logo_url);
          setLogoPreview(subdomainResponse.data.logo_url);
        }
        if (subdomainResponse.data.favicon_url) {
          setFaviconUrl(subdomainResponse.data.favicon_url);
          setFaviconPreview(subdomainResponse.data.favicon_url);
        }

        // Clear file selections after successful upload
        setLogoFile(null);
        setFaviconFile(null);

        // Refresh portal colors to apply new colors immediately
        refreshColors();
      } else {
        throw new Error(subdomainResponse.message || 'Failed to update subdomain settings');
      }
    } catch (err) {
      console.error('Error updating subdomain settings:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update subdomain settings');
      toast.error(errorMsg || 'Failed to update subdomain settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading subdomain settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subdomain Configuration */}


        {/* Color Scheme */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Portal Colors
            </h3>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Customize your portal's color scheme
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                  <div
                    className="w-12 h-8 !rounded-lg cursor-pointer"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <input
                    type="color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  name="primary_color"
                  value={formData.primary_color}
                  onChange={handleInputChange}
                  className="flex-1 rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                  <div
                    className="w-12 h-8 !rounded-lg cursor-pointer"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                  <input
                    type="color"
                    name="secondary_color"
                    value={formData.secondary_color}
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  name="secondary_color"
                  value={formData.secondary_color}
                  onChange={handleInputChange}
                  className="flex-1 rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleApplyColors}
              disabled={savingColors}
              className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingColors ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Portal Assets
            </h3>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Upload logo and favicon for your portal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-20 h-20 object-contain rounded-lg border border-[#E8F0FF]"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn('Failed to load logo preview from B2');
                        // Keep showing broken image or could set to null
                      }}
                    />
                  ) : (
                    <svg width="80" height="80" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="69" height="69" rx="9.5" fill="#E8F0FF" />
                      <rect x="0.5" y="0.5" width="69" height="69" rx="9.5" stroke="#E8F0FF" />
                      <path d="M26.5 49.1693V23.6693C26.5 22.9178 26.7985 22.1972 27.3299 21.6658C27.8612 21.1344 28.5819 20.8359 29.3333 20.8359H40.6667C41.4181 20.8359 42.1388 21.1344 42.6701 21.6658C43.2015 22.1972 43.5 22.9178 43.5 23.6693V49.1693H26.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.91683 4.66667L7.00016 1.75L4.0835 4.66667" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 1.75V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {logoFile ? logoFile.name : 'Upload Logo'}
                  </button>
                  <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Favicon
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center">
                  {faviconPreview ? (
                    <img
                      src={faviconPreview}
                      alt="Favicon preview"
                      className="w-12 h-12 object-contain rounded-lg border border-[#E8F0FF]"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn('Failed to load favicon preview from B2');
                        // Keep showing broken image or could set to null
                      }}
                    />
                  ) : (
                    <svg width="50" height="50" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" fill="#E8F0FF" />
                      <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" stroke="#E8F0FF" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon"
                    onChange={handleFaviconSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-[#E8F0FF] transition font-[BasisGrotesquePro] flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.91683 4.66667L7.00016 1.75L4.0835 4.66667" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 1.75V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {faviconFile ? faviconFile.name : 'Upload Favicon'}
                  </button>
                  <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">PNG, ICO up to 500KB</p>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleApplyAssets}
                disabled={savingAssets || (!logoFile && !faviconFile)}
                className="mt-4 px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingAssets ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Logo & Favicon */}


      {/* Save Button */}

    </div>
  );
}
