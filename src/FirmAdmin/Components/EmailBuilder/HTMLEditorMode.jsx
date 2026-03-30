// import React, { useState } from 'react';
// import EnhancedVariablesPanel from './EnhancedVariablesPanel';
// import ProtectedHTMLTextArea from './ProtectedHTMLTextArea';

// const HTMLEditorMode = ({
//     headerHTML = '',
//     bodyHTML = '',
//     footerHTML = '',
//     onChange,
//     onSave
// }) => {
//     const [html, setHtml] = useState({
//         header: headerHTML,
//         body: bodyHTML,
//         footer: footerHTML,
//     });
//     const [showVariables, setShowVariables] = useState(true);
//     const [activeField, setActiveField] = useState('body');
//     const [showPreview, setShowPreview] = useState(false);
//     const headerRef = React.useRef(null);
//     const bodyRef = React.useRef(null);
//     const footerRef = React.useRef(null);


//     const handleChange = (field, value) => {
//         const newHtml = { ...html, [field]: value };
//         setHtml(newHtml);
//         if (onChange) {
//             onChange(newHtml);
//         }
//     };

//     const insertVariable = (placeholder) => {
//         const refs = { header: headerRef, body: bodyRef, footer: footerRef };
//         const ref = refs[activeField];
//         if (ref && ref.current) {
//             ref.current.insertVariable(placeholder);
//         }
//     };


//     const getPreviewHTML = () => {
//         return `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <style>
//             body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
//           </style>
//         </head>
//         <body>
//           ${html.header || ''}
//           ${html.body || ''}
//           ${html.footer || ''}
//         </body>
//       </html>
//     `;
//     };

//     return (
//         <div className="flex flex-col bg-[#f3f6fd]">
//             <div className="sticky top-0 z-10 bg-white border-b border-[#e8f0ff] p-[16px_24px] flex-shrink-0">
//                 <div className="flex gap-[12px] p-[12px_16px] bg-[#fff3cd] border-l-4 border-[#f56d2d] rounded-[12px] mb-[16px]">
//                     <span className="text-[24px]">⚠️</span>
//                     <div className="warning-content">
//                         <strong className="block text-[#856404] text-[14px] mb-[4px] font-bold">Advanced Mode</strong>
//                         <p className="m-0 text-[12px] text-[#856404] leading-[1.5]">This mode is intended for experienced users with HTML knowledge. Incorrect HTML can break email layouts.</p>
//                     </div>
//                 </div>
//                 <div className="flex gap-[12px] justify-end">
//                     <button
//                         className="p-[10px_20px] !rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer bg-white text-[#1f2a55] border-2 border-[#e8f0ff]  onClick={() => setShowVariables(!showVariables)}
//                     >
//                         {showVariables ? 'Hide' : 'Show'} Variables
//                     </button>
//                     <button
//                        className="p-[10px_20px] !rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer bg-white text-[#1f2a55] border-2 border-[#e8f0ff] " onClick={() => setShowPreview(!showPreview)}
//                     >
//                         {showPreview ? 'Hide' : 'Show'} Preview
//                     </button>
//                     {onSave && (
//                         <button
//                             className="p-[10px_20px] !rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer bg-[#3ad6f2] text-white onClick={() => onSave(html)}
//                         >
//                             Save Template
//                         </button>
//                     )}
//                 </div>
//             </div>

//            <div className="flex flex-row items-stretch min-h-[calc(100vh-150px)] bg-white">
//                 {/* Editor Panel */}
//                 {!showPreview ? (
//                     <div className="flex-1 p-[24px]">
//                         <div className="max-w-[800px] mx-auto">
//                             <div className="mb-[24px]">
//                                 <label htmlFor="html-header" className="flex items-center gap-[8px] mb-[8px] text-[14px] text-[#1f2a55]">
//                                     <strong className="font-bold">Header HTML</strong>
//                                     <span className="text-[11px] text-[#6e7dae] font-medium">(Optional)</span>
//                                 </label>
//                                 <ProtectedHTMLTextArea
//                                     ref={headerRef}
//                                     id="html-header"
//                                     className="w-full min-h-[100px]"
//                                     value={html.header}
//                                     onChange={(value) => handleChange('header', value)}
//                                     onFocus={() => setActiveField('header')}
//                                     placeholder="Enter header HTML..."
//                                 />
//                             </div>

//                             <div className="mb-[24px]">
//                                 <label htmlFor="html-body" className="flex items-center gap-[8px] mb-[8px] text-[14px] text-[#1f2a55]">
//                                     <strong className="font-bold">Body HTML</strong>
//                                     <span className="text-[11px] text-[#f56d2d] font-semibold">(Required)</span>
//                                 </label>
//                                 <ProtectedHTMLTextArea
//                                     ref={bodyRef}
//                                     id="html-body"
//                                     className="w-full min-h-[300px]"
//                                     value={html.body}
//                                     onChange={(value) => handleChange('body', value)}
//                                     onFocus={() => setActiveField('body')}
//                                     placeholder="Enter body HTML..."
//                                 />
//                             </div>

