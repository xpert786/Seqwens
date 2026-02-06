import React from 'react';

const DividerBlock = ({ data }) => {
    const containerStyle = {
        padding: `${data.spacing} 0`,
    };

    const dividerStyle = {
        border: 'none',
        borderTop: `${data.thickness} ${data.style} ${data.color}`,
        width: data.width,
        margin: '0 auto',
    };

    return (
        <div style={containerStyle}>
            <hr style={dividerStyle} />
        </div>
    );
};

export default DividerBlock;
