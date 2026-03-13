import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const GENRE_ICONS = {
  art: "🎨", science: "🔬", technology: "💻", literature: "📚",
  history: "🏛️", mathematics: "📐", physics: "⚛️", chemistry: "🧪",
  biology: "🧬", computer_science: "👨‍💻", philosophy: "🤔",
  economics: "📈", law: "⚖️", medicine: "🏥", engineering: "🔧", other: "📌",
};

function AdminPendingPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkReason, setBulkReason] = useState("");
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Modal state for individual rejection
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    setLoading(true);
    setError(null);
    setMessage("");
    try {
      const response = await api.get("/admin/pending");
      console.log("Pending Documents Response:", response.data);
      
      const docs = response.data.data || response.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
      setSelectedIds(new Set());
    } catch (err) {
      setError(`Failed to load pending documents: ${err.response?.data?.message || err.message}`);
      console.error("Full error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocument = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  const approveDocument = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/admin/approve/${id}`);
      setMessage("✅ Document approved successfully!");
      setDocuments(docs => docs.filter(d => d.id !== id));
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to approve document");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectDocument = async (id) => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessingId(id);
    try {
      await api.post(`/admin/reject/${id}`, { reason: rejectReason });
      setMessage("❌ Document rejected successfully!");
      setDocuments(docs => docs.filter(d => d.id !== id));
      setRejectingId(null);
      setRejectReason("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to reject document");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const bulkApprove = async () => {
    if (selectedIds.size === 0) {
      setError("Please select documents to approve");
      return;
    }

    setBulkAction("approving");
    try {
      await api.post("/admin/bulk-action", {
        ids: Array.from(selectedIds),
        action: "approve",
      });
      setMessage(`✅ ${selectedIds.size} document(s) approved successfully!`);
      setDocuments(docs => docs.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to approve documents");
      console.error(err);
    } finally {
      setBulkAction(null);
    }
  };

  const bulkReject = async () => {
    if (selectedIds.size === 0) {
      setError("Please select documents to reject");
      return;
    }

    if (!bulkReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setBulkAction("rejecting");
    try {
      await api.post("/admin/bulk-action", {
        ids: Array.from(selectedIds),
        action: "reject",
        reason: bulkReason,
      });
      setMessage(`❌ ${selectedIds.size} document(s) rejected successfully!`);
      setDocuments(docs => docs.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      setBulkReason("");
      setShowBulkRejectModal(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to reject documents");
      console.error(err);
    } finally {
      setBulkAction(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "calc(100vh - 60px)",
        padding: "40px",
        background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
        color: "white",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "3rem" }}>⏳</div>
        <p>Loading pending documents...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      padding: "40px 20px",
      background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
      color: "white",
      fontFamily: "sans-serif",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
            ⏳ Pending Documents
          </h1>
          <p style={{ opacity: 0.9 }}>
            Review and moderate document submissions
          </p>
        </div>

        {/* Stats Bar */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "15px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
        }}>
          <div>
            <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
              📋 {documents.length} pending document{documents.length !== 1 ? "s" : ""}
            </span>
            {selectedIds.size > 0 && (
              <span style={{ marginLeft: "20px", opacity: 0.9 }}>
                ✓ {selectedIds.size} selected
              </span>
            )}
          </div>
          <button
            onClick={() => fetchPendingDocuments()}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "15px 20px",
            background: "rgba(244,67,54,0.2)",
            border: "1px solid #f44336",
            borderRadius: "10px",
            color: "#ff6b6b",
            marginBottom: "20px",
            borderLeft: "4px solid #f44336",
          }}>
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div style={{
            padding: "15px 20px",
            background: "rgba(76,175,80,0.2)",
            border: "1px solid #4caf50",
            borderRadius: "10px",
            color: "#4caf50",
            marginBottom: "20px",
            borderLeft: "4px solid #4caf50",
          }}>
            {message}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "15px 20px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <span style={{ fontWeight: "bold" }}>Bulk Actions:</span>
            <button
              onClick={bulkApprove}
              disabled={bulkAction === "approving"}
              style={{
                padding: "8px 16px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: bulkAction === "approving" ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {bulkAction === "approving" ? "⏳ Approving..." : "✅ Approve All"}
            </button>
            <button
              onClick={() => setShowBulkRejectModal(true)}
              disabled={bulkAction === "rejecting"}
              style={{
                padding: "8px 16px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: bulkAction === "rejecting" ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {bulkAction === "rejecting" ? "⏳ Rejecting..." : "❌ Reject All"}
            </button>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "20px",
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>✅</div>
            <h3>No pending documents</h3>
            <p>All submissions have been reviewed!</p>
          </div>
        )}

        {/* Documents List */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "20px",
                alignItems: "start",
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedIds.has(doc.id)}
                onChange={() => handleSelectDocument(doc.id)}
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  marginTop: "5px",
                }}
              />

              {/* Thumbnail & Info */}
              <div style={{ display: "flex", gap: "15px", minWidth: 0 }}>
                {/* Thumbnail */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {doc.thumbnail_url ? (
                    <img
                      src={`http://127.0.0.1:8000${String(doc.thumbnail_url).replace(/\\/g, "/")}`}
                      alt={doc.original_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "2rem" }}>📄</span>
                  )}
                </div>

                {/* Document Info */}
                <div style={{ minWidth: 0 }}>
                  {/* Title */}
                  <h3 style={{
                    margin: "0 0 8px 0",
                    color: "#1e5631",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "1.1rem",
                  }}>
                    {doc.original_name}
                  </h3>

                  {/* Description (if present) */}
                  {doc.description && (
                    <p style={{
                      margin: "0 0 10px 0",
                      color: "#666",
                      fontSize: "0.9rem",
                      lineHeight: "1.4",
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {doc.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {doc.genre && (
                      <span style={{
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        background: "#e8f5e9",
                        color: "#1e5631",
                        borderRadius: "12px",
                      }}>
                        {GENRE_ICONS[doc.genre]} {doc.genre.replace(/_/g, " ")}
                      </span>
                    )}
                    {doc.publication_year && (
                      <span style={{
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        background: "#f0f0f0",
                        color: "#666",
                        borderRadius: "12px",
                      }}>
                        📅 {doc.publication_year}
                      </span>
                    )}
                  </div>

                  {/* Uploader Info */}
                  <p style={{
                    margin: "0 0 6px 0",
                    color: "#666",
                    fontSize: "0.9rem",
                  }}>
                    👤 <strong>{doc.uploader.name}</strong> ({doc.uploader.email})
                  </p>

                  {/* File Info */}
                  <p style={{
                    margin: "0 0 8px 0",
                    color: "#999",
                    fontSize: "0.85rem",
                  }}>
                    💾 {doc.file_size_formatted} • 📅 {new Date(doc.created_at).toLocaleDateString()}
                  </p>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      {doc.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{
                          display: "inline-block",
                          marginRight: "5px",
                          marginBottom: "5px",
                          padding: "2px 8px",
                          background: "#f0f0f0",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          color: "#666",
                        }}>
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 4 && (
                        <span style={{
                          fontSize: "0.75rem",
                          color: "#999",
                          marginLeft: "4px",
                        }}>
                          +{doc.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minWidth: "130px",
              }}>
                <button
                  onClick={() => window.open(`/read/${doc.id}`, '_blank')}
                  disabled={processingId === doc.id}
                  style={{
                    padding: "10px 16px",
                    background: "#d4af37",
                    color: "#1e5631",
                    border: "none",
                    borderRadius: "8px",
                    cursor: processingId === doc.id ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    opacity: processingId === doc.id ? 0.6 : 1,
                  }}
                >
                  👁️ Read
                </button>
                <button
                  onClick={() => approveDocument(doc.id)}
                  disabled={processingId === doc.id}
                  style={{
                    padding: "10px 16px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: processingId === doc.id ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    opacity: processingId === doc.id ? 0.6 : 1,
                  }}
                >
                  {processingId === doc.id ? "⏳" : "✅ Approve"}
                </button>
                <button
                  onClick={() => setRejectingId(doc.id)}
                  disabled={processingId === doc.id}
                  style={{
                    padding: "10px 16px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: processingId === doc.id ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    opacity: processingId === doc.id ? 0.6 : 1,
                  }}
                >
                  {processingId === doc.id ? "⏳" : "❌ Reject"}
                </button>
              </div>

              {/* Individual Reject Modal */}
              {rejectingId === doc.id && (
                <div style={{
                  gridColumn: "1 / -1",
                  padding: "15px",
                  background: "#ffebee",
                  borderRadius: "8px",
                  borderLeft: "4px solid #f44336",
                }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#c62828",
                    fontWeight: "bold",
                  }}>
                    Rejection Reason:
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this document is being rejected..."
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #f44336",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      marginBottom: "10px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => rejectDocument(doc.id)}
                      style={{
                        padding: "8px 16px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "#ccc",
                        color: "#333",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bulk Reject Modal */}
        {showBulkRejectModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: "white",
              borderRadius: "15px",
              padding: "30px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>
              <h2 style={{ margin: "0 0 15px 0", color: "#1e5631" }}>
                ❌ Reject {selectedIds.size} Document{selectedIds.size !== 1 ? "s" : ""}?
              </h2>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                Please provide a reason for rejecting these documents:
              </p>
              <textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="e.g., Document quality is poor, Missing required information, etc."
                rows="4"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  marginBottom: "20px",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowBulkRejectModal(false);
                    setBulkReason("");
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#ccc",
                    color: "#333",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={bulkReject}
                  disabled={bulkAction === "rejecting"}
                  style={{
                    padding: "10px 20px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: bulkAction === "rejecting" ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    opacity: bulkAction === "rejecting" ? 0.6 : 1,
                  }}
                >
                  {bulkAction === "rejecting" ? "⏳ Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPendingPage;