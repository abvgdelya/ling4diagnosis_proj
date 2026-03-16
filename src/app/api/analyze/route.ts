import { NextRequest, NextResponse } from 'next/server';

interface FoundMarker {
  word: string;
  position: number;
  type: 'lexical' | 'morphological1' | 'morphological2' | 'semantic' | 'syntactic1' | 'syntactic2';
  strength: number;
}

interface AnalysisResult {
  score: number;
  severity: string;
  presentMarkers: string[];
  markerStrengths: Record<string, number>;
  criteria: Record<string, { strength: number; present: boolean }>;
  evaluation: string;
  foundMarkers: FoundMarker[];
  textWithMarkers: string;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (text.length < 50) {
      return NextResponse.json({ error: "Text too short (min 50 chars)" }, { status: 400 });
    }

    const words: string[] = text.toLowerCase().split(/\W+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);

    // ✅ 1. LEXICAL: Sentiment Analysis (DistilBERT)
    let polarityScore = 0;
    try {
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      
      const sentimentAnalyzer = await pipeline(
        'sentiment-analysis', 
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
      
      const result = await sentimentAnalyzer(text.slice(0, 512));
      const sentimentResult = Array.isArray(result) ? result[0] : result;
      const typedResult = sentimentResult as { label: string; score: number };
      
      polarityScore = typedResult.label === 'NEGATIVE' ? Number(typedResult.score) * 100 : 0;
    } catch (e) {
      console.error('Sentiment model failed:', e);
      polarityScore = 20; // fallback
    }

    const lexicalPresent = polarityScore > 40;

    if (!lexicalPresent) {
      return NextResponse.json({
        score: 0,
        severity: 'Low',
        presentMarkers: [],
        markerStrengths: { lexical: Math.round(polarityScore) },
        criteria: { lexical: { strength: Math.round(polarityScore), present: false } },
        evaluation: `✅ Low risk - Sentiment ${Math.round(polarityScore)}%`,
        foundMarkers: [],
        textWithMarkers: text
      } satisfies AnalysisResult);
    }

    // ✅ 2. MORPHOLOGICAL 1: First-person pronouns
    const firstPersonWords = ['i', 'me', 'my', 'myself'];
    const otherPronouns = ['you', 'your', 'yours', 'yourself', 'he', 'his', 'him', 'himself', 
                          'she', 'her', 'hers', 'herself', 'we', 'our', 'ours', 'ourselves', 
                          'they', 'them', 'their', 'theirs', 'themselves', 'it', 'its', 'itself'];
    
    const firstPersonCount = countWords(words, firstPersonWords);
    const otherPronounCount = countWords(words, otherPronouns);
    const totalPronouns = firstPersonCount + otherPronounCount;
    const firstPersonRatio = totalPronouns > 0 ? (firstPersonCount / totalPronouns) * 100 : 0;
    const morph1Present = firstPersonRatio > 50;

   // ✅ 3. MORPHOLOGICAL 2: REAL Active vs Passive Voice Detection
  const analyzeActivePassive = (text: string): { passiveCount: number; activeCount: number; passiveRatio: number } => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let passiveCount = 0;
  let activeCount = 0;

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    // ✅ НАСТОЯЩИЕ ПРИЗНАКИ PASSIVE VOICE (из PassivePy алгоритма)
    const passivePatterns = [
      // "be + past participle" (основной паттерн)
      /((?:is|was|were|be|been|being|am|are|get|got|gotten)\s+[a-z]+ed(?:\b|$))/gi,
      /((?:is|was|were|be|been|being|am|are|get|got|gotten)\s+[a-z]+en(?:\b|$))/gi,
      
      // by-agent passive
      /(?:by\s+the|by\s+a|by\s+an)/gi,
      
      // truncated passives (без be-verbs)
      /\b(?:written|done|made|taken|given|seen|known|called|told|shown)\s+(?:by|to|from)/gi
    ];

    const activePatterns = [
      // subject-verb-object (I/you/he + action verb)
      /(?:i|you|he|she|it|we|they)\s+(?:do|does|did|go|went|run|runs|make|makes|take|takes|get|gets|have|has|had|want|wanted|need|needed|feel|felt|think|thought|know|knew|see|saw|hear|heard|say|said|tell|told)/gi,
      
      // action verbs без вспомогательных
      /\b(?:run|jump|hit|kick|push|pull|throw|catch|build|destroy|create|eat|drink|walk|talk|shout|whisper|laugh|cry|fight|win|lose)\b/gi
    ];

    // Считаем passive patterns
    passivePatterns.forEach(pattern => {
      const matches = lowerSentence.match(pattern);
      if (matches) passiveCount += matches.length;
    });

    // Считаем active patterns
    activePatterns.forEach(pattern => {
      const matches = lowerSentence.match(pattern);
      if (matches) activeCount += matches.length;
    });
  });

  const totalVerbs = passiveCount + activeCount;
  const passiveRatio = totalVerbs > 0 ? (passiveCount / totalVerbs) * 100 : 0;
  
  return { passiveCount, activeCount, passiveRatio };
};

  // ✅ ИСПОЛЬЗОВАНИЕ в основном коде:
  const { passiveCount, activeCount, passiveRatio } = analyzeActivePassive(text);
  const morph2Present = passiveRatio > 30; // >30% passive = депрессивный маркер


   // ✅ 4. SEMANTIC: REAL MEANING-BASED Verb Classification (Halliday)
