import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import "../styles/Navbar.css";
import { profileAPI, handleAPIError } from "../utils/apiUtils"; 

export default function Navbar() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh profile picture (can be called from other components)
  const refreshProfilePicture = async () => {
    try {
      console.log('🔄 Refreshing profile picture...');
      const response = await profileAPI.getProfilePicture();
      console.log('📋 Refresh profile picture API response:', response);
      
      if (response.success && response.data) {
        if (response.data.has_profile_picture && response.data.profile_picture_url) {
          console.log('🖼️ Profile picture refreshed:', response.data.profile_picture_url);
          setProfilePicture(response.data.profile_picture_url);
        } else {
          console.log('❌ No profile picture found after refresh');
          setProfilePicture(null);
        }
      }
    } catch (err) {
      console.error('💥 Error refreshing profile picture:', err);
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
        console.log('🔄 Starting to fetch profile picture...');
        const response = await profileAPI.getProfilePicture();
        console.log('📋 Profile picture API response:', response);
        
        if (response.success && response.data) {
          console.log('✅ API response successful, setting profile picture...');
          
          if (response.data.has_profile_picture && response.data.profile_picture_url) {
            console.log('🖼️ Profile picture found:', response.data.profile_picture_url);
            setProfilePicture(response.data.profile_picture_url);
            console.log('✅ Profile picture state updated');
          } else {
            console.log('❌ No profile picture found in response');
            setProfilePicture(null);
          }
        } else {
          console.log('❌ API response not successful:', response);
        }
      } catch (err) {
        console.error('💥 Error fetching profile picture:', err);
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
              <>
                {console.log('👤 Rendering default avatar - no profile picture')}
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    backgroundColor: "#F56D2D",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "600"
                  }}
                >
                  <i className="bi bi-person-fill"></i>
                </div>
              </>
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
