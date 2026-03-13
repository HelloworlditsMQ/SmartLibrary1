import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 60px)',
      width: '100%',
      background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
      color: '#1e5631',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '3.5rem', 
        marginBottom: '10px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
        fontWeight: 'bold'
      }}>
        Admin Dashboard
      </h1>

      <p style={{ 
        fontSize: '1.2rem', 
        marginBottom: '15px',
        opacity: 0.9
      }}>
        Welcome back, <strong>{user?.name}</strong>
      </p>

      <p style={{ 
        fontSize: '1rem', 
        marginBottom: '50px',
        opacity: 0.8,
        maxWidth: '600px'
      }}>
        Manage library content, review pending documents, and monitor platform activity
      </p>

      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '1000px'
      }}>
        <Link to="/admin/dashboard" style={adminCardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1e5631' }}>Dashboard</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>View statistics and analytics</p>
        </Link>

        <Link to="/admin/pending" style={adminCardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⏳</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1e5631' }}>Pending Documents</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Review and approve submissions</p>
        </Link>

        <Link to="/documents" style={adminCardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1e5631' }}>Library Catalogue</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Browse all library documents</p>
        </Link>
      </div>

      <p style={{ marginTop: '60px', opacity: 0.6, fontSize: '0.9rem' }}>
        Administrator Mode Active
      </p>
    </div>
  );
}

const adminCardStyle = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  padding: '40px 30px',
  borderRadius: '15px',
  width: '280px',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

export default AdminHomePage;