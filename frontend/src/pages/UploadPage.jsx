import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// Genre options with icons - matching your green theme
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

function UploadPage() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef(null);

  // Full metadata matching your database columns
  const [metadata, setMetadata] = useState({
    genre: "",
    tags: "",
    description: "",
    author: "",
    publication_year: "",
    language: "en",
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf" && file.size <= 50 * 1024 * 1024
    );
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      setMessage("");
    } else {
      setMessage("Please drop PDF files only (max 50MB each)");
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      (file) => file.type === "application/pdf" && file.size <= 50 * 1024 * 1024
    );
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setMessage("");
    }
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMetadataChange = (field, value) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const clearAll = () => {
    setFiles([]);
    setMetadata({
      genre: "",
      tags: "",
      description: "",
      author: "",
      publication_year: "",
      language: "en",
    });
    setMessage("");
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please choose files first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage(`Uploading ${files.length} file(s)...`);

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      
      // Add all metadata fields
      if (metadata.genre) formData.append("genre", metadata.genre);
      if (metadata.tags) formData.append("tags", metadata.tags);
      if (metadata.description) formData.append("description", metadata.description);
      if (metadata.author) formData.append("author", metadata.author);
      if (metadata.publication_year) formData.append("publication_year", metadata.publication_year);
      formData.append("language", metadata.language);

      try {
        const response = await api.post("/test-upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              ((i + progressEvent.loaded / progressEvent.total) / files.length) * 100
            );
            setUploadProgress(percentCompleted);
          },
        });
        results.push(response.data);
      } catch (error) {
        errors.push(file.name + ": " + (error.response?.data?.message || "Upload failed"));
      }
    }

    if (errors.length === 0) {
      setMessage(`✅ Successfully uploaded ${results.length} document(s)!`);
      setTimeout(() => navigate("/documents"), 1500);
    } else if (results.length === 0) {
      setMessage("❌ All uploads failed: " + errors.join(", "));
    } else {
      setMessage(`⚠️ ${results.length} succeeded, ${errors.length} failed: ${errors.join(", ")}`);
    }
    
    setUploading(false);
    setUploadProgress(0);
  };

  // Shared input styles matching your glassmorphism theme
  const inputStyle = {
    padding: "12px 16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.95)",
    fontSize: "16px",
    color: "#333",
    outline: "none",
    width: "100%",
    transition: "all 0.3s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        padding: "40px 20px",
        background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", textAlign: "center" }}>
        ⬆️ Upload PDF Documents
      </h1>
      <p style={{ textAlign: "center", opacity: 0.9, maxWidth: "500px" }}>
        Drag & drop your PDFs here or click to browse (Max 50MB per file)
      </p>

      {/* Drag Zone */}
      <div
        style={{
          border: `3px dashed ${dragActive ? "#4caf50" : "rgba(255,255,255,0.3)"}`,
          borderRadius: "20px",
          width: "100%",
          maxWidth: "600px",
          height: "250px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          margin: "30px 0",
          cursor: "pointer",
          transition: "all 0.3s",
          backgroundColor: dragActive ? "rgba(255,255,255,0.1)" : "transparent",
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {dragActive ? (
          <>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📥</div>
            <p style={{ fontSize: "1.3rem" }}>Drop to upload!</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: "5rem", marginBottom: "20px" }}>📁</div>
            <p style={{ fontSize: "1.5rem", marginBottom: "10px" }}>
              Drag & drop PDFs here
            </p>
            <p style={{ fontSize: "1rem", opacity: 0.8 }}>or click to browse</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
        />
      </div>

      {/* Files Preview */}
      {files.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "15px",
            padding: "20px",
            backdropFilter: "blur(10px)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>
              📋 {files.length} file{files.length > 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={clearAll}
              disabled={uploading}
              style={{
                padding: "6px 12px",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "150px", overflowY: "auto" }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  style={{
                    padding: "6px 12px",
                    background: "#ff4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Form - Glassmorphism style matching your theme */}
      {files.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "15px",
            padding: "25px",
            backdropFilter: "blur(10px)",
            marginBottom: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
            📝 Document Metadata
            <span style={{ fontSize: "0.75em", opacity: 0.7, fontWeight: "normal" }}>
              (applied to all files)
            </span>
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
            {/* Genre */}
            <div>
              <label style={labelStyle}>Genre/Category</label>
              <select
                value={metadata.genre}
                onChange={(e) => handleMetadataChange("genre", e.target.value)}
                style={inputStyle}
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
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                placeholder="e.g., Dr. Smith"
                value={metadata.author}
                onChange={(e) => handleMetadataChange("author", e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Year */}
            <div>
              <label style={labelStyle}>Publication Year</label>
              <input
                type="number"
                placeholder="2024"
                min="1800"
                max={new Date().getFullYear() + 1}
                value={metadata.publication_year}
                onChange={(e) => handleMetadataChange("publication_year", e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Language */}
            <div>
              <label style={labelStyle}>Language</label>
              <select
                value={metadata.language}
                onChange={(e) => handleMetadataChange("language", e.target.value)}
                style={inputStyle}
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
              <label style={labelStyle}>
                Tags <span style={{ opacity: 0.7, fontWeight: "normal" }}>(comma separated)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., research, phd, machine learning, 2024"
                value={metadata.tags}
                onChange={(e) => handleMetadataChange("tags", e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Description - Full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description</label>
              <textarea
                placeholder="Brief description of the document content..."
                rows="3"
                value={metadata.description}
                onChange={(e) => handleMetadataChange("description", e.target.value)}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: "15px 40px",
            fontSize: "1.2rem",
            background: uploading ? "#ff9800" : "#d4af37",
            color: "white",
            border: "none",
            borderRadius: "50px",
            cursor: uploading ? "not-allowed" : "pointer",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s",
          }}
        >
          {uploading ? (
            <>
              <span>⏳</span>
              <span>Uploading... {uploadProgress}%</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Upload {files.length} PDF{files.length > 1 ? "s" : ""}</span>
            </>
          )}
        </button>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }}>
          <div
            style={{
              height: "8px",
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${uploadProgress}%`,
                backgroundColor: "#4caf50",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px 20px",
            background: message.includes("✅") 
              ? "rgba(76,175,80,0.2)" 
              : message.includes("⚠️") 
                ? "rgba(255,152,0,0.2)" 
                : "rgba(244,67,54,0.2)",
            border: `1px solid ${
              message.includes("✅") 
                ? "#4caf50" 
                : message.includes("⚠️") 
                  ? "#ff9800" 
                  : "#f44336"
            }`,
            borderRadius: "10px",
            color: "white",
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default UploadPage;