import { BrowserRouter as Router, Link, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from "./pages/HomePage";
import AdminHomePage from "./pages/AdminHomePage";
import UploadPage from "./pages/UploadPage";
import DocumentsPage from "./pages/DocumentsPage";
import ReaderPage from "./pages/ReaderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyDocumentsPage from "./pages/MyDocumentsPage";
import EditDocumentPage from "./pages/EditDocumentPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminPendingPage from "./pages/AdminPendingPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin()) return <Navigate to="/my-documents" />;
  return children;
}

// Update the HomePage component to redirect admins
function HomePageWrapper() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  return isAdmin() ? <AdminHomePage /> : <HomePage />;
}

function Navigation() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <nav style={{ 
      padding: "10px 20px", 
      background: "#1e5631", 
      marginBottom: "0",
      display: "flex", 
      justifyContent: "space-between",
      alignItems: "center",
      color: "white",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
    }}>
      <div>
        <Link to="/" style={{ 
          marginRight: "20px", 
          fontWeight: "bold", 
          color: "white",
          textDecoration: "none",
          fontSize: "1.2rem"
        }}>
          📚 ENS Meknès Library
        </Link>
        {isAuthenticated && (
          <>
            {isAdmin() ? (
              <>
                <Link to="/admin/dashboard" style={{ marginRight: "15px", color: "white", textDecoration: "none" }}>
                  📊 Dashboard
                </Link>
                <Link to="/admin/pending" style={{ marginRight: "15px", color: "white", textDecoration: "none" }}>
                  ⏳ Pending
                </Link>
              </>
            ) : (
              <>
                <Link to="/upload" style={{ marginRight: "15px", color: "white", textDecoration: "none" }}>
                  Upload
                </Link>
                <Link to="/documents" style={{ marginRight: "15px", color: "white", textDecoration: "none" }}>
                  Documents
                </Link>
                <Link to="/my-documents" style={{ color: "white", textDecoration: "none" }}>
                  My Documents
                </Link>
              </>
            )}
          </>
        )}
      </div>
      
      <div>
        {isAuthenticated ? (
          <>
            <span style={{ marginRight: "15px" }}>
              👤 {user?.name}
              {isAdmin() && (
                <span style={{
                  marginLeft: "8px",
                  padding: "2px 8px",
                  background: "#d4af37",
                  color: "#1e5631",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: "bold"
                }}>
                  ADMIN
                </span>
              )}
            </span>
            <button 
              onClick={logout}
              style={{
                padding: "5px 15px",
                backgroundColor: "#d4af37",
                color: "#1e5631",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: "15px", color: "white", textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{ color: "white", textDecoration: "none" }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Protected routes */}
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/read/:id" element={
            <ProtectedRoute>
              <ReaderPage />
            </ProtectedRoute>
          } />
          <Route path="/my-documents" element={
            <ProtectedRoute>
              <MyDocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/edit/:id" element={
            <ProtectedRoute>
              <EditDocumentPage />
            </ProtectedRoute>
          } />

          {/* Admin Protected routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          <Route path="/admin/pending" element={
            <AdminRoute>
              <AdminPendingPage />
            </AdminRoute>
          } />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;