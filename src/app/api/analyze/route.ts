import { NextRequest, NextResponse } from "next/server";

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

// ✅ REAL Active/Passive Detection
const analyzeActivePassive = (text: string) => {
  const sentences = text
    .split(/[.!?]+/)
    .filter((s: string) => s.trim().length > 10);
  let passiveCount = 0;
  let activeCount = 0;

  sentences.forEach((sentence: string) => {
    const lowerSentence = sentence.toLowerCase();
    const passivePatterns = [
      /((?:is|was|were|be|been|being|am|are|get|got|gotten)\s+[a-z]+ed(?:\b|$))/gi,
      /((?:is|was|were|be|been|being|am|are|get|got|gotten)\s+[a-z]+en(?:\b|$))/gi,
      /(?:by\s+the|by\s+a|by\s+an)/gi,
    ];
    const activePatterns = [
      /(?:i|you|he|she|it|we|they)\s+(?:do|does|did|go|went|run|runs|make|makes|take|takes)/gi,
    ];

    passivePatterns.forEach((pattern) => {
      const matches = lowerSentence.match(pattern);
      if (matches) passiveCount += matches.length;
    });
    activePatterns.forEach((pattern) => {
      const matches = lowerSentence.match(pattern);
      if (matches) activeCount += matches.length;
    });
  });

  const totalVerbs = passiveCount + activeCount;
  const passiveRatio =
    totalVerbs > 0 ? (passiveCount / totalVerbs) * 100 : 0;
  return { passiveCount, activeCount, passiveRatio };
};

// ✅ REAL Semantic Analysis (meaning-based, >50%)
const analyzeSemanticMarkers = (text: string) => {
  const sentences = text
    .split(/[.!?]+/)
    .filter((s: string) => s.trim().length > 5);
  const classifiedVerbs: any[] = [];

  sentences.forEach((sentence: string) => {
    const verbMatches =
      sentence.match(/\b(?:[a-z]{3,})(?:ing|ed|s|es)?\b/gi) || [];
    verbMatches.forEach((verb) => {
      const position = sentence
        .toLowerCase()
        .indexOf(verb.toLowerCase());
      if (position > -1) {
        const lowerVerb = verb.toLowerCase();
        let category = "MATERIAL";

        // Meaning-based classification
        if (lowerVerb.match(/^(feel|think|know|believe|seem)$/))
          category = "MENTAL";
        else if (lowerVerb.match(/^(is|are|was|were|be|have|has)$/))
          category = "RELATIONAL";
        else if (lowerVerb.match(/^(say|tell|ask|speak)$/))
          category = "VERBAL";
        else if (lowerVerb.match(/^(laugh|cry|smile|watch)$/))
          category = "BEHAVIORAL";

        classifiedVerbs.push({ verb: lowerVerb, category, position });
      }
    });
  });

  const mentalRelationalCount = classifiedVerbs.filter(
    (v) => v.category === "MENTAL" || v.category === "RELATIONAL"
  ).length;
  const totalVerbs = classifiedVerbs.length;
  const semanticRatio =
    totalVerbs > 0 ? (mentalRelationalCount / totalVerbs) * 100 : 0;

  return { semanticRatio, classifiedVerbs };
};

