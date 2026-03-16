"use client";
import { useState } from "react";

interface AnalysisResult {
  textWithMarkers?: string;
  markers?: { [key: string]: number }; // { "sadness": 0.25, "anxiety": 0.15 }
  depressivityRate?: number; // 0.0 to 1.0
  [key: string]: any;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const MAX_CHARS = 20;

  const analyze = async () => {
    if (text.length < MAX_CHARS) {
      alert(`Please enter at least ${MAX_CHARS} characters`);
      return;
    }
    setLoading(true);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, MAX_CHARS) }),
    });
    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#333", textAlign: "center" }}>Linguistic Analysis</h1>
      
      <div style={{ marginBottom: "15px" }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
          maxLength={MAX_CHARS}
          style={{
            width: "100%",
            height: "120px",
            padding: "12px",
            border: "2px solid #4a90e2",
            borderRadius: "8px",
            fontSize: "16px",
            backgroundColor: "#f8f9ff",
            color: "#1a1a2e",
            resize: "vertical",
            fontFamily: "monospace"
          }}
          placeholder={`Enter at least ${MAX_CHARS} characters for analysis...`}
        />
        <div style={{ 
          textAlign: "right", 
          marginTop: "5px", 
          color: text.length >= MAX_CHARS ? "#28a745" : "#6c757d",
          fontSize: "14px",
          fontWeight: "bold"
        }}>
          {text.length}/{MAX_CHARS} characters
        </div>
      </div>
      
      <button 
        onClick={analyze} 
        disabled={loading || text.length < MAX_CHARS}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: text.length >= MAX_CHARS ? "#4a90e2" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: text.length >= MAX_CHARS ? "pointer" : "not-allowed",
          transition: "background-color 0.2s"
        }}
        onMouseOver={(e) => {
          if (text.length >= MAX_CHARS) {
            e.currentTarget.style.backgroundColor = "#357abd";
          }
        }}
        onMouseOut={(e) => {
          if (text.length >= MAX_CHARS) {
            e.currentTarget.style.backgroundColor = "#4a90e2";
          }
        }}
      >
        {loading ? "Analyzing..." : `Analyze Text (${text.length}/${MAX_CHARS})`}
      </button>
      
      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2 style={{ color: "#333", marginBottom: "20px" }}>Analysis Results</h2>
          
          {/* Markers Percentages */}
          {result.markers && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#555", marginBottom: "15px" }}>Emotion Markers</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                {Object.entries(result.markers).map(([marker, percentage]) => (
                  <div key={marker} style={{
                    padding: "12px",
                    backgroundColor: "#e8f4f8",
                    borderRadius: "6px",
                    borderLeft: "4px solid #4a90e2"
                  }}>
                    <strong style={{ color: "#1a1a2e" }}>{marker}</strong>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4a90e2", margin: "5px 0" }}>
                      {Math.round(percentage * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Text with Markers */}
          {result.textWithMarkers && (
            <div style={{
              backgroundColor: "#fff3cd",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #ffeaa7",
              marginBottom: "20px"
            }}>
              <h3 style={{ color: "#856404", marginBottom: "15px" }}>Text with Markers</h3>
              <div 
                style={{ fontFamily: "monospace", lineHeight: "1.6" }}
                dangerouslySetInnerHTML={{__html: result.textWithMarkers}}
              />
            </div>
          )}
          
          {/* Depressivity Rate */}
          {result.depressivityRate !== undefined && (
            <div style={{
              backgroundColor: "#d4edda",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #c3e6cb",
              textAlign: "center"
            }}>
              <h3 style={{ color: "#155724", marginBottom: "10px" }}>Final Depressivity Rate</h3>
              <div style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#155724",
                marginBottom: "5px"
              }}>
                {Math.round(result.depressivityRate * 100)}%
              </div>
              <div style={{ color: "#6c757d" }}>
                Risk level: {result.depressivityRate > 0.7 ? "High" : result.depressivityRate > 0.4 ? "Moderate" : "Low"}
              </div>
            </div>
          )}
          
          {/* Raw JSON for debugging */}
          <details style={{ marginTop: "20px" }}>
            <summary style={{ cursor: "pointer", padding: "10px", background: "#f8f9fa", borderRadius: "4px" }}>
              Raw JSON Data
            </summary>
            <pre style={{ 
              background: "#f8f9fa", 
              padding: "15px", 
              borderRadius: "4px", 
              fontSize: "12px",
              overflow: "auto"
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <style jsx global>{`
        .marker { 
          background: linear-gradient(45deg, #ff6b6b, #ff8e8e) !important; 
          color: white !important; 
          padding: 4px 8px !important; 
          border-radius: 4px !important;
          font-weight: bold !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          display: inline-block !important;
          margin: 2px !important;
        }
      `}</style>
    </div>
  );
}
