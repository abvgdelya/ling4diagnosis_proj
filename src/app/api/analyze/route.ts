import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (text.length < 50) {
      return NextResponse.json({ error: "Text too short (min 50 chars)" }, { status: 400 });
    }

    // ✅ 1. LEXICAL: DistilBERT Sentiment Analysis (из вашего промпта)
    const { pipeline } = await import('@xenova/transformers');
    const sentimentAnalyzer = await pipeline(
      'sentiment-analysis', 
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    
    const sentiment = await sentimentAnalyzer(text.slice(0, 512));
    const polarityScore = sentiment[0].label === 'NEGATIVE' ? 
      Number(sentiment[0].score) * 100 : 0;
    
    const lexicalPresent = polarityScore > 40; // Ваш порог из промпта

    if (!lexicalPresent) {
      return NextResponse.json({
        score: 0,
        severity: 'Low',
        presentMarkers: [],
        markerStrengths: { lexical: Math.round(polarityScore) },
        criteria: { lexical: { strength: Math.round(polarityScore), present: false } },
        evaluation: `✅ Low risk - Sentiment ${Math.round(polarityScore)}% (no depression markers)`
      });
    }

    // ✅ 2. MORPHOLOGY: First-person pronouns (из вашего промпта)
    const words: string[] = text.toLowerCase().split(/\W+/).filter(Boolean);
    const firstPerson: number = countWords(words, ['i', 'me', 'my', 'myself']);
    const otherPronouns: number = countWords(words, ['he', 'him', 'she', 'her', 'it', 'we', 'you', 'they']);
    const totalPronouns = firstPerson + otherPronouns;
    const firstPersonRatio = totalPronouns > 0 ? (firstPerson / totalPronouns) * 100 : 0;
    const morph1Present = firstPersonRatio > 50;

    // ✅ 3. Абсолютные слова (severity)
    const absolutes: number = countWords(words, ['always','never','nothing','nobody']);
    const absoluteRatio = words.length > 0 ? (absolutes / words.length) * 100 : 0;

    // ✅ ИТОГОВЫЙ СКОР (ваша формула из промпта)
    const additionalMarkers = [
      { name: 'morphological1', present: morph1Present, strength: firstPersonRatio },
      { name: 'absolutes', present: absoluteRatio > 10, strength: absoluteRatio }
    ];
    
    const presentAdditional = additionalMarkers.filter(m => m.present);
    const additionalAvg = presentAdditional.length > 0 
      ? presentAdditional.reduce((sum, m) => sum + m.strength, 0) / presentAdditional.length 
      : polarityScore;

    const score = Math.round(additionalAvg);
    const severity = score > 70 ? 'High' : score > 45 ? 'Medium' : 'Low';

    return NextResponse.json({
      score,
      severity,
      presentMarkers: ['lexical', ...presentAdditional.map(m => m.name)],
      markerStrengths: {
        lexical: Math.round(polarityScore),
        morphological1: Math.round(firstPersonRatio),
        absolutes: Math.round(absoluteRatio)
      },
      criteria: {
        lexical: { strength: Math.round(polarityScore), present: true },
        morphological1: { strength: Math.round(firstPersonRatio), present: morph1Present },
        absolutes: { strength: Math.round(absoluteRatio), present: absoluteRatio > 10 }
      },
      evaluation: `⚠️ ${severity} RISK (${Math.round(polarityScore)}% sentiment + ${presentAdditional.length} markers)`
    });

  } catch (error) {
    console.error('DistilBERT error:', error);
    return NextResponse.json({ error: "ML analysis failed - using fallback" }, { status: 500 });
  }
}

function countWords(words: string[], targets: string[]): number {
  return words.filter((w: string) => targets.some((t: string) => w.includes(t))).length;
}
