import React from 'react';

const BLOCK_TYPES = [
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
        <div className="w-full lg:w-[200px] h-full bg-white border-b lg:border-b-0 lg:border-r border-[#e8f0ff] flex flex-col overflow-y-auto lg:max-h-none max-h-[400px] custom-scrollbar">
            <div className="p-3 border-b border-[#e8f0ff]">
                <h4 className="m-0 mb-[4px] !text-[16px] font-bold text-[#1f2a55]">Content Blocks</h4>
                <p className="m-0 text-[12px] text-[#6e7dae]">Drag or click to add</p>
            </div>

            <div className="flex-1 p-3 grid lg:grid-cols-1 grid-cols-4 gap-2 overflow-y-auto lg:overflow-x-visible overflow-x-hidden custom-scrollbar">
                {BLOCK_TYPES.map((blockType) => (
                    <button
                        key={blockType.type}
                        className="flex lg:flex-row flex-col items-center gap-3 p-3 bg-white border-2 border-[#e8f0ff] !rounded-[12px] cursor-pointer transition-all duration-200 text-left w-full active:translate-y-0"
                        onClick={() => onAddBlock(blockType.type)}
                        title={blockType.description}
                    >
                        <span className="text-[20px] w-7 h-7 flex items-center justify-center bg-[#f3f6fd] rounded-[8px] flex-shrink-0">
                            {blockType.icon}
                        </span>
                        <span className="flex-1 text-[11px] font-bold tracking-[0.5px] text-[#1f2a55]">
                            {blockType.label}
                        </span>
                    </button>
                ))}
            </div>


            <div className="p-4 border-t border-[#e8f0ff] bg-[#f9fbff]">
                <div className="text-[11px] text-[#6e7dae] leading-[1.5]">
                    <strong className="block mb-1 text-[#1f2a55]">💡 Tip:</strong> Click a block to add it to your email template
                </div>
            </div>
        </div>
    );
};

export default BlockPalette;

