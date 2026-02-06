import React from 'react';

const ButtonBlock = ({ data, onChange, previewMode }) => {
    const buttonStyle = {
        display: 'inline-block',
        backgroundColor: data.backgroundColor,
        color: data.textColor,
        borderRadius: data.borderRadius,
        padding: data.padding,
        fontSize: data.fontSize,
        fontWeight: data.fontWeight,
        textDecoration: 'none',
        border: 'none',
        cursor: 'pointer',
        margin: '10px 0',
    };

    const containerStyle = {
        textAlign: data.align,
        padding: '10px',
    };

    if (previewMode) {
        return (
            <div style={containerStyle}>
                <a href={data.url} style={buttonStyle}>
                    {data.text}
                </a>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <button style={buttonStyle} type="button">
                <input
                    type="text"
                    value={data.text}
                    onChange={(e) => onChange({ text: e.target.value })}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        color: data.textColor,
                        fontSize: data.fontSize,
                        fontWeight: data.fontWeight,
                        outline: 'none',
                        textAlign: 'center',
                    }}
                />
            </button>
        </div>
    );
};

export default ButtonBlock;
