import React from 'react';

const LogoBlock = ({ data, previewMode, firmData }) => {
    const containerStyle = {
        textAlign: data.align,
        padding: '20px 10px',
    };

    const logoStyle = {
        width: data.width,
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: data.align === 'center' ? '0 auto' : data.align === 'right' ? '0 0 0 auto' : '0',
    };

    const logoUrl = data.url || firmData?.logo_url;

    return (
        <div style={containerStyle}>
            {logoUrl ? (
                <img src={logoUrl} alt={data.alt} style={logoStyle} crossOrigin="anonymous" />
            ) : (
                <div style={{
                    ...logoStyle,
                    backgroundColor: '#f0f0f0',
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                }}>
                    {firmData?.name || 'Company Logo'}
                </div>
            )}
        </div>
    );
};

export default LogoBlock;
