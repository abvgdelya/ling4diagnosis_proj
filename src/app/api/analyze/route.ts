import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (text.length < 50) {
      return NextResponse.json({ error: "Text too short (min 50 chars)" }, { status: 400 });
    }

    // ✅ DistilBERT Sentiment Analysis
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    
    const sentimentAnalyzer = await pipeline(
      'sentiment-analysis', 
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    
    const result = await sentimentAnalyzer(text.slice(0, 512));
    
    // ✅ TYPE SAFE DistilBERT result
    const sentimentResult = Array.isArray(result) ? result[0] : result;
    const typedResult = sentimentResult as { label: string; score: number };
    
    const polarityScore = typedResult.label === 'NEGATIVE' ? 
      Number(typedResult.score) * 100 : 0;
    
    const lexicalPresent = polarityScore > 40;

    if (!lexicalPresent) {
      return NextResponse.json({
        score: 0,
        severity: 'Low',
        presentMarkers: [],
        markerStrengths: { lexical: Math.round(polarityScore) },
        criteria: { lexical: { strength: Math.round(polarityScore), present: false } },
        evaluation: `✅ Low risk - Sentiment ${Math.round(polarityScore)}%`
      });
    }

    // ✅ Morphology markers
    const words: string[] = text.toLowerCase().split(/\W+/).filter(Boolean);
    const firstPerson: number = countWords(words, ['i', 'me', 'my', 'myself']);
    const otherPronouns: number = countWords(words, ['he', 'him', 'she', 'her', 'it', 'we', 'you', 'they']);
    const totalPronouns = firstPerson + otherPronouns;
    const firstPersonRatio = totalPronouns > 0 ? (firstPerson / totalPronouns) * 100 : 0;

    const absolutes: number = countWords(words, ['always','never','nothing','nobody']);
    const absoluteRatio = words.length > 0 ? (absolutes / words.length) * 100 : 0;

    // ✅ Final score
    const score = Math.round(polarityScore * 0.7 + firstPersonRatio * 0.2 + absoluteRatio * 0.1);
    const severity = score > 70 ? 'High' : score > 45 ? 'Medium' : 'Low';

    return NextResponse.json({
      score: Math.min(95, score),
      severity,
      presentMarkers: ['lexical'],
      markerStrengths: {
        lexical: Math.round(polarityScore),
        firstPerson: Math.round(firstPersonRatio),
        absolutes: Math.round(absoluteRatio)
      },
      criteria: {
        lexical: { strength: Math.round(polarityScore), present: true },
        firstPerson: { strength: Math.round(firstPersonRatio), present: firstPersonRatio > 50 }
      },
      evaluation: `⚠️ ${severity} RISK (${Math.round(polarityScore)}% sentiment)`
    });

  } catch (error: any) {
    console.error('DistilBERT error:', error);
    
    // ✅ FIXED: Передаём text в catch scope
    const { text } = await req.json();
    const words: string[] = text.toLowerCase().split(/\W+/).filter(Boolean);
    const negativeWords = words.filter((w: string) => 
      ['sad','depressed','anxious','hopeless','tired'].includes(w)
    );
    const fallbackScore = Math.min(85, negativeWords.length * 15);
    
    return NextResponse.json({
      score: fallbackScore,
      severity: fallbackScore > 60 ? 'High' : fallbackScore > 30 ? 'Medium' : 'Low',
      presentMarkers: negativeWords.length > 0 ? ['lexical'] : [],
      evaluation: `ℹ️ ML unavailable - Basic analysis: ${fallbackScore}%`
    });
  }
}

// ✅ НАЙДЕННЫЕ МАРКЕРЫ с позициями
const foundMarkers = negativeMatches.map((word, index) => ({
  word,
  position: text.toLowerCase().indexOf(word, index * 2), // примерная позиция
  strength: word === 'depressed' || word === 'hopeless' ? 'high' : 'medium'
}));

return NextResponse.json({
  score,
  severity,
  presentMarkers,
  markerStrengths,
  criteria,
  evaluation,
  // ✅ НОВЫЕ ДАННЫЕ
  foundMarkers, 
  textWithMarkers: text.split(' ').map((word, i) => 
    negativeMatches.includes(word.toLowerCase()) ? 
    `<mark style="background: #fee2e2; color: #991b1b">${word}</mark>` : word
  ).join(' ')
});

function countWords(words: string[], targets: string[]): number {
  return words.filter((w: string) => targets.some((t: string) => w.includes(t))).length;
}
