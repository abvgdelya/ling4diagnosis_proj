"use client";

import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<null | any>(null);
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
    } catch (err: any) {
      console.error("Fetch error:", err);
      alert("Error: " + (err.message || "Check browser console"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Linguistic Depressivity Analysis
      </h1>

      <div>
        <label
          htmlFor="text-input"
          className="block mb-2 text-sm font-medium"
        >
          Paste your text:
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type or paste text here..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">
            Depressivity Risk: {result.risk} ({result.depressivityPercent}%)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {result.evaluation}
          </p>

          <h3 className="text-sm font-medium mt-4 mb-2">
            Text with markers:
          </h3>
          <div
            className="border rounded-md p-3 text-sm bg-white"
            style={{ minHeight: "100px", lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{ __html: result.textWithMarkers }}
          />
        </div>
      )}

    <style jsx global>{`
  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-color: #f8fafc;
    color: #334155;
  }

  .marker {
    background-color: #fef9c3;
    border-bottom: 2px solid #d946ef;
    font-weight: 500;
    border-radius: 2px;
    padding: 0 2px;
  }
  .marker-lexical          { border-color: #ef4444; }
  .marker-morphological1   { border-color: #059669; }
  .marker-morphological2   { border-color: #0891b2; }
  .marker-semantic         { border-color: #f59e0b; }
  .marker-syntactic1       { border-color: #ef4444; }
  .marker-syntactic2       { border-color: #8b5cf6; }
`}</style>
