import React from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaPinterest } from 'react-icons/fa';

const SOCIAL_ICONS = {
    facebook: { icon: FaFacebook, color: '#1877F2' },
    twitter: { icon: FaTwitter, color: '#1DA1F2' },
    linkedin: { icon: FaLinkedin, color: '#0A66C2' },
    instagram: { icon: FaInstagram, color: '#E4405F' },
    youtube: { icon: FaYoutube, color: '#FF0000' },
    pinterest: { icon: FaPinterest, color: '#E60023' },
};

const SocialIconsBlock = ({ data }) => {
    const containerStyle = {
        textAlign: data.align,
        padding: '20px 10px',
    };

    const iconsContainerStyle = {
        display: 'inline-flex',
        gap: data.spacing,
        justifyContent: data.align,
    };

    const iconStyle = {
        width: data.iconSize,
        height: data.iconSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        textDecoration: 'none',
    };

    return (
        <div style={containerStyle}>
            <div style={iconsContainerStyle}>
                {data.icons.filter(icon => icon.url).map((icon, index) => {
                    const IconComponent = SOCIAL_ICONS[icon.platform]?.icon;
                    const iconColor = SOCIAL_ICONS[icon.platform]?.color || '#666';

                    if (!IconComponent) return null;

                    return (
                        <a
                            key={index}
                            href={icon.url}
                            style={iconStyle}
                            title={icon.platform}
                        >
                            <IconComponent size={data.iconSize} color={iconColor} />
                        </a>
                    );
                })}
            </div>
        </div>
    );
};

export default SocialIconsBlock;
