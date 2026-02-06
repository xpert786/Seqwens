import React from 'react';

const MenuBlock = ({ data }) => {
    const containerStyle = {
        textAlign: data.align,
        padding: '15px 10px',
        backgroundColor: '#f8f9fa',
    };

    const menuStyle = {
        display: 'flex',
        flexDirection: data.orientation === 'horizontal' ? 'row' : 'column',
        gap: data.spacing,
        justifyContent: data.align,
        listStyle: 'none',
        margin: 0,
        padding: 0,
    };

    const linkStyle = {
        color: data.color,
        fontSize: data.fontSize,
        textDecoration: 'none',
        fontWeight: '500',
    };

    return (
        <div style={containerStyle}>
            <ul style={menuStyle}>
                {data.items.map((item, index) => (
                    <li key={index}>
                        <a href={item.url} style={linkStyle}>
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MenuBlock;
