import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import "../styles/Navbar.css";
import { profileAPI, handleAPIError } from "../utils/apiUtils";
import { getUserData } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";

export default function Navbar() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to normalize profile picture URL
  const normalizeProfilePictureUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
    }

    // If URL already starts with http:// or https://, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If URL contains a malformed concatenation (base URL + https://), extract the correct part
    const httpsIndex = url.indexOf('https://');
    const httpIndex = url.indexOf('http://');
    if (httpsIndex > 0) {
      // Extract the part starting from https://
      return url.substring(httpsIndex);
    }
    if (httpIndex > 0 && !url.startsWith('http://')) {
      // Extract the part starting from http://
      return url.substring(httpIndex);
    }

    // If URL starts with /, it's a relative path - prepend API base URL
    if (url.startsWith('/')) {
      const API_BASE_URL = getApiBaseUrl();
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      return `${baseUrl}${url}`;
    }

    // Otherwise, return as is (might be a data URL or other format)
    return url;
  };

  // Function to refresh profile picture (can be called from other components)
  const refreshProfilePicture = async () => {
    try {
      console.log('🔄 Refreshing profile picture...');

      // Always fetch from API first to get the latest picture
      const response = await profileAPI.getProfilePicture();
      console.log('📋 Refresh profile picture API response:', response);

      if (response.success && response.data) {
        if (response.data.has_profile_picture && response.data.profile_picture_url) {
          const normalizedUrl = normalizeProfilePictureUrl(response.data.profile_picture_url);
          console.log('🖼️ Profile picture refreshed:', normalizedUrl);
          setProfilePicture(normalizedUrl);
          return;
        } else {
          console.log('❌ No profile picture found after refresh');
          setProfilePicture(null);
          return;
        }
      }

      // Fallback: check userData if API doesn't return a picture
      const userData = getUserData();
      if (userData) {
        // Check both profile_picture and profile_image fields
        const pictureUrl = userData.profile_picture || userData.profile_image;
        if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
          const normalizedUrl = normalizeProfilePictureUrl(pictureUrl);
          console.log('🖼️ Profile picture from user data (fallback):', normalizedUrl);
          setProfilePicture(normalizedUrl);
          return;
        }
      }

      // If no picture found anywhere, clear it
      setProfilePicture(null);
    } catch (err) {
      console.error('💥 Error refreshing profile picture:', err);

      // On error, fallback to userData
      const userData = getUserData();
      if (userData) {
        const pictureUrl = userData.profile_picture || userData.profile_image;
        if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
          const normalizedUrl = normalizeProfilePictureUrl(pictureUrl);
          console.log('🖼️ Profile picture from user data (error fallback):', normalizedUrl);
          setProfilePicture(normalizedUrl);
          return;
        }
      }

      setProfilePicture(null);
    }
  };

  // Expose refresh function to window for global access
  useEffect(() => {
    window.refreshNavbarProfilePicture = refreshProfilePicture;
    return () => {
      delete window.refreshNavbarProfilePicture;
    };
  }, []);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        // First, check userData from login response
        const userData = getUserData();
        if (userData) {
          setUserInfo(userData);

          // Check both profile_picture and profile_image fields
          const pictureUrl = userData.profile_picture || userData.profile_image;
          if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
            // Use profile picture from userData if available
            const normalizedUrl = normalizeProfilePictureUrl(pictureUrl);
            console.log('🖼️ Profile picture from user data:', normalizedUrl);
            setProfilePicture(normalizedUrl);
            setLoading(false);
            return;
          } else {
            console.log('❌ No profile picture in user data, will fetch from API');
          }
        }

        console.log('🔄 Starting to fetch profile picture from API...');
        const response = await profileAPI.getProfilePicture();
        console.log('📋 Profile picture API response:', response);

        if (response.success && response.data) {
          console.log('✅ API response successful, setting profile picture...');

          if (response.data.has_profile_picture && response.data.profile_picture_url) {
            const normalizedUrl = normalizeProfilePictureUrl(response.data.profile_picture_url);
            console.log('🖼️ Profile picture found:', normalizedUrl);
            setProfilePicture(normalizedUrl);
            console.log('✅ Profile picture state updated');
          } else {
            console.log('❌ No profile picture found in response');
            setProfilePicture(null);
          }
        } else {
          console.log('❌ API response not successful:', response);
          setProfilePicture(null);
        }
      } catch (err) {
        console.error('💥 Error fetching profile picture:', err);
        setProfilePicture(null);
        // Don't show error for profile picture as it's not critical
      } finally {
        setLoading(false);
        console.log('🏁 Finished fetching profile picture');
      }
    };

    fetchProfilePicture();
  }, []);

  // Monitor profile picture state changes
  useEffect(() => {
    console.log('🔄 Profile picture state changed:', profilePicture);
  }, [profilePicture]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top py-3">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center">
          <Link className="navbar-brand me-5" to="/">
            <img src={logo} alt="Seqwens" height="35" />
          </Link>
        </div>

        <div className="mx-auto text-center d-none d-lg-block">
          <ul className="navbar-nav gap-4 flex-row justify-content-center">
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#home">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#capabilities">AI Capabilities</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#pricing">Pricing</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#case">Case Studies</Link>
            </li>
          </ul>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          <div className="d-flex align-items-center gap-3">
            {profilePicture ? (
              <>
                {console.log('🖼️ Rendering profile picture:', profilePicture)}
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                  onLoad={() => console.log('✅ Profile picture loaded successfully')}
                  onError={() => console.log('❌ Profile picture failed to load')}
                />
              </>
            ) : (
              <button
                type="button"
                className="btn border-0 p-0 d-flex align-items-center justify-content-center"
                onClick={() => window.refreshNavbarProfilePicture?.()}
                aria-label="Profile options"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "transparent"
                }}
              >
                <i className="bi bi-chevron-down fs-4 text-muted"></i>
              </button>
            )}
            <span className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
              {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : 'Profile'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
