import React from 'react';

const ImageBlock = ({ data, previewMode }) => {
    const containerStyle = {
        textAlign: data.align,
        padding: '10px',
    };

    const imageStyle = {
        width: data.width,
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: data.align === 'center' ? '0 auto' : data.align === 'right' ? '0 0 0 auto' : '0',
    };

    const image = data.url ? (
        <img src={data.url} alt={data.alt} style={imageStyle} crossOrigin="anonymous" />
    ) : (
        <div style={{
            ...imageStyle,
            backgroundColor: '#f0f0f0',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
        }}>
            No image selected
        </div>
    );

    if (data.link && previewMode) {
        return (
            <div style={containerStyle}>
                <a href={data.link}>
                    {image}
                </a>
            </div>
        );
    }

    return <div style={containerStyle}>{image}</div>;
};

export default ImageBlock;
