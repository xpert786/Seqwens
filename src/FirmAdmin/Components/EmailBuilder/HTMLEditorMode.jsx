import React, { useState } from 'react';
import EnhancedVariablesPanel from './EnhancedVariablesPanel';
import './HTMLEditorMode.css';

const HTMLEditorMode = ({
    headerHTML = '',
    bodyHTML = '',
    footerHTML = '',
    onChange,
    onSave
}) => {
    const [html, setHtml] = useState({
        header: headerHTML,
        body: bodyHTML,
        footer: footerHTML,
    });
    const [showVariables, setShowVariables] = useState(true);
    const [activeField, setActiveField] = useState('body');
    const [showPreview, setShowPreview] = useState(false);

    const handleChange = (field, value) => {
        const newHtml = { ...html, [field]: value };
        setHtml(newHtml);
        if (onChange) {
            onChange(newHtml);
        }
    };

    const insertVariable = (placeholder) => {
        const textarea = document.getElementById(`html-${activeField}`);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = html[activeField] || '';
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        handleChange(activeField, before + placeholder + after);

        // Reset cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 0);
    };

    const getPreviewHTML = () => {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          </style>
        </head>
        <body>
          ${html.header || ''}
          ${html.body || ''}
          ${html.footer || ''}
        </body>
      </html>
    `;
    };

    return (
        <div className="html-editor-mode">
            <div className="html-editor-header">
                <div className="mode-warning">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-content">
                        <strong>Advanced Mode</strong>
                        <p>This mode is intended for experienced users with HTML knowledge. Incorrect HTML can break email layouts.</p>
                    </div>
                </div>
                <div className="editor-actions">
                    <button
                        className="toggle-variables-btn"
                        onClick={() => setShowVariables(!showVariables)}
                    >
                        {showVariables ? 'Hide' : 'Show'} Variables
                    </button>
                    <button
                        className="toggle-preview-btn"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                    {onSave && (
                        <button className="save-html-btn" onClick={() => onSave(html)}>
                            Save Template
                        </button>
                    )}
                </div>
            </div>

            <div className="html-editor-main">
                <div className="html-editors-container">
                    <div className="html-editor-section">
                        <label htmlFor="html-header">
                            <strong>Header HTML</strong>
                            <span className="optional-label">(Optional - appears at top of email)</span>
                        </label>
                        <textarea
                            id="html-header"
                            className="html-textarea"
                            value={html.header}
                            onChange={(e) => handleChange('header', e.target.value)}
                            onFocus={() => setActiveField('header')}
                            placeholder="Enter header HTML (e.g., logo, navigation)..."
                            spellCheck={false}
                        />
                    </div>

                    <div className="html-editor-section">
                        <label htmlFor="html-body">
                            <strong>Body HTML</strong>
                            <span className="required-label">(Required - main email content)</span>
                        </label>
                        <textarea
                            id="html-body"
                            className="html-textarea body"
                            value={html.body}
                            onChange={(e) => handleChange('body', e.target.value)}
                            onFocus={() => setActiveField('body')}
                            placeholder="Enter body HTML (main email content)..."
                            spellCheck={false}
                        />
                    </div>

                    <div className="html-editor-section">
                        <label htmlFor="html-footer">
                            <strong>Footer HTML</strong>
                            <span className="optional-label">(Optional - appears at bottom of email)</span>
                        </label>
                        <textarea
                            id="html-footer"
                            className="html-textarea"
                            value={html.footer}
                            onChange={(e) => handleChange('footer', e.target.value)}
                            onFocus={() => setActiveField('footer')}
                            placeholder="Enter footer HTML (e.g., contact info, unsubscribe)..."
                            spellCheck={false}
                        />
                    </div>

                    <div className="html-tips">
                        <h4>💡 HTML Tips</h4>
                        <ul>
                            <li>Use inline CSS styles for best email compatibility</li>
                            <li>Use table layouts instead of divs for complex layouts</li>
                            <li>Test in multiple email clients before sending</li>
                            <li>Insert variables using the panel on the right →</li>
                        </ul>
                    </div>
                </div>

                {showPreview && (
                    <div className="html-preview-panel">
                        <div className="preview-header">
                            <h3>Email Preview</h3>
                        </div>
                        <div className="preview-content">
                            <iframe
                                srcDoc={getPreviewHTML()}
                                title="Email Preview"
                                className="preview-iframe"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                )}

                {showVariables && (
                    <EnhancedVariablesPanel
                        onInsertVariable={insertVariable}
                        onClose={() => setShowVariables(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default HTMLEditorMode;
