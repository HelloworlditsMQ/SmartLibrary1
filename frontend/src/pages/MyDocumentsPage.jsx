import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const STATUS_CONFIG = {
  pending: { color: "#ff9800", bg: "#fff3e0", label: "⏳ Pending", icon: "⏳" },
  approved: { color: "#4caf50", bg: "#e8f5e9", label: "✅ Approved", icon: "✅" },
  rejected: { color: "#f44336", bg: "#ffebee", label: "❌ Rejected", icon: "❌" },
};

const GENRE_ICONS = {
  art: "🎨", science: "🔬", technology: "💻", literature: "📚",
  history: "🏛️", mathematics: "📐", physics: "⚛️", chemistry: "🧪",
  biology: "🧬", computer_science: "👨‍💻", philosophy: "🤔",
  economics: "📈", law: "⚖️", medicine: "🏥", engineering: "🔧", other: "📌",
};

function MyDocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMyDocuments();
  }, []);

  const fetchMyDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/my-documents");
      console.log("MyDocuments Response:", response.data); // Debug
      setDocuments(response.data.data || response.data || []);
    } catch (err) {
      setError("Failed to load your documents");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (err) {
      alert("Failed to delete document");
      console.error(err);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (filter === "all") return true;
    return doc.status === filter;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "pending").length,
    approved: documents.filter(d => d.status === "approved").length,
    rejected: documents.filter(d => d.status === "rejected").length,
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
        <p>Loading your documents...</p>
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
            📁 My Documents
          </h1>
          <p style={{ opacity: 0.9 }}>
            Manage your uploads and track their status
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}>
          {[
            { label: "Total", value: stats.total, color: "#d4af37" },
            { label: "Pending", value: stats.pending, color: "#ff9800" },
            { label: "Approved", value: stats.approved, color: "#4caf50" },
            { label: "Rejected", value: stats.rejected, color: "#f44336" },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={() => setFilter(stat.label.toLowerCase())}
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "15px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                border: filter === stat.label.toLowerCase() ? `2px solid ${stat.color}` : "2px solid transparent",
                transition: "all 0.3s",
              }}
            >
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "none",
                background: filter === f ? "#d4af37" : "rgba(255,255,255,0.2)",
                color: filter === f ? "#1e5631" : "white",
                cursor: "pointer",
                textTransform: "capitalize",
                fontWeight: filter === f ? "bold" : "normal",
              }}
            >
              {f === "all" ? "All Documents" : f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "15px",
            background: "rgba(244,67,54,0.2)",
            borderRadius: "10px",
            marginBottom: "20px",
            color: "#ff6b6b",
            borderLeft: "4px solid #f44336",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDocs.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "20px",
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📭</div>
            <h3 style={{ color: "white" }}>No documents found</h3>
            <p style={{ color: "rgba(255,255,255,0.9)" }}>
              {filter === "all" 
                ? "You haven't uploaded any documents yet" 
                : `No ${filter} documents`}
            </p>
            <Link
              to="/upload"
              style={{
                display: "inline-block",
                marginTop: "20px",
                padding: "12px 30px",
                background: "#d4af37",
                color: "#1e5631",
                textDecoration: "none",
                borderRadius: "25px",
                fontWeight: "bold",
              }}
            >
              + Upload Your First Document
            </Link>
          </div>
        )}

        {/* Documents Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}>
          {filteredDocs.map((doc) => {
            const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
            const canEdit = doc.can_edit;
            
            return (
              <div
                key={doc.id}
                style={{
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "15px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: "160px",
                  background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {doc.thumbnail_url ? (
                    <img
                      src={`http://127.0.0.1:8000${String(doc.thumbnail_url).replace(/\\/g, '/')}`}
                        alt={doc.original_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "4rem" }}>
                      {GENRE_ICONS[doc.genre] || "📄"}
                    </span>
                  )}
                  
                  {/* Status Badge */}
                  {status && (
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      padding: "6px 12px",
                      background: status.bg,
                      color: status.color,
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      {status.icon} {doc.status}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: "20px" }}>
                  <h3 style={{
                    margin: "0 0 10px 0",
                    color: "#1e5631",
                    fontSize: "1.1rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {doc.original_name}
                  </h3>

                  {/* Rejection Reason */}
                  {doc.status === "rejected" && doc.rejection_reason && (
                    <div style={{
                      padding: "10px",
                      background: "#ffebee",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      fontSize: "0.85rem",
                      color: "#c62828",
                    }}>
                      <strong>Reason:</strong> {doc.rejection_reason}
                    </div>
                  )}

                  {/* Metadata */}
                  <div style={{ marginBottom: "15px" }}>
                    {doc.genre && (
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        background: "#e8f5e9",
                        color: "#1e5631",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        marginRight: "5px",
                        marginBottom: "5px",
                      }}>
                        {GENRE_ICONS[doc.genre]} {doc.genre}
                      </span>
                    )}
                    {doc.publication_year && (
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        background: "#f0f0f0",
                        color: "#666",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        marginRight: "5px",
                      }}>
                        📅 {doc.publication_year}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div style={{ marginBottom: "15px" }}>
                      {doc.tags.map(tag => (
                        <span key={tag} style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          background: "#f5f5f5",
                          color: "#666",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          margin: "2px",
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "0.85rem" }}>
                    💾 {doc.file_size_formatted} • 📅 {new Date(doc.created_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => navigate(`/read/${doc.id}`)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#1e5631",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      👁️ View
                    </button>
                    
                    {canEdit && (
                      <button
                        onClick={() => navigate(`/edit/${doc.id}`)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#d4af37",
                          color: "#1e5631",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        padding: "10px 15px",
                        background: "#ffebee",
                        color: "#c62828",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MyDocumentsPage;