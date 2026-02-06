import React from 'react';

const HtmlBlock = ({ data }) => {
    return (
        <div
            style={{ padding: '10px' }}
            dangerouslySetInnerHTML={{ __html: data.content }}
        />
    );
};

export default HtmlBlock;
