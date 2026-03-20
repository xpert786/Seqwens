import React, { useState, useEffect, useCallback } from "react";
import { superAdminAPI } from "../../utils/superAdminAPI";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm" },
  { value: "formal", label: "Formal" },
  { value: "urgent", label: "Urgent" },
  { value: "informative", label: "Informative" },
];

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getSystemTemplates(search);
      if (res?.success) {
        setTemplates(res.data || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelectTemplate = async (template) => {
    try {
      const res = await superAdminAPI.getSystemTemplate(template.id);
      if (res?.success) {
        setSelectedTemplate(res.data);
        setEditData(res.data);
        setEditMode(false);
        setShowPreview(false);
      }
    } catch (err) {
      showToast(err.message || "Failed to load template details", "error");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await superAdminAPI.updateSystemTemplate(selectedTemplate.id, {
        name: editData.name,
        description: editData.description,
        subject: editData.subject,
        body_html: editData.body_html,
        tone: editData.tone,
        is_active: editData.is_active,
      });
      if (res?.success) {
        showToast("Template updated successfully!");
        setEditMode(false);
        fetchTemplates();
        // Refresh detail
        const detail = await superAdminAPI.getSystemTemplate(selectedTemplate.id);
        if (detail?.success) setSelectedTemplate(detail.data);
      }
    } catch (err) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await superAdminAPI.previewSystemTemplate({
        body_html: editData.body_html || selectedTemplate.body_html,
        subject: editData.subject || selectedTemplate.subject,
        email_type: selectedTemplate.email_type,
      });
      if (res?.success) {
        setPreviewHtml(res.data.html);
        setShowPreview(true);
      }
    } catch {
      // If preview fails, just show raw HTML
      setPreviewHtml(editData.body_html || selectedTemplate.body_html);
      setShowPreview(true);
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const res = await superAdminAPI.updateSystemTemplate(template.id, {
        is_active: !template.is_active,
      });
      if (res?.success) {
        showToast(`Template ${template.is_active ? "disabled" : "enabled"}`);
        fetchTemplates();
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate({ ...selectedTemplate, is_active: !template.is_active });
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to update", "error");
    }
  };

  // Styles
  const styles = {
    container: {
      display: "flex",
      gap: "24px",
      minHeight: "600px",
      fontFamily: "BasisGrotesquePro, sans-serif",
    },
    sidebar: {
      width: "340px",
      minWidth: "340px",
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #E5E7EB",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    sidebarHeader: {
      padding: "20px",
      borderBottom: "1px solid #E5E7EB",
    },
    sidebarTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1F2937",
      margin: "0 0 12px 0",
    },
    searchInput: {
      width: "100%",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #D1D5DB",
      fontSize: "13px",
      outline: "none",
      boxSizing: "border-box",
    },
    templateList: {
      flex: 1,
      overflowY: "auto",
      padding: "8px",
    },
    templateItem: (isActive) => ({
      padding: "12px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      marginBottom: "4px",
      background: isActive ? "#EEF2FF" : "transparent",
      border: isActive ? "1px solid #C7D2FE" : "1px solid transparent",
      transition: "all 0.15s ease",
    }),
    templateName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#1F2937",
      margin: "0 0 2px 0",
    },
    templateType: {
      fontSize: "12px",
      color: "#6B7280",
      margin: 0,
    },
    badge: (active) => ({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "500",
      backgroundColor: active ? "#D1FAE5" : "#FEE2E2",
      color: active ? "#065F46" : "#991B1B",
    }),
    main: {
      flex: 1,
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #E5E7EB",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    mainHeader: {
      padding: "20px 24px",
      borderBottom: "1px solid #E5E7EB",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    mainTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#1F2937",
      margin: 0,
    },
    btnGroup: {
      display: "flex",
      gap: "8px",
    },
    btn: (variant = "default") => ({
      padding: "8px 16px",
      borderRadius: "8px",
      border: variant === "default" ? "1px solid #D1D5DB" : "none",
      background: variant === "primary" ? "#4F46E5" : variant === "danger" ? "#EF4444" : "#fff",
      color: variant === "primary" || variant === "danger" ? "#fff" : "#374151",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }),
    content: {
      flex: 1,
      padding: "24px",
      overflowY: "auto",
    },
    fieldGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #D1D5DB",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #D1D5DB",
      fontSize: "13px",
      fontFamily: "monospace",
      outline: "none",
      boxSizing: "border-box",
      minHeight: "300px",
      resize: "vertical",
    },
    select: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #D1D5DB",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
      background: "#fff",
    },
    row: {
      display: "flex",
      gap: "16px",
    },
    col: {
      flex: 1,
    },
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#9CA3AF",
      fontSize: "14px",
      textAlign: "center",
      padding: "40px",
    },
    toast: (type) => ({
      position: "fixed",
      bottom: "24px",
      right: "24px",
      padding: "12px 20px",
      borderRadius: "8px",
      background: type === "error" ? "#FEE2E2" : "#D1FAE5",
      color: type === "error" ? "#991B1B" : "#065F46",
      fontSize: "13px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 9999,
      transition: "all 0.3s ease",
    }),
    previewFrame: {
      width: "100%",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      minHeight: "400px",
      background: "#fff",
    },
    toggleSwitch: (isOn) => ({
      position: "relative",
      width: "40px",
      height: "22px",
      borderRadius: "12px",
      background: isOn ? "#4F46E5" : "#D1D5DB",
      cursor: "pointer",
      transition: "background 0.2s ease",
      border: "none",
      padding: 0,
    }),
    toggleKnob: (isOn) => ({
      position: "absolute",
      top: "2px",
      left: isOn ? "20px" : "2px",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      background: "#fff",
      transition: "left 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }),
  };

  return (
    <div>
      {/* Toast */}
      {toast.show && <div style={styles.toast(toast.type)}>{toast.message}</div>}

      <div style={styles.container}>
        {/* Sidebar - Template List */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>📧 System Email Templates</h3>
            <input
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.templateList}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF" }}>
                Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF" }}>
                No templates found
              </div>
            ) : (
              templates.map((t) => (
                <div
                  key={t.id}
                  style={styles.templateItem(selectedTemplate?.id === t.id)}
                  onClick={() => handleSelectTemplate(t)}
                  onMouseEnter={(e) => {
                    if (selectedTemplate?.id !== t.id) e.currentTarget.style.background = "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate?.id !== t.id) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={styles.templateName}>{t.name}</p>
                    <span style={styles.badge(t.is_active)}>{t.is_active ? "Active" : "Disabled"}</span>
                  </div>
                  <p style={styles.templateType}>{t.email_type.replace(/_/g, " ")}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {!selectedTemplate ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
              <p style={{ fontWeight: "500", color: "#6B7280", marginBottom: "4px" }}>
                Select a template to view or edit
              </p>
              <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
                Choose from the list on the left to manage system email templates
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={styles.mainHeader}>
                <div>
                  <h2 style={styles.mainTitle}>
                    {editMode ? "Edit Template" : selectedTemplate.name}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>
                    Type: <strong>{selectedTemplate.email_type.replace(/_/g, " ")}</strong>
                  </p>
                </div>
                <div style={styles.btnGroup}>
                  {editMode ? (
                    <>
                      <button
                        style={styles.btn("default")}
                        onClick={() => {
                          setEditMode(false);
                          setEditData(selectedTemplate);
                          setShowPreview(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button style={styles.btn("primary")} onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        style={styles.btn("default")}
                        onClick={handlePreview}
                      >
                        👁 Preview
                      </button>
                      <button
                        style={styles.btn("primary")}
                        onClick={() => {
                          setEditMode(true);
                          setEditData({ ...selectedTemplate });
                          setShowPreview(false);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>
                          {selectedTemplate.is_active ? "Active" : "Disabled"}
                        </span>
                        <button
                          style={styles.toggleSwitch(selectedTemplate.is_active)}
                          onClick={() => handleToggleActive(selectedTemplate)}
                        >
                          <span style={styles.toggleKnob(selectedTemplate.is_active)} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={styles.content}>
                {showPreview && !editMode ? (
                  <div>
                    <div
                      style={{
                        marginBottom: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: "15px", color: "#374151" }}>Email Preview</h4>
                      <button style={styles.btn("default")} onClick={() => setShowPreview(false)}>
                        Close Preview
                      </button>
                    </div>
                    <iframe
                      title="Email Preview"
                      srcDoc={previewHtml}
                      style={styles.previewFrame}
                      sandbox=""
                    />
                  </div>
                ) : editMode ? (
                  <div>
                    <div style={styles.row}>
                      <div style={{ ...styles.col, ...styles.fieldGroup }}>
                        <label style={styles.label}>Template Name</label>
                        <input
                          style={styles.input}
                          value={editData.name || ""}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div style={{ ...styles.col, ...styles.fieldGroup }}>
                        <label style={styles.label}>Tone</label>
                        <select
                          style={styles.select}
                          value={editData.tone || "professional"}
                          onChange={(e) => setEditData({ ...editData, tone: e.target.value })}
                        >
                          {TONE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Description</label>
                      <input
                        style={styles.input}
                        value={editData.description || ""}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Subject Line</label>
                      <input
                        style={styles.input}
                        value={editData.subject || ""}
                        onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Body HTML</label>
                      <textarea
                        style={styles.textarea}
                        value={editData.body_html || ""}
                        onChange={(e) => setEditData({ ...editData, body_html: e.target.value })}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button style={styles.btn("default")} onClick={handlePreview}>
                        👁 Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={styles.row}>
                      <div style={{ ...styles.col, ...styles.fieldGroup }}>
                        <label style={styles.label}>Description</label>
                        <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                          {selectedTemplate.description || "—"}
                        </p>
                      </div>
                      <div style={{ ...styles.col, ...styles.fieldGroup }}>
                        <label style={styles.label}>Tone</label>
                        <p style={{ margin: 0, fontSize: "14px", color: "#374151", textTransform: "capitalize" }}>
                          {selectedTemplate.tone || "—"}
                        </p>
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Subject Line</label>
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          fontSize: "14px",
                          color: "#1F2937",
                        }}
                      >
                        {selectedTemplate.subject}
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Body HTML</label>
                      <pre
                        style={{
                          padding: "14px",
                          borderRadius: "8px",
                          background: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          fontSize: "12px",
                          color: "#374151",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: "400px",
                          overflowY: "auto",
                          margin: 0,
                        }}
                      >
                        {selectedTemplate.body_html}
                      </pre>
                    </div>

                    <div style={styles.row}>
                      <div style={{ ...styles.col, ...styles.fieldGroup }}>
                        <label style={styles.label}>Last Updated</label>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                          {selectedTemplate.updated_at
                            ? new Date(selectedTemplate.updated_at).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div style={{ ...styles.col, ...styles.fieldGroup }}>
                        <label style={styles.label}>Status</label>
                        <span style={styles.badge(selectedTemplate.is_active)}>
                          {selectedTemplate.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
