import React, { useState, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import BlockPalette from './BlockPalette';
import BuilderCanvas from './BuilderCanvas';
import PropertiesPanel from './PropertiesPanel';
import './VisualEmailBuilder.css';

const VisualEmailBuilder = ({
    initialBlocks = [],
    onChange,
    firmData,
    brandingData,
    onSave
}) => {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Notify parent of changes
    useEffect(() => {
        if (onChange) {
            onChange(blocks);
        }
    }, [blocks, onChange]);

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    const addBlock = useCallback((blockType) => {
        const newBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: blockType,
            data: getDefaultBlockData(blockType, firmData, brandingData),
        };
        setBlocks(prev => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
    }, [firmData, brandingData]);

    const updateBlock = useCallback((blockId, newData) => {
        setBlocks(prev => prev.map(block =>
            block.id === blockId ? { ...block, data: { ...block.data, ...newData } } : block
        ));
    }, []);

    const deleteBlock = useCallback((blockId) => {
        console.log("Deleting block:", blockId);
        setBlocks(prev => prev.filter(block => block.id !== blockId));
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
        }
    }, [selectedBlockId]);

    const duplicateBlock = useCallback((blockId) => {
        const blockToDuplicate = blocks.find(b => b.id === blockId);
        if (blockToDuplicate) {
            const newBlock = {
                ...blockToDuplicate,
                id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };
            const index = blocks.findIndex(b => b.id === blockId);
            setBlocks(prev => [
                ...prev.slice(0, index + 1),
                newBlock,
                ...prev.slice(index + 1)
            ]);
        }
    }, [blocks]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setBlocks((blocks) => {
                const oldIndex = blocks.findIndex(b => b.id === active.id);
                const newIndex = blocks.findIndex(b => b.id === over.id);
                return arrayMove(blocks, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="visual-email-builder">
            <div className="builder-header">
                <div className="builder-actions">
                    <button
                        className="preview-toggle-btn"
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        {previewMode ? 'Edit Mode' : 'Preview Mode'}
                    </button>
                    {onSave && (
                        <button className="save-template-btn" onClick={() => onSave(blocks)}>
                            Save Template
                        </button>
                    )}
                </div>
            </div>

            <div className="builder-main">
                {!previewMode && (
                    <BlockPalette onAddBlock={addBlock} />
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <BuilderCanvas
                            blocks={blocks}
                            selectedBlockId={selectedBlockId}
                            onSelectBlock={setSelectedBlockId}
                            onUpdateBlock={updateBlock}
                            onDeleteBlock={deleteBlock}
                            onDuplicateBlock={duplicateBlock}
                            previewMode={previewMode}
                            firmData={firmData}
                            brandingData={brandingData}
                        />
                    </SortableContext>
                </DndContext>

                {!previewMode && selectedBlock && (
                    <PropertiesPanel
                        block={selectedBlock}
                        firmData={firmData}
                        brandingData={brandingData}
                        onUpdate={(newData) => updateBlock(selectedBlock.id, newData)}
                        onClose={() => setSelectedBlockId(null)}
                    />
                )}
            </div>
        </div>
    );
};

// Helper function to get default data for each block type
const getDefaultBlockData = (blockType, firmData, brandingData) => {
    const defaults = {
        text: {
            content: 'Enter your text here...',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#333333',
            align: 'left',
            lineHeight: '1.6',
        },
        heading: {
            content: 'Heading Text',
            level: 'h2',
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#1F2A55',
            align: 'left',
            fontWeight: 'bold',
        },
        button: {
            text: 'Click Here',
            url: 'https://example.com',
            backgroundColor: brandingData?.primaryColor || '#F56D2D',
            textColor: '#ffffff',
            borderRadius: '8px',
            padding: '12px 24px',
            align: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
        },
        image: {
            url: '',
            alt: 'Image',
            width: '100%',
            align: 'center',
            link: '',
        },
        logo: {
            url: brandingData?.logo || firmData?.logo_url || '',
            alt: firmData?.name || 'Company Logo',
            width: '200px',
            align: 'center',
        },
        divider: {
            style: 'solid',
            color: '#E8F0FF',
            thickness: '1px',
            width: '100%',
            spacing: '20px',
        },
        social: {
            icons: [
                { platform: 'facebook', url: '' },
                { platform: 'twitter', url: '' },
                { platform: 'linkedin', url: '' },
                { platform: 'instagram', url: '' },
            ],
            iconSize: '32px',
            spacing: '10px',
            align: 'center',
        },
        columns: {
            count: 2,
            columns: [
                { blocks: [] },
                { blocks: [] },
            ],
            gap: '20px',
        },
        signature: {
            firmName: firmData?.name || 'Your Firm Name',
            address: firmData?.address || '',
            phone: firmData?.phone_number || '',
            email: firmData?.email || '',
            website: firmData?.website || '',
            socialLinks: [],
            align: 'left',
        },
        menu: {
            items: [
                { text: 'Home', url: '#' },
                { text: 'Services', url: '#' },
                { text: 'Contact', url: '#' },
            ],
            orientation: 'horizontal',
            align: 'center',
            fontSize: '14px',
            color: '#1F2A55',
            spacing: '20px',
        },
        video: {
            url: '',
            thumbnail: '',
            width: '100%',
            align: 'center',
        },
        html: {
            content: '<p>Custom HTML content</p>',
        },
        timer: {
            endDate: '',
            title: 'Limited Time Offer',
            fontSize: '16px',
            color: '#F56D2D',
            align: 'center',
        },
    };

    return defaults[blockType] || {};
};

export default VisualEmailBuilder;
