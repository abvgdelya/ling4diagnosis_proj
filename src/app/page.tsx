"use client";
import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (text.length < 50) {
      alert("Please enter 50+ characters");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      console.log("API Response:", data);
      setResult(data);
    } catch (error) {
      console.error("API Error:", error);
      alert("API failed - check console");
    }
    setLoading(false);
  };

  return (
    <div style={{
      padding: "30px", 
      maxWidth: "1000px", 
      margin: "0 auto", 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh",
      color: "#333"
    }}>
      <div style={{textAlign: "center", marginBottom: "40px"}}>
        <h1 style={{
          fontSize: "42px", 
          color: "white", 
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          marginBottom: "10px"
        }}>
          🧠 Linguistic Marker Analysis
        </h1>
        <p style={{color: "rgba(255,255,255,0.9)", fontSize: "18px"}}>
          See individual marker rates + highlighted text
        </p>
      </div>

      <div style={{
        background: "white", 
        padding: "30px", 
        borderRadius: "20px", 
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        marginBottom: "30px"
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            height: "180px",
            padding: "20px",
            border: "3px solid #e2e8f0",
            borderRadius: "15px",
            fontSize: "16px",
            color: "#1e293b",
            background: "#f8fafc",
            resize: "vertical",
            fontFamily: "Georgia, serif",
            lineHeight: "1.6"
          }}
          placeholder="Enter 50+ characters for full analysis..."
        />
        <div style={{
          textAlign: "right", 
          marginTop: "10px", 
          fontSize: "16px", 
          fontWeight: "bold",
          color: text.length >= 50 ? "#10b981" : "#ef4444"
        }}>
          {text.length}/50 characters
        </div>
        
        <button 
          onClick={analyze} 
          disabled={loading || text.length < 50}
          style={{
            width: "100%",
            padding: "18px",
            background: loading || text.length < 50 ? "#94a3b8" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "15px",
            fontSize: "20px",
            fontWeight: "bold",
            marginTop: "20px",
            cursor: loading || text.length < 50 ? "not-allowed" : "pointer",
            boxShadow: "0 8px 20px rgba(16,185,129,0.3)"
          }}
        >
          {loading ? "🔄 Analyzing..." : "🚀 FULL ANALYSIS"}
        </button>
      </div>

      {result && (
        <div>
          {/* SUMMARY CARD */}
          <div style={{
            background: "white", 
            padding: "30px", 
            borderRadius: "20px", 
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            marginBottom: "30px"
          }}>
            <div style={{display: "flex", alignItems: "center", gap: "25px"}}>
              <div style={{
                width: "80px", 
                height: "80px", 
                borderRadius: "50%",
                background: "#ef4444",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(239,68,68,0.4)"
              }}>
                <span style={{fontSize: "36px", color: "white"}}>🔴</span>
              </div>
              <div>
                <h2 style={{fontSize: "32px", color: "#1e293b", margin: 0}}>
                  HIGH Risk
                </h2>
                <div style={{fontSize: "52px", fontWeight: "bold", color: "#dc2626",
