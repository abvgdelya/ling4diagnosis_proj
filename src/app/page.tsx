"use client";

import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Linguistic Depressivity Analysis
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Paste text to analyze linguistic markers of depressivity
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-300 resize-vertical"
          placeholder="Paste your text here for analysis..."
        />
        
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="w-full mt-4 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          {loading ? "🔄 Analyzing..." : "🚀 Analyze Text"}
        </button>
      </div>

      {result && (
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-purple-200 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {result.risk === "High" ? "🔴" : result.risk === "Medium" ? "🟡" : "🟢"}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Risk: <span className={`text-${result.risk === "High" ? "red" : result.risk === "Medium" ? "orange" : "green"}-600 font-black`}>
                    {result.risk}
                  </span>
                </h2>
                <p className="text-3xl font-black text-gray-800">
                  {result.depressivityPercent}%
                </p>
                <p className="text-sm text-gray-600 mt-1">{result.evaluation}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">📝 Text with Markers</h3>
              <div 
                className="bg-gray-50 border-2 border-dashed border-purple-200 rounded-xl p-6 min-h-[150px] text-gray-900 leading-relaxed"
                style={{ lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{ __html: result.textWithMarkers || result.text || "" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
