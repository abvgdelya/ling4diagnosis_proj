"use client";

import { useState } from "react";

interface AnalysisResult {
  score: number;
  risk?: "Low" | "Medium" | "High";
  depressivityPercent?: number;
  evaluation?: string;
  textWithMarkers?: string;
  text?: string;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (text.length < 50) {
      setError("Text must be 50+ characters");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await res.json();
      console.log("API returned:", data);
      setResult(data);
    } catch (err: any) {
      setError("API Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "2rem", 
      backgroundColor: "#ffffff",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "bold", 
          background: "linear-gradient(45deg, #8b5cf6, #3b82f6)", 
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "1rem"
        }}>
          Linguistic Depressivity Analysis
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "500px", margin: "0 auto" }}>
          Enter 50+ characters to analyze linguistic markers
        </p>
      </div>

      {/* Input Form */}
      <div style={{ maxWidth: "500px", margin: "0 auto 2rem" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            height: "160px",
            padding: "1rem",
            border: "2px solid #e5e7eb",
            borderRadius: "12px",
            fontSize: "16px",
            fontFamily: "Arial, sans-serif",
            color: "#111827",
            backgroundColor: "#ffffff",
            resize: "vertical"
          }}
          placeholder="Type or paste your text here (50+ characters)..."
        />
        <div style={{ 
          textAlign: "center", 
          marginTop: "1rem",
          color: text.length >= 50 ? "#059669" : "#dc2626",
          fontWeight: "500"
        }}>
          {text.length}/50 characters
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading || text.length < 50}
          style={{
            width: "100%",
            marginTop: "1rem",
            padding: "1rem 2rem",
            background: loading || text.length < 50 
              ? "#9ca3af" 
              : "linear-gradient(45deg, #8b5cf6, #3b82f6)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading || text.length < 50 ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "🔄 Analyzing..." : `🚀 Analyze (${text.length}/50)`}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          maxWidth: "500px",
          margin: "0 auto 2rem",
          padding: "1rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          color: "#dc2626"
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{
            background: "linear-gradient(135deg, #fdf4ff 0%, #f0f9ff 100%)",
            border: "2px solid #e9d5ff",
            borderRadius: "20px",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0,0, 0.1)"
         
