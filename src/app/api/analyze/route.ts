import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
  score: number;
  severity: string;
  presentMarkers: string[];
  evaluation: string;
  lexicalPresent: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text?.trim() || text.length < 50) {
      return NextResponse.json({ error: "Text too short (min 50 chars)" }, { status: 400 });
    }
    
    const words: string[] = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2); // ✅ TypeScript FIX
    
    const wordCount = words.length;

    // ✅ ЛЕКСИЧЕСКИЕ МАРКЕРЫ ДЕПРЕССИИ (ГЛАВНЫЙ ФИЛЬТР)
    const lexicalMarkers: string[] = [
      'sad','depressed','depression','anxious','anxiety','hopeless','tired','exhausted',
      'alone','lonely','empty','numb','worthless','guilty','ashamed','failure','broken',
      'dead','die','death','suicide','overwhelmed','trapped','stuck','drowning','despair'
    ];

    // ✅ ДОПОЛНИТЕЛЬНЫЕ МАРКЕРЫ ДЛЯ SEVERITY
    const morphologyMarkers: string[] = ['always','never','nothing','nobody','everyone','no one'];
    const semanticsMarkers: string[] = ['dark','black','grey','heavy','weight','burden','pain','hurt'];

    // 1. ПРОВЕРКА ЛЕКСИЧЕСКИХ МАРКЕРОВ (ОБЯЗАТЕЛЬНО!)
    const lexicalMatches: string[] = words.filter(w => lexicalMarkers.includes(w));
    const lexicalPresent = lexicalMatches.length > 0;
    const lexicalScore = lexicalPresent ? Math.round((lexicalMatches.length / wordCount) * 100) : 0;

    if (!lexicalPresent) {
      return NextResponse.json({
        score: 5,
        severity: 'Low',
        presentMarkers: [],
        evaluation: '✅ No lexical depression markers detected',
        lexicalPresent: false
      });
    }

    // 2. SEVERITY анализ (только если лексика есть)
    const morphMatches: string[] = words.filter(w => morphologyMarkers.includes(w));
    const morphScore = Math.round((morphMatches.length / wordCount) * 100);

    const semMatches: string[] = words.filter(w => semanticsMarkers.includes(w));
    const semScore = Math.round((semMatches.length / wordCount) * 100);

    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
    const avgSentenceLength = sentences.length > 0 
      ? sentences.reduce((sum: number, s: string) => sum + s.split(' ').length, 0) / sentences.length 
      : 20;
    const syntaxScore = avgSentenceLength < 12 ? 25 : 0;

    // ✅ ИТОГОВЫЙ SCORE
    const baseScore = 30 + (lexicalScore * 1.5);
    const severityScore = morphScore * 0.8 + semScore * 0.7 + syntaxScore;
    const totalScore = Math.min(95, Math.round(baseScore + severityScore));

    const severity = totalScore < 50 ? 'Low' : totalScore < 75 ? 'Medium' : 'High';
    const presentMarkers: string[] = ['lexical'];
    
    if (morphScore > 15) presentMarkers.push('morphology');
    if (semScore > 10) presentMarkers.push('semantics');
    if (syntaxScore > 0) presentMarkers.push('syntax');

    const result: AnalysisResult = {
      score: totalScore,
      severity,
      presentMarkers,
      evaluation: totalScore < 50 
        ? '⚠️ Mild symptoms (lexical markers present)' 
        : totalScore < 75 
        ? '🚨 Moderate depression risk - professional evaluation recommended' 
        : '🚨🚨 High risk - urgent professional help needed',
      lexicalPresent: true
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
