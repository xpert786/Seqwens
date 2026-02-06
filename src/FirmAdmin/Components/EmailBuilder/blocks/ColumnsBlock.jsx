import React from 'react';

const ColumnsBlock = ({ data }) => {
    const containerStyle = {
        display: 'flex',
        gap: data.gap,
        padding: '10px',
    };

    const columnStyle = {
        flex: 1,
        minWidth: 0,
    };

    return (
        <div style={containerStyle}>
            {data.columns.map((column, index) => (
                <div key={index} style={columnStyle}>
                    <div style={{
                        padding: '10px',
                        border: '1px dashed #ccc',
                        minHeight: '100px',
                        backgroundColor: '#fafafa',
                    }}>
                        Column {index + 1}
                        {/* In a full implementation, this would render nested blocks */}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ColumnsBlock;
