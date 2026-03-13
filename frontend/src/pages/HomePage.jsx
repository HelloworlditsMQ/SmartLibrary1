import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 60px)',
      width: '100%',
      background: 'linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)',
      color: 'white',
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
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        fontWeight: 'bold'
      }}>
        ENS Meknès Smart Library
      </h1>

      <p style={{ 
        fontSize: '1.3rem', 
        marginBottom: '40px',
        opacity: 0.9,
        maxWidth: '600px'
      }}>
        We are the school's first library. Open to everyone and free to use.
      </p>

      <h2 style={{ 
        fontSize: '1.8rem', 
        marginBottom: '40px',
        fontWeight: 'normal'
      }}>
        What do you want to do today?
      </h2>

      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '1000px'
      }}>
        <div onClick={() => handleNavigation('/documents')} style={cardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1e5631' }}>Search our main catalogue</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Find documents by title or content</p>
        </div>

        <div onClick={() => handleNavigation('/documents')} style={cardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1e5631' }}>Discover our collections</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Browse all available documents</p>
        </div>

        <div onClick={() => handleNavigation('/upload')} style={cardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⬆️</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1e5631' }}>Upload your own work</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Share your documents with the community</p>
        </div>
      </div>

      <p style={{ marginTop: '60px', opacity: 0.7, fontSize: '0.9rem' }}>
        {!isAuthenticated && (
          <span>
            Please <Link to="/login" style={{ color: '#d4af37' }}>login</Link> or <Link to="/register" style={{ color: '#d4af37' }}>register</Link> to continue
          </span>
        )}
      </p>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  padding: '40px 30px',
  borderRadius: '15px',
  width: '280px',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
};

export default HomePage;