"use client";
import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{padding: "20px", maxWidth: "900px", margin: "0 auto", fontFamily: "Arial, sans-serif", background: "#f8fafc", minHeight: "100vh"}}>
      <h1 style={{color: "#1e293b", textAlign: "center", fontSize: "36px", marginBottom: "10px"}}>
        🧠 Linguistic Depressivity Analysis
      </h1>
      <p style={{color: "#64748b", textAlign: "center", fontSize: "18px", marginBottom: "30px"}}>
        Analyze linguistic markers with individual strength percentages
      </p>
      
      <div style={{background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "20px"}}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            height: "160px",
            padding: "15px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "16px",
            color: "#1e293b",
            background: "#f8fafc",
            resize: "vertical",
            fontFamily: "Georgia, serif",
            lineHeight: "1.6"
          }}
          placeholder="Enter 50+ characters of text for analysis..."
        />
        <div style={{textAlign: "right", marginTop: "8px", color: text.length >= 50 ? "#059669" : "#ef4444", fontWeight: "bold"}}>
          {text.length}/50 characters
        </div>
        
        <button 
          onClick={analyze} 
          disabled={loading || text.length < 50}
          style={{
            width: "100%",
            padding: "15px",
            background: loading || text.length < 50 ? "#94a3b8" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            marginTop: "15px",
            cursor: loading || text.length < 50 ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "🔄 Analyzing..." : `🚀 Analyze Text`}
        </button>
      </div>
      
      {result && (
        <div>
          {/* OVERALL RESULT */}
          <div style={{background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "20px"}}>
            <div style={{display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px"}}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%", 
                background: result.risk === "High" ? "#ef4444" : result.risk === "Medium" ? "#f59e0b" : "#10b981",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{fontSize: "28px", fontWeight: "bold", color: "white"}}>
                  {result.risk === "High" ? "🔴" : result.risk === "Medium" ? "🟡" : "🟢"}
                </span>
              </div>
              <div>
                <h2 style={{fontSize: "28px", color: "#1e293b", margin: "0 0 5px 0"}}>
                  {result.risk || result.severity || "Unknown"} Risk
                </h2>
                <div style={{fontSize: "42px", fontWeight: "bold", color: "#1e293b"}}>
                  {(result.depressivityPercent || result.score || 0).toString()}%
                </div>
                <p style={{color: "#64748b", margin: "5px 0 0 0", fontSize: "16px"}}>
                  {result.evaluation}
                </p>
              </div>
            </div>
          </div>

          {/* MARKER BREAKDOWN */}
          {result && result.markerStrengths && (
            <div style={{background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "20px"}}>
              <h3 style={{fontSize: "22px", color: "#1e293b", marginBottom: "20px", textAlign: "center"}}>
                📊 Individual Marker Rates
              </h3>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px"}}>
                {Object.entries(result.markerStrengths).map(([marker, strength]) => (
                  <div key={marker} style={{
                    background: "#f1f5f9", padding: "15px", borderRadius: "8px", textAlign: "center"
                  }}>
                    <div style={{fontSize: "14px", color: "#64748b", marginBottom: "5px", fontWeight: "500"}}>
                      {marker.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                    </div>
                    <div style={{fontSize: "24px", fontWeight: "bold", color: "#1e293b"}}>
                      {Math.round(strength || 0)}%
                    </div>
                    {result.criteria && result.criteria[marker] && result.criteria[marker].present && (
                      <div style={{fontSize: "12px", color: "#059669", fontWeight: "bold"}}>✅ PRESENT</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEXT WITH MARKERS */}
          {result && result.textWithMarkers && (
            <div style={{background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"}}>
              <h3 style={{fontSize: "20px", color: "#1e293b", marginBottom: "15px"}}>
                📝 Original Text with Markers
              </h3>
              <div 
                style={{
                  background: "#f8fafc", 
                  border: "2px dashed #cbd5e1", 
                  borderRadius: "8px",
                  padding: "20px",
                  minHeight: "120px",
                  color: "#1e293b",
                  lineHeight: "1.7",
                  fontSize: "16px",
                  fontFamily: "Georgia, serif"
                }}
                dangerouslySetInnerHTML={{__html: result.textWithMarkers}}
              />
            </div>
          )}

          {/* RAW DATA */}
          <div style={{textAlign: "center", marginTop: "30px"}}>
            <button 
              onClick={() => {setText(""); setResult(null);}} 
              style={{
                padding: "12px 24px",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              🔄 New Analysis
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .marker {
          background: #fef9c3 !important;
          border: 2px solid #f59e0b !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-weight: bold !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          animation: pulse 2s infinite !important;
        }
        .marker-lexical { border-color: #ef4444 !important; background: #fee2e2 !important; }
        .marker-morphological1 { border-color: #10b981 !important; background: #ecfdf5 !important; }
        .marker-morphological2 { border-color: #3b82f6 !important; background: #dbeafe !important; }
        .marker-semantic { border-color: #f59e0b !important; background: #fef3c7 !important; }
        .marker-syntactic1 { border-color: #ef4444 !important; background: #fee2e2 !important; }
        .marker-syntactic2 { border-color: #8b5cf6 !important; background: #f3e8ff !important; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
