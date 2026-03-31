import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../components/icons";
import "../styles/Upload.css";
import { FaFolder } from "react-icons/fa";
import { documentsAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";


export default function UploadModal({ show, handleClose, onUploadSuccess }) {
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
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [fetchingData, setFetchingData] = useState(false);
    const [folderTree, setFolderTree] = useState([]);
    const modalBodyRef = useRef(null);



    // Fetch data on mount
    useEffect(() => {
        if (show) {
            fetchInitialData();
        }
    }, [show]);

    const fetchInitialData = async () => {
        try {
            setFetchingData(true);
            const [foldersResult, categoriesResult] = await Promise.all([
                documentsAPI.browseFoldersSplit(),
                documentsAPI.getDocumentCategories()
            ]);

            if (foldersResult.success && foldersResult.data) {
                // Convert simple folder list to the tree format expected by the UI
                const fetchedFolders = foldersResult.data.folders || [];
                const tree = fetchedFolders.map(f => ({
                    id: f.id,
                    name: f.name || f.title,
                    expanded: false,
                    children: [] // Assuming flat folders for now, or update if nested
                }));
                setFolderTree(tree);
            }

            if (categoriesResult.success && categoriesResult.data) {
                const fetchedCategories = categoriesResult.data || [];
                // Filter out duplicates by name
                const uniqueCategories = [];
                const seenNames = new Set();
                fetchedCategories.forEach(cat => {
                    if (!seenNames.has(cat.name)) {
                        seenNames.add(cat.name);
                        uniqueCategories.push(cat);
                    }
                });
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error("Error fetching upload modal data:", error);
        } finally {
            setFetchingData(false);
        }
    };

    const handleFinalUpload = async () => {
        const errors = [];
        const incompleteFiles = files.filter(f => !f.category || !f.folderId);

        if (incompleteFiles.length > 0) {
            errors.push("Please configure all files with a category and folder before uploading.");
            setValidationErrors(errors);
            return;
        }

        try {
            setLoading(true);
            setValidationErrors([]);

            // Upload files one by one (or bulk if API supports it, but uploadDocument seems to be single)
            // Wait, apiUtils shows uploadDocument takes formData. 
            // If I want to upload multiple, I should probably use a loop or a bulk endpoint.
            // Let's check apiUtils 7077 again. It uses /taxpayer/documents/upload/
            const uploadPromises = files.map(async (fileData) => {
                const formData = new FormData();
                formData.append('files', fileData.realFile);
                formData.append('category_id', fileData.category);
                formData.append('folder_id', fileData.folderId);

                // Add optional upload mode if specified
                if (fileData.upload_mode) {
                    formData.append('upload_mode', fileData.upload_mode);
                }

                // If it's a "Keep Both" and we renamed it locally
                if (fileData.upload_mode === 'keep_both' && fileData.name !== fileData.realFile.name) {
                    formData.append('custom_name', fileData.name);
                }

                return documentsAPI.uploadDocument(formData);
            });

            const results = await Promise.all(uploadPromises);
            const allSuccess = results.every(r => r.success);

            if (allSuccess) {
                toast.success("All documents uploaded successfully!");
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
                resetModal();
            } else {
                toast.error("Some uploads failed. Please try again.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            const apiError = handleAPIError(error);
            setValidationErrors([typeof apiError === 'string' ? apiError : (apiError.message || "Upload failed")]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files).map((file) => ({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            category: "",
            folderPath: "",
            folderId: "",
            status: "Incomplete",
            file: URL.createObjectURL(file), // For preview
            realFile: file, // Store the actual file for upload
        }));
        setFiles([...files, ...newFiles]);
        setSelectedIndex(0);
        // Scroll to top
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTop = 0;
        }
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

    const handleFolderSelect = (folder) => {
        const updated = [...files];
        const folderName = folder.name || folder.title;
        updated[selectedIndex].folderPath = folderName;
        updated[selectedIndex].folderId = folder.id;

        // Update status if both category and folder are selected
        if (updated[selectedIndex].category && updated[selectedIndex].folderId) {
            updated[selectedIndex].status = "Ready";
        }

        setFiles(updated);
        setSelectedFolder(folderName);
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
            const folderName = folder.name || folder.title;
            const fullPath = [...path, folderName].join(" > ");
            const hasChildren = folder.children && folder.children.length > 0;

            return (
                <div key={idx} className="ps-2">
                    <div className="d-flex align-items-center gap-1 folder-tree-item">
                        {hasChildren ? (
                            <span onClick={() => toggleExpand(folder, path)} className="cursor-pointer">
                                {folder.expanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                            </span>
                        ) : <span style={{ width: "12px" }} />}
                        <div onClick={() => handleFolderSelect(folder)} className="cursor-pointer">
                            <span className="d-flex align-items-center gap-2">
                                <FaFolder className="text-warning" />
                                {folderName}
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
            <Modal.Body className="" ref={modalBodyRef}>

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
                    <>
                        {files.length > 0 && (
                            <div className="mb-4">
                                <h6 className="mb-2 text-muted">Selected Files ({files.length})</h6>
                                <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {files.map((file, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center p-2 border-bottom last:border-0">
                                            <div className="d-flex align-items-center gap-2">
                                                <FaRegFileAlt className="text-muted" />
                                                <div>
                                                    <div className="small fw-semibold">{file.name}</div>
                                                    <small className="text-muted">{file.size}</small>
                                                </div>
                                            </div>
                                            <span className="remove-icon" onClick={(e) => removeFile(idx)}>
                                                <CrossIcon />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                    </>
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
                                                                className={`doc-btn ${file.upload_mode === 'save' ? 'save-btn' : 'replace-btn'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = [...files];
                                                                    const file = updated[idx];
                                                                    if (file.category && file.folderId) {
                                                                        file.status = "Ready";
                                                                        file.upload_mode = 'save';
                                                                        setValidationErrors([]);
                                                                    } else {
                                                                        setValidationErrors(["Please select category and folder before saving."]);
                                                                    }
                                                                    setFiles(updated);
                                                                }}
                                                            >
                                                                {file.upload_mode === 'save' ? 'Saved' : 'Save'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className={`doc-btn ${file.upload_mode === 'replace' ? 'save-btn' : 'replace-btn'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = [...files];
                                                                    const file = updated[idx];
                                                                    file.upload_mode = 'replace';
                                                                    if (file.category && file.folderId) {
                                                                        file.status = "Ready";
                                                                        setValidationErrors([]);
                                                                    }
                                                                    setFiles(updated);
                                                                }}
                                                            >
                                                                Replace
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className={`doc-btn ${file.upload_mode === 'keep_both' ? 'save-btn' : 'keep-btn'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = [...files];
                                                                    const file = updated[idx];
                                                                    file.upload_mode = 'keep_both';
                                                                    if (file.category && file.folderId) {
                                                                        file.status = "Ready";
                                                                        setValidationErrors([]);
                                                                    }
                                                                    setFiles(updated);
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
                                                <div className="dropdown custom-category-dropdown">
                                                    <Button
                                                        className="custom-select w-100 d-flex justify-content-between align-items-center bg-white border"
                                                        onClick={() => setFolderDropdownOpen(false)} // Close folder if category clicked? No, let's use another state or just Dropdown
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                        style={{ color: '#3B4A66', textAlign: 'left', minHeight: '38px', borderRadius: '6px' }}
                                                    >
                                                        {categories.find(c => c.id.toString() === files[selectedIndex]?.category.toString())?.name || "Select a Category"}
                                                        <FaChevronDown size={12} />
                                                    </Button>
                                                    <ul className="dropdown-menu w-100 category-dropdown-menu" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        <li>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => {
                                                                    const updated = [...files];
                                                                    updated[selectedIndex].category = "";
                                                                    setFiles(updated);
                                                                }}
                                                            >
                                                                Select a Category
                                                            </button>
                                                        </li>
                                                        {categories.map(cat => (
                                                            <li key={cat.id}>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        const updated = [...files];
                                                                        updated[selectedIndex].category = cat.id.toString();
                                                                        if (updated[selectedIndex].category && updated[selectedIndex].folderId) {
                                                                            updated[selectedIndex].status = "Ready";
                                                                        }
                                                                        setFiles(updated);
                                                                    }}
                                                                >
                                                                    {cat.name}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
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

                                    <Button
                                        className="btn-upload-custom"
                                        onClick={handleFinalUpload}
                                        disabled={loading || files.length === 0}
                                    >
                                        {loading ? "Uploading..." : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
                                    </Button>
                                </div>

                            </div>

                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}














