import React, { useState, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import BlockPalette from './BlockPalette';
import BuilderCanvas from './BuilderCanvas';
import PropertiesPanel from './PropertiesPanel';


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

    const moveBlockUp = useCallback((index) => {
        if (index > 0) {
            setBlocks(prev => arrayMove(prev, index, index - 1));
        }
    }, []);

    const moveBlockDown = useCallback((index) => {
        if (index < blocks.length - 1) {
            setBlocks(prev => arrayMove(prev, index, index + 1));
        }
    }, [blocks.length]);

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
        <div className="flex flex-col h-full bg-[#f3f6fd]">
            <div className="p-3 bg-white border-b border-[#e8f0ff] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {previewMode && (
                        <span className="bg-[#ebfcff] text-[#3ad6f2] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#3ad6f2]/20">
                            Preview
                        </span>
                    )}
                </div>
                <div className="flex gap-[12px]">
                    <button
                        className="px-4 py-2.5 !rounded-[10px] font-semibold text-sm cursor-pointer transition-all duration-200 border-2 bg-white text-[#1f2a55] border-[#e8f0ff] hover:bg-[#f3f6fd] hover:border-[#3ad6f2]"
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        {previewMode ? 'Edit Mode' : 'Preview Mode'}
                    </button>
                    {onSave && (
                        <button
                            className="px-4 py-2.5 !rounded-[10px] font-semibold text-sm cursor-pointer transition-all duration-200 bg-[#3ad6f2] text-white hover:bg-[#2bc5e0]"
                            onClick={() => onSave(blocks)}
                        >
                            Save Template
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden gap-0 lg:flex-row flex-col">
                {!previewMode && (
                    <div className="w-full lg:w-auto h-auto lg:h-full lg:border-r border-[#e8f0ff]">
                        <BlockPalette onAddBlock={addBlock} />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#f3f6fd]">
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
                                onMoveUp={moveBlockUp}
                                onMoveDown={moveBlockDown}
                                previewMode={previewMode}
                                firmData={firmData}
                                brandingData={brandingData}
                            />
                        </SortableContext>
                    </DndContext>
                </div>

                {!previewMode && selectedBlock && (
                    <div className="w-full lg:w-[350px] lg:border-l border-[#e8f0ff] bg-white">
                        <PropertiesPanel
                            block={selectedBlock}
                            firmData={firmData}
                            brandingData={brandingData}
                            onUpdate={(newData) => updateBlock(selectedBlock.id, newData)}
                            onClose={() => setSelectedBlockId(null)}
                        />
                    </div>
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
