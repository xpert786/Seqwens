import React from 'react';
import './BlockPalette.css';

const BLOCK_TYPES = [
    // {
    //     type: 'columns',
    //     icon: '▥',
    //     label: 'COLUMNS',
    //     description: '2 or 3 column layout',
    // },
    {
        type: 'signature',
        icon: '✍',
        label: 'SIGNATURE',
        description: 'Firm signature block',
    },
    {
        type: 'button',
        icon: '▭',
        label: 'BUTTON',
        description: 'Call-to-action button',
    },
    {
        type: 'divider',
        icon: '—',
        label: 'DIVIDER',
        description: 'Horizontal line',
    },
    {
        type: 'heading',
        icon: 'H',
        label: 'HEADING',
        description: 'Title or heading',
    },
    {
        type: 'text',
        icon: 'T',
        label: 'TEXT',
        description: 'Paragraph text',
    },
    {
        type: 'image',
        icon: '🖼',
        label: 'IMAGE',
        description: 'Add an image',
    },
    {
        type: 'logo',
        icon: '◈',
        label: 'LOGO',
        description: 'Your firm logo',
    },
    {
        type: 'video',
        icon: '▶',
        label: 'VIDEO',
        description: 'Embedded video',
    },
    {
        type: 'social',
        icon: '♦',
        label: 'SOCIAL',
        description: 'Social media icons',
    },
    {
        type: 'menu',
        icon: '☰',
        label: 'MENU',
        description: 'Navigation menu',
    },
    {
        type: 'html',
        icon: '<>',
        label: 'HTML',
        description: 'Custom HTML',
    },
    {
        type: 'timer',
        icon: '◷',
        label: 'TIMER',
        description: 'Countdown timer',
    },
];

const BlockPalette = ({ onAddBlock }) => {
    return (
        <div className="block-palette">
            <div className="palette-header">
                <h3>Content Blocks</h3>
                <p className="palette-subtitle">Drag or click to add</p>
            </div>
            <div className="palette-blocks">
                {BLOCK_TYPES.map((blockType) => (
                    <button
                        key={blockType.type}
                        className="palette-block-btn"
                        onClick={() => onAddBlock(blockType.type)}
                        title={blockType.description}
                    >
                        <span className="block-icon">{blockType.icon}</span>
                        <span className="block-label">{blockType.label}</span>
                    </button>
                ))}
            </div>
            <div className="palette-footer">
                <div className="palette-tip">
                    <strong>💡 Tip:</strong> Click a block to add it to your email template
                </div>
            </div>
        </div>
    );
};

export default BlockPalette;
