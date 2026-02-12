import React, { useState, useEffect, useRef } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getMediaUrl } from '../../../ClientOnboarding/utils/urlUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useFirmSettings } from '../../Context/FirmSettingsContext';

export default function BrandingTab() {
  const { refreshBranding } = useFirmSettings();
  const [formData, setFormData] = useState({
    primary_color: '#1E40AF',
    secondary_color: '#22C55E',
    accent_color: '#F56D2D',
    font_family: 'Inter',
    custom_domain: '',
    white_label_enabled: false,
    branding_login_url: '',
    favicon_url: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [showResetBrandingConfirm, setShowResetBrandingConfirm] = useState(false);
  const [faviconFile, setFaviconFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreviewPassword, setShowPreviewPassword] = useState(false);

  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  // Fetch branding information on mount
  useEffect(() => {
    const fetchBrandingInfo = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await firmAdminSettingsAPI.getBrandingInfo();

        if (response.success && response.data) {
          setFormData({
            primary_color: response.data.primary_color || '#1E40AF',
            secondary_color: response.data.secondary_color || '#22C55E',
            accent_color: response.data.accent_color || '#F56D2D',
            font_family: response.data.font_family || 'Inter',
            custom_domain: response.data.custom_domain || '',
            white_label_enabled: response.data.white_label_enabled || false,
            branding_login_url: response.data.branding_login_url || '',
            favicon_url: response.data.favicon_url || ''
          });

          // Set logo and favicon previews if URLs exist
          if (response.data.logo_url) {
            setLogoPreview(getMediaUrl(response.data.logo_url));
          }
          if (response.data.favicon_url) {
            setFaviconPreview(getMediaUrl(response.data.favicon_url));
          }
        } else {
          throw new Error(response.message || 'Failed to load branding information');
        }
      } catch (err) {
        console.error('Error fetching branding info:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load branding information');
        toast.error(errorMsg || 'Failed to load branding information');
      } finally {
        setLoading(false);
      }
    };

    fetchBrandingInfo();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      if (file.size > 1024 * 1024) {
        toast.error('Favicon file size must be less than 1MB');
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

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const brandingData = {
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        font_family: formData.font_family,
        custom_domain: formData.custom_domain,
        white_label_enabled: formData.white_label_enabled,
        branding_login_url: formData.branding_login_url
      };

      const files = {};
      if (logoFile) files.logo = logoFile;
      if (faviconFile) files.favicon = faviconFile;

      const response = await firmAdminSettingsAPI.updateBrandingInfo(brandingData, files);

      if (response.success && response.data) {
        toast.success('Branding information updated successfully');
        // Update previews if new URLs are returned
        if (response.data.logo_url) {
          setLogoPreview(getMediaUrl(response.data.logo_url));
        }
        if (response.data.favicon_url) {
          setFaviconPreview(getMediaUrl(response.data.favicon_url));
        }
        // Clear file selections after successful upload
        setLogoFile(null);
        setFaviconFile(null);
      } else {
        throw new Error(response.message || 'Failed to update branding information');
      }
    } catch (err) {
      console.error('Error updating branding info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update branding information');
      toast.error(errorMsg || 'Failed to update branding information');
    } finally {
      setSaving(false);
      refreshBranding();
    }
  };

  // Handle reset branding
  const handleResetBranding = async () => {
    setShowResetBrandingConfirm(true);
  };

  const confirmResetBranding = async () => {
    try {
      setSaving(true);
      const defaultData = {
        primary_color: '#1E40AF',
        secondary_color: '#22C55E',
        accent_color: '#F56D2D',
        font_family: 'Inter',
        custom_domain: '',
        white_label_enabled: false,
        branding_login_url: ''
      };

      const response = await firmAdminSettingsAPI.updateBrandingInfo(defaultData);

      if (response.success) {
        setFormData({
          ...formData,
          ...defaultData
        });
        toast.success('Branding reset to default values');
      } else {
        throw new Error(response.message || 'Failed to reset branding');
      }
    } catch (err) {
      console.error('Error resetting branding:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to reset branding');
    } finally {
      setSaving(false);
      refreshBranding();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading branding information...</p>
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
        {/* Logo & Assets */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Logo & Assets
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Upload your firm's visual assets
            </p>
          </div>

          <div className="space-y-6">
            {/* Firm Logo */}
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Firm Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      crossOrigin="anonymous"
                      className="w-20 h-20 object-contain rounded-lg border border-[#E8F0FF]"
                    />
                  ) : (
                    <svg width="80" height="80" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="69" height="69" rx="9.5" fill="#E8F0FF" />
                      <rect x="0.5" y="0.5" width="69" height="69" rx="9.5" stroke="#E8F0FF" />
                      <path d="M26.5 49.1693V23.6693C26.5 22.9178 26.7985 22.1972 27.3299 21.6658C27.8612 21.1344 28.5819 20.8359 29.3333 20.8359H40.6667C41.4181 20.8359 42.1388 21.1344 42.6701 21.6658C43.2015 22.1972 43.5 22.9178 43.5 23.6693V49.1693H26.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M26.5002 35H23.6668C22.9154 35 22.1947 35.2985 21.6634 35.8299C21.132 36.3612 20.8335 37.0819 20.8335 37.8333V46.3333C20.8335 47.0848 21.132 47.8054 21.6634 48.3368C22.1947 48.8682 22.9154 49.1667 23.6668 49.1667H26.5002" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M43.5 30.75H46.3333C47.0848 30.75 47.8054 31.0485 48.3368 31.5799C48.8682 32.1112 49.1667 32.8319 49.1667 33.5833V46.3333C49.1667 47.0848 48.8682 47.8054 48.3368 48.3368C47.8054 48.8682 47.0848 49.1667 46.3333 49.1667H43.5" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M32.1665 26.5H37.8332" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M32.1665 32.1641H37.8332" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M32.1665 37.8359H37.8332" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M32.1665 43.5H37.8332" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
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
                    className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-[#E8F0FF] font-[BasisGrotesquePro] flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.91683 4.66667L7.00016 1.75L4.0835 4.66667" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 1.75V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {logoFile ? logoFile.name : 'Upload Logo'}
                  </button>
                  <div className="space-y-1">
                    <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                      Recommended: 200x50px. Max: 2MB.
                    </p>
                    <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                      Supported: PNG, JPG.
                    </p>
                  </div>
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
                      crossOrigin="anonymous"
                      className="w-12 h-12 object-contain rounded-lg border border-[#E8F0FF]"
                    />
                  ) : (
                    <svg width="50" height="50" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" fill="#E8F0FF" />
                      <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" stroke="#E8F0FF" />
                      <g clipPath="url(#clip0_2455_972)">
                        <path d="M11.4998 20.8307V10.3307C11.4998 10.0213 11.6228 9.72456 11.8415 9.50577C12.0603 9.28698 12.3571 9.16406 12.6665 9.16406H17.3332C17.6426 9.16406 17.9393 9.28698 18.1581 9.50577C18.3769 9.72456 18.4998 10.0213 18.4998 10.3307V20.8307M11.4998 20.8307H18.4998M11.4998 20.8307H10.3332C10.0238 20.8307 9.72701 20.7078 9.50821 20.489C9.28942 20.2702 9.1665 19.9735 9.1665 19.6641V16.1641C9.1665 15.8546 9.28942 15.5579 9.50821 15.3391C9.72701 15.1203 10.0238 14.9974 10.3332 14.9974H11.4998M18.4998 20.8307L19.6665 20.8307C19.9759 20.8307 20.2727 20.7078 20.4915 20.489C20.7103 20.2702 20.8332 19.9735 20.8332 19.6641V14.4141C20.8332 14.1046 20.7103 13.8079 20.4915 13.5891C20.2727 13.3703 19.9759 13.2474 19.6665 13.2474H18.4998M13.8332 11.4974H16.1665M13.8332 13.8307H16.1665M13.8332 16.1641H16.1665M13.8332 18.4974H16.1665" stroke="#3AD6F2" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                      <defs>
                        <clipPath id="clip0_2455_972">
                          <rect width="14" height="14" fill="white" transform="translate(8 8)" />
                        </clipPath>
                      </defs>
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
                  <div className="space-y-1">
                    <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                      Recommended: 32x32px. Max: 1MB.
                    </p>
                    <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                      Supported: PNG, ICO, JPG.
                    </p>
                    <p className="text-xs text-amber-600 font-regular font-[BasisGrotesquePro] flex items-start gap-1">
                      <i className="bi bi-info-circle-fill mt-0.5"></i>
                      <span>Updates may take a few minutes to reflect due to caching.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Color Scheme
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Customize your firm's color palette
            </p>
          </div>

          <div className="space-y-4">
            {/* Color Options - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                    <div
                      className="w-12 h-8 sm:w-14 h-8 !rounded-lg cursor-pointer"
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
                  <div className="flex-1 min-w-[100px] sm:min-w-[120px] rounded-lg !border border-[#E8F0FF] bg-white">
                    <input
                      type="text"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                    <div
                      className="w-12 h-8 sm:w-14 h-8 !rounded-md cursor-pointer"
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
                  <div className="flex-1 min-w-[100px] sm:min-w-[120px] rounded-lg !border border-[#E8F0FF] bg-white">
                    <input
                      type="text"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 2xl:col-span-1">
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                    <div
                      className="w-12 h-8 sm:w-14 h-8 !rounded-md cursor-pointer"
                      style={{ backgroundColor: formData.accent_color }}
                    />
                    <input
                      type="color"
                      name="accent_color"
                      value={formData.accent_color}
                      onChange={handleInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px] sm:min-w-[100px] max-w-[100px] md:max-w-[150px] 2xl:max-w-none rounded-lg !border border-[#E8F0FF] bg-white">
                    <input
                      type="text"
                      name="accent_color"
                      value={formData.accent_color}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Font Family
              </label>
              <select
                name="font_family"
                value={formData.font_family}
                onChange={handleInputChange}
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none cursor-pointer font-[BasisGrotesquePro]"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
              </select>
            </div>

            <button className="w-full px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Preview Changes
            </button>
          </div>
        </div>
      </div>

      {/* Portal Login Preview */}
      <div className="bg-white rounded-2xl p-3 !border border-[#E8F0FF]">
        <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-5">
          Portal Login Preview
        </h5>

        <div className="bg-white rounded-lg p-2">
          <div className="space-y-4">
            {/* Logo Preview */}
            <div className="flex justify-center mb-6">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  crossOrigin="anonymous"
                  className="max-h-20 object-contain"
                />
              ) : (
                <div className="text-center text-sm text-gray-400">Logo will appear here</div>
              )}
            </div>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
            <div className="relative mt-3">
              <input
                type={showPreviewPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2.5 pr-10 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPreviewPassword(!showPreviewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#3B4A66] focus:outline-none"
              >
                <i className={`bi ${showPreviewPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: "18px" }}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Login Fields */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-5">
          Customize Login Fields
        </h5>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg font-[BasisGrotesquePro] w-28 flex-shrink-0">
              Email
            </button>
            <div className="relative flex-1 min-w-[150px]">
              <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 pr-10 text-sm text-[#3B4A66] focus:outline-none cursor-pointer font-[BasisGrotesquePro] bg-white appearance-none">
                <option>Email</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter your email"
              className="flex-1 min-w-[200px] !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg font-[BasisGrotesquePro] w-28 flex-shrink-0">
              Password
            </button>
            <div className="relative flex-1 min-w-[150px]">
              <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 pr-10 text-sm text-[#3B4A66] focus:outline-none cursor-pointer font-[BasisGrotesquePro] bg-white appearance-none">
                <option>Password</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter your password"
              className="flex-1 min-w-[200px] !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
          </div>

          <button
            className="px-4 py-2 text-sm font-medium text-white !rounded-lg hover:brightness-90 transition font-[BasisGrotesquePro] flex items-center gap-2"
            style={{ backgroundColor: 'var(--firm-primary-color, #1E40AF)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Field
          </button>
        </div>
      </div>

      {/* Custom Domain and White-Label */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-4">
            Custom Domain
          </h5>

          <div className="flex gap-2">
            <input
              type="text"
              name="custom_domain"
              value={formData.custom_domain}
              onChange={handleInputChange}
              placeholder="portal.myfirm.com"
              className="flex-1 !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular placeholder:text-gray-400 focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-4">
            White-Label Mode
          </h5>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="white_label_enabled"
              checked={formData.white_label_enabled}
              onChange={handleInputChange}
              className="w-5 h-4 !rounded-lg !border border-[#3AD6F2] bg-white focus:outline-none"
            />
            <span className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro] ml-3">
              Enable White-Label for multi-office use
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start gap-3">
        <button
          onClick={handleResetBranding}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-[#131323] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset Branding
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white !rounded-lg hover:brightness-90 transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: 'var(--firm-primary-color, #1E40AF)' }}
        >
          {saving ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Reset Branding Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetBrandingConfirm}
        onClose={() => {
          if (!saving) {
            setShowResetBrandingConfirm(false);
          }
        }}
        onConfirm={confirmResetBranding}
        title="Reset Branding Settings"
        message="Are you sure you want to reset all branding settings to default?"
        confirmText="Reset"
        cancelText="Cancel"
        isLoading={saving}
        isDestructive={true}
      />
    </div>
  );
}

