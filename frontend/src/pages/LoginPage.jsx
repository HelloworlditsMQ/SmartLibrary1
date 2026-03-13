import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // Redirect based on role
      if (isAdmin()) {
        navigate('/admin/dashboard');
      } else {
        navigate('/my-documents');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.2rem',
            color: '#1e5631',
            margin: '0 0 10px 0',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            👤 Welcome Back
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '1rem' }}>
            Sign in to your ENS Meknès Library account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            padding: '15px', 
            background: 'linear-gradient(90deg, #ffebee 0%, #ffcdd2 100%)', 
            color: '#c62828',
            borderRadius: '12px',
            marginBottom: '25px',
            borderLeft: '4px solid #f44336',
            boxShadow: '0 2px 10px rgba(244,67,54,0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#1e5631', 
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              📧 Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                background: loading ? '#f5f5f5' : 'white',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              placeholder="student@ensmeknes.ma"
              onFocus={(e) => e.target.style.borderColor = '#1e5631'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#1e5631', 
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              🔒 Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                background: loading ? '#f5f5f5' : 'white',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              placeholder="••••••••"
              onFocus={(e) => e.target.style.borderColor = '#1e5631'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#b0b0b0' : 'linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(30,86,49,0.4)',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <>
                <span style={{ marginRight: '10px' }}>⏳</span>
                Logging in...
              </>
            ) : (
              '🚀 Sign In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '25px', 
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          color: '#666'
        }}>
          <p style={{ margin: 0 }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#d4af37', 
                fontWeight: 'bold',
                textDecoration: 'none',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#f4b400'}
              onMouseLeave={(e) => e.target.style.color = '#d4af37'}
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;