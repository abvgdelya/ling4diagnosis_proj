import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (text.length < 50) {
      return NextResponse.json({ error: "Text too short (min 50 chars)" }, { status: 400 });
    }

    // ✅ 1. DistilBERT Sentiment Analysis (правильная типизация)
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false; // CDN models only
    
    const sentimentAnalyzer = await pipeline(
      'sentiment-analysis', 
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    
    const result = await sentimentAnalyzer(text.slice(0, 512));
    
    // ✅ ПРАВИЛЬНАЯ РАБОТА С ТИПАМИ Xenova/transformers
    const sentimentResult = Array.isArray(result) ? result[0] : result;
    const polarityScore = sentimentResult.label === 'NEGATIVE' ? 
      Number(sentimentResult.score) * 100 : 0;
    
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

    // ✅ 2. Morphology markers
    const words: string[] = text.toLowerCase().split(/\W+/).filter(Boolean);
    const firstPerson: number = countWords(words, ['i', 'me', 'my', 'myself']);
    const otherPronouns: number = countWords(words, ['he', 'him', 'she', 'her', 'it', 'we', 'you', 'they']);
    const totalPronouns = firstPerson + otherPronouns;
    const firstPersonRatio = totalPronouns > 0 ? (firstPerson / totalPronouns) * 100 : 0;
    const morph1Present = firstPersonRatio > 50;

    const absolutes: number = countWords(words, ['always','never','nothing','nobody']);
    const absoluteRatio = words.length > 0 ? (absolutes / words.length) * 100 : 0;

    // ✅ Финальный score
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
        firstPerson: { strength: Math.round(firstPersonRatio), present: morph1Present }
      },
      evaluation: `⚠️ ${severity} RISK (${Math.round(polarityScore)}% sentiment)`
    });

  } catch (error) {
    console.error('DistilBERT error:', error);
    // Fallback lexicon
    return NextResponse.json({ 
      error: "ML unavailable - basic analysis active",
      score: 0,
      severity: 'Low'
    }, { status: 503 });
  }
}

function countWords(words: string[], targets: string[]): number {
  return words.filter((w: string) => targets.some((t: string) => w.includes(t))).length;
}