//                             <div className="mb-[24px]">
//                                 <label htmlFor="html-footer" className="flex items-center gap-[8px] mb-[8px] text-[14px] text-[#1f2a55]">
//                                     <strong className="font-bold">Footer HTML</strong>
//                                     <span className="text-[11px] text-[#6e7dae] font-medium">(Optional)</span>
//                                 </label>
//                                 <ProtectedHTMLTextArea
//                                     ref={footerRef}
//                                     id="html-footer"
//                                     className="w-full min-h-[100px]"
//                                     value={html.footer}
//                                     onChange={(value) => handleChange('footer', value)}
//                                     onFocus={() => setActiveField('footer')}
//                                     placeholder="Enter footer HTML..."
//                                 />
//                             </div>

//                             <div className="p-[16px] bg-[#ebfcff] border-l-4 border-[#3ad6f2] rounded-[12px] mt-[24px]">
//                                 <h4 className="m-[0_0_12px_0] text-[14px] text-[#1f2a55] font-bold">💡 HTML Tips</h4>
//                                 <ul className="m-0 pl-[20px]">
//                                     <li className="text-[12px] text-[#1f2a55] mb-[6px] leading-[1.5]">Use inline CSS styles for best email compatibility</li>
//                                     <li className="text-[12px] text-[#1f2a55] mb-[6px] leading-[1.5]">Use table layouts instead of divs</li>
//                                     <li className="text-[12px] text-[#1f2a55] mb-[6px] leading-[1.5]">Insert variables using the panel on the right →</li>
//                                 </ul>
//                             </div>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="flex-1 bg-white flex flex-col min-h-0">
//                         <div className="p-[20px] border-b border-[#e8f0ff] bg-[#f9fbff] flex-shrink-0 flex items-center justify-between">
//                             <h3 className="m-0 text-[16px] font-bold text-[#1f2a55]">Full Email Preview</h3>
//                             <button
//                                 className="text-[12px] text-[#3ad6f2] font-semibold onClick={() => setShowPreview(false)}
//                             >
//                                 Back to Editor
//                             </button>
//                         </div>
//                        <div className="flex-1 p-[24px] bg-[#f3f6fd] flex justify-center">
//                             <div className="w-full max-w-[600px] bg-white shadow-lg rounded-[12px] border border-[#e8f0ff] min-h-[600px] mb-[40px]">
//                                 <iframe
//                                     srcDoc={getPreviewHTML()}
//                                     title="Email Preview"
//                                     className="w-full border-none min-h-[500px]"
//                                     sandbox="allow-same-origin"
//                                     onLoad={(e) => {
//                                         const iframe = e.target;
//                                         if (iframe.contentWindow) {
//                                             iframe.style.height = '0px'; // Reset height
//                                             iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
//                                         }
//                                     }}
//                                 />
//                             </div>
//                         </div>

//                     </div>
//                 )}

//                 {/* Variables Panel */}
//                 {showVariables && (
//                     <div className="w-[300px] border-l border-[#e8f0ff] flex-shrink-0 flex-col flex bg-white relative">
//                         <div className="sticky top-[80px] h-[calc(100vh-100px)]">
//                             <EnhancedVariablesPanel
//                                 onInsertVariable={!showPreview ? insertVariable : null}
//                                 onClose={() => setShowVariables(false)}
//                             />
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );

// };

// export default HTMLEditorMode;