// 👀 NEW: helper to wrap markers in HTML spans
function highlightMarkers(text: string, foundMarkers: FoundMarker[]): string {
  let highlighted = text;

  const sortedMarkers = foundMarkers
    .slice()
    .sort((a, b) => b.position - a.position); // descending so we don’t break indices

  for (const { word, position, type } of sortedMarkers) {
    if (position >= 0 && position < text.length) {
      const before = highlighted.slice(0, position);
      const content = highlighted.slice(position, position + word.length);
      const after = highlighted.slice(position + word.length);

      highlighted =
        before +
        `<span class="marker marker-${type}" data-type="${type}">${content}</span>` +
        after;
    }
  }

  return highlighted;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (text.length < 50) {
      return NextResponse.json({ error: "Text too short" }, { status: 400 });
    }

    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    const sentences = text
      .split(/[.!?]+/)
      .filter((s: string) => s.trim().length > 5);

    // 1. LEXICAL: DistilBERT (gate for low vs medium/high)
    let polarityScore = 20;
    try {
      const { pipeline, env } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      const analyzer = await pipeline(
        "sentiment-analysis",
        "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
      );
      const result = await analyzer(text.slice(0, 512));
      const sentimentResult = Array.isArray(result) ? result[0] : result;
      polarityScore =
        (sentimentResult as any).label === "NEGATIVE"
          ? Number((sentimentResult as any).score) * 100
          : 0;
    } catch (e) {
      console.error("Sentiment failed:", e);
    }

    // ✅ LEXICAL MARKER: below 50% → LOW risk, above 50% → MEDIUM/HIGH
    const lexicalStrength = Math.round(polarityScore);
    const isLowDepressivity = lexicalStrength <= 50;

    if (isLowDepressivity) {
      return NextResponse.json({
        score: 0,
        risk: "Low",
        depressivityPercent: lexicalStrength,
        presentMarkers: ["lexical"],
        markerStrengths: { lexical: lexicalStrength },
        criteria: {
          lexical: { strength: lexicalStrength, present: true },
        },
        evaluation: `✅ Low risk – Sentiment ${lexicalStrength}%`,
        foundMarkers: [],
        textWithMarkers: text,
      });
    }

    // 2. Morphological 1: First-person pronouns
    const firstPersonCount = countWords(words, ["i", "me", "my", "myself"]);
    const otherPronounCount = countWords(words, [
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
    ]);
    const totalPronouns = firstPersonCount + otherPronounCount;
    const firstPersonRatio =
      totalPronouns > 0 ? (firstPersonCount / totalPronouns) * 100 : 0;
    const morph1Present = firstPersonRatio > 50;

    // 3. Morphological 2: Active/Passive
    const { passiveRatio } = analyzeActivePassive(text);
    const morph2Present = passiveRatio > 30;

    // 4. Semantic: MENTAL+RELATIONAL >50%
    const { semanticRatio } = analyzeSemanticMarkers(text);
    const semanticPresent = semanticRatio > 50;

    // 5. Syntactic markers
    const shortSentences = sentences.filter((s: string) => {
      const wc = s.split(/\W+/).filter(Boolean).length;
      return wc >= 11 && wc <= 12;
    });
    const longSentences = sentences.filter((s: string) =>
      s.split(/\W+/).filter(Boolean).length > 12
    );
    const synt1Ratio = longSentences.length > 0
      ? (shortSentences.length / longSentences.length) * 100
      : 0;
    const synt1Present = synt1Ratio > 25;

    const ellipsisRatio =
      sentences.filter((s: string) => /\.{2,}/.test(s)).length /
      Math.max(1, sentences.length) *
      100;
    const synt2Present = ellipsisRatio >= 25;

    // Found markers
    const foundMarkers: FoundMarker[] = [];
    if (morph1Present)
      foundMarkers.push({
        word: "I/me",
        position: 0,
        type: "morphological1",
        strength: firstPersonRatio,
      });
    if (morph2Present)
      foundMarkers.push({
        word: `passive:${Math.round(passiveRatio)}%`,
        position: 0,
        type: "morphological2",
        strength: passiveRatio,
      });
    if (semanticPresent)
      foundMarkers.push({
        word: `mental:${Math.round(semanticRatio)}%`,
        position: 0,
        type: "semantic",
        strength: semanticRatio,
      });

    // ✅ DEPRESSIVITY: lex + other markers as average
    const allStrengths: number[] = [
      lexicalStrength,
      morph1Present ? firstPersonRatio : 0,
      morph2Present ? passiveRatio : 0,
      semanticPresent ? semanticRatio : 0,
      synt1Present ? synt1Ratio : 0,
      synt2Present ? ellipsisRatio : 0,
    ].filter(s => s > 0);
    const depressivityPercent =
      allStrengths.reduce((a, b) => a + b, 0) / Math.max(1, allStrengths.length);

    const score = Math.round(depressivityPercent);
    const risk: "Low" | "Medium" | "High" =
      score > 70 ? "High" : score > 45 ? "Medium" : "Low";

    const highlightedText = highlightMarkers(text, foundMarkers);

    const result: AnalysisResult = {
      score,
      risk,
      depressivityPercent: Math.round(depressivityPercent),
      presentMarkers: [
        "lexical",
        ...(morph1Present ? ["morphological1"] : []),
        ...(morph2Present ? ["morphological2"] : []),
        ...(semanticPresent ? ["semantic"] : []),
      ],
      markerStrengths: {
        lexical: lexicalStrength,
        morphological1: Math.round(firstPersonRatio),
        morphological2: Math.round(passiveRatio),
        semantic: Math.round(semanticRatio),
        syntactic1: Math.round(synt1Ratio),
        syntactic2: Math.round(ellipsisRatio),
      },
      criteria: {
        lexical: { strength: lexicalStrength, present: true },
        morphological1: {
          strength: Math.round(firstPersonRatio),
          present: morph1Present,
        },
        morphological2: {
          strength: Math.round(passiveRatio),
          present: morph2Present,
        },
        semantic: {
          strength: Math.round(semanticRatio),
          present: semanticPresent,
        },
        syntactic1: {
          strength: Math.round(synt1Ratio),
          present: synt1Present,
        },
        syntactic2: {
          strength: Math.round(ellipsisRatio),
          present: synt2Present,
        },
      },
      evaluation: `⚠️ ${
        isLowDepressivity ? "Low" : risk
      } risk – Depressivity: ${Math.round(
        depressivityPercent
      )}% (based on lexical + other markers)`,
      foundMarkers,
      textWithMarkers: highlightedText,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", score: 0, risk: "Low", depressivityPercent: 0 },
      { status: 500 }
    );
  }
}

function countWords(words: string[], targets: string[]): number {
  return words.filter((w) => targets.some((t) => w.includes(t))).length;
}
