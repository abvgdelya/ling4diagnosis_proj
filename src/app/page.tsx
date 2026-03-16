"use client";
import { useState } from "react";

interface AnalysisResult {
  textWithMarkers?: string;
  [key: string]: any; // For other properties returned by your API
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null); // Changed to null initially
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div>
      <h1>Linguistic Analysis</h1>
      
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{width: "100%", height: "200px"}}
        placeholder="Enter 50+ chars"
      />
      
      <button onClick={analyze} disabled={loading}>
        {loading ? "Loading..." : "Analyze"}
      </button>
      
      {result && (
        <div>
          <h2>Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          {result.textWithMarkers && (
            <div 
              style={{background: "yellow", padding: "10px", margin: "10px 0"}}
              dangerouslySetInnerHTML={{__html: result.textWithMarkers}}
            />
          )}
        </div>
      )}
      
      <style jsx global>{`
        .marker { 
          background: red !important; 
          color: black !important; 
          padding: 3px !important; 
          border: 2px solid orange !important;
        }
      `}</style>
    </div>
  );
}
