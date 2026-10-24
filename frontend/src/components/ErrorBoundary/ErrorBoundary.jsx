import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
          padding: "20px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 20px"
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: "22px", color: "#1f2937", marginBottom: "12px", fontWeight: "700" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              An unexpected error occurred while loading this page. Please try reloading the page or return to the home page.
            </p>
            {this.state.error?.message && (
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                color: "#991b1b",
                textAlign: "left",
                marginBottom: "24px",
                overflowX: "auto",
                fontFamily: "monospace"
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#c91f2e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleHome}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
