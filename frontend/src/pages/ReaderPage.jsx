import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/client";

function ReaderPage() {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchPdf = async () => {
    try {
      setLoading(true);
      console.log('Fetching PDF for doc:', id); // DEBUG
      
      const response = await api.get(`/documents/${id}/view`, {
        responseType: 'blob'
      });
      
      console.log('PDF fetched successfully:', response); // DEBUG
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setError(null);
    } catch (err) {
      console.error('Full error object:', err); // DEBUG
      console.error('Error response:', err.response); // DEBUG
      console.error('Error status:', err.response?.status); // DEBUG
      console.error('Error data:', err.response?.data); // DEBUG
      
      setError(err.response?.data?.message || 'Failed to load document');
      setPdfUrl(null);
    } finally {
      setLoading(false);
    }
  };

  fetchPdf();

  return () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
  };
}, [id]);

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px 20px 20px 20px',
      background: 'linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 20px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <Link to="/documents" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.15)',
          color: 'white', textDecoration: 'none',
          borderRadius: '10px', fontWeight: '600'
        }}>
          ← Back
        </Link>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
            📄 Document #{id}
          </h2>
        </div>
        
        <a href={`http://localhost:8000/api/documents/${id}/download`} 
           download 
           style={{
             padding: '10px 20px',
             background: '#d4af37', color: '#1e5631',
             textDecoration: 'none', borderRadius: '10px',
             fontWeight: '600'
           }}>
          💾 Download
        </a>
      </div>

      {/* PDF Viewer */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: 'calc(100vh - 120px)',
        background: 'rgba(255,255,255,0.98)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {loading && (
          <div style={{ fontSize: '1.2rem', color: '#666' }}>
            📄 Loading document...
          </div>
        )}
        
        {error && (
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            color: '#c62828'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
            <p>{error}</p>
          </div>
        )}
        
        {pdfUrl && !loading && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ 
              border: 'none', 
              display: 'block' 
            }}
            title={`Document ${id}`}
          />
        )}
      </div>
    </div>
  );
}

export default ReaderPage;