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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Linguistic Depressivity Analysis</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-40 p-2 border border-gray-300 rounded"
        placeholder="Paste your text here..."
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Analysis Result</h2>
          <p>
            Depressivity risk: {result.risk} ({result.depressivityPercent}%)
          </p>

          <h3 className="mt-4">Text with Markers</h3>
          <div
            className="border border-gray-300 p-4 mt-2 text-left whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: result.textWithMarkers }}
          />
        </div>
      )}

      <style jsx global>{`
        .marker {
          background-color: #fff8dc;
          border-bottom: 2px solid #ff6b6b;
          font-weight: 500;
        }
        .marker-lexical          { border-color: #ff6b6b; }
        .marker-morphological1   { border-color: #51cf66; }
        .marker-morphological2   { border-color: #3bc9db; }
        .marker-semantic         { border-color: #ff9e00; }
        .marker-syntactic1       { border-color: #ff595e; }
        .marker-syntactic2       { border-color: #9b59b6; }
      `}</style>
    </div>
  );
}
