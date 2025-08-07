import React, { useRef, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaCloudUploadAlt, FaRegFileAlt, FaTimes } from "react-icons/fa";
import { UploadsIcon } from "../components/icons";
import "../styles/Upload.css";

export default function UploadModal({ show, handleClose }) {
    const fileInputRef = useRef();
    const [files, setFiles] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [step, setStep] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);

    const [folderList, setFolderList] = useState([
        "Tax Year 2023 > Income Documents > W-2 Forms",
        "Tax Year 2023 > Income Documents > 1099 Forms",
        "Tax Year 2023 > Other Income",
    ]);

    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const handleFileSelect = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files).map((file) => ({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            category: "",
            folderPath: folderList[0],
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

    const handleFolderChange = (e) => {
        const updated = [...files];
        updated[selectedIndex].folderPath = e.target.value;
        setFiles(updated);
    };

    const proceedToConfigure = () => {
        if (files.length > 0) setStep(2);
    };

    const resetModal = () => {
        setStep(1);
        setFiles([]);
        setPreviewMode(false);
        handleClose();
    };

    const togglePreview = () => {
        setPreviewMode(!previewMode);
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim() !== "") {
            const newPath = `Tax Year 2023 > ${newFolderName}`;
            setFolderList([...folderList, newPath]);

            // Assign new folder to selected file
            const updated = [...files];
            updated[selectedIndex].folderPath = newPath;
            setFiles(updated);

            // Reset UI
            setCreatingFolder(false);
            setNewFolderName("");
        }
    };

    return (
        <Modal
            show={show}
            onHide={resetModal}
            centered
            backdrop="static"
            size={step === 1 ? "md" : "xl"}
            className="upload-modal"
        >
            <Modal.Body className="p-4">
                <h5 className="upload-heading">Upload Documents</h5>
                <p className="upload-subheading">Upload your tax documents securely</p>
                <p className="upload-section-title">Add Files</p>

                <div
                    className="upload-dropzone mb-4 bg-white border rounded p-4 cursor-pointer text-center"
                    onClick={handleFileSelect}
                >
                    <UploadsIcon className="upload-icon" />
                    <p className="upload-text">
                        <strong>Drop files here or click to browse</strong>
                    </p>
                    <p className="upload-hint">
                        Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Max 10MB per file)
                    </p>
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                </div>

                {step === 1 && (
                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-secondary" onClick={resetModal}>
                            Cancel
                        </Button>
                        <Button
                            className="btn-orange"
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
                            {/* Left Panel */}
                            <div className="doc-list">
                                <h6 className="mb-1">Documents ({files.length})</h6>
                                <p className="small text-muted">Click on a document to configure it</p>
                                <div className="doc-scroll">
                                    {files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className={`doc-item ${selectedIndex === idx ? "active" : ""}`}
                                            onClick={() => setSelectedIndex(idx)}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-start gap-2">
                                                    <FaRegFileAlt className="file-icon" />
                                                    <div>
                                                        <div className="small fw-semibold">{file.name}</div>
                                                        <small className="text-muted">{file.size}</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2 align-items-center">
                                                    <span className="badge bg-warning text-dark small">{file.status}</span>
                                                    <FaTimes
                                                        className="remove-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(idx);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Panel */}
                            <div className="flex-grow-1">
                                <div className="d-flex gap-2 mb-3">
                                    <Button
                                        className={`toggle-btn ${!previewMode ? "active" : ""}`}
                                        onClick={() => setPreviewMode(false)}
                                    >
                                        Configure
                                    </Button>

                                    <Button
                                        className={`toggle-btn ${previewMode ? "active" : ""}`}
                                        onClick={() => setPreviewMode(true)}
                                    >
                                        Preview
                                    </Button>
                                </div>

                                {!previewMode ? (
                                    <div className="config-panel">
                                        <h6 className="fw-bold">Document Configuration</h6>

                                        {/* Category Select */}
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-semibold">Document Category</Form.Label>
                                            <Form.Select
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
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <Form.Label className="small fw-semibold mb-0">Folders</Form.Label>
                                                <Button
                                                    variant="link"
                                                    className="p-0 small"
                                                    onClick={() => setCreatingFolder(true)}
                                                >
                                                    Create New Folder
                                                </Button>
                                            </div>

                                            {!creatingFolder ? (
                                                <Form.Select
                                                    value={files[selectedIndex]?.folderPath || ""}
                                                    onChange={handleFolderChange}
                                                    className="custom-folder-dropdown"
                                                >
                                                    {folderList.map((folder, idx) => (
                                                        <option key={idx} value={folder}>
                                                            📁 {folder}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            ) : (
                                                <div className="d-flex gap-2">
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="Enter folder name"
                                                        value={newFolderName}
                                                        onChange={(e) => setNewFolderName(e.target.value)}
                                                    />
                                                    <Button variant="primary" size="sm" onClick={handleCreateFolder}>
                                                        Add
                                                    </Button>
                                                </div>
                                            )}
                                        </Form.Group>

                                    </div>
                                ) : (
                                    <div className="preview-panel border rounded p-3">
                                        <iframe
                                            src={files[selectedIndex]?.file}
                                            title="Document Preview"
                                            width="100%"
                                            height="500px"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="outline-secondary" onClick={resetModal}>
                                Cancel
                            </Button>
                            <Button className="btn-orange">
                                Upload {files.length} File{files.length !== 1 ? "s" : ""}
                            </Button>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}






