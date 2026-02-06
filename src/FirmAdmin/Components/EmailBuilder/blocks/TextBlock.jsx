import React from 'react';

const TextBlock = ({ data, onChange, previewMode }) => {
    const style = {
        fontSize: data.fontSize,
        fontFamily: data.fontFamily,
        color: data.color,
        textAlign: data.align,
        lineHeight: data.lineHeight,
        padding: '10px',
    };

    if (previewMode) {
        return (
            <div style={style} dangerouslySetInnerHTML={{ __html: data.content }} />
        );
    }

    return (
        <div style={style}>
            <textarea
                value={data.content}
                onChange={(e) => onChange({ content: e.target.value })}
                style={{
                    width: '100%',
                    minHeight: '100px',
                    border: 'none',
                    background: 'transparent',
                    ...style,
                    outline: 'none',
                    resize: 'vertical',
                }}
            />
        </div>
    );
};

export default TextBlock;
