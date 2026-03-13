import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// Genre icons mapping
const GENRE_ICONS = {
  art: "🎨", science: "🔬", technology: "💻", literature: "📚",
  history: "🏛️", mathematics: "📐", physics: "⚛️", chemistry: "🧪",
  biology: "🧬", computer_science: "👨‍💻", philosophy: "🤔",
  economics: "📈", law: "⚖️", medicine: "🏥", engineering: "🔧", other: "📌",
};

const SORT_OPTIONS = [
  { value: "newest", label: "📅 Newest First" },
  { value: "oldest", label: "📅 Oldest First" },
  { value: "name_asc", label: "🔤 Name (A-Z)" },
  { value: "name_desc", label: "🔤 Name (Z-A)" },
  { value: "size_desc", label: "📊 Size (Large-Small)" },
  { value: "size_asc", label: "📊 Size (Small-Large)" },
  { value: "year_desc", label: "📆 Year (Newest)" },
  { value: "year_asc", label: "📆 Year (Oldest)" },
];

function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Filters
  const [filters, setFilters] = useState({
    genre: "",
    tags: "",
    year: "",
    sort: "newest",
  });

  // Metadata for filter options
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch filter metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch documents when search or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  const fetchMetadata = async () => {
    try {
      const response = await api.get("/documents/metadata");
      setAvailableGenres(response.data.genres || []);
      setAvailableYears(
        response.data.year_range?.max 
          ? Array.from(
              { length: response.data.year_range.max - (response.data.year_range.min || 2000) + 1 },
              (_, i) => response.data.year_range.max - i
            )
          : []
      );
      setPopularTags(response.data.popular_tags || []);
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  };

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        q: searchTerm,
        sort: filters.sort,
      };
      if (filters.genre) params.genre = filters.genre;
      if (filters.tags) params.tags = filters.tags;
      if (filters.year) params.year = filters.year;

      const response = await api.get("/documents/search", { params });
      setDocuments(response.data.data || response.data);
    } catch (err) {
      console.error("Failed to load:", err);
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ genre: "", tags: "", year: "", sort: "newest" });
    setSearchTerm("");
  };

  const handleDownload = async (documentId, originalName) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    }
  };

  const getGenreIcon = (genre) => GENRE_ICONS[genre] || "📄";

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "newest").length + (searchTerm ? 1 : 0);

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 60px)',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2.8rem', 
            marginBottom: '15px', 
            color: 'white',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            📚 ENS Meknès Document Library
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} available
            {loading && ' ⏳ Loading...'}
          </p>
        </div>

        {/* Search & Controls Bar */}
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto 30px auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="🔍 Search by title, author, content, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "18px 25px",
                border: `3px solid ${loading ? '#ff9800' : 'rgba(255,255,255,0.3)'}`,
                borderRadius: "50px",
                fontSize: "18px",
                background: loading ? 'rgba(255,248,225,0.9)' : 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: loading ? '0 0 20px rgba(255,152,0,0.4)' : '0 8px 30px rgba(0,0,0,0.2)',
                color: '#333',
                fontWeight: '500',
                outline: 'none',
              }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '15px 25px',
                backgroundColor: showFilters ? '#d4af37' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ⚙️ Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '15px',
              padding: '20px',
              color: '#333',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                {/* Genre Filter */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#555' }}>
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange("genre", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="">All Genres</option>
                    {availableGenres.map(g => (
                      <option key={g} value={g}>{getGenreIcon(g)} {g.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#555' }}>
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#555' }}>
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags Input */}
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#555' }}>
                    Tags
                  </label>
                  <input
                    type="text"
                    value={filters.tags}
                    onChange={(e) => handleFilterChange("tags", e.target.value)}
                    placeholder="e.g., research, phd"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              {/* Popular Tags */}
              {popularTags.length > 0 && !filters.tags && (
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.9em', color: '#666', marginRight: '10px' }}>Popular:</span>
                  {popularTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleFilterChange("tags", tag)}
                      style={{
                        margin: '2px',
                        padding: '4px 12px',
                        backgroundColor: '#e8f5e9',
                        color: '#1e5631',
                        border: '1px solid #1e5631',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9em', color: '#666' }}>
                  {activeFiltersCount > 0 ? `${activeFiltersCount} filter(s) active` : 'No filters active'}
                </span>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#d4af37',
                    color: '#1e5631',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 15px',
                backgroundColor: viewMode === 'grid' ? 'rgba(255,255,255,0.3)' : 'transparent',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 15px',
                backgroundColor: viewMode === 'list' ? 'rgba(255,255,255,0.3)' : 'transparent',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            maxWidth: '800px',
            margin: '0 auto 30px auto',
            padding: "20px 25px", 
            background: 'rgba(255,235,238,0.9)', 
            color: "#c62828",
            borderRadius: "16px",
            borderLeft: '5px solid #f44336',
            boxShadow: '0 10px 30px rgba(244,67,54,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && documents.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "100px 40px",
            maxWidth: '600px',
            margin: '0 auto',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: "6rem", marginBottom: "30px", opacity: 0.7 }}>📚</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'white' }}>
              No documents found
            </h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
              {searchTerm || activeFiltersCount > 0 
                ? "Try adjusting your search or filters" 
                : "Upload your first document to get started"}
            </p>
            {(searchTerm || activeFiltersCount > 0) && (
              <button
                onClick={clearFilters}
                style={{
                  marginTop: '20px',
                  padding: '12px 30px',
                  backgroundColor: '#d4af37',
                  color: '#1e5631',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Documents Display */}
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? "repeat(auto-fill, minmax(320px, 1fr))" : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: "30px",
        }}>
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: "all 0.3s ease",
                cursor: "pointer",
                display: viewMode === 'list' ? 'flex' : undefined,
                alignItems: viewMode === 'list' ? 'center' : undefined,
                height: viewMode === 'list' ? '120px' : undefined,
              }}
              onMouseEnter={(e) => {
                if (viewMode === 'grid') {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow = "0 25px 60px rgba(0,0,0,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode === 'grid') {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.15)";
                }
              }}
            >
              {/* Thumbnail */}
              <div 
                onClick={() => navigate(`/read/${doc.id}`)}
                style={{
                  height: viewMode === 'list' ? '120px' : "220px",
                  width: viewMode === 'list' ? '120px' : '100%',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {doc.thumbnail_url ? (
                  <img
                    src={`http://127.0.0.1:8000${doc.thumbnail_url.replace(/\\/g, '/')}`} 
                    alt={doc.original_name} 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: viewMode === 'list' ? "2.5rem" : "5rem", opacity: 0.7 }}>
                    {getGenreIcon(doc.genre)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ 
                padding: viewMode === 'list' ? '20px' : "25px",
                flex: 1,
                minWidth: 0,
                display: viewMode === 'list' ? 'flex' : undefined,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                justifyContent: viewMode === 'list' ? 'center' : undefined,
              }}>
                {/* Metadata Badges */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                }}>
                  {doc.genre && (
                    <span style={{
                      fontSize: '0.75em',
                      padding: '4px 10px',
                      backgroundColor: '#e8f5e9',
                      color: '#1e5631',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {getGenreIcon(doc.genre)} {doc.genre.replace('_', ' ')}
                    </span>
                  )}
                  {doc.publication_year && (
                    <span style={{ fontSize: '0.75em', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📅 {doc.publication_year}
                    </span>
                  )}
                  {doc.language && doc.language !== 'en' && (
                    <span style={{ fontSize: '0.75em', color: '#666' }}>
                      🌐 {doc.language.toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 style={{ 
                  margin: "0 0 8px 0",
                  fontSize: viewMode === 'list' ? "1.1rem" : "1.3rem",
                  color: "#1e5631",
                  fontWeight: '700',
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: '1.3',
                }} title={doc.original_name}>
                  {doc.original_name}
                </h3>
                
                {doc.author && (
                  <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "0.9em" }}>
                    👤 {doc.author}
                  </p>
                )}

                {doc.description && viewMode === 'grid' && (
                  <p style={{ 
                    margin: "0 0 12px 0", 
                    color: "#666", 
                    fontSize: "0.85em",
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {doc.description}
                  </p>
                )}

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '4px',
                    marginBottom: '12px',
                  }}>
                    {doc.tags.slice(0, viewMode === 'list' ? 3 : 5).map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.75em',
                          padding: '2px 8px',
                          backgroundColor: '#f0f0f0',
                          color: '#555',
                          borderRadius: '4px',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    {doc.tags.length > (viewMode === 'list' ? 3 : 5) && (
                      <span style={{ fontSize: '0.75em', color: '#999' }}>
                        +{doc.tags.length - (viewMode === 'list' ? 3 : 5)}
                      </span>
                    )}
                  </div>
                )}

                <p style={{ 
                  margin: "0 0 15px 0",
                  color: "#666",
                  fontSize: "0.85rem",
                  opacity: 0.8,
                }}>
                  💾 {doc.file_size_formatted || (doc.file_size / 1024 / 1024).toFixed(1) + ' MB'} • 
                  📅 {new Date(doc.created_at).toLocaleDateString()}
                </p>

                {/* Buttons - Only in grid view, side buttons in list view */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => navigate(`/read/${doc.id}`)}
                    style={{
                      flex: 1,
                      padding: viewMode === 'list' ? "8px 16px" : "12px 20px",
                      background: 'linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)',
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: viewMode === 'list' ? "0.85rem" : "15px",
                      fontWeight: '600',
                      boxShadow: '0 4px 15px rgba(30,86,49,0.3)',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    👁️ Read
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.id, doc.original_name);
                    }}
                    style={{
                      flex: 1,
                      padding: viewMode === 'list' ? "8px 16px" : "12px 20px",
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4b400 100%)',
                      color: "#1e5631",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: viewMode === 'list' ? "0.85rem" : "15px",
                      fontWeight: '600',
                      boxShadow: '0 4px 15px rgba(212,175,55,0.4)',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;