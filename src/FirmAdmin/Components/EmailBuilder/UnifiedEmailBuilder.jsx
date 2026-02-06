import React, { useState, useEffect } from 'react';
import VisualEmailBuilder from './VisualEmailBuilder';
import HTMLEditorMode from './HTMLEditorMode';
import EnhancedVariablesPanel from './EnhancedVariablesPanel';
import './UnifiedEmailBuilder.css';

const UnifiedEmailBuilder = ({
    initialMode = 'visual',
    initialBlocks = [],
    initialHTML = { header: '', body: '', footer: '' },
    firmData,
    brandingData,
    onSave,
    onModeChange,
}) => {
    const [editorMode, setEditorMode] = useState(initialMode);
    const [blocks, setBlocks] = useState(initialBlocks);
    const [html, setHtml] = useState(initialHTML);
    const [showVariables, setShowVariables] = useState(false);
    const [showModeWarning, setShowModeWarning] = useState(false);

    useEffect(() => {
        // Only trigger onModeChange if it's defined and the mode is actually different from what might be passed in props
        if (onModeChange) {
            onModeChange(editorMode);
        }
    }, [editorMode]); // Removed onModeChange from dependency array to prevent loop if function identity changes

    // Auto-sync changes to parent
    useEffect(() => {
        if (onSave) {
            onSave({
                mode: editorMode,
                blocks: editorMode === 'visual' ? blocks : [],
                html: editorMode === 'html' ? html : { header: '', body: '', footer: '' },
            });
        }
    }, [blocks, html, editorMode]);

    const handleModeToggle = () => {
        if (editorMode === 'visual') {
            // Switching to HTML mode - show warning first
            setShowModeWarning(true);
        } else {
            // Switching to Visual mode - direct switch
            setEditorMode('visual');
        }
    };

    const confirmModeSwitch = () => {
        setEditorMode('html');
        setShowModeWarning(false);
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                mode: editorMode,
                blocks: editorMode === 'visual' ? blocks : null,
                html: editorMode === 'html' ? html : null,
            });
        }
    };

    const handleInsertVariable = (placeholder) => {
        // This will be implemented in the visual builder for text blocks
        console.log('Insert variable:', placeholder);
    };

    return (
        <div className="unified-email-builder">
            {/* Mode Toggle Header */}
            <div className="builder-mode-header">
                <div className="mode-toggle-container">
                    <div className="mode-info">
                        <h3>
                            {editorMode === 'visual' ? '🎨 Visual Builder' : '⚡ HTML Editor'}
                        </h3>
                        <p>
                            {editorMode === 'visual'
                                ? 'Drag and drop content blocks to build your email - no coding required'
                                : 'Advanced HTML editing mode for experienced users'}
                        </p>
                    </div>
                    <div className="mode-actions">
                        <button
                            className="variables-toggle-btn"
                            onClick={() => setShowVariables(!showVariables)}
                        >
                            📋 {showVariables ? 'Hide' : 'Show'} Variables
                        </button>
                        <button className="mode-toggle-btn" onClick={handleModeToggle}>
                            {editorMode === 'visual' ? (
                                <>
                                    <span className="toggle-icon">⚡</span>
                                    Switch to HTML Editor
                                </>
                            ) : (
                                <>
                                    <span className="toggle-icon">🎨</span>
                                    Switch to Visual Builder
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Builder Area */}
            <div className="builder-content-area">
                {editorMode === 'visual' ? (
                    <VisualEmailBuilder
                        initialBlocks={blocks}
                        onChange={setBlocks}
                        firmData={firmData}
                        brandingData={brandingData}
                        onSave={handleSave}
                    />
                ) : (
                    <HTMLEditorMode
                        headerHTML={html.header}
                        bodyHTML={html.body}
                        footerHTML={html.footer}
                        onChange={setHtml}
                        onSave={handleSave}
                    />
                )}

                {/* Variables Panel Overlay for Visual Mode */}
                {showVariables && editorMode === 'visual' && (
                    <div className="variables-overlay">
                        <EnhancedVariablesPanel
                            onInsertVariable={handleInsertVariable}
                            onClose={() => setShowVariables(false)}
                        />
                    </div>
                )}
            </div>

            {/* Mode Switch Warning Modal */}
            {showModeWarning && (
                <div className="mode-warning-modal-overlay">
                    <div className="mode-warning-modal">
                        <div className="modal-header">
                            <h3>⚠️ Switch to Advanced HTML Editor?</h3>
                        </div>
                        <div className="modal-content">
                            <p className="warning-text">
                                The HTML Editor is designed for experienced users who are comfortable writing HTML code.
                            </p>
                            <div className="warning-points">
                                <div className="warning-point">
                                    <span className="point-icon">❗</span>
                                    <div>
                                        <strong>Technical Knowledge Required</strong>
                                        <p>You'll need to understand HTML, CSS, and email-safe coding practices.</p>
                                    </div>
                                </div>
                                <div className="warning-point">
                                    <span className="point-icon">⚠️</span>
                                    <div>
                                        <strong>Risk of Breaking Layout</strong>
                                        <p>Incorrect HTML can cause emails to display incorrectly or not at all.</p>
                                    </div>
                                </div>
                                <div className="warning-point">
                                    <span className="point-icon">📝</span>
                                    <div>
                                        <strong>Manual Coding Required</strong>
                                        <p>You'll need to write all HTML, CSS, and structure manually.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="recommendation">
                                <strong>💡 Recommendation:</strong> Most users should stick with the Visual Builder for ease of use and reliability.
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowModeWarning(false)}
                            >
                                Stay in Visual Builder
                            </button>
                            <button className="confirm-btn" onClick={confirmModeSwitch}>
                                Switch to HTML Editor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedEmailBuilder;
