'use client';  // ← ДОБАВИТЬ НА 1-Ю СТРОКУ!
import { useState } from 'react';


export default function Home() {
  const handleClick = () => {
    alert('✅ КНОПКА РАБОТАЕТ!');
    console.log('Button clicked!');
  };

  return (
    <main style={{
      minHeight: '100vh',
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '3rem 2rem',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: '2rem',
          textShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          Lang4Diagnosis
        </h1>
        
        <textarea
          style={{
            width: '100%',
            height: '160px',
            padding: '1.5rem',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '16px',
            fontSize: '16px',
            background: 'rgba(255,255,255,0.9)',
            color: '#1f2937',
            resize: 'vertical',
            fontFamily: 'monospace'
          }}
          placeholder="Paste English text here (50+ characters)..."
          onChange={(e) => console.log('Typing:', e.target.value.length)}
        />
        
        <button
          onClick={handleClick}
          style={{
            width: '100%',
            marginTop: '1.5rem',
            padding: '1.2rem',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🔬 Analyze Text
        </button>
        
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          fontSize: '14px'
        }}>
          <strong>📋 Инструкция:</strong><br/>
          1. F12 → Console<br/>
          2. Нажми кнопку → увидишь alert + лог<br/>
          3. Кнопка работает! ✅
        </div>
      </div>
    </main>
  );
}
