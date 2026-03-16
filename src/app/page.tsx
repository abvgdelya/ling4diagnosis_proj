"use client";
import { useState } from "react";

interface AnalysisResult {
  textWithMarkers?: string;
  markers?: { [key: string]: number };
  depressivityRate?: number;
  [key: string]: any;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MIN_CHARS = 20;
  const MAX_CHARS = 500;

  const validateText = (inputText: string): string => {
    if (inputText.trim().length === 0) {
      return "Ooops! Seems like there is no text. Try again!";
    }
    if (inputText.trim().length < MIN_CHARS) {
      return `Ooops! Seems like there are not enough characters in the text. Try again! (Need ${MIN_CHARS}+ chars)`;
    }
    // Basic check for incomprehensible text (all special chars, very short words, etc.)
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
      setError("Analysis service temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
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
            For speacialists working with people and mental health maintenance.
            Enter a text to see whether it shows any signs of potential depressive indicators.
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

        {/* Results Section - Only show if no error */}
        {result && !error && (
          <div className="space-y-8">
            {/* Emotion Markers */}
            {result.markers && Object.keys(result.markers).length > 0 && (
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-r from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    🧠
                  </span>
                  Emotion Markers Detected
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(result.markers).map(([marker, percentage]: [string, number]) => (
                    <div key={marker} className="group relative p-6 bg-gradient-to-br rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default from-indigo-50 via-blue-50 to-purple-50 border border-white/50 hover:-translate-y-1">
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
                      <div className="relative">
                        <h4 className="font-semibold text-xl text-gray-900 mb-2 capitalize">{marker}</h4>
                        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          {Math.round(percentage * 100)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                               style={{ width: `${Math.round(percentage * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marked Text */}
            {result.textWithMarkers && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                <h3 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center gap-3">
                  <span className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    📝
                  </span>
                  Text with Markers
                </h3>
                <div className="prose prose-lg max-w-none bg-white/80 rounded-2xl p-8 shadow-inner border border-yellow-100/50 backdrop-blur-sm font-mono text-lg leading-relaxed"
                     dangerouslySetInnerHTML={{__html: result.textWithMarkers}} />
              </div>
            )}

            {/* Depressivity Rate */}
            {result.depressivityRate !== undefined && (
              <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200/50 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl">
                <h3 className="text-2xl font-semibold text-emerald-900 mb-6">Final Depressivity Assessment</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent mb-4">
                  {Math.round(result.depressivityRate * 100)}%
                </div>
                <div className="text-2xl font-semibold text-emerald-900 mb-2">
                  Risk Level: 
                  <span className={`ml-2 px-4 py-2 rounded-full text-lg font-bold ${
                    result.depressivityRate > 0.7 ? 'bg-red-200 text-red-800' :
                    result.depressivityRate > 0.4 ? 'bg-amber-200 text-amber-800' :
                    'bg-emerald-200 text-emerald-800'
                  }`}>
                    {result.depressivityRate > 0.7 ? 'HIGH' : 
                     result.depressivityRate > 0.4 ? 'MODERATE' : 'LOW'}
                  </span>
                </div>
                <p className="text-lg text-emerald-800 mt-4 max-w-2xl mx-auto leading-relaxed">
                  Professionals should {result.depressivityRate > 0.4 ? 'consider' : 'monitor'} further evaluation.
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
        
        .marker {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e) !important;
          color: white !important;
          padding: 6px 12px !important;
          border-radius: 9999px !important;
          font-weight: 600 !important;
          font-size: 0.875rem !important;
          box-shadow: 0 4px 12px rgba(255,107,107,0.4) !important;
          display: inline-block !important;
          margin: 2px 4px !important;
          animation: pulse 2s infinite !important;
          border: 2px solid rgba(255,255,255,0.3) !important;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