interface VerbClassification {
  verb: string;
  originalForm: string;
  category: 'MATERIAL' | 'BEHAVIORAL' | 'RELATIONAL' | 'VERBAL' | 'MENTAL';
  position: number;
  confidence: number;
}

const classifyVerbByMeaning = (verb: string, context: string, position: number): VerbClassification => {
  const lowerContext = context.toLowerCase();
  const lowerVerb = verb.toLowerCase();
  const beforeContext = context.slice(0, position).toLowerCase();
  const afterContext = context.slice(position + verb.length).toLowerCase();
  
  // ✅ 1. MENTAL: cognition/perception/emotion (смысл мышления/чувств)
  const mentalScore = (
    // Эмоциональные состояния
    (beforeContext.includes('i feel') || beforeContext.includes('i think') || 
     afterContext.includes('sad') || afterContext.includes('happy') || 
     afterContext.includes('angry') || lowerVerb.match(/^(feel|think)$/)) ? 0.9 :
    
    // Сенсорное восприятие
    (lowerVerb.match(/^(see|hear|smell|taste|touch)$/) || 
     afterContext.match(/(?:sound|look|smell|taste|feel)s?\s+(?:good|bad|nice|strange)/)) ? 0.8 :
    
    // Когнитивные процессы
    (lowerVerb.match(/^(know|believe|remember|forget|understand|realize|imagine|dream)$/) ||
     beforeContext.match(/(?:i\s+)?(?:know|believe|remember)\s+that/i)) ? 0.7 : 0
  );
  
  if (mentalScore > 0.5) {
    return { verb: lowerVerb, originalForm: verb, category: 'MENTAL', position, confidence: mentalScore };
  }
  
  // ✅ 2. VERBAL: speech acts (смысл говорения/коммуникации)
  const verbalScore = (
    (lowerVerb.match(/^(say|tell|ask|answer|shout|whisper|talk|speak|claim|explain)$/) ||
     afterContext.match(/to\s+(?:me|him|her|them|us)/) ||
     beforeContext.match(/(?:i\s+)?(?:say|tell)\s+(?:that|to)/i)) ? 0.9 : 0
  );
  
  if (verbalScore > 0.5) {
    return { verb: lowerVerb, originalForm: verb, category: 'VERBAL', position, confidence: verbalScore };
  }
  
  // ✅ 3. RELATIONAL: identification/comparison/attribution (смысл "есть/быть")
  const relationalScore = (
    (lowerVerb.match(/^(be|is|are|was|were|seem|appear|become|have|has|had|contain|include)$/) ||
     beforeContext.match(/^(it|he|she|they|this|that)\s+is/i) ||
     afterContext.match(/^(good|bad|nice|true|false|important|difficult|easy)/)) ? 0.9 :
    
    (lowerVerb.match(/^(look|sound|feel|taste|smell)$/) && 
     afterContext.match(/^(like|as|similar|different)/)) ? 0.7 : 0
  );
  
  if (relationalScore > 0.5) {
    return { verb: lowerVerb, originalForm: verb, category: 'RELATIONAL', position, confidence: relationalScore };
  }
  
  // ✅ 4. BEHAVIORAL: observable behavior (смысл физиологического поведения)
  const behavioralScore = (
    (lowerVerb.match(/^(laugh|cry|smile|cough|sneeze|sleep|watch|listen|yawn|blink)$/) ||
     afterContext.match(/and\s+(?:cry|smile|laugh|scream)/)) ? 0.8 :
    
    (lowerVerb.match(/^(look|stare|listen)$/) && 
     beforeContext.match(/(?:i\s+)?(?:try\s+to|want\s+to)/i)) ? 0.6 : 0
  );
  
  if (behavioralScore > 0.5) {
    return { verb: lowerVerb, originalForm: verb, category: 'BEHAVIORAL', position, confidence: behavioralScore };
  }
  
  // ✅ 5. MATERIAL: physical actions/events (всё остальное - физические действия)
  return { 
    verb: lowerVerb, 
    originalForm: verb, 
    category: 'MATERIAL', 
    position, 
    confidence: 0.9 
  };
};

// ✅ ОСНОВНАЯ ФУНКЦИЯ АНАЛИЗА
const analyzeSemanticMarkers = (text: string): { 
  mentalRelationalCount: number; 
  otherCount: number; 
  semanticRatio: number; 
  classifiedVerbs: VerbClassification[] 
} => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const classifiedVerbs: VerbClassification[] = [];
  
  sentences.forEach(sentence => {
    // Находим все возможные глаголы
    const verbMatches = sentence.match(/\b(?:[a-z]{3,})(?:ing|ed|s|es)?\b/gi) || [];
    
    verbMatches.forEach((verb, index) => {
      const position = sentence.toLowerCase().indexOf(verb.toLowerCase());
      if (position > -1) {
        const classification = classifyVerbByMeaning(verb, sentence, position);
        classifiedVerbs.push(classification);
      }
    });
  });

  const mentalRelationalCount = classifiedVerbs.filter(v => 
    v.category === 'MENTAL' || v.category === 'RELATIONAL'
  ).length;
  
  const otherCount = classifiedVerbs.length - mentalRelationalCount;
  const totalVerbs = classifiedVerbs.length;
  const semanticRatio = totalVerbs > 0 ? (mentalRelationalCount / totalVerbs) * 100 : 0;
  
  return { mentalRelationalCount, otherCount, semanticRatio, classifiedVerbs };
};

// ✅ ИСПОЛЬЗОВАНИЕ в основном коде API:
const { semanticRatio, classifiedVerbs } = analyzeSemanticMarkers(text);
const semanticPresent = semanticRatio > 50;

// Добавляем в результаты
markerStrengths.semantic = Math.round(semanticRatio);
criteria.semantic = { strength: Math.round(semanticRatio), present: semanticPresent };

// Топ-3 MENTAL/RELATIONAL в foundMarkers
classifiedVerbs
  .filter(v => (v.category === 'MENTAL' || v.category === 'RELATIONAL') && v.confidence > 0.6)
  .slice(0, 3)
  .forEach(v => {
    foundMarkers.push({
      word: `${v.originalForm} (${v.category})`,
      position: v.position,
      type: 'semantic',
      strength: semanticRatio
    });
  });

