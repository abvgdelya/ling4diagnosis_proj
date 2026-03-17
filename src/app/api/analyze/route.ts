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
      /((?:is|was|were|be|been|being|am|are|get|got|gotten)\\s+[a-z]+ed(?:\\b|$))/gi,
      /((?:is|was|were|be|been|being|am|are|get|got|gotten)\\s+[a-z]+en(?:\\b|$))/gi,
      /(?:by\\s+the|by\\s+a|by\\s+an)/gi,
    ];
    const activePatterns = [
      /(?:i|you|he|she|it|we|they)\\s+(?:do|does|did|go|went|run|runs|make|makes|take|takes)/gi,
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

// 🔥 EXPANDED Halliday's Process Types Semantic Analysis
const analyzeSemanticMarkers = (text: string) => {
  const sentences = text
    .split(/[.!?]+/)
    .filter((s: string) => s.trim().length > 5);
  const classifiedVerbs: any[] = [];

  // COMPLETE HALLIDAY'S VERB LISTS
  const materialVerbs = [
    'move','go','come','leave','arrive','enter','exit','walk','march','stride','run','jog','sprint','crawl','creep','climb','descend','jump','hop','leap','skip',
    'slide','glide','slip','fall','rise','stand','sit','lie','kneel','crouch','bend','stretch','reach','lift','raise','lower','carry','haul','drag','pull','push','shove','heave','tote',
    'throw','toss','hurl','lob','cast','fling','catch','hit','strike','smack','slap','punch','kick','knock','break','smash','crack','crush','shatter','split','snap','tear','rip','cut','slice','chop','saw','carve',
    'tie','fasten','attach','glue','tape','nail','screw','bolt','weld','forge','build','construct','assemble','fabricate','make','create','craft','form','shape','mold',
    'open','close','lock','unlock','shut','latch','seal','unseal','turn','twist','rotate','spin','roll','press','squeeze','flick','click',
    'pour','fill','empty','drain','mix','stir','shake','blend','knead','cook','bake','boil','fry','roast','grill','freeze','melt','thaw','heat','cool','ignite','burn','extinguish','explode',
    'grow','plant','sow','water','weed','harvest','dig','plow','mine','drill','load','unload','pack','unpack','wrap','unwrap','deliver','send','bring','fetch',
    'clean','wash','rinse','wipe','scrub','sweep','mop','polish','dust','repair','fix','mend','replace','install','remove','assemble','disassemble','calibrate'
  ];

  const relationalVerbs = [
    'be','constitute','represent','amount','equal','identical','same','make','render','serve','function','define','denote','signify','mean','indicate','designate',
    'name','call','label','dub','brand','style','entitle','classify','categorize','type','identify','comprise','consist','include','exclude','form','makeup','total',
    'seem','appear','become','get','grow','turn','prove','remain','stay','keep','feel','look','sound','smell','taste','have','own','possess','lack','contain','feature','exhibit','display','show','boast',
    'match','resemble','differ','vary','contrast','compare','correspond','align','mirror','parallel','exceed','surpass','outnumber','outweigh','lag','trail','outpace','overtake',
    'fallshort','approach','approximate','similar','close','greater','less','proportional','scale','correlate','covary','diverge','converge'
  ];

  const verbalVerbs = [
    'say','tell','speak','talk','discuss','converse','address','state','assert','claim','maintain','contend','allege','declare','announce','proclaim','pronounce',
    'explain','clarify','describe','define','illustrate','elaborate','report','recount','narrate','relate','summarize','paraphrase','mention','note','remark','add','comment','observe',
    'ask','inquire','query','question','probe','grill','answer','reply','respond','retort','rebut','contradict','argue','debate','dispute','challenge','request','beg','plead','beseech','implore','urge','petition',
    'order','command','direct','instruct','mandate','decree','suggest','recommend','propose','advise','warn','caution','alert','threaten','promise','vow','swear','guarantee','assure','pledge',
    'agree','consent','accept','refuse','deny','admit','confess','apologize','forgive','thank','praise','compliment','congratulate','commend','criticize','blame','accuse','reprimand','scold','admonish',
    'complain','object','protest','advocate','lobby','joke','jest','quip','tease','taunt','mock','jeer','heckle','greet','welcome','bid','toast','whisper','murmur','mutter','hiss','shout','yell','scream',
    'read','recite','quote','call','phone','text','message','email','write','post'
  ];

  const mentalVerbs = [
    'see','behold','glimpse','spot','notice','observe','watch','witness','view','hear','overhear','eavesdrop','listen','detect','perceive','discern','distinguish',
    'feel','sense','smell','sniff','taste','recognize','identify','think','know','understand','comprehend','realize','remember','recall','forget','learn','study','memorize',
    'consider','regard','deem','suppose','assume','imagine','envision','envisage','conceive','analyze','evaluate','appraise','judge','assess','critique','infer','deduce','conclude','determine','figureout','solve','decide','resolve',
    'estimate','calculate','compute','gauge','predict','expect','anticipate','believe','doubt','question','wonder','reflect','ponder','contemplate','deliberate','plan','intend','mean',
    'like','dislike','love','hate','enjoy','prefer','adore','cherish','value','appreciate','respect','admire','trust','distrust','fear','dread','worry','panic','regret','resent','pity','envy','rue',
    'hope','wish','long','yearn','desire','crave','miss','delight','relish','savor','care','mind'
  ];

  const behavioralVerbs = [
    'breathe','respire','inhale','exhale','pant','gasp','wheeze','cough','sneeze','hiccup','burp','belch','yawn','sigh','snore','sleep','nap','doze','slumber','wake','awaken','dream',
    'blink','wink','squint','peer','stare','gaze','glance','peep','gawk','ogle','look','watch','listen','sniff','smell','taste','lick','chew','nibble','munch','bite','swallow','sip','slurp',
    'sweat','perspire','shiver','tremble','shake','quiver','twitch','fidget','startle','flinch','blush','flush','pale','smile','grin','smirk','beam','frown','scowl','grimace','glower',
    'laugh','chuckle','giggle','chortle','snicker','snigger','guffaw','cry','sob','weep','wail','howl','whimper','groan','moan','murmur','hum','whine','nod','bow','curtsey','shrug','wave','beckon','clap','applaud'
  ];

  sentences.forEach((sentence: string) => {
    const verbMatches = sentence.match(/\b[a-z]{3,}(?:ing|ed|s|es|d|t)?\b/gi) || [];
    
    verbMatches.forEach((verb) => {
      const position = sentence.toLowerCase().indexOf(verb.toLowerCase());
      if (position > -1) {
        const lowerVerb = verb.toLowerCase();
        let category = "MATERIAL";

        if (mentalVerbs.some(v => lowerVerb.includes(v))) category = "MENTAL";
        else if (relationalVerbs.some(v => lowerVerb.includes(v))) category = "RELATIONAL";
        else if (verbalVerbs.some(v => lowerVerb.includes(v))) category = "VERBAL";
        else if (behavioralVerbs.some(v => lowerVerb.includes(v))) category = "BEHAVIORAL";
        else if (materialVerbs.some(v => lowerVerb.includes(v))) category = "MATERIAL";

        classifiedVerbs.push({ verb: lowerVerb, category, position });
      }
    });
  });

  const mentalRelationalCount = classifiedVerbs.filter(
    (v) => v.category === "MENTAL" || v.category === "RELATIONAL"
  ).length;
  const totalVerbs = classifiedVerbs.length;
  const semanticRatio = totalVerbs > 0 ? (mentalRelationalCount / totalVerbs) * 100 : 0;

  return { semanticRatio, classifiedVerbs };
};

// 🔥 POSITION-BASED LINGUISTIC ELLIPSIS
function analyzeEllipsis(text: string): { ellipsisRatio: number } {
  const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 5);
  let ellipsisCount = 0;
  
  sentences.forEach((sentence: string) => {
    const words = sentence.split(/\W+/).filter(Boolean);
    if (words.length < 4) return;
    
    const subjectZoneEnd = Math.floor(words.length * 0.2);
    const subjectZone = words.slice(0, Math.max(1, subjectZoneEnd));
    const verbZoneStart = Math.floor(words.length * 0.2);
    const verbZoneEnd = Math.floor(words.length * 0.5);
    const verbZone = words.slice(verbZoneStart, verbZoneEnd);
    const subjectOmission = subjectZone.length <= 1;
    const hasSubject = subjectZone.length > 1;
    const verbOmission = hasSubject && verbZone.length < 2;
    const conjunctionZone = words.slice(-Math.floor(words.length * 0.15));
    const postConjunctionShort = conjunctionZone.filter(w => w.length > 2).length < 2;
    
    if (subjectOmission || verbOmission || postConjunctionShort) ellipsisCount++;
  });
  
  const ellipsisRatio = sentences.length > 0 ? (ellipsisCount / sentences.length) * 100 : 0;
  return { ellipsisRatio };
}

