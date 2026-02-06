import React from 'react';

const HeadingBlock = ({ data, onChange, previewMode }) => {
    const style = {
        fontSize: data.fontSize,
        fontFamily: data.fontFamily,
        color: data.color,
        textAlign: data.align,
        fontWeight: data.fontWeight,
        margin: '10px 0',
        padding: '10px',
    };

    const HeadingTag = data.level;

    if (previewMode) {
        return <HeadingTag style={style}>{data.content}</HeadingTag>;
    }

    return (
        <HeadingTag style={style}>
            <input
                type="text"
                value={data.content}
                onChange={(e) => onChange({ content: e.target.value })}
                style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    ...style,
                    outline: 'none',
                    fontWeight: data.fontWeight,
                }}
            />
        </HeadingTag>
    );
};

export default HeadingBlock;
