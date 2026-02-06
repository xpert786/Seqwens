import React from 'react';

const SignatureBlock = ({ data, firmData }) => {
    const firmName = data.firmName || firmData?.name || '';
    const address = data.address || firmData?.address || '';
    const phone = data.phone || firmData?.phone_number || '';
    const email = data.email || firmData?.email || '';
    const website = data.website || firmData?.website || '';

    const containerStyle = {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderTop: '3px solid #1F2A55',
        textAlign: data.align,
        fontSize: '14px',
        color: '#666',
        lineHeight: '1.6',
    };

    const firmNameStyle = {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1F2A55',
        marginBottom: '10px',
    };

    return (
        <div style={containerStyle}>
            {firmName && <div style={firmNameStyle}>{firmName}</div>}
            {address && <div>{address}</div>}
            {phone && <div>Phone: {phone}</div>}
            {email && <div>Email: <a href={`mailto:${email}`} style={{ color: '#3AD6F2', textDecoration: 'none' }}>{email}</a></div>}
            {website && <div>Website: <a href={website} style={{ color: '#3AD6F2', textDecoration: 'none' }}>{website}</a></div>}
        </div>
    );
};

export default SignatureBlock;
