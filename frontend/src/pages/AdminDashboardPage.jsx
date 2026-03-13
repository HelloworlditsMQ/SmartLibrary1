import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data);
    } catch (err) {
      setError("Failed to load admin stats");
      console.error(err);
    } finally {
      setLoading(false);
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
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "calc(100vh - 60px)",
        padding: "40px",
        background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
        color: "white",
        textAlign: "center",
      }}>
        <p>❌ {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{
        minHeight: "calc(100vh - 60px)",
        padding: "40px",
        background: "linear-gradient(135deg, #1e5631 0%, #2d7a46 100%)",
        color: "white",
        textAlign: "center",
      }}>
        <p>No data available</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Documents",
      value: stats.total,
      color: "#d4af37",
      icon: "📚",
      bg: "#fff3e0",
    },
    {
      label: "Pending Review",
      value: stats.pending,
      color: "#ff9800",
      icon: "⏳",
      bg: "#fff3e0",
      action: () => navigate("/admin/pending"),
    },
    {
      label: "Approved",
      value: stats.approved,
      color: "#4caf50",
      icon: "✅",
      bg: "#e8f5e9",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      color: "#f44336",
      icon: "❌",
      bg: "#ffebee",
    },
    {
      label: "Today's Uploads",
      value: stats.today_uploads,
      color: "#2196f3",
      icon: "📤",
      bg: "#e3f2fd",
    },
    {
        label: "Oldest Pending (days)",
        value: Math.floor(stats.pending_oldest_days ?? 0), 
        color: "#9c27b0",
        icon: "⏰",
        bg: "#f3e5f5",
    },

  ];

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
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.8rem", marginBottom: "10px" }}>
            📊 Admin Dashboard
          </h1>
          <p style={{ opacity: 0.9, fontSize: "1.1rem" }}>
            ENS Meknès Library Management System
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              onClick={card.action}
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: "15px",
                padding: "25px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                cursor: card.action ? "pointer" : "default",
                transition: "all 0.3s",
                border: `3px solid ${card.color}`,
              }}
              onMouseEnter={(e) => {
                if (card.action) {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (card.action) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
                }
              }}
            >
              {/* Icon & Label */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "15px", gap: "10px" }}>
                <div style={{
                  fontSize: "2.5rem",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.bg,
                  borderRadius: "10px",
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  margin: 0,
                  color: "#1e5631",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                }}>
                  {card.label}
                </h3>
              </div>

              {/* Value */}
              <div style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: card.color,
                marginBottom: "10px",
              }}>
                {card.value}
              </div>

              {/* Action hint */}
              {card.action && (
                <div style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  fontStyle: "italic",
                }}>
                  Click to view details →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "15px",
          padding: "30px",
          border: "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
        }}>
          <h2 style={{ margin: "0 0 20px 0", color: "white" }}>
            🎯 Quick Actions
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}>
            <button
              onClick={() => navigate("/admin/pending")}
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #ff9800 0%, #f4b400 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                boxShadow: "0 8px 20px rgba(255,152,0,0.3)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 12px 30px rgba(255,152,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(255,152,0,0.3)";
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>⏳</span>
              Review Pending ({stats.pending})
            </button>

            <button
              onClick={() => navigate("/documents")}
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                boxShadow: "0 8px 20px rgba(76,175,80,0.3)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 12px 30px rgba(76,175,80,0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(76,175,80,0.3)";
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>✅</span>
              View Library ({stats.approved})
            </button>

            <button
              onClick={fetchStats}
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                boxShadow: "0 8px 20px rgba(33,150,243,0.3)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 12px 30px rgba(33,150,243,0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(33,150,243,0.3)";
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>🔄</span>
              Refresh Stats
            </button>
          </div>
        </div>

        {/* Alert if pending documents */}
        {stats.pending > 0 && (
          <div style={{
            marginTop: "30px",
            padding: "20px",
            background: "rgba(255,152,0,0.2)",
            border: "2px solid #ff9800",
            borderRadius: "12px",
            color: "#ff9800",
            fontWeight: "bold",
            textAlign: "center",
          }}>
            ⚠️ You have <strong>{stats.pending}</strong> pending document{stats.pending !== 1 ? "s" : ""} waiting for review!
            {stats.pending_oldest_days > 0 && (
              <div style={{ marginTop: "10px", fontSize: "0.9rem" }}>
                The oldest pending document has been waiting for <strong>{Math.floor(stats.pending_oldest_days ?? 0)} days</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;