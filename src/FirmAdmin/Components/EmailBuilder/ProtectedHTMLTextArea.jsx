import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

const ProtectedHTMLTextArea = forwardRef(({ value, onChange, placeholder, className, id, onFocus }, ref) => {
    const editorRef = useRef(null);
    const [isInternalUpdate, setIsInternalUpdate] = useState(false);

    const escapeHTML = (text) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const getVariableClasses = (token) => {
        const isInviteLink = token === '[InviteLink]';
        const base = "protected-token select-none cursor-default inline-block align-baseline px-[6px] py-[2px] rounded-[4px] font-bold font-sans text-[11px] uppercase tracking-[0.05em] mx-[2px] transition-all duration-200 border";
        const theme = isInviteLink
            ? "bg-[#fef3c7] text-[#92400e] border-[#fbbf24]"
            : "bg-[#e8f0ff] text-[#3ad6f2] border-[#cce0ff] hover:bg-[#d1e5ff] hover:border-[#3ad6f2] hover:shadow-[0_2px_4px_rgba(58,214,242,0.1)]";
        return `${base} ${theme}`;
    };

    const getButtonClasses = () => {
        return "protected-button select-none cursor-default inline-block align-baseline px-[12px] py-[6px] rounded-[8px] font-bold text-[11px] bg-[#f3f6fd] text-[#1f2a55] border border-[#e8f0ff] hover:bg-[#e8f0ff] hover:border-[#3ad6f2] mx-[4px] my-[2px] transition-all duration-200 shadow-sm";
    };

    const formatHTML = (text) => {
        if (!text) return '';

        let processed = text;

        // More robust regex to catch the Move Invitation button even with extra whitespace or attribute ordering
        const buttonRegex = /<a\s+[^>]*href=["']\s*\[InviteLink\]\s*["'][^>]*>[\s\S]*?<\/a>/gi;
        const buttons = [];
        processed = processed.replace(buttonRegex, (match) => {
            const id = `__BTN_${buttons.length}__`;
            buttons.push(match);
            return id;
        });

        const variables = [];
        processed = processed.replace(/\[([a-zA-Z0-9]+)\]/g, (match) => {
            const id = `__VAR_${variables.length}__`;
            variables.push(match);
            return id;
        });

        let escaped = escapeHTML(processed);

        buttons.forEach((original, index) => {
            const id = `__BTN_${index}__`;
            escaped = escaped.replace(id, `<span class="${getButtonClasses()}" data-full-code="${escapeHTML(original)}" data-protected-type="button" contenteditable="false">🔒 Protected Link Button</span>`);
        });

        variables.forEach((original, index) => {
            const id = `__VAR_${index}__`;
            escaped = escaped.replace(id, `<span class="${getVariableClasses(original)}" data-token="${original}" data-protected-type="variable" contenteditable="false">${original}</span>`);
        });

        return escaped;
    };

    useImperativeHandle(ref, () => ({
        focus: () => editorRef.current?.focus(),
        insertVariable: (placeholderText) => {
            if (!editorRef.current) return;
            editorRef.current.focus();

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            const node = document.createElement('span');
            node.className = getVariableClasses(placeholderText);
            node.setAttribute('contenteditable', 'false');
            node.setAttribute('data-token', placeholderText);
            node.setAttribute('data-protected-type', 'variable');
            node.innerText = placeholderText;

            range.insertNode(node);

            range.setStartAfter(node);
            range.setEndAfter(node);
            selection.removeAllRanges();
            selection.addRange(range);

            triggerChange();
        }
    }));

    const triggerChange = () => {
        if (!editorRef.current) return;

        let text = "";
        const childNodes = editorRef.current.childNodes;

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const type = node.getAttribute('data-protected-type');
                if (type === 'button') {
                    text += node.getAttribute('data-full-code');
                } else if (type === 'variable') {
                    text += node.getAttribute('data-token');
                } else if (node.tagName === 'DIV' || node.tagName === 'P') {
                    // Browsers often wrap lines in divs or p tags
                    text += node.innerText + "\n";
                } else if (node.tagName === 'BR') {
                    text += "\n";
                } else {
                    text += node.innerText;
                }
            }
        });

        setIsInternalUpdate(true);
        onChange(text);
    };


    useEffect(() => {
        if (!editorRef.current) return;

        if (!isInternalUpdate) {
            const currentHTML = editorRef.current.innerHTML;
            const newHTML = formatHTML(value);
            if (currentHTML !== newHTML) {
                editorRef.current.innerHTML = newHTML;
            }
        }
        setIsInternalUpdate(false);
    }, [value]);

    return (
        <div className="relative w-full">
            <div
                ref={editorRef}
                id={id}
                className={`w-full min-h-[100px] p-[16px] border-2 border-[#e8f0ff] rounded-[12px] font-mono text-[13px] leading-[1.6] text-[#1f2a55] bg-white resize-y transition-all duration-200 overflow-y-auto whitespace-pre-wrap break-words outline-none focus:border-[#3ad6f2] focus:ring-[4px] focus:ring-[#3ad6f2]/10 ${className}`}
                contentEditable
                onInput={() => triggerChange()}
                onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                    triggerChange();
                }}
                onFocus={onFocus}
                spellCheck={false}
            />
            {!value && (
                <div className="absolute top-[16px] left-[16px] pointer-events-none text-[#7b8ab2] opacity-50 font-mono text-[13px]">
                    {placeholder}
                </div>
            )}
        </div>
    );
});

export default ProtectedHTMLTextArea;