import React, { useState } from 'react';
import EnhancedVariablesPanel from './EnhancedVariablesPanel';
import ProtectedHTMLTextArea from './ProtectedHTMLTextArea';

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

    const headerRef = React.useRef(null);
    const bodyRef = React.useRef(null);
    const footerRef = React.useRef(null);

    const handleChange = (field, value) => {
        const newHtml = { ...html, [field]: value };
        setHtml(newHtml);

        if (onChange) {
            onChange(newHtml);
        }
    };

    const insertVariable = (placeholder) => {
        const refs = {
            header: headerRef,
            body: bodyRef,
            footer: footerRef
        };

        const ref = refs[activeField];

        if (ref && ref.current) {
            ref.current.insertVariable(placeholder);
        }
    };

    const getPreviewHTML = () => {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
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
        <div className="flex flex-col bg-[#f3f6fd]">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#e8f0ff] p-[16px_24px] flex-shrink-0">

                {/* Warning */}
                <div className="flex gap-[12px] p-[12px_16px] bg-[#fff3cd] border-l-4 border-[#f56d2d] rounded-[12px] mb-[16px]">
                    <span className="text-[24px]">⚠️</span>

                    <div>
                        <strong className="block text-[#856404] text-[14px] mb-[4px] font-bold">
                            Advanced Mode
                        </strong>

                        <p className="m-0 text-[12px] text-[#856404] leading-[1.5]">
                            This mode is intended for experienced users with HTML knowledge.
                            Incorrect HTML can break email layouts.
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-[12px] justify-end">

                    {/* Show Variables */}
                    <button
                        onClick={() => setShowVariables(!showVariables)}
                        className="p-[10px_20px] !rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer bg-white text-[#1f2a55] border-2 border-[#e8f0ff]"
                    >
                        {showVariables ? 'Hide' : 'Show'} Variables
                    </button>

                    {/* Show Preview */}
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="p-[10px_20px] !rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer bg-white text-[#1f2a55] border-2 border-[#e8f0ff]"
                    >
                        {showPreview ? 'Hide' : 'Show'} Preview
                    </button>

                    {/* Save */}
                    {onSave && (
                        <button
                            onClick={() => onSave(html)}
                            className="p-[10px_20px] !rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer bg-[#3ad6f2] text-white"
                        >
                            Save Template
                        </button>
                    )}

                </div>
            </div>

            {/* Body Layout */}
            <div className="flex flex-row items-stretch min-h-[calc(100vh-150px)] bg-white">

                {/* Editor OR Preview */}
                {!showPreview ? (

                    <div className="flex-1 p-[24px]">

                        <div className="max-w-[800px] mx-auto">

                            {/* Header */}
                            <div className="mb-[24px]">

                                <label className="flex items-center gap-[8px] mb-[8px] text-[14px] text-[#1f2a55]">

                                    <strong className="font-bold">
                                        Header HTML
                                    </strong>

                                    <span className="text-[11px] text-[#6e7dae] font-medium">
                                        (Optional)
                                    </span>

                                </label>

                                <ProtectedHTMLTextArea
                                    ref={headerRef}
                                    className="w-full min-h-[100px]"
                                    value={html.header}
                                    onChange={(value) => handleChange('header', value)}
                                    onFocus={() => setActiveField('header')}
                                    placeholder="Enter header HTML..."
                                />

                            </div>

                            {/* Body */}
                            <div className="mb-[24px]">

                                <label className="flex items-center gap-[8px] mb-[8px] text-[14px] text-[#1f2a55]">

                                    <strong className="font-bold">
                                        Body HTML
                                    </strong>

                                    <span className="text-[11px] text-[#f56d2d] font-semibold">
                                        (Required)
                                    </span>

                                </label>

                                <ProtectedHTMLTextArea
                                    ref={bodyRef}
                                    className="w-full min-h-[300px]"
                                    value={html.body}
                                    onChange={(value) => handleChange('body', value)}
                                    onFocus={() => setActiveField('body')}
                                    placeholder="Enter body HTML..."
                                />

                            </div>

                            {/* Footer */}
                            <div className="mb-[24px]">

                                <label className="flex items-center gap-[8px] mb-[8px] text-[14px] text-[#1f2a55]">

                                    <strong className="font-bold">
                                        Footer HTML
                                    </strong>

                                    <span className="text-[11px] text-[#6e7dae] font-medium">
                                        (Optional)
                                    </span>

                                </label>

                                <ProtectedHTMLTextArea
                                    ref={footerRef}
                                    className="w-full min-h-[100px]"
                                    value={html.footer}
                                    onChange={(value) => handleChange('footer', value)}
                                    onFocus={() => setActiveField('footer')}
                                    placeholder="Enter footer HTML..."
                                />

                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="flex-1 bg-white flex flex-col min-h-0">

                        <div className="p-[20px] border-b border-[#e8f0ff] bg-[#f9fbff] flex items-center justify-between">

                            <h3 className="m-0 text-[16px] font-bold text-[#1f2a55]">
                                Full Email Preview
                            </h3>

                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-[12px] text-[#3ad6f2] font-semibold"
                            >
                                Back to Editor
                            </button>

                        </div>

                        <div className="flex-1 p-[24px] bg-[#f3f6fd] flex justify-center">

                            <div className="w-full max-w-[600px] bg-white shadow-lg rounded-[12px] border border-[#e8f0ff] min-h-[600px] mb-[40px]">

                                <iframe
                                    srcDoc={getPreviewHTML()}
                                    title="Email Preview"
                                    className="w-full border-none min-h-[500px]"
                                    sandbox="allow-same-origin"
                                    onLoad={(e) => {
                                        const iframe = e.target;

                                        if (iframe.contentWindow) {
                                            iframe.style.height = '0px';

                                            iframe.style.height =
                                                iframe.contentWindow.document.body.scrollHeight + 'px';
                                        }
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                )}

                {/* Variables Panel */}
                {showVariables && (

                    <div className="w-[300px] border-l border-[#e8f0ff] flex-shrink-0 flex-col flex bg-white relative">

                        <div className="sticky top-[80px] h-[calc(100vh-100px)]">

                            <EnhancedVariablesPanel
                                onInsertVariable={!showPreview ? insertVariable : null}
                                onClose={() => setShowVariables(false)}
                            />

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
};

export default HTMLEditorMode;