function highlightMarkers(text: string, foundMarkers: FoundMarker[]): string {
  let highlighted = text;
  const sortedMarkers = foundMarkers.slice().sort((a, b) => b.position - a.position);

  for (const { word, position, type } of sortedMarkers) {
    if (position >= 0 && position < text.length) {
      const before = highlighted.slice(0, position);
      const content = highlighted.slice(position, position + word.length);
      const after = highlighted.slice(position + word.length);
      highlighted = before + `<span class="marker marker-${type}" data-type="${type}">${content}</span>` + after;
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
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 5);

    // 1. LEXICAL: DistilBERT sentiment
    let polarityScore = 20;
    try {
      const { pipeline, env } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      const analyzer = await pipeline("sentiment-analysis", "Xenova/distilbert-base-uncased-finetuned-sst-2-english");
      const result = await analyzer(text.slice(0, 512));
      const sentimentResult = Array.isArray(result) ? result[0] : result;
      polarityScore = (sentimentResult as any).label === "NEGATIVE" ? Number((sentimentResult as any).score) * 100 : 0;
    } catch (e) {
      console.error("Sentiment failed:", e);
    }

    const lexicalStrength = Math.round(polarityScore);
    const isLowDepressivity = lexicalStrength <= 50;

    if (isLowDepressivity) {
      return NextResponse.json({
        score: 0, risk: "Low", depressivityPercent: lexicalStrength,
        presentMarkers: ["lexical"], markerStrengths: { lexical: lexicalStrength },
        criteria: { lexical: { strength: lexicalStrength, present: true } },
        evaluation: `✅ Low risk – Sentiment ${lexicalStrength}%`, foundMarkers: [], textWithMarkers: text,
      });
    }

    // 2. Morphological 1: First-person pronouns
    const firstPersonCount = countWords(words, ["i", "me", "my", "myself"]);
    const otherPronounCount = countWords(words, ["you", "he", "she", "it", "we", "they"]);
    const totalPronouns = firstPersonCount + otherPronounCount;
    const firstPersonRatio = totalPronouns > 0 ? (firstPersonCount / totalPronouns) * 100 : 0;
    const morph1Present = firstPersonRatio > 50;

    // 3. Morphological 2: Active/Passive
    const { passiveRatio } = analyzeActivePassive(text);
    const morph2Present = passiveRatio > 30;

    // 4. Semantic: MENTAL+RELATIONAL >50%
    const { semanticRatio } = analyzeSemanticMarkers(text);
    const semanticPresent = semanticRatio > 50;

    // 5. Syntactic 1: Short sentence ratio
    const shortSentences = sentences.filter((s: string) => {
      const wc = s.split(/\W+/).filter(Boolean).length;
      return wc >= 11 && wc <= 12;
    });
    const longSentences = sentences.filter((s: string) => s.split(/\W+/).filter(Boolean).length > 12);
    const synt1Ratio = longSentences.length > 0 ? (shortSentences.length / longSentences.length) * 100 : 0;
    const synt1Present = synt1Ratio > 25;

    // 6. Syntactic 2: POSITION-BASED ELLIPSIS
    const { ellipsisRatio } = analyzeEllipsis(text);
    const synt2Present = ellipsisRatio >= 25;

    // Found markers (only the ones that trigger)
    const foundMarkers: FoundMarker[] = [];
    if (morph1Present) foundMarkers.push({ word: "I/me", position: 0, type: "morphological1", strength: firstPersonRatio });
    if (morph2Present) foundMarkers.push({ word: `passive:${Math.round(passiveRatio)}%`, position: 0, type: "morphological2", strength: passiveRatio });
    if (semanticPresent) foundMarkers.push({ word: `mental:${Math.round(semanticRatio)}%`, position: 0, type: "semantic", strength: semanticRatio });

    // Calculate overall score
    const allStrengths: number[] = [
      lexicalStrength,
      morph1Present ? firstPersonRatio : 0,
      morph2Present ? passiveRatio : 0,
      semanticPresent ? semanticRatio : 0,
      synt1Present ? synt1Ratio : 0,
      synt2Present ? ellipsisRatio : 0,
    ].filter(s => s > 0);
    const depressivityPercent = allStrengths.reduce((a, b) => a + b, 0) / Math.max(1, allStrengths.length);
    const score = Math.round(depressivityPercent);
    const risk: "Low" | "Medium" | "High" = score > 70 ? "High" : score > 45 ? "Medium" : "Low";

    const highlightedText = highlightMarkers(text, foundMarkers);

    const result: AnalysisResult = {
      score, risk, depressivityPercent: Math.round(depressivityPercent),
      presentMarkers: ["lexical", ...(morph1Present ? ["morphological1"] : []), ...(morph2Present ? ["morphological2"] : []), ...(semanticPresent ? ["semantic"] : [])],
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
        morphological1: { strength: Math.round(firstPersonRatio), present: morph1Present },
        morphological2: { strength: Math.round(passiveRatio), present: morph2Present },
        semantic: { strength: Math.round(semanticRatio), present: semanticPresent },
        syntactic1: { strength: Math.round(synt1Ratio), present: synt1Present },
        syntactic2: { strength: Math.round(ellipsisRatio), present: synt2Present },
      },
      evaluation: `⚠️ ${isLowDepressivity ? "Low" : risk} risk – Depressivity: ${Math.round(depressivityPercent)}% (lexical + Halliday + ellipsis)`,
      foundMarkers, textWithMarkers: highlightedText,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Analysis failed", score: 0, risk: "Low", depressivityPercent: 0 }, { status: 500 });
  }
}

function countWords(words: string[], targets: string[]): number {
  return words.filter((w) => targets.some((t) => w.includes(t))).length;
}
