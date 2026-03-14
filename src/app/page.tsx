'use client';
import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('I feel very sad and tired all the time. Nothing brings me joy anymore. I just want to sleep.');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    // Очистка предыдущих результатов
    setResult(null);
    setError('');
    
    // Проверка длины текста
    if (text.length < 50) {
      setError('❌ Текст слишком короткий! Нужно 50+ символов');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Отправляю текст длиной:', text.length);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      console.log('📡 Статус ответа:', response.status);

      const data = await response.json();
      console.log('✅ Получил данные:', data);

      // Если API вернул ошибку
      if (response.status !== 200) {
        setError(data.error || 'API Error');
        return;
      }

      setResult(data);
      
    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: 40, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: 40, 
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 900, 
          textAlign: 'center', 
          marginBottom: 32,
          background: 'linear-gradient(45deg, white, #e0e7ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🧠 Lang4Diagnosis
        </h1>
        
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste English text here (50+ characters)..."
            style={{
              flex: 1,
              minHeight: 160,
              padding: 20,
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: 16,
              fontSize: 16,
              background: 'rgba(255,255,255,0.95)',
              color: '#1f2937',
              resize: 'vertical',
              fontFamily: 'monospace',
              lineHeight: 1.5
            }}
          />
          <div style={{ 
            minWidth: 120, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ textAlign: 'center', fontSize: 14, color: text.length >= 50 ? '#10b981' : '#f59e0b' }}>
              {text.length}/50
            </div>
            <button
              onClick={analyze}
              disabled={loading || text.length < 50}
              style={{
                padding: '16px 24px',
                background: loading || text.length < 50 ? '#6b7280' : 'rgba(255,255,255,0.3)',
                color: 'white',
                border: 'none',
                borderRadius: 16,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading || text.length < 50 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? '🔄 Analyzing...' : '🔬 Analyze'}
            </button>
          </div>
        </div>

        {/* ОШИБКИ */}
        {error && (
          <div style={{ 
            padding: 16, 
            background: 'rgba(239,68,68,0.2)', 
            border: '1px solid #ef4444',
            borderRadius: 12,
            marginBottom: 20,
            color: '#fecaca'
          }}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {/* РЕЗУЛЬТАТ */}
        {result && (
          <div style={{ 
            padding: 32, 
            background: 'rgba(34,197,94,0.2)', 
            border: '2px solid #10b981',
            borderRadius: 20
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: 24, 
              textAlign: 'center' 
            }}>
              📊 Analysis Results
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 24, 
              marginBottom: 24 
            }}>
              <div style={{ 
                padding: 24, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 16,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#10b981' }}>
                  {result.score}%
                </div>
                <div style={{ fontSize: '1.2rem', opacity: 0.9 }}>
                  {result.severity} Risk
                </div>
              </div>
              <div style={{ 
                padding: 24, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 16
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
                  Evaluation:
                </div>
                <div style={{ fontSize: '1.3rem', color: '#10b981' }}>
                  {result.evaluation}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              <strong>Debug info:</strong> {JSON.stringify(result, null, 2)}
            </div>
          </div>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: 32, 
          padding: 16, 
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          fontSize: 14
        }}>
          F12 → Console для детальной отладки
        </div>
      </div>
    </div>
  );
}
