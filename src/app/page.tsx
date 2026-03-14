export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '4rem 2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.95)',
        padding: '3rem',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: '900', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '2rem'
        }}>
          Lang4Diagnosis
        </h1>
        
        <div style={{ 
          fontSize: '1.5rem', 
          color: '#1f2937', 
          marginBottom: '3rem',
          fontWeight: '600'
        }}>
          ✅ DEPLOYMENT SUCCESSFUL
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{ 
            padding: '2rem', 
            background: 'rgba(34,197,94,0.1)', 
            border: '2px solid rgba(34,197,94,0.3)',
            borderRadius: '16px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#166534', marginBottom: '1rem' }}>
              ✓ Статус
            </h3>
            <ul style={{ textAlign: 'left', color: '#166534', lineHeight: '1.6' }}>
              <li>Next.js 15.3.6 ✓</li>
              <li>React 18.3.1 ✓</li>
              <li>Tailwind CSS ✓</li>
              <li>TypeScript ✓</li>
            </ul>
          </div>
          
          <div style={{ 
            padding: '2rem', 
            background: 'rgba(59,130,246,0.1)', 
            border: '2px solid rgba(59,130,246,0.3)',
            borderRadius: '16px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e40af', marginBottom: '1rem' }}>
              → Скоро
            </h3>
            <ul style={{ textAlign: 'left', color: '#1e40af', lineHeight: '1.6' }}>
              <li>• Анализ текста</li>
              <li>• Маркеры депрессии</li>
              <li>• Оценка риска</li>
              <li>• Экспорт PDF/CSV</li>
            </ul>
          </div>
        </div>
        
        <button style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem 3rem',
          border: 'none',
          borderRadius: '16px',
          fontSize: '1.25rem',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(102,126,234,0.4)'
        }}>
          Анализировать текст →
        </button>
        
        <p style={{ 
          marginTop: '3rem', 
          color: '#6b7280', 
          fontSize: '1.1rem'
        }}>
          Научный анализ лингвистических маркеров депрессии для психологов
        </p>
      </div>
    </main>
  )
}
