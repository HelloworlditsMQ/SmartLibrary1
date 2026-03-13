import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

const GENRES = [
  { value: "", label: "Select Genre" },
  { value: "art", label: "🎨 Art & Design" },
  { value: "science", label: "🔬 Science" },
  { value: "technology", label: "💻 Technology" },
  { value: "literature", label: "📚 Literature" },
  { value: "history", label: "🏛️ History" },
  { value: "mathematics", label: "📐 Mathematics" },
  { value: "physics", label: "⚛️ Physics" },
  { value: "chemistry", label: "🧪 Chemistry" },
  { value: "biology", label: "🧬 Biology" },
  { value: "computer_science", label: "👨‍💻 Computer Science" },
  { value: "philosophy", label: "🤔 Philosophy" },
  { value: "economics", label: "📈 Economics" },
  { value: "law", label: "⚖️ Law" },
  { value: "medicine", label: "🏥 Medicine" },
  { value: "engineering", label: "🔧 Engineering" },
  { value: "other", label: "📌 Other" },
];

const STATUS_CONFIG = {
  pending: { color: "#ff9800", bg: "#fff3e0", label: "⏳ Pending", icon: "⏳" },
  approved: { color: "#4caf50", bg: "#e8f5e9", label: "✅ Approved", icon: "✅" },
  rejected: { color: "#f44336", bg: "#ffebee", label: "❌ Rejected", icon: "❌" },
};

function EditDocumentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [metadata, setMetadata] = useState({
    genre: "",
    tags: "",
    description: "",
    author: "",
    publication_year: "",
    language: "en",
  });

  // Fetch document on mount
  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from /my-documents endpoint
      const response = await api.get("/my-documents");
      const allDocs = response.data.data || [];
      const doc = allDocs.find(d => d.id === parseInt(id));

      if (!doc) {
        setError("Document not found");
        return;
      }

      setDocument(doc);

      // Check if can be edited (only rejected or pending)
      if (doc.status !== "rejected" && doc.status !== "pending") {
        setError("This document cannot be edited. Only rejected or pending documents can be modified.");
        return;
      }

      // Populate form with existing data
      setMetadata({
        genre: doc.genre || "",
        tags: Array.isArray(doc.tags) ? doc.tags.join(", ") : (doc.tags || ""),
        description: doc.description || "",
        author: doc.author || "",
        publication_year: doc.publication_year || "",
        language: doc.language || "en",
      });
    } catch (err) {
      setError("Failed to load document");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (field, value) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      
      // Only add non-empty fields
      if (metadata.genre) formData.append("genre", metadata.genre);
      if (metadata.tags) formData.append("tags", metadata.tags);
      if (metadata.description) formData.append("description", metadata.description);
      if (metadata.author) formData.append("author", metadata.author);
      if (metadata.publication_year) formData.append("publication_year", metadata.publication_year);
      formData.append("language", metadata.language);

      const response = await api.put(`/documents/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage(
        document.status === "rejected" 
          ? "✅ Document updated and resubmitted for approval!" 
          : "✅ Document updated successfully!"
      );
      
      setTimeout(() => navigate("/my-documents"), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update document";
      setError(`❌ ${errorMsg}`);
      console.error(err);
    } finally {
      setSaving(false);
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
        <p>Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div style={{
        minHeight: "calc(100vh - 60px)",
        padding: "40px",
        background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
        color: "white",
        textAlign: "center",
      }}>
        <p>Document not found</p>
      </div>
    );
  }

  const status = STATUS_CONFIG[document.status];
  const canEdit = document.status === "rejected" || document.status === "pending";

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      padding: "40px 20px",
      background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
      color: "white",
      fontFamily: "sans-serif",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
            ✏️ Edit Document
          </h1>
          <p style={{ opacity: 0.9 }}>
            Update the document details and resubmit for approval
          </p>
        </div>

        {/* Document Info Card */}
        <div style={{
          background: "rgba(255,255,255,0.95)",
          borderRadius: "15px",
          padding: "20px",
          marginBottom: "30px",
          color: "#333",
        }}>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            {/* Thumbnail */}
            <div style={{
              width: "120px",
              height: "120px",
              background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}>
              {document.thumbnail_url ? (
                  <img
                    src={`http://127.0.0.1:8000${String(document.thumbnail_url).replace(/\\\\/g, '/')}`}
                    alt={document.original_name}  // ✅ Use 'document' everywhere
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                />
                            ) : (
                <span style={{ fontSize: "3rem" }}>📄</span>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 10px 0", color: "#1e5631" }}>
                {document.original_name}
              </h2>
              <p style={{ margin: "0 0 10px 0", color: "#666" }}>
                💾 {document.file_size_formatted} • 📅 {new Date(document.created_at).toLocaleDateString()}
              </p>
              <div style={{
                display: "inline-block",
                padding: "8px 15px",
                background: status.bg,
                color: status.color,
                borderRadius: "20px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}>
                {status.icon} {document.status}
              </div>

              {/* Rejection Reason */}
              {document.status === "rejected" && document.rejection_reason && (
                <div style={{
                  marginTop: "15px",
                  padding: "15px",
                  background: "#ffebee",
                  borderRadius: "8px",
                  borderLeft: "4px solid #f44336",
                  color: "#c62828",
                }}>
                  <strong>Rejection Reason:</strong>
                  <p style={{ margin: "8px 0 0 0" }}>{document.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
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
        {successMessage && (
          <div style={{
            padding: "15px 20px",
            background: "rgba(76,175,80,0.2)",
            border: "1px solid #4caf50",
            borderRadius: "10px",
            color: "#4caf50",
            marginBottom: "20px",
            borderLeft: "4px solid #4caf50",
          }}>
            {successMessage}
          </div>
        )}

        {/* Edit Form */}
        {canEdit && (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "15px",
              padding: "25px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              marginBottom: "20px",
            }}>
              <h3 style={{ margin: "0 0 20px 0", color: "white" }}>
                📝 Document Metadata
              </h3>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}>
                {/* Genre */}
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Genre/Category
                  </label>
                  <select
                    value={metadata.genre}
                    onChange={(e) => handleMetadataChange("genre", e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {GENRES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Author
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. Smith"
                    value={metadata.author}
                    onChange={(e) => handleMetadataChange("author", e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Year */}
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Publication Year
                  </label>
                  <input
                    type="number"
                    placeholder="2024"
                    min="1800"
                    max={new Date().getFullYear() + 1}
                    value={metadata.publication_year}
                    onChange={(e) => handleMetadataChange("publication_year", e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Language */}
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Language
                  </label>
                  <select
                    value={metadata.language}
                    onChange={(e) => handleMetadataChange("language", e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="fr">🇫🇷 French</option>
                    <option value="ar">🇸🇦 Arabic</option>
                    <option value="es">🇪🇸 Spanish</option>
                    <option value="de">🇩🇪 German</option>
                    <option value="other">🌍 Other</option>
                  </select>
                </div>

                {/* Tags - Full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Tags <span style={{ opacity: 0.7, fontWeight: "normal" }}>(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., research, phd, machine learning"
                    value={metadata.tags}
                    onChange={(e) => handleMetadataChange("tags", e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Description - Full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the document content..."
                    rows="4"
                    value={metadata.description}
                    onChange={(e) => handleMetadataChange("description", e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "16px",
                      color: "#333",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => navigate("/my-documents")}
                  disabled={saving}
                  style={{
                    padding: "12px 30px",
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderRadius: "25px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    transition: "all 0.3s",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 30px",
                    background: saving ? "#ff9800" : "#d4af37",
                    color: saving ? "white" : "#1e5631",
                    border: "none",
                    borderRadius: "25px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    transition: "all 0.3s",
                  }}
                >
                  {saving ? "⏳ Saving..." : "💾 Save & Resubmit"}
                </button>
              </div>
            </div>
          </form>
        )}

        {!canEdit && !error && (
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "15px",
            padding: "30px",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🔒</div>
            <h3>This document cannot be edited</h3>
            <p style={{ opacity: 0.8 }}>
              Only rejected or pending documents can be modified.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditDocumentPage;