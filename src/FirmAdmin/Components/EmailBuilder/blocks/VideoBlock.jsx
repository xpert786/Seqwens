import React from 'react';

const VideoBlock = ({ data }) => {
    const containerStyle = {
        textAlign: data.align,
        padding: '10px',
    };

    const getVideoEmbedUrl = (url) => {
        // Convert YouTube watch URLs to embed URLs
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            return `https://www.youtube.com/embed/${videoId}`;
        }
        // Convert YouTube short URLs
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        // Convert Vimeo URLs
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1].split('?')[0];
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    const videoStyle = {
        width: data.width,
        maxWidth: '100%',
        height: '400px',
        border: 'none',
    };

    if (!data.url) {
        return (
            <div style={containerStyle}>
                <div style={{
                    ...videoStyle,
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                }}>
                    No video URL provided
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <iframe
                src={getVideoEmbedUrl(data.url)}
                style={videoStyle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Embedded video"
            />
        </div>
    );
};

export default VideoBlock;
