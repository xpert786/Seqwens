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
import './BuilderCanvas.css';

const BuilderCanvas = ({
    blocks,
    selectedBlockId,
    onSelectBlock,
    onUpdateBlock,
    onDeleteBlock,
    onDuplicateBlock,
    previewMode,
    firmData,
    brandingData,
}) => {
    if (blocks.length === 0) {
        return (
            <div className="builder-canvas empty-canvas">
                <div className="empty-state">
                    <div className="empty-icon">✉️</div>
                    <h3>Start Building Your Email</h3>
                    <p>Click on a content block from the right panel to add it to your email template</p>
                </div>
            </div>
        );
    }

    return (
        <div className="builder-canvas">
            <div className="canvas-email-container">
                {blocks.map((block) => (
                    <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={onSelectBlock}
                        onUpdate={onUpdateBlock}
                        onDelete={onDeleteBlock}
                        onDuplicate={onDuplicateBlock}
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
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onDuplicate,
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
            className={`canvas-block ${isSelected ? 'selected' : ''} ${previewMode ? 'preview' : ''}`}
            onClick={handleClick}
        >
            {!previewMode && (
                <>
                    <div className="block-drag-handle" {...attributes} {...listeners}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="4" cy="4" r="1.5" />
                            <circle cx="12" cy="4" r="1.5" />
                            <circle cx="4" cy="8" r="1.5" />
                            <circle cx="12" cy="8" r="1.5" />
                            <circle cx="4" cy="12" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                        </svg>
                    </div>
                    <div className="block-actions">
                        <button
                            className="block-action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(block.id);
                            }}
                            title="Duplicate block"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" />
                                <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1H2V6z" opacity="0.5" />
                            </svg>
                        </button>
                        <button
                            className="block-action-btn delete"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onDelete(block.id);
                            }}
                            title="Delete block"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
            <div className="block-content">
                {renderBlock()}
            </div>
        </div>
    );
};

export default BuilderCanvas;
