import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function NewFolderModal({ show, handleClose, onCreateFolder }) {
    const [folderName, setFolderName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (folderName.trim()) {
            onCreateFolder(folderName);
            setFolderName('');
            handleClose();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Body className="p-0">
                <div className="p-4 bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0" style={{ color: '#3B4A66', fontWeight: 'bold' }}>Create New Folder</h5>
                        <button
                            className="btn-close"
                            onClick={handleClose}
                            aria-label="Close"
                        ></button>
                    </div>
                </div>

                <div className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#3B4A66', fontWeight: '500' }}>Folder Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter folder name"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                variant="outline-secondary"
                                onClick={handleClose}
                                style={{ borderRadius: '8px' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                style={{
                                    backgroundColor: '#00C0C6',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                                disabled={!folderName.trim()}
                            >
                                Create Folder
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal.Body>
        </Modal>
    );
}