// Подсветка в тексте
classifiedVerbs.forEach(v => {
  if ((v.category === 'MENTAL' || v.category === 'RELATIONAL') && v.confidence > 0.7) {
    const color = v.category === 'MENTAL' ? '#e0e7ff' : '#d1fae5';
    const style = `background: ${color}; color: #1e3a8a; padding: 2px 4px; border-radius: 4px; font-weight: 600`;
    highlightedText = highlightedText.replace(
      new RegExp(escapeRegExp(v.originalForm), 'gi'),
      `<mark style="${style}">${v.originalForm}</mark>`
    );
  }
});

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
 
    // ✅ 5. SYNTACTIC 1: 11-12 word sentences
    const shortSentences = sentences.filter(s => {
      const wordCount = s.split(/\W+/).filter(Boolean).length;
      return wordCount >= 11 && wordCount <= 12;
    });
    const longSentences = sentences.filter(s => s.split(/\W+/).filter(Boolean).length > 12);
    const synt1Ratio = longSentences.length > 0 ? (shortSentences.length / longSentences.length) * 100 : 0;
    const synt1Present = synt1Ratio > 25;

    // ✅ 6. SYNTACTIC 2: Ellipsis (многоточия)
    const ellipsisSentences = sentences.filter(s => /\.{2,}/.test(s));
    const ellipsisRatio = sentences.length > 0 ? (ellipsisSentences.length / sentences.length) * 100 : 0;
    const synt2Present = ellipsisRatio >= 25;

    // ✅ НАЙДЕННЫЕ МАРКЕРЫ
    const foundMarkers: FoundMarker[] = [];
    
    // Lexical markers (top sentiment contributors)
    const lexicalMarkers = ['sad', 'depressed', 'anxious', 'hopeless', 'tired'];
    words.forEach((word, i) => {
      if (lexicalMarkers.includes(word)) {
        foundMarkers.push({
          word,
          position: text.toLowerCase().indexOf(word),
          type: 'lexical',
          strength: polarityScore
        });
      }
    });

    // First-person markers
    firstPersonWords.forEach(pronoun => {
      if (firstPersonCount > 0) {
        foundMarkers.push({
          word: pronoun,
          position: text.toLowerCase().indexOf(pronoun),
          type: 'morphological1',
          strength: firstPersonRatio
        });
      }
    });

    // Текст с подсветкой
    const highlightedText = text.split(' ').map(word => {
      const lowerWord = word.toLowerCase().replace(/[^\w]/g, '');
      
      // Подсветка маркеров по типу
      if (firstPersonWords.includes(lowerWord) && firstPersonRatio > 50) {
        return `<mark style="background: #dbeafe; color: #1e3a8a; padding: 2px 4px; border-radius: 4px">${word}</mark>`;
      }
      if (lexicalMarkers.includes(lowerWord)) {
        return `<mark style="background: #fee2e2; color: #991b1b; padding: 2px 4px; border-radius: 4px">${word}</mark>`;
      }
      return word;
    }).join(' ');

    // ✅ FINAL SCORING (среднее по всем маркерам)
    const additionalMarkers = [
      { name: 'morphological1', present: morph1Present, strength: firstPersonRatio },
      { name: 'morphological2', present: morph2Present, strength: passiveRatio },
      { name: 'semantic', present: semanticPresent, strength: semanticRatio },
      { name: 'syntactic1', present: synt1Present, strength: synt1Ratio },
      { name: 'syntactic2', present: synt2Present, strength: ellipsisRatio }
    ];

    const presentAdditional = additionalMarkers.filter(m => m.present);
    const additionalAvg = presentAdditional.length > 0 
      ? presentAdditional.reduce((sum, m) => sum + m.strength, 0) / presentAdditional.length 
      : 50;

    const score = Math.round(polarityScore * 0.4 + additionalAvg * 0.6);
    const severity = score > 70 ? 'High' : score > 45 ? 'Medium' : 'Low';

    const result: AnalysisResult = {
      score: Math.min(95, score),
      severity,
      presentMarkers: ['lexical', ...presentAdditional.map(m => m.name)],
      markerStrengths: {
        lexical: Math.round(polarityScore),
        morphological1: Math.round(firstPersonRatio),
        morphological2: Math.round(passiveRatio),
        semantic: Math.round(semanticRatio),
        syntactic1: Math.round(synt1Ratio),
        syntactic2: Math.round(ellipsisRatio)
      },
      criteria: {
        lexical: { strength: Math.round(polarityScore), present: true },
        morphological1: { strength: Math.round(firstPersonRatio), present: morph1Present },
        morphological2: { strength: Math.round(passiveRatio), present: morph2Present },
        semantic: { strength: Math.round(semanticRatio), present: semanticPresent },
        syntactic1: { strength: Math.round(synt1Ratio), present: synt1Present },
        syntactic2: { strength: Math.round(ellipsisRatio), present: synt2Present }
      },
      evaluation: `⚠️ ${severity} RISK (${Math.round(polarityScore)}% sentiment + ${presentAdditional.length}/5 markers)`,
      foundMarkers,
      textWithMarkers: highlightedText
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Analysis error:',
