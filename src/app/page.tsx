"use client";
import { useState, useRef, useEffect } from "react";

interface FoundMarker {
  word: string;
  position: number;
  type: "lexical" | "morphological1" | "morphological2" | "semantic" | "syntactic1" | "syntactic2";
  strength: number;
}

interface AnalysisResult {
  score: number;
  risk: "Low" | "Medium" | "High";
  depressivityPercent: number;
  presentMarkers: string[];
  markerStrengths: Record<string, number>;
  criteria: Record<string, { strength: number; present: boolean }>;
  evaluation: string;
  foundMarkers: FoundMarker[];
  textWithMarkers: string;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const MIN_CHARS = 50;
  const MAX_CHARS = 3500;

  const validateText = (inputText: string): string => {
    if (inputText.trim().length === 0) {
      return "Ooops! Seems like there is no text. Try again!";
    }
    if (inputText.trim().length < MIN_CHARS) {
      return `Ooops! Seems like there are not enough characters in the text. Try again! (Need ${MIN_CHARS}+ chars)`;
    }
    const cleanText = inputText.replace(/[^\w\s]/g, '').toLowerCase();
    const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 3 || cleanText.length < 10) {
      return "Ooops! Seems like the text contains errors. Try again!";
    }
    return "";
  };

  const analyze = async () => {
    const validationError = validateText(text);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, MAX_CHARS) }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setError("Analysis service temporarily unavailable. Please try again later.");
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simple HTML parser for marker display
  const renderTextWithMarkers = (htmlString: string) => {
    return <div className="text-highlight-container" dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Ling4Diagnosis
          </h1>
          <p className="text-lg text-gray-700 mt-2 font-medium max-w-2xl leading-relaxed">
           You are a specialist working with people and mental health maintenance? 
            Put the text in the text box to test it for signs of potential depressive indicators for further professional diagnosis.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Input Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Analyze Your Text</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter between {MIN_CHARS} and {MAX_CHARS} characters for comprehensive linguistic analysis.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
                className="w-full h-32 p-6 text-lg border-2 border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-300 resize-vertical font-mono text-gray-900 placeholder-gray-500 shadow-inner"
                placeholder={`Type your text here (${MIN_CHARS}-${MAX_CHARS} characters)...`}
              />
              <div className="text-right mt-3 flex justify-between items-center">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  text.length >= MIN_CHARS 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {text.length}/{MAX_CHARS} characters
                </span>
                <span className="text-sm text-gray-500">
                  Min: {MIN_CHARS} chars
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-rose-900 font-medium leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <button 
              onClick={analyze} 
              disabled={loading || text.length < MIN_CHARS}
              className={`w-full py-6 px-8 text-xl font-semibold rounded-2xl transition-all duration-300 transform shadow-xl flex items-center justify-center gap-3 group ${
                loading || text.length < MIN_CHARS
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-700 text-white shadow-indigo-500/50 hover:shadow-indigo-500/75 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                `Analyze Text (${text.length}/${MAX_CHARS})`
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && !error && (
          <div className="space-y-8">
            {/* Enhanced Markers Section with Explanations */}
            {result.markerStrengths && Object.keys(result.markerStrengths).length > 0 && (
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-r from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    🧠
                  </span>
                  Linguistic Markers Detected
                </h3>
                
                {/* Marker Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Object.entries(result.markerStrengths).map(([marker, strength]: [string, number]) => {
                    const strengthPercent = Math.round(strength);
                    const markerInfo = {
                      lexical: "Negative sentiment detected (DistilBERT AI analysis)",
                      morphological1: "Excessive first-person pronouns (I, me, my >50%)", 
                      morphological2: "High passive voice usage (>30%)",
                      semantic: "Mental/relational verbs dominate (>50%)",
                      syntactic1: "Short sentences (11-12 words) vs long (>25%)",
                      syntactic2: "Excessive ellipsis/pauses (≥25% sentences)"
                    };
                    return (
                      <div key={marker} className="group relative p-6 bg-gradient-to-br rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default from-indigo-50 via-blue-50 to-purple-50 border border-white/50 hover:-translate-y-1">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
                        <div className="relative">
                          <h4 className="font-semibold text-xl text-gray-900 mb-2 capitalize">{marker.replace(/([A-Z])/g, ' $1')}</h4>
                          <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            {strengthPercent}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner mb-4">
                            <div className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${
                              marker === 'lexical' ? 'from-red-500 to-pink-500' : 
                              marker === 'morphological1' ? 'from-orange-500 to-yellow-500' :
                              marker === 'morphological2' ? 'from-teal-500 to-cyan-500' :
                              marker === 'semantic' ? 'from-blue-500 to-indigo-500' :
                              'from-green-500 to-emerald-500'
                            }`} style={{ width: `${strengthPercent}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{markerInfo[marker as keyof typeof markerInfo]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>


            {/* Depressivity Rate */}
            {result.depressivityPercent !== undefined && (
              <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200/50 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl">
                <h3 className="text-2xl font-semibold text-emerald-900 mb-6">Final Depressivity Assessment</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent mb-4">
                  {result.depressivityPercent}%
                </div>
                <div className="text-2xl font-semibold text-emerald-900 mb-2">
                  Risk Level: 
                  <span className={`ml-2 px-4 py-2 rounded-full text-lg font-bold ${
                    result.risk === 'High' ? 'bg-red-200 text-red-800' :
                    result.risk === 'Medium' ? 'bg-amber-200 text-amber-800' :
                    'bg-emerald-200 text-emerald-800'
                  }`}>
                    {result.risk}
                  </span>
                </div>
                <p className="text-lg text-emerald-800 mt-4 max-w-2xl mx-auto leading-relaxed">
                  {result.evaluation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debug Section */}
        {result && !error && (
          <details className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-6 mt-12">
            <summary className="cursor-pointer font-medium text-gray-800 hover:text-indigo-600 transition-colors p-4 rounded-xl hover:bg-white/60">
              🔧 View Raw Analysis Data
            </summary>
            <pre className="mt-6 p-6 bg-gray-900 text-green-400 rounded-xl font-mono text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        )}
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
        
        /* Text container scrollbar */
        .text-highlight-container::-webkit-scrollbar {
          width: 8px;
        }
        .text-highlight-container::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .text-highlight-container::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.6);
          border-radius: 4px;
        }
        .text-highlight-container::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.8);
        }
        
        /* MARKER STYLES - Only show when actually present */
        .marker {
          display: inline-block !important;
          color: white !important;
          padding: 2px 6px !important;
          margin: 0 1px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          line-height: 1.3 !important;
          vertical-align: middle !important;
          position: relative !important;
          z-index: 20 !important;
          border: 1px solid rgba(255,255,255,0.3) !important;
          font-family: inherit !important;
          animation: markerPulse 1.5s ease-in-out infinite !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3) !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
        }
        
        .marker-lexical { 
          background: linear-gradient(135deg, #ef4444, #f87171) !important;
          box-shadow: 0 2px 8px rgba(239,68,68,0.4) !important;
        }
        .marker-morphological1 { 
          background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
          box-shadow: 0 2px 8px rgba(245,158,11,0.4) !important;
        }
        .marker-morphological2 { 
          background: linear-gradient(135deg, #10b981, #34d399) !important;
          box-shadow: 0 2px 8px rgba(16,185,129,0.4) !important;
        }
        .marker-semantic { 
          background: linear-gradient(135deg, #3b82f6, #60a5fa) !important;
          box-shadow: 0 2px 8px rgba(59,130,246,0.4) !important;
        }
        .marker-syntactic1, .marker-syntactic2 { 
          background: linear-gradient(135deg, #8b5cf6, #a78bfa) !important;
          box-shadow: 0 2px 8px rgba(139,92,246,0.4) !important;
        }
        
        @keyframes markerPulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.9; 
            transform: scale(1.05); 
          }
        }
        
        /* Ensure text doesn't overflow */
        .text-highlight-container {
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}

