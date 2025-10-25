import React, { useRef, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../component/icons";
import "../styles/taxupload.css";
import { FaFolder } from "react-icons/fa";
export default function TaxUploadModal({ show, handleClose }) {
    const fileInputRef = useRef();
    const [files, setFiles] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [step, setStep] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [validationErrors, setValidationErrors] = useState([]);
    const handleFinalUpload = () => {
        const errors = [];
        const currentFile = files[selectedIndex];
        if (!currentFile?.category) {
            errors.push("Please select a document category to proceed.");
        }
        if (!currentFile?.folderPath) {
            errors.push("Please select the folder to proceed.");
        }

        const duplicate = files.findIndex(
            (f, idx) =>
                idx !== selectedIndex &&
                f.name.trim().toLowerCase() === currentFile?.name.trim().toLowerCase()
        );
        if (duplicate !== -1) {
            errors.push("This document already exists.");
        }

        setValidationErrors(errors);

        if (errors.length === 0) {

            alert("Upload successful!");

        }
    };

    const [folderTree, setFolderTree] = useState([
        {
            name: "Tax Year 2023",
            expanded: true,
            children: [
                {
                    name: "Income Documents",
                    expanded: true,
                    children: [
                        { name: "W-2 Forms", children: [] },
                        { name: "1099 Forms", children: [] }
                    ]
                },
                {
                    name: "Other Income",
                    children: []
                }
            ]
        }
    ]);

    const handleFileSelect = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files).map((file) => ({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            category: "",
            folderPath: "",
            status: "Incomplete",
            file: URL.createObjectURL(file),
        }));
        setFiles([...files, ...newFiles]);
        setSelectedIndex(0);
    };

    const removeFile = (index) => {
        const updated = [...files];
        updated.splice(index, 1);
        setFiles(updated);
        if (selectedIndex >= updated.length) setSelectedIndex(0);
    };

    const handleCategoryChange = (e) => {
        const updated = [...files];
        updated[selectedIndex].category = e.target.value;
        setFiles(updated);
    };

    const handleFolderSelect = (path) => {
        const updated = [...files];
        updated[selectedIndex].folderPath = path;
        setFiles(updated);
        setSelectedFolder(path);
        setFolderDropdownOpen(false);
    };

    const proceedToConfigure = () => {
        if (files.length > 0) setStep(2);
    };

    const resetModal = () => {
        setStep(1);
        setFiles([]);
        setPreviewMode(false);
        setCreatingFolder(false);
        setNewFolderName("");
        handleClose();
    };

    const toggleExpand = (folder, path = []) => {
        const recursiveToggle = (folders, currentPath) =>
            folders.map((f, idx) => {
                if (f.name === folder.name && currentPath.join(" > ") === path.join(" > ")) {
                    return { ...f, expanded: !f.expanded };
                }
                if (f.children) {
                    return {
                        ...f,
                        children: recursiveToggle(f.children, [...currentPath, f.name]),
                    };
                }
                return f;
            });
        setFolderTree(recursiveToggle(folderTree, []));
    };
    const addFolderToParent = (tree, parentName, newFolder) => {
        return tree.map(folder => {
            if (folder.name === parentName) {
                return {
                    ...folder,
                    children: [...folder.children, newFolder]
                };
            }
            if (folder.children?.length) {
                return {
                    ...folder,
                    children: addFolderToParent(folder.children, parentName, newFolder)
                };
            }
            return folder;
        });
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;

        const newFolderObj = { name: newFolderName, children: [] };
        let updatedTree;

        if (selectedFolder) {
            updatedTree = addFolderToParent(folderTree, selectedFolder, newFolderObj);
        } else {
            updatedTree = [...folderTree, newFolderObj];
        }

        setFolderTree(updatedTree);
        setNewFolderName("");
        setCreatingFolder(false);
    };




    const renderTree = (folders, path = []) =>
        folders.map((folder, idx) => {
            const fullPath = [...path, folder.name].join(" > ");
            const hasChildren = folder.children && folder.children.length > 0;

            return (
                <div key={idx} className="ps-2">
                    <div className="d-flex align-items-center gap-1 folder-tree-item">
                        {hasChildren ? (
                            <span onClick={() => toggleExpand(folder, path)} className="cursor-pointer">
                                {folder.expanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                            </span>
                        ) : <span style={{ width: "12px" }} />}
                        <div onClick={() => handleFolderSelect(fullPath)} className="cursor-pointer">
                            <span className="d-flex align-items-center gap-2">
                                <FaFolder className="text-warning" />
                                {folder.name}
                            </span>

                        </div>
                    </div>
                    {hasChildren && folder.expanded && (
                        <div className="ps-3">
                            {renderTree(folder.children, [...path, folder.name])}
                        </div>
                    )}
                </div>
            );
        });


    return (
        <Modal show={show} onHide={resetModal} centered backdrop="static" size={step === 1 ? "md" : "xl"} className="upload-modal">
            <Modal.Body className="p-4">

                <h5 className="upload-heading">Upload Documents</h5>
                <p className="upload-subheading ">Upload your tax documents securely</p>


                <p className="upload-section-title">Add Files</p>

                <div
                    className="upload-dropzone mb-4 bg-white border rounded p-4 cursor-pointer text-center"
                    onClick={handleFileSelect}
                >
                    <UploadsIcon className="upload-icon" />
                    <p className="upload-text">
                        <strong className="texts">Drop files here or click to browse</strong>
                    </p>
                    <p className="upload-hint">
                        Supported formats: All file types (AVIF, JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, etc.) - Max 50MB per file
                    </p>
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="*/*"
                    />
                </div>

                {step === 1 && (
                    <div className="d-flex justify-content-end gap-2">
                        <Button className="btn-cancel-custom" onClick={resetModal}>
                            Cancel
                        </Button>

                        <Button
                            className="btn-upload-custom"
                            onClick={proceedToConfigure}
                            disabled={files.length === 0}
                        >
                            Upload Documents
                        </Button>
                    </div>

                )}
                {step === 2 && (
                    <>
                        <div className="d-flex flex-wrap gap-4 mt-4">
                            <div className="doc-scroll">
                                <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
                                <p className="small text-muted custom-doc-subtext">Click on a document to configure it</p>

                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`doc-item ${selectedIndex === idx ? "active" : ""}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            {/* LEFT */}
                                            <div className="d-flex align-items-start gap-2">
                                                {/* File Icon */}
                                                <div className="file-icon-wrapper">
                                                    <FaRegFileAlt className="file-icon" />
                                                </div>

                                                <div className="d-flex flex-column w-100">


                                                    <div>
                                                        <div className="small fw-semibold">{file.name}</div>
                                                        <small className="text-muted">{file.size}</small>
                                                    </div>


                                                    {selectedIndex === idx && validationErrors.length > 0 && (
                                                        <div className="mt-2">
                                                            {validationErrors.map((error, i) => (
                                                                <div key={i} className="doc-error-box">
                                                                    <span className="doc-error-icon">!</span>
                                                                    {error}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}


                                                    {selectedIndex === idx && (
                                                        <div className="doc-action-btns mt-2">
                                                            <Button
                                                                size="sm"
                                                                className="doc-btn save-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Save clicked", file);
                                                                }}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="doc-btn replace-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Replace clicked", file);
                                                                }}
                                                            >
                                                                Replace
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="doc-btn keep-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Keep Both clicked", file);
                                                                }}
                                                            >
                                                                Keep Both
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT */}
                                            <div className="d-flex gap-2 align-items-center">
                                                <span className="custom-badge">{file.status}</span>
                                                <span className="remove-icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(idx);
                                                    }}><CrossIcon /></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>




                            <div className="flex-grow-1 d-flex flex-column">
                                <div className="d-flex gap-2 mb-3">
                                    <Button className={`toggle-btn ${!previewMode ? "active" : ""}`} onClick={() => setPreviewMode(false)}>Configure</Button>
                                    <Button className={`toggle-btn ${previewMode ? "active" : ""}`} onClick={() => setPreviewMode(true)}>Preview</Button>
                                </div>

                                <div className="config-scroll flex-grow-1">
                                    {!previewMode ? (
                                        <div className="config-panel">
                                            <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
                                            <p className="small text-muted custom-doc-subtext">Click on a document to configure it</p>


                                            <Form.Group className="mb-3">
                                                <h6 className="txt">Document Category</h6>
                                                <Form.Select
                                                    className="custom-select"
                                                    value={files[selectedIndex]?.category || ""}
                                                    onChange={handleCategoryChange}
                                                >
                                                    <option value="">Select a Category</option>
                                                    <option value="W-2">W-2 Forms</option>
                                                    <option value="1099">1099 Forms</option>
                                                    <option value="Other">Other</option>
                                                </Form.Select>

                                            </Form.Group>

                                            <Form.Group className="mb-3">

                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="txt">Folder</h6>

                                                    {!creatingFolder ? (
                                                        <Button
                                                            variant="link"
                                                            className="p-0 small create-folder-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCreatingFolder(true);
                                                            }}
                                                        >

                                                            Create New Folder
                                                        </Button>

                                                    ) : (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Form.Control
                                                                size="sm"
                                                                type="text"
                                                                placeholder="Enter folder name"
                                                                value={newFolderName}
                                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCreateFolder();
                                                                }}
                                                            >
                                                                Add
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCreatingFolder(false);
                                                                    setNewFolderName("");
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    className="d-flex flex-column folder-dropdown-toggle border rounded px-2 py-2 bg-white cursor-pointer"
                                                    onClick={() => {
                                                        if (!selectedFolder) {
                                                            setFolderDropdownOpen(!folderDropdownOpen);
                                                        }
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <div className="d-flex align-items-center gap-2">
                                                            {!selectedFolder ? (
                                                                <>

                                                                    <span className="custom-select">Select a Folder</span>
                                                                </>
                                                            ) : (
                                                                <span>{selectedFolder}</span>
                                                            )}
                                                        </div>

                                                        {!selectedFolder ? (
                                                            <FaChevronDown />
                                                        ) : (
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="change-btns-t"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFolderDropdownOpen(true);
                                                                }}
                                                            >
                                                                Change
                                                            </Button>

                                                        )}
                                                    </div>

                                                    <div className="small text-muted">
                                                        {files[selectedIndex]?.name || "N/A"} &gt;{" "}
                                                        {files[selectedIndex]?.folderPath || "No folder selected"} &gt;{" "}
                                                        {files[selectedIndex]?.category || "No category selected"}
                                                    </div>
                                                </div>


                                                {/* Folder dropdown content */}
                                                {folderDropdownOpen && (
                                                    <div className="folder-dropdown-content">
                                                        <div className="small text-muted mb-1">TEMPLATED FOLDER</div>
                                                        {renderTree(folderTree)}
                                                    </div>
                                                )}
                                            </Form.Group>

                                        </div>
                                    ) : (
                                        <div className="preview-panel border rounded p-3">
                                            <iframe src={files[selectedIndex]?.file} title="Document Preview" width="100%" height="500px" />
                                        </div>
                                    )}
                                </div>

                                {/* Sticky footer buttons */}
                                <div className="sticky-footer mt-3 d-flex justify-content-end gap-2">
                                    <Button className="btn-cancel-custom" onClick={resetModal}>
                                        Cancel
                                    </Button>

                                    <Button className="btn-upload-custom" onClick={handleFinalUpload}>
                                        Upload {files.length} File{files.length !== 1 ? "s" : ""}
                                    </Button>
                                </div>

                            </div>

                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};