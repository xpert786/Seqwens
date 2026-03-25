import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TextBlock from './blocks/TextBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ButtonBlock from './blocks/ButtonBlock';
import ImageBlock from './blocks/ImageBlock';
import LogoBlock from './blocks/LogoBlock';
import DividerBlock from './blocks/DividerBlock';
import SocialIconsBlock from './blocks/SocialIconsBlock';
import ColumnsBlock from './blocks/ColumnsBlock';
import SignatureBlock from './blocks/SignatureBlock';
import MenuBlock from './blocks/MenuBlock';
import VideoBlock from './blocks/VideoBlock';
import HtmlBlock from './blocks/HtmlBlock';
import TimerBlock from './blocks/TimerBlock';


const BuilderCanvas = ({
    blocks,
    selectedBlockId,
    onSelectBlock,
    onUpdateBlock,
    onDeleteBlock,
    onDuplicateBlock,
    onMoveUp,
    onMoveDown,
    previewMode,
    firmData,
    brandingData,
}) => {
    if (blocks.length === 0) {
        return (
            <div className="flex-1 bg-white overflow-y-auto p-6 md:p-3 flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl m-4">
                <div className="text-center p-10 text-[#6e7dae]">
                    <div className="text-[64px] mb-4">✉️</div>
                    <h3 className="m-0 mb-2 text-[20px] text-[#1f2a55] font-bold">Start Building Your Email</h3>
                    <p className="m-0 text-[14px] max-w-[400px]">Click on a content block from the right panel to add it to your email template</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#f3f6fd] overflow-y-auto p-6 md:p-3 custom-scrollbar overflow-x-hidden">
            <div className="max-w-[600px] mx-auto bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-[8px] overflow-hidden min-h-[400px]">
                {blocks.map((block, index) => (
                    <SortableBlock
                        key={block.id}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === blocks.length - 1}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={onSelectBlock}
                        onUpdate={onUpdateBlock}
                        onDelete={onDeleteBlock}
                        onDuplicate={onDuplicateBlock}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        previewMode={previewMode}
                        firmData={firmData}
                        brandingData={brandingData}
                    />
                ))}
            </div>
        </div>
    );
};

const SortableBlock = ({
    block,
    index,
    isFirst,
    isLast,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    previewMode,
    firmData,
    brandingData,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e) => {
        if (!previewMode) {
            e.stopPropagation();
            onSelect(block.id);
        }
    };

    const blockProps = {
        data: block.data,
        onChange: (newData) => onUpdate(block.id, newData),
        firmData,
        brandingData,
        previewMode,
    };

    const renderBlock = () => {
        switch (block.type) {
            case 'text':
                return <TextBlock {...blockProps} />;
            case 'heading':
                return <HeadingBlock {...blockProps} />;
            case 'button':
                return <ButtonBlock {...blockProps} />;
            case 'image':
                return <ImageBlock {...blockProps} />;
            case 'logo':
                return <LogoBlock {...blockProps} />;
            case 'divider':
                return <DividerBlock {...blockProps} />;
            case 'social':
                return <SocialIconsBlock {...blockProps} />;
            case 'columns':
                return <ColumnsBlock {...blockProps} />;
            case 'signature':
                return <SignatureBlock {...blockProps} />;
            case 'menu':
                return <MenuBlock {...blockProps} />;
            case 'video':
                return <VideoBlock {...blockProps} />;
            case 'html':
                return <HtmlBlock {...blockProps} />;
            case 'timer':
                return <TimerBlock {...blockProps} />;
            default:
                return <div>Unknown block type: {block.type}</div>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative !border-2 transition-all duration-200 !bg-white ${isSelected && !previewMode ? '!border-[#3ad6f2] !shadow-[0_0_0_3px_rgba(58,214,242,0.1)] z-10' : '!border-transparent hover:!border-[#e8f0ff]'} ${previewMode ? '!border-none !shadow-none' : ''}`}
            onClick={handleClick}
        >
            {!previewMode && (
                <>
                    <div
                        className={`absolute left-[-32px] top-1/2 -translate-y-1/2 !w-7 !h-7 flex items-center justify-center !bg-white !border !border-[#e8f0ff] !rounded-[6px] !cursor-grab transition-all duration-200 !text-[#6e7dae] active:cursor-grabbing md:left-1 md:top-2 md:translate-y-0 z-20 hover:!border-[#3ad6f2] hover:!text-[#1f2a55] hover:!scale-105 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        {...attributes}
                        {...listeners}
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="4" cy="4" r="1.5" />
                            <circle cx="12" cy="4" r="1.5" />
                            <circle cx="4" cy="8" r="1.5" />
                            <circle cx="12" cy="8" r="1.5" />
                            <circle cx="4" cy="12" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                        </svg>
                    </div>
                    <div className={`absolute right-2 top-2 flex gap-1.5 transition-all duration-200 z-[100] md:right-1 md:top-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            className={`!w-8 !h-8 flex items-center justify-center !bg-white !border !border-[#e8f0ff] !rounded-[6px] !cursor-pointer transition-all duration-200 !text-[#6e7dae] hover:!bg-[#f3f6fd] hover:!border-[#3ad6f2] hover:!text-[#1f2a55] hover:!scale-105 hover:!shadow-md ${isFirst ? 'opacity-30 !cursor-not-allowed !bg-[#f8f9fa]' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isFirst) onMoveUp(index);
                            }}
                            disabled={isFirst}
                            title="Move up"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path fillRule="evenodd" d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z" />
                            </svg>
                        </button>
                        <button
                            className={`!w-8 !h-8 flex items-center justify-center !bg-white !border !border-[#e8f0ff] !rounded-[6px] !cursor-pointer transition-all duration-200 !text-[#6e7dae] hover:!bg-[#f3f6fd] hover:!border-[#3ad6f2] hover:!text-[#1f2a55] hover:!scale-105 hover:!shadow-md ${isLast ? 'opacity-30 !cursor-not-allowed !bg-[#f8f9fa]' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isLast) onMoveDown(index);
                            }}
                            disabled={isLast}
                            title="Move down"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z" />
                            </svg>
                        </button>
                        <button
                            className="!w-8 !h-8 flex items-center justify-center !bg-white !border !border-[#e8f0ff] !rounded-[6px] !cursor-pointer transition-all duration-200 !text-[#6e7dae] hover:!bg-[#f3f6fd] hover:!border-[#3ad6f2] hover:!text-[#1f2a55] hover:!scale-105 hover:!shadow-md"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(block.id);
                            }}
                            title="Duplicate block"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" />
                                <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1H2V6z" opacity="0.5" />
                            </svg>
                        </button>
                        <button
                            className="!w-8 !h-8 flex items-center justify-center !bg-white !border !border-[#e8f0ff] !rounded-[6px] !cursor-pointer transition-all duration-200 !text-[#6e7dae] hover:!bg-[#ffeeee] hover:!border-[#f56d2d] hover:!text-[#f56d2d] hover:!scale-105 hover:!shadow-md"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onDelete(block.id);
                            }}
                            title="Delete block"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
            <div className="relative z-[1]">
                {renderBlock()}
            </div>
        </div>
    );
};




export default BuilderCanvas;
