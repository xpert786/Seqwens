import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../component/icons";
import "../styles/taxupload.css";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../ClientOnboarding/utils/apiUtils";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const STATUS_LABELS = {
  queued: "Queued",
  uploading: "Uploading…",
  success: "Uploaded",
  error: "Failed",
};

const formatBytes = (bytes) => {
  if (bytes === undefined || bytes === null) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const getExtension = (name = "", type = "") => {
  if (type && type.includes("/")) {
    return type.split("/").pop().toLowerCase();
  }
  const trimmed = name.trim().toLowerCase();
  if (trimmed.includes(".")) {
    return trimmed.split(".").pop();
  }
  return "";
};

const createFileEntry = (file) => {
  const extension = getExtension(file.name, file.type);
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`,
    name: file.name,
    sizeBytes: file.size,
    sizeLabel: formatBytes(file.size),
    category: "",
    categoryId: null,
    folderPath: "",
    folderId: null,
    status: "queued",
    progress: 0,
    previewUrl: URL.createObjectURL(file),
    fileObject: file,
    issues: [],
    extension,
  };
};

const uploadSingleFile = async ({ fileEntry, clientId }) => {
  const API_BASE_URL = getApiBaseUrl();
  const token = getAccessToken();

  if (!token) {
    throw new Error("No authentication token found. Please login again.");
  }

  const formData = new FormData();
  formData.append("files", fileEntry.fileObject);

  const documentsPayload = [
    {
      category_id: fileEntry.categoryId,
      folder_id: fileEntry.folderId,
      file_name: fileEntry.name,
      ...(clientId ? { client_id: clientId } : {}),
    },
  ];

  formData.append("documents", JSON.stringify(documentsPayload));

  const uploadUrl = `${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`;

  const response = await fetchWithCors(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
    } catch (_) {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};

export default function TaxUploadModal({ show, handleClose, clientId = null, onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const folderDropdownRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
  const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [folderTree, setFolderTree] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const activeFile = files[selectedIndex] || null;

  const handleFilesAdded = (fileList) => {
    if (uploading) return;

    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const skipped = [];
    const entries = incoming.reduce((acc, file) => {
      if (file.size > MAX_FILE_SIZE) {
        skipped.push(file.name);
        return acc;
      }
      acc.push(createFileEntry(file));
      return acc;
    }, []);

    if (skipped.length) {
      toast.error(`These files exceed the 50MB limit and were skipped: ${skipped.join(", ")}`);
    }

    if (!entries.length) {
      return;
    }

    const startingIndex = files.length;
    setFiles((prev) => [...prev, ...entries]);
    setSelectedIndex(startingIndex);
    setPreviewMode(false);
  };

  const handleFileSelect = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    handleFilesAdded(event.target.files);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading) {
      event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (uploading) return;
    setIsDragging(false);
    if (event.dataTransfer?.files?.length) {
      handleFilesAdded(event.dataTransfer.files);
    }
  };

  const handleClearAll = () => {
    if (uploading) return;
    files.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setFiles([]);
    setSelectedIndex(0);
    setSelectedFolder("");
    setSelectedFolderId(null);
    setPreviewMode(false);
  };

  const removeFile = (index) => {
    if (uploading) return;
    setFiles((prev) => {
      if (!prev[index]) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const nextIndex = updated.length === 0 ? 0 : Math.min(index, updated.length - 1);
      setSelectedIndex(nextIndex);
      return updated;
    });
  };

  const handleCategoryChange = (event) => {
    const categoryName = event.target.value;
    const category = categories.find((cat) => cat.name === categoryName);
    setFiles((prev) =>
      prev.map((file, index) =>
        index === selectedIndex
          ? {
              ...file,
              category: categoryName,
              categoryId: category ? category.id : null,
              issues: file.issues.filter((issue) => !issue.toLowerCase().includes("category")),
            }
          : file
      )
    );
  };

  const validateFilesBeforeUpload = (fileEntries) => {
    const nameCounts = fileEntries.reduce((acc, file) => {
      const key = file.name.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return fileEntries.map((file) => {
      const issues = [];
      if (!file.categoryId) {
        issues.push("Select a document category.");
      }
      if (!file.folderId) {
        issues.push("Select a folder.");
      }
      if (nameCounts[file.name.toLowerCase()] > 1) {
        issues.push("Duplicate file name detected.");
      }
      return {
        ...file,
        issues,
      };
    });
  };

  const fetchSubfolders = async (folderId) => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        return [];
      }

      const config = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      let response;
      if (clientId) {
        response = await fetchWithCors(
          `${API_BASE_URL}/firm/staff/folders/browse/?client_id=${clientId}&folder_id=${folderId}`,
          config
        );
      } else {
        response = await fetchWithCors(
          `${API_BASE_URL}/firm/staff/documents/browse/?folder_id=${folderId}`,
          config
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        let subfolders = [];

        if (clientId) {
          if (Array.isArray(result.data.subfolders)) {
            subfolders = result.data.subfolders;
          } else if (Array.isArray(result.data.folders)) {
            subfolders = result.data.folders;
          }
        } else if (Array.isArray(result.data.folders)) {
          subfolders = result.data.folders;
        }

        return subfolders.map((folder) => ({
          id: folder.id,
          name: folder.title || folder.name,
          title: folder.title || folder.name,
          description: folder.description || "",
          children: [],
          loaded: false,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching subfolders:", error);
      return [];
    }
  };

  const updateFolderWithSubfolders = (tree, targetFolderId, subfolders) =>
    tree.map((folder) => {
      if (folder.id === targetFolderId) {
        return {
          ...folder,
          children: subfolders,
          loaded: true,
        };
      }
      if (folder.children && folder.children.length > 0) {
        return {
          ...folder,
          children: updateFolderWithSubfolders(folder.children, targetFolderId, subfolders),
        };
      }
      return folder;
    });

  const toggleExpand = async (folder) => {
    const isExpanded = expandedFolders.has(folder.id);
    const newExpanded = new Set(expandedFolders);

    if (isExpanded) {
      newExpanded.delete(folder.id);
    } else {
      newExpanded.add(folder.id);
    }

    setExpandedFolders(newExpanded);

    if (!isExpanded && !folder.loaded && folder.id) {
      const subfolders = await fetchSubfolders(folder.id);
      setFolderTree((prevTree) => updateFolderWithSubfolders(prevTree, folder.id, subfolders));
    }
  };

  const handleFolderSelect = (path, folderId) => {
    setFiles((prev) =>
      prev.map((file, index) =>
        index === selectedIndex
          ? {
              ...file,
              folderPath: path,
              folderId,
              issues: file.issues.filter((issue) => !issue.toLowerCase().includes("folder")),
            }
          : file
      )
    );
    setSelectedFolder(path);
    setSelectedFolderId(folderId);
    setFolderDropdownOpen(false);
  };

  const findFolderById = (tree, folderId) => {
    for (const folder of tree) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setCreatingFolderLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const folderData = {
        title: newFolderName.trim(),
        description: `Documents folder: ${newFolderName.trim()}`,
      };

      if (parentFolderForNewFolder) {
        folderData.parent_id = parentFolderForNewFolder;
      }

      const apiUrl = `${API_BASE_URL}/firm/staff/documents/folders/create/`;

      const response = await fetchWithCors(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(folderData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (_) {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const folderInfo = result?.data || result;

      const newFolder = {
        id: folderInfo.id,
        name: folderInfo.title || folderInfo.name || newFolderName.trim(),
        title: folderInfo.title || folderInfo.name || newFolderName.trim(),
        description: folderInfo.description || "",
        children: [],
        loaded: false,
      };

      setFolderTree((prevTree) => {
        if (parentFolderForNewFolder) {
          const target = findFolderById(prevTree, parentFolderForNewFolder);
          const existingChildren = target?.children || [];
          return updateFolderWithSubfolders(prevTree, parentFolderForNewFolder, [...existingChildren, newFolder]);
        }
        return [...prevTree, newFolder];
      });

      setNewFolderName("");
      setCreatingFolder(false);
      setParentFolderForNewFolder(null);
      toast.success("Folder created successfully!");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error(handleAPIError(error));
    } finally {
      setCreatingFolderLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setCreatingCategoryLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        toast.error("No authentication token found. Please login again.");
        return;
      }

      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-categories/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: `Document category: ${newCategoryName.trim()}`,
          is_active: true,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
              .join("; ");
            errorMessage = errorData.message ? `${errorData.message}. ${fieldErrors}` : fieldErrors;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (_) {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create category");
      }

      const categoryInfo = result.data;
      const newCategory = {
        id: categoryInfo.id,
        name: categoryInfo.name || newCategoryName.trim(),
        description: categoryInfo.description || "",
        is_active: categoryInfo.is_active !== false,
      };

      setCategories((prev) => [...prev, newCategory]);

      setFiles((prev) =>
        prev.map((file, index) =>
          index === selectedIndex
            ? {
                ...file,
                category: newCategory.name,
                categoryId: newCategory.id,
                issues: file.issues.filter((issue) => !issue.toLowerCase().includes("category")),
              }
            : file
        )
      );

      toast.success(result.message || "Category created successfully!");
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(error.message || "Failed to create category.");
    } finally {
      setCreatingCategoryLoading(false);
    }
  };

  const renderFolderTree = (folders, path = []) =>
    folders.map((folder) => {
      const fullPath = [...path, folder.name].join(" > ");
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const showCaret = hasChildren || (!folder.loaded && folder.id);

      return (
        <div key={folder.id || fullPath} style={{ paddingLeft: "8px", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {showCaret ? (
              <span
                onClick={() => toggleExpand(folder)}
                style={{ cursor: "pointer", width: "12px", display: "inline-block" }}
              >
                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
              </span>
            ) : (
              <span style={{ width: "12px" }} />
            )}
            <div
              onClick={() => handleFolderSelect(fullPath, folder.id)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                padding: "2px 0",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "#F9FAFB";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <FaFolder style={{ color: "#F59E0B" }} />
              <span style={{ fontSize: "14px" }}>{folder.name}</span>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ paddingLeft: "12px" }}>{renderFolderTree(folder.children, [...path, folder.name])}</div>
          )}
        </div>
      );
    });

  const resetModal = (closeModal = true) => {
    files.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });

    setFiles([]);
    setSelectedIndex(0);
    setPreviewMode(false);
    setCreatingFolder(false);
    setNewFolderName("");
    setFolderDropdownOpen(false);
    setSelectedFolder("");
    setSelectedFolderId(null);
    setExpandedFolders(new Set());
    setCreatingFolderLoading(false);
    setParentFolderForNewFolder(null);
    setUploading(false);
    setCreatingCategory(false);
    setNewCategoryName("");
    setCreatingCategoryLoading(false);
    setIsDragging(false);

    if (closeModal) {
      handleClose();
    }
  };

  const handleFinalUpload = async () => {
    if (uploading || files.length === 0) return;

    const validated = validateFilesBeforeUpload(files);
    setFiles(validated);

    const hasIssues = validated.some((file) => file.issues.length > 0);
    if (hasIssues) {
      toast.error("Please resolve the highlighted issues before uploading.");
      return;
    }

    setUploading(true);
    setFolderDropdownOpen(false);
    setCreatingFolder(false);
    setCreatingCategory(false);

    const updatedFiles = [...validated];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < updatedFiles.length; i += 1) {
      updatedFiles[i] = {
        ...updatedFiles[i],
        status: "uploading",
        progress: 20,
        issues: [],
      };
      setFiles((prev) => prev.map((file, index) => (index === i ? updatedFiles[i] : file)));

      try {
        await uploadSingleFile({ fileEntry: updatedFiles[i], clientId });
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: "success",
          progress: 100,
          issues: [],
        };
        setFiles((prev) => prev.map((file, index) => (index === i ? updatedFiles[i] : file)));
        successCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload.";
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: "error",
          progress: 0,
          issues: [message],
        };
        setFiles((prev) => prev.map((file, index) => (index === i ? updatedFiles[i] : file)));
        failureCount += 1;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount === 1 ? "" : "s"} uploaded successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });
      if (typeof onUploadSuccess === "function") {
        onUploadSuccess();
      }
      if (failureCount === 0) {
        resetModal(true);
        return;
      }
    }

    if (failureCount > 0) {
      toast.error(
        `${failureCount} file${failureCount === 1 ? "" : "s"} failed to upload. Please review the highlighted items and try again.`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        folderDropdownOpen &&
        folderDropdownRef.current &&
        !folderDropdownRef.current.contains(event.target)
      ) {
        setFolderDropdownOpen(false);
      }
    };

    if (folderDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [folderDropdownOpen]);

  useEffect(() => {
    if (!show) return;

    const fetchRootFolders = async () => {
      try {
        setLoadingFolders(true);
        const API_BASE_URL = getApiBaseUrl();
        const token = getAccessToken();

        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const config = {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };

        let response;
        if (clientId) {
          response = await fetchWithCors(`${API_BASE_URL}/firm/staff/folders/browse/?client_id=${clientId}`, config);
        } else {
          response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/browse/`, config);
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          let rootFolders = [];

          if (clientId) {
            if (Array.isArray(result.data.subfolders)) {
              rootFolders = result.data.subfolders;
            } else if (Array.isArray(result.data.folders)) {
              rootFolders = result.data.folders;
            } else if (Array.isArray(result.data)) {
              rootFolders = result.data;
            }
          } else if (Array.isArray(result.data.folders)) {
            rootFolders = result.data.folders;
          }

          const mapped = rootFolders.map((folder) => ({
            id: folder.id,
            name: folder.title || folder.name,
            title: folder.title || folder.name,
            description: folder.description || "",
            children: [],
            loaded: false,
          }));

          setFolderTree(mapped);
          setExpandedFolders(new Set());
        } else {
          setFolderTree([]);
        }
      } catch (error) {
        console.error("Error fetching root folders:", error);
        toast.error("Failed to load folders. Please try again.");
        setFolderTree([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchRootFolders();
  }, [show, clientId]);

  useEffect(() => {
    if (!show) return;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const API_BASE_URL = getApiBaseUrl();
        const token = getAccessToken();

        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-categories/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data.filter((category) => category.is_active !== false));
        } else if (Array.isArray(result)) {
          setCategories(result.filter((category) => category.is_active !== false));
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load document categories.");
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [show]);

  useEffect(() => {
    if (files.length === 0) {
      setSelectedFolder("");
      setSelectedFolderId(null);
      setSelectedIndex(0);
      return;
    }

    if (selectedIndex >= files.length) {
      setSelectedIndex(files.length - 1);
      return;
    }

    const currentFile = files[selectedIndex];
    setSelectedFolder(currentFile.folderPath || "");
    setSelectedFolderId(currentFile.folderId || null);
  }, [files, selectedIndex]);

  return (
    <Modal show={show} onHide={() => resetModal(true)} centered backdrop="static" size="xl" className="upload-modal">
      <Modal.Body className="p-4">
        <h5 className="upload-heading">Upload Documents</h5>
        <p className="upload-subheading">Upload your tax documents securely</p>

        <p className="upload-section-title">Add Files</p>

        <div
          className={`upload-dropzone mb-4 ${isDragging ? "drag-active" : ""}`}
          onClick={handleFileSelect}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-disabled={uploading}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleFileSelect();
            }
          }}
        >
          <UploadsIcon className="upload-icon" />
          <p className="upload-text">
            <strong className="texts">Drop files here or click to browse</strong>
          </p>
          <p className="upload-hint">Supported formats up to 50MB per file</p>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} accept="*/*" />
        </div>

        {files.length > 0 ? (
          <div className="d-flex flex-wrap gap-4">
            <div className="doc-scroll">
              <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
              <p className="small text-muted custom-doc-subtext">Select a document to configure it</p>

              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`doc-item ${selectedIndex === index ? "active" : ""}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div className="file-icon-wrapper">
                      <FaRegFileAlt className="file-icon" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="small fw-semibold">{file.name}</div>
                          <small className="text-muted">{file.sizeLabel}</small>
                        </div>
                        <span
                          className="remove-icon"
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${file.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFile(index);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              removeFile(index);
                            }
                          }}
                        >
                          <CrossIcon />
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-2">
                        <span className={`doc-status-badge doc-status-${file.status}`}>{STATUS_LABELS[file.status]}</span>
                        {file.status === "error" && !uploading && (
                          <button
                            type="button"
                            className="btn btn-link p-0 doc-retry-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setFiles((prev) =>
                                prev.map((entry, idx) =>
                                  idx === index
                                    ? { ...entry, status: "queued", progress: 0, issues: [] }
                                    : entry
                                )
                              );
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </div>

                      <div className="doc-progress mt-2">
                        <div className={`doc-progress-bar doc-progress-${file.status}`} style={{ width: `${file.progress}%` }} />
                      </div>

                      {file.issues.length > 0 && (
                        <div className="doc-issues mt-2">
                          {file.issues.map((issue, issueIndex) => (
                            <div key={`${file.id}-issue-${issueIndex}`} className="doc-error-box">
                              <span className="doc-error-icon">!</span>
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-grow-1 d-flex flex-column">
              <div className="d-flex gap-2 mb-3">
                <Button
                  className={`toggle-btn ${!previewMode ? "active" : ""}`}
                  onClick={() => setPreviewMode(false)}
                  disabled={!activeFile}
                >
                  Configure
                </Button>
                <Button
                  className={`toggle-btn ${previewMode ? "active" : ""}`}
                  onClick={() => setPreviewMode(true)}
                  disabled={!activeFile || !activeFile.previewUrl}
                >
                  Preview
                </Button>
              </div>

              <div className="config-scroll flex-grow-1">
                {!previewMode ? (
                  <div className="config-panel">
                    <h6 className="mb-1 custom-doc-header">Details</h6>
                    <p className="small text-muted custom-doc-subtext">
                      Set the category and destination folder for <strong>{activeFile?.name}</strong>
                    </p>

                    <Form.Group className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="txt">Document Category</h6>
                        {!creatingCategory ? (
                          <Button
                            variant="link"
                            className="p-0 small create-folder-btn"
                            onClick={() => setCreatingCategory(true)}
                          >
                            Create New Category
                          </Button>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              size="sm"
                              type="text"
                              placeholder="Enter category name"
                              value={newCategoryName}
                              onChange={(event) => setNewCategoryName(event.target.value)}
                              disabled={creatingCategoryLoading}
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  handleCreateCategory();
                                } else if (event.key === "Escape") {
                                  setCreatingCategory(false);
                                  setNewCategoryName("");
                                }
                              }}
                            />
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0"
                              onClick={handleCreateCategory}
                              disabled={creatingCategoryLoading || !newCategoryName.trim()}
                            >
                              {creatingCategoryLoading ? "..." : "Create"}
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0"
                              onClick={() => {
                                setCreatingCategory(false);
                                setNewCategoryName("");
                              }}
                              disabled={creatingCategoryLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                      {!creatingCategory && (
                        <Form.Select
                          className="custom-select"
                          value={activeFile?.category || ""}
                          onChange={handleCategoryChange}
                          disabled={loadingCategories}
                        >
                          <option value="">
                            {loadingCategories ? "Loading categories..." : "Select a Category"}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      {categories.length === 0 && !loadingCategories && !creatingCategory && (
                        <small className="text-muted" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                          No categories available
                        </small>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="txt">Folder</h6>
                        {!creatingFolder ? (
                          <Button
                            variant="link"
                            className="p-0 small create-folder-btn"
                            onClick={() => {
                              setCreatingFolder(true);
                              setParentFolderForNewFolder(selectedFolderId || null);
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
                              onChange={(event) => setNewFolderName(event.target.value)}
                              disabled={creatingFolderLoading}
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && newFolderName.trim() && !creatingFolderLoading) {
                                  event.preventDefault();
                                  handleCreateFolder();
                                }
                                if (event.key === "Escape") {
                                  setCreatingFolder(false);
                                  setNewFolderName("");
                                  setParentFolderForNewFolder(null);
                                }
                              }}
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleCreateFolder}
                              disabled={creatingFolderLoading || !newFolderName.trim()}
                            >
                              {creatingFolderLoading ? "Creating..." : "Add"}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setCreatingFolder(false);
                                setNewFolderName("");
                                setParentFolderForNewFolder(null);
                              }}
                              disabled={creatingFolderLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>

                      <div ref={folderDropdownRef} style={{ position: "relative" }}>
                        <div
                          className="d-flex flex-column folder-dropdown-toggle border rounded px-2 py-2 bg-white cursor-pointer"
                          onClick={() => setFolderDropdownOpen((prev) => !prev)}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="d-flex align-items-center gap-2">
                              {selectedFolder ? <span>{selectedFolder}</span> : <span className="custom-select">Select a Folder</span>}
                            </div>
                            {selectedFolder && (
                              <Button
                                variant="light"
                                size="sm"
                                className="change-btns-t"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedFolder("");
                                  setSelectedFolderId(null);
                                  setFiles((prev) =>
                                    prev.map((file, index) =>
                                      index === selectedIndex
                                        ? { ...file, folderPath: "", folderId: null }
                                        : file
                                    )
                                  );
                                }}
                              >
                                ×
                              </Button>
                            )}
                            <FaChevronDown
                              size={12}
                              style={{
                                color: "#9CA3AF",
                                marginLeft: "8px",
                                transform: folderDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          <div className="small text-muted">
                            {activeFile?.name || "N/A"} &gt;{" "}
                            {activeFile?.folderPath || "No folder selected"} &gt;{" "}
                            {activeFile?.category || "No category selected"}
                          </div>
                        </div>

                        {folderDropdownOpen && (
                          <div
                            className="folder-dropdown-content"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              marginTop: "4px",
                              backgroundColor: "white",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              maxHeight: "300px",
                              overflowY: "auto",
                              zIndex: 1000,
                              padding: "8px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6B7280",
                                marginBottom: "8px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {clientId ? "Client Folders" : "Folders"}
                            </div>
                            {loadingFolders ? (
                              <div className="text-center p-3">
                                <small className="text-muted">Loading folders...</small>
                              </div>
                            ) : folderTree.length === 0 ? (
                              <div className="text-center p-3">
                                <small className="text-muted">
                                  {clientId ? "No folders found." : "No folders available."}
                                </small>
                              </div>
                            ) : (
                              renderFolderTree(folderTree)
                            )}
                          </div>
                        )}
                      </div>
                    </Form.Group>
                  </div>
                ) : (
                  <div className="preview-panel border rounded p-3">
                    {activeFile?.previewUrl ? (
                      <iframe
                        title={`${activeFile.name} preview`}
                        src={activeFile.previewUrl}
                        width="100%"
                        height="480px"
                      />
                    ) : (
                      <p className="text-muted mb-0">No preview available for this file.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="text-muted small"
            style={{ fontFamily: "BasisGrotesquePro", background: "#F9FAFB", padding: "16px", borderRadius: "10px" }}
          >
            No files added yet. Drag and drop files into the area above or click to browse.
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-4">
          <Button
            variant="link"
            className="p-0 text-decoration-none text-danger"
            onClick={handleClearAll}
            disabled={uploading || files.length === 0}
          >
            Clear all
          </Button>
          <div className="d-flex gap-2">
            <Button className="btn-cancel-custom" onClick={() => resetModal(true)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              className="btn-upload-custom"
              onClick={handleFinalUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading ? "Uploading..." : `Upload ${files.length === 1 ? "File" : `${files.length} Files`}`}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
