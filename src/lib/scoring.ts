// ============================================================
// Advanced rule-based scoring engine for idea evaluation
// Uses multiple weighted algorithms: lexical analysis, structural
// parsing, domain classification, complexity estimation, and
// market saturation heuristics.
// ============================================================

// --- Dictionaries & Knowledge Bases ---

const CLONE_PATTERNS: { pattern: RegExp; label: string; penalty: number }[] = [
  { pattern: /\buber\s+for\b/i, label: "Uber for X", penalty: 4 },
  { pattern: /\bairbnb\s+for\b/i, label: "Airbnb for X", penalty: 4 },
  { pattern: /\btinder\s+for\b/i, label: "Tinder for X", penalty: 3 },
  { pattern: /\bamazon\s+for\b/i, label: "Amazon for X", penalty: 3 },
  { pattern: /\bnetflix\s+for\b/i, label: "Netflix for X", penalty: 3 },
  { pattern: /\bspotify\s+for\b/i, label: "Spotify for X", penalty: 3 },
  { pattern: /\bdoordash\s+for\b/i, label: "DoorDash for X", penalty: 3 },
  { pattern: /\bgoogle\s+for\b/i, label: "Google for X", penalty: 3 },
  { pattern: /\blike\s+uber\b/i, label: "Like Uber", penalty: 3 },
  { pattern: /\blike\s+airbnb\b/i, label: "Like Airbnb", penalty: 3 },
];

const AI_PATTERNS = [
  /\bai\s+that\b/i, /\bai\s+for\b/i, /\bai[\s-]powered\b/i,
  /\bchatgpt\s+for\b/i, /\bgpt\s+for\b/i, /\busing\s+ai\b/i,
  /\bmachine\s+learning\b/i, /\bdeep\s+learning\b/i, /\bneural\s+net/i,
  /\bllm\b/i, /\blarge\s+language\s+model\b/i,
];

const PLATFORM_PATTERNS = [
  /\bplatform\s+for\b/i, /\bmarketplace\s+for\b/i,
  /\bapp\s+for\b/i, /\bservice\s+for\b/i, /\btool\s+for\b/i,
  /\bapp\s+that\b/i, /\bwebsite\s+that\b/i,
];

const BUZZWORDS: { word: string; weight: number }[] = [
  { word: "ai", weight: 1.5 }, { word: "platform", weight: 1 }, { word: "saas", weight: 1.5 },
  { word: "marketplace", weight: 1 }, { word: "blockchain", weight: 2 }, { word: "web3", weight: 2 },
  { word: "disrupt", weight: 1.5 }, { word: "automation", weight: 1 }, { word: "metaverse", weight: 2 },
  { word: "crypto", weight: 2 }, { word: "nft", weight: 2 }, { word: "machine learning", weight: 1 },
  { word: "deep learning", weight: 1.5 }, { word: "cloud", weight: 0.5 }, { word: "scalable", weight: 1 },
  { word: "synergy", weight: 1.5 }, { word: "ecosystem", weight: 1 }, { word: "paradigm", weight: 1.5 },
  { word: "leverage", weight: 1 }, { word: "innovate", weight: 1 }, { word: "revolutionize", weight: 1.5 },
  { word: "decentralized", weight: 1.5 }, { word: "tokenize", weight: 2 }, { word: "gamify", weight: 1 },
  { word: "monetize", weight: 0.5 }, { word: "pivot", weight: 1 }, { word: "agile", weight: 0.5 },
  { word: "disruptive", weight: 1.5 }, { word: "hyperscale", weight: 2 }, { word: "quantum", weight: 2 },
  { word: "iot", weight: 1 }, { word: "big data", weight: 1 }, { word: "the cloud", weight: 0.5 },
  { word: "neural", weight: 1.5 }, { word: "autonomous", weight: 1 }, { word: "augmented reality", weight: 1 },
  { word: "virtual reality", weight: 1 }, { word: "ar", weight: 0.5 }, { word: "vr", weight: 0.5 },
];

const UNREALISTIC_SIGNALS: { pattern: RegExp; penalty: number; reason: string }[] = [
  { pattern: /\bteleport/i, penalty: 5, reason: "involves teleportation (not yet invented)" },
  { pattern: /\btime\s*travel/i, penalty: 5, reason: "time travel remains fictional" },
  { pattern: /\bimmort/i, penalty: 4, reason: "defeating death is ambitious" },
  { pattern: /\binfinite\b/i, penalty: 3, reason: "nothing is truly infinite" },
  { pattern: /\bmagic\b/i, penalty: 3, reason: "relies on magic" },
  { pattern: /\bflying\s+car/i, penalty: 3, reason: "flying cars have been 'coming soon' since 1950" },
  { pattern: /\binvisib/i, penalty: 3, reason: "invisibility tech isn't consumer-ready" },
  { pattern: /\bmind\s*read/i, penalty: 4, reason: "mind-reading is sci-fi territory" },
  { pattern: /\btelepath/i, penalty: 4, reason: "telepathy isn't a thing yet" },
  { pattern: /\breturn.*dead\b|resurrect/i, penalty: 5, reason: "necromancy is not a business model" },
  { pattern: /\bworld\s*peace\b/i, penalty: 3, reason: "noble but not an app feature" },
  { pattern: /\bcure.*cancer\b|cancer.*cure\b/i, penalty: 3, reason: "medical breakthroughs take decades" },
];

const REALISM_BOOSTERS: { pattern: RegExp; boost: number; reason: string }[] = [
  { pattern: /\bapp\b/i, boost: 1, reason: "apps are buildable" },
  { pattern: /\bwebsite\b/i, boost: 1.5, reason: "websites are straightforward to build" },
  { pattern: /\btool\b/i, boost: 1, reason: "tools have clear utility" },
  { pattern: /\bcalculator\b/i, boost: 2, reason: "calculators are simple and useful" },
  { pattern: /\btracker\b/i, boost: 1.5, reason: "tracking apps have proven demand" },
  { pattern: /\bnewsletter\b/i, boost: 2, reason: "newsletters are low-barrier businesses" },
  { pattern: /\bcourse\b|online\s+class/i, boost: 1.5, reason: "ed-tech is established" },
  { pattern: /\bchrome\s+extension\b/i, boost: 2, reason: "browser extensions are feasible" },
  { pattern: /\bplugin\b/i, boost: 1.5, reason: "plugins have clear distribution" },
  { pattern: /\bopen\s*source\b/i, boost: 1, reason: "open-source has community support" },
];

const EXECUTION_HARD: { pattern: RegExp; cost: number; reason: string }[] = [
  { pattern: /\bdelivery\b/i, cost: 2, reason: "last-mile delivery is operationally brutal" },
  { pattern: /\blogistics\b/i, cost: 2, reason: "logistics requires real-world coordination" },
  { pattern: /\bshipping\b/i, cost: 2, reason: "shipping networks are capital-intensive" },
  { pattern: /\bfleet\b/i, cost: 3, reason: "fleet management is extremely complex" },
  { pattern: /\bwarehouse\b/i, cost: 2, reason: "warehousing needs physical infrastructure" },
  { pattern: /\bsupply\s*chain\b/i, cost: 3, reason: "supply chains span multiple industries" },
  { pattern: /\bhardware\b/i, cost: 3, reason: "hardware adds manufacturing complexity" },
  { pattern: /\bmanufactur/i, cost: 3, reason: "manufacturing requires facilities and capital" },
  { pattern: /\bsatellite\b/i, cost: 4, reason: "satellites are literally rocket science" },
  { pattern: /\bglobal\b/i, cost: 1, reason: "going global multiplies complexity" },
  { pattern: /\bregulat/i, cost: 2, reason: "regulatory compliance is costly" },
  { pattern: /\bhealth\s*care\b|\bmedical\b/i, cost: 2, reason: "healthcare has heavy regulations" },
  { pattern: /\bfinance\b|\bfintech\b|\bbank/i, cost: 2, reason: "fintech faces regulatory hurdles" },
  { pattern: /\btwo[\s-]sided\b|\bmarketplace\b/i, cost: 2, reason: "two-sided marketplaces face the cold-start problem" },
  { pattern: /\breal[\s-]time\b/i, cost: 1, reason: "real-time systems need robust infra" },
  { pattern: /\bself[\s-]driving\b|\bautonomous\s+vehic/i, cost: 4, reason: "autonomous vehicles are incredibly hard" },
];

const EXECUTION_EASY: { pattern: RegExp; reduction: number; reason: string }[] = [
  { pattern: /\bapp\b/i, reduction: 1, reason: "apps have established frameworks" },
  { pattern: /\bwebsite\b/i, reduction: 2, reason: "websites are straightforward" },
  { pattern: /\btool\b/i, reduction: 1, reason: "tools have focused scope" },
  { pattern: /\bcalculator\b/i, reduction: 2, reason: "calculators are simple to build" },
  { pattern: /\btimer\b/i, reduction: 2, reason: "timers are trivial" },
  { pattern: /\blist\b/i, reduction: 2, reason: "list apps have minimal backend needs" },
  { pattern: /\breminder\b/i, reduction: 1, reason: "reminders are well-understood" },
  { pattern: /\bnote\b/i, reduction: 1, reason: "note apps are achievable" },
  { pattern: /\bchrome\s+extension\b/i, reduction: 2, reason: "extensions are quick to ship" },
];

// --- Domain Classification ---

interface DomainProfile {
  domain: string;
  saturation: number; // 0–1 how saturated the market is
  difficulty: number; // baseline difficulty modifier
}

const DOMAIN_SIGNALS: { pattern: RegExp; profile: DomainProfile }[] = [
  { pattern: /\bfood\b|\bmeal\b|\brestaurant\b|\bcook/i, profile: { domain: "FoodTech", saturation: 0.85, difficulty: 0.6 } },
  { pattern: /\bhealth\b|\bfit(ness)?\b|\bwellness\b|\bmeditat/i, profile: { domain: "HealthTech", saturation: 0.8, difficulty: 0.5 } },
  { pattern: /\beducat\b|\blearn\b|\bstud(y|ent)\b|\btutor/i, profile: { domain: "EdTech", saturation: 0.75, difficulty: 0.4 } },
  { pattern: /\bfinance\b|\bmoney\b|\binvest\b|\bbank\b|\bpay/i, profile: { domain: "FinTech", saturation: 0.8, difficulty: 0.7 } },
  { pattern: /\bsocial\b|\bfriend\b|\bcommunity\b|\bchat\b/i, profile: { domain: "Social", saturation: 0.9, difficulty: 0.5 } },
  { pattern: /\btravel\b|\bflight\b|\bhotel\b|\bbook/i, profile: { domain: "TravelTech", saturation: 0.8, difficulty: 0.5 } },
  { pattern: /\bpet\b|\banimal\b|\bdog\b|\bcat\b/i, profile: { domain: "PetTech", saturation: 0.5, difficulty: 0.4 } },
  { pattern: /\bgame\b|\bgaming\b|\bplay\b/i, profile: { domain: "Gaming", saturation: 0.85, difficulty: 0.6 } },
  { pattern: /\bfashion\b|\bcloth\b|\bwear\b|\bstyle\b/i, profile: { domain: "FashionTech", saturation: 0.7, difficulty: 0.4 } },
  { pattern: /\breal\s*estate\b|\bproperty\b|\brent/i, profile: { domain: "PropTech", saturation: 0.7, difficulty: 0.6 } },
  { pattern: /\bmusic\b|\bsong\b|\bartist\b/i, profile: { domain: "MusicTech", saturation: 0.75, difficulty: 0.4 } },
  { pattern: /\bcar\b|\bvehicle\b|\bdriv/i, profile: { domain: "Automotive", saturation: 0.6, difficulty: 0.7 } },
];

function detectDomain(idea: string): DomainProfile | null {
  for (const s of DOMAIN_SIGNALS) {
    if (s.pattern.test(idea)) return s.profile;
  }
  return null;
}

// --- Lexical Analysis ---

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s'-]/g, "").split(/\s+/).filter(Boolean);
}

function lexicalDiversity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens);
  return unique.size / tokens.length; // 0–1, higher = more diverse
}

function ideaSpecificity(tokens: string[]): number {
  // Longer, more specific ideas score higher
  const len = tokens.length;
  if (len <= 2) return 0.1;
  if (len <= 5) return 0.3;
  if (len <= 10) return 0.5;
  if (len <= 20) return 0.7;
  return 0.9;
}

function hashIdea(idea: string): number {
  // Deterministic hash for consistent but varied output
  let hash = 0;
  for (let i = 0; i < idea.length; i++) {
    const char = idea.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// --- Scoring Algorithms ---

export interface IdeaScore {
  originality: number;
  originalityReason: string;
  buzzwordDensity: number;
  buzzwordReason: string;
  realism: number;
  realismReason: string;
  executionDifficulty: number;
  executionReason: string;
}

export interface StartupPattern {
  pattern: string;
  similarity: "High" | "Medium" | "Low" | "None";
  explanation: string;
}

export interface ExistingIdeaResult {
  probability: "High" | "Medium" | "Low";
  explanation: string;
}

export interface EvaluationResult {
  scores: IdeaScore;
  pattern: StartupPattern;
  existingIdea: ExistingIdeaResult;
  pitch: string;
  overallScore: number;
}

function scoreOriginality(idea: string): { score: number; reason: string } {
  const tokens = tokenize(idea);
  const diversity = lexicalDiversity(tokens);
  const specificity = ideaSpecificity(tokens);

  let score = 5;
  const reasons: string[] = [];

  // Algorithm 1: Clone pattern detection (heaviest penalty)
  const cloneMatches = CLONE_PATTERNS.filter(p => p.pattern.test(idea));
  if (cloneMatches.length > 0) {
    const worst = cloneMatches.reduce((a, b) => a.penalty > b.penalty ? a : b);
    score -= worst.penalty;
    reasons.push(`follows the "${worst.label}" startup template — one of the most overused patterns`);
  }

  // Algorithm 2: AI pattern detection
  const aiCount = AI_PATTERNS.filter(p => p.test(idea)).length;
  if (aiCount > 0) {
    score -= Math.min(3, aiCount * 1.5);
    reasons.push("uses the well-worn 'AI that does X' formula");
  }

  // Algorithm 3: Generic platform detection
  const platCount = PLATFORM_PATTERNS.filter(p => p.test(idea)).length;
  if (platCount > 0) {
    score -= Math.min(2, platCount);
    reasons.push("generic platform/app framing reduces originality");
  }

  // Algorithm 4: Specificity bonus
  if (specificity > 0.5) {
    score += Math.round(specificity * 2);
    reasons.push("the level of detail suggests genuine thought");
  }

  // Algorithm 5: Lexical diversity bonus
  if (diversity > 0.8 && tokens.length > 5) {
    score += 1;
    reasons.push("uses varied vocabulary");
  }

  // Algorithm 6: Domain saturation penalty
  const domain = detectDomain(idea);
  if (domain && domain.saturation > 0.7) {
    score -= 1;
    reasons.push(`the ${domain.domain} space is highly saturated`);
  }

  // Algorithm 7: No-template bonus
  if (cloneMatches.length === 0 && aiCount === 0 && platCount === 0 && tokens.length > 3) {
    score += 2;
    reasons.push("doesn't follow any common startup templates");
  }

  score = Math.max(1, Math.min(10, Math.round(score)));
  const reason = reasons.length > 0
    ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + "."
    : "A reasonably original concept with no obvious template matches.";
  return { score, reason };
}

function scoreBuzzwords(idea: string): { score: number; reason: string } {
  const lower = idea.toLowerCase();
  const matches: { word: string; weight: number }[] = [];

  for (const bw of BUZZWORDS) {
    if (lower.includes(bw.word)) {
      matches.push(bw);
    }
  }

  // Weighted buzzword score — not just count, but severity
  const totalWeight = matches.reduce((sum, m) => sum + m.weight, 0);
  let score = Math.min(10, Math.round(totalWeight * 1.5));
  
  // Bonus penalty for stacking buzzwords
  if (matches.length >= 3) score = Math.min(10, score + 1);
  if (matches.length >= 5) score = Math.min(10, score + 1);

  let reason: string;
  const topBuzzwords = matches.sort((a, b) => b.weight - a.weight).slice(0, 3).map(m => m.word);

  if (matches.length === 0) {
    reason = "Refreshingly buzzword-free — rare in startup pitches.";
  } else if (totalWeight <= 2) {
    reason = `Light buzzword usage ("${topBuzzwords[0]}") — still readable by humans.`;
  } else if (totalWeight <= 5) {
    reason = `Moderate buzzword load: "${topBuzzwords.join('", "')}". Investors will nod knowingly.`;
  } else if (totalWeight <= 8) {
    reason = `Heavy buzzword density with "${topBuzzwords.join('", "')}". This reads like a pitch deck.`;
  } else {
    reason = `Extreme buzzword saturation (${matches.length} detected). This is more jargon than idea.`;
  }

  return { score: Math.max(0, score), reason };
}

function scoreRealism(idea: string): { score: number; reason: string } {
  let score = 6;
  const reasons: string[] = [];

  // Algorithm 1: Unrealistic concept detection
  for (const sig of UNREALISTIC_SIGNALS) {
    if (sig.pattern.test(idea)) {
      score -= sig.penalty;
      reasons.push(sig.reason);
    }
  }

  // Algorithm 2: Realism boosters
  for (const boost of REALISM_BOOSTERS) {
    if (boost.pattern.test(idea)) {
      score += boost.boost;
      reasons.push(boost.reason);
      break; // Only take the best booster
    }
  }

  // Algorithm 3: Domain feasibility
  const domain = detectDomain(idea);
  if (domain) {
    if (domain.difficulty > 0.6) {
      score -= 1;
      reasons.push(`${domain.domain} has high regulatory/technical barriers`);
    } else if (domain.difficulty < 0.4) {
      score += 1;
      reasons.push(`${domain.domain} is an accessible market`);
    }
  }

  // Algorithm 4: Idea length as proxy for thought-through-ness
  const tokens = tokenize(idea);
  if (tokens.length <= 3) {
    score -= 1;
    reasons.push("too vague to assess feasibility");
  } else if (tokens.length > 15) {
    score += 1;
    reasons.push("the detail suggests a thought-through concept");
  }

  // Algorithm 5: Contradiction detection
  const lower = idea.toLowerCase();
  if ((lower.includes("free") && lower.includes("premium")) ||
      (lower.includes("simple") && lower.includes("everything")) ||
      (lower.includes("cheap") && lower.includes("luxury"))) {
    score -= 1;
    reasons.push("contains contradictory elements");
  }

  score = Math.max(1, Math.min(10, Math.round(score)));
  const reason = reasons.length > 0
    ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + "."
    : "Seems plausible with the right execution.";
  return { score, reason };
}

function scoreExecution(idea: string): { score: number; reason: string } {
  let score = 5;
  const reasons: string[] = [];

  // Algorithm 1: Hard execution signals
  for (const h of EXECUTION_HARD) {
    if (h.pattern.test(idea)) {
      score += h.cost;
      reasons.push(h.reason);
    }
  }

  // Algorithm 2: Easy execution signals
  for (const e of EXECUTION_EASY) {
    if (e.pattern.test(idea)) {
      score -= e.reduction;
      reasons.push(e.reason);
      break; // Only take the best
    }
  }

  // Algorithm 3: Clone model complexity
  const cloneMatches = CLONE_PATTERNS.filter(p => p.pattern.test(idea));
  if (cloneMatches.length > 0) {
    score += 2;
    reasons.push("replicating an established giant's model requires significant resources");
  }

  // Algorithm 4: Domain difficulty
  const domain = detectDomain(idea);
  if (domain) {
    score += Math.round(domain.difficulty * 2);
    if (domain.difficulty > 0.5) {
      reasons.push(`${domain.domain} involves complex operations`);
    }
  }

  // Algorithm 5: Scale indicators
  const lower = idea.toLowerCase();
  if (/\beveryone\b|\bworldwide\b|\bglobal\b|\bmillions?\b/i.test(lower)) {
    score += 1;
    reasons.push("ambitious scale increases execution complexity");
  }

  score = Math.max(1, Math.min(10, Math.round(score)));
  const reason = reasons.length > 0
    ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + "."
    : "Moderate complexity — achievable with the right team.";
  return { score, reason };
}

// --- Pattern Detection (Multi-Signal) ---

interface PatternCandidate {
  pattern: string;
  signals: RegExp[];
  explanation: string;
}

const PATTERN_CANDIDATES: PatternCandidate[] = [
  {
    pattern: "On-Demand Platform",
    signals: [/\buber\s+for\b/i, /\bon[\s-]demand\b/i, /\binstant\b/i, /\breal[\s-]time\b.*\bdelivery\b/i],
    explanation: "This idea follows the 'Uber for X' on-demand model — connect supply with demand in real time.",
  },
  {
    pattern: "Marketplace Platform",
    signals: [/\bmarketplace\b/i, /\bbuy\b.*\bsell\b/i, /\brent\b/i, /\bpeer[\s-]to[\s-]peer\b/i, /\bp2p\b/i, /\bairbnb\s+for\b/i],
    explanation: "Classic two-sided marketplace — the cold-start problem is your biggest challenge.",
  },
  {
    pattern: "AI Assistant / Copilot",
    signals: AI_PATTERNS,
    explanation: "Follows the 'AI that does X' model. Differentiation from ChatGPT and existing tools is critical.",
  },
  {
    pattern: "Subscription Service",
    signals: [/\bsubscription\b/i, /\bnetflix\s+for\b/i, /\bspotify\s+for\b/i, /\bmonthly\b/i, /\bbox\b/i, /\bmembership\b/i],
    explanation: "Subscription-based model. Churn rate will be your primary challenge.",
  },
  {
    pattern: "Delivery / Logistics Service",
    signals: [/\bdeliver/i, /\bshipping\b/i, /\blogistics\b/i, /\bdoordash\s+for\b/i, /\blast[\s-]mile\b/i],
    explanation: "Delivery businesses are capital-intensive and operationally challenging.",
  },
  {
    pattern: "Productivity / Developer Tool",
    signals: [/\btool\b/i, /\bproductivity\b/i, /\bworkflow\b/i, /\bautomat/i, /\bplugin\b/i, /\bextension\b/i, /\bdeveloper\b/i],
    explanation: "Productivity tools can grow virally but need a clear 10x improvement over existing solutions.",
  },
  {
    pattern: "Social Network / Community",
    signals: [/\bsocial\b/i, /\bcommunity\b/i, /\bconnect\b.*\bpeople\b/i, /\btinder\s+for\b/i, /\bnetwork\b/i],
    explanation: "Social platforms face massive network effects — you need a unique hook to get initial users.",
  },
  {
    pattern: "EdTech / Learning Platform",
    signals: [/\blearn/i, /\beducat/i, /\bstud/i, /\btutor/i, /\bcourse\b/i, /\bteach/i],
    explanation: "EdTech is proven but competitive. Engagement and outcomes differentiate winners.",
  },
];

function detectPattern(idea: string): StartupPattern {
  let bestMatch: { pattern: string; count: number; explanation: string } | null = null;

  for (const candidate of PATTERN_CANDIDATES) {
    const matchCount = candidate.signals.filter(s => s.test(idea)).length;
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.count)) {
      bestMatch = { pattern: candidate.pattern, count: matchCount, explanation: candidate.explanation };
    }
  }

  if (!bestMatch) {
    return { pattern: "Unusual Concept", similarity: "None", explanation: "This idea doesn't match common startup patterns. Could be visionary — or completely unhinged." };
  }

  const similarity: "High" | "Medium" | "Low" = bestMatch.count >= 2 ? "High" : bestMatch.count === 1 ? "Medium" : "Low";
  return { pattern: bestMatch.pattern, similarity, explanation: bestMatch.explanation };
}

// --- Existing Idea Detection (Multi-Factor) ---

function detectExisting(idea: string, pattern: StartupPattern, originality: number): ExistingIdeaResult {
  let existenceScore = 0; // 0–10

  // Factor 1: Pattern similarity
  if (pattern.similarity === "High") existenceScore += 4;
  else if (pattern.similarity === "Medium") existenceScore += 2;

  // Factor 2: Low originality correlates with existing ideas
  if (originality <= 3) existenceScore += 3;
  else if (originality <= 5) existenceScore += 1;

  // Factor 3: Domain saturation
  const domain = detectDomain(idea);
  if (domain) {
    existenceScore += Math.round(domain.saturation * 3);
  }

  // Factor 4: Clone patterns are definitionally existing
  const cloneMatches = CLONE_PATTERNS.filter(p => p.pattern.test(idea));
  if (cloneMatches.length > 0) existenceScore += 2;

  if (existenceScore >= 7) {
    return { probability: "High", explanation: "This idea closely resembles multiple existing startups. Differentiation is essential." };
  }
  if (existenceScore >= 4) {
    return { probability: "Medium", explanation: "Similar concepts exist, but your specific angle might carve out a niche." };
  }
  return { probability: "Low", explanation: "This concept appears relatively novel — few direct competitors are obvious." };
}

// --- Pitch Generator (Template-based with variability from idea hash) ---

function generatePitch(idea: string, pattern: StartupPattern): string {
  const hash = hashIdea(idea);
  const lower = idea.toLowerCase();

  // Extract the "subject" from clone patterns
  for (const cp of CLONE_PATTERNS) {
    const match = idea.match(cp.pattern);
    if (match) {
      const subject = idea.substring(match.index! + match[0].length).trim() || "this niche";
      const templates = [
        `We're building the world's first on-demand ${subject} platform, connecting ${subject} providers with consumers through a seamless mobile experience. Think ${match[0].replace(/\s+for$/i, "")}, but for ${subject}.`,
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} is a $${(hash % 90) + 10}B market stuck in the stone age. We're modernizing it with a mobile-first platform that matches supply to demand in real time.`,
        `Every year, millions of people struggle with ${subject}. Our platform eliminates friction by creating a trusted, on-demand marketplace for ${subject} — starting in urban markets.`,
      ];
      return templates[hash % templates.length];
    }
  }

  if (AI_PATTERNS.some(p => p.test(idea))) {
    const subject = idea.replace(/\bai\s+(that|for|powered)\s*/gi, "").trim() || "complex tasks";
    const templates = [
      `Our proprietary AI engine ${subject.toLowerCase()} with unprecedented accuracy. Built on cutting-edge language models fine-tuned for this specific domain, we deliver results 10x faster than manual approaches.`,
      `We're training the first AI specifically designed to ${subject.toLowerCase()}. Unlike general-purpose AI, our models understand the nuance and context that matter.`,
    ];
    return templates[hash % templates.length];
  }

  if (pattern.pattern.includes("Marketplace")) {
    const subject = idea.replace(/\bmarketplace\s+for\b/gi, "").trim();
    return `We're creating a trusted peer-to-peer marketplace for ${subject}, eliminating middlemen and empowering both sides of the transaction. Our AI-powered matching ensures the right buyers find the right sellers.`;
  }

  if (pattern.pattern.includes("Subscription")) {
    return `Imagine a curated subscription experience built around ${idea.toLowerCase()}. Members get personalized recommendations, exclusive access, and a community of like-minded enthusiasts — all for less than a coffee a day.`;
  }

  // Generic fallback with deterministic variation
  const fallbacks = [
    `Imagine a world where ${idea.toLowerCase()} is effortless. That's the future we're building — a scalable, mobile-first solution for the $${(hash % 90) + 10}B market we've identified.`,
    `${idea.charAt(0).toUpperCase() + idea.slice(1)} is broken. We're fixing it with a platform that combines elegant UX, data-driven insights, and a passionate team that won't stop until we've redefined this space.`,
    `We're tackling ${idea.toLowerCase()} — a problem that affects millions daily. Our lean, iterative approach lets us ship fast, learn faster, and build the definitive solution in this space.`,
  ];
  return fallbacks[hash % fallbacks.length];
}

// --- Brutal Mode ---

const BRUTAL_COMMENTS = [
  "This sounds like something invented at 3am during a hackathon fueled by energy drinks.",
  "Your parents would pretend to be proud of this.",
  "A VC might fund this ironically — or accidentally.",
  "This idea has 'pivot within 6 months' written all over it.",
  "Bold of you to assume anyone asked for this.",
  "Somewhere, a Product Hunt graveyard has a headstone with this idea on it.",
  "This is the startup equivalent of a participation trophy.",
  "I've seen better ideas on a napkin — and the napkin was wet.",
  "Your co-founder will ghost you before the MVP is done.",
  "This has 'acquired for talent, not product' energy.",
];

export function makeBrutal(reason: string): string {
  // Deterministic selection based on reason content
  let hash = 0;
  for (let i = 0; i < reason.length; i++) {
    hash = ((hash << 5) - hash) + reason.charCodeAt(i);
    hash |= 0;
  }
  return reason + " " + BRUTAL_COMMENTS[Math.abs(hash) % BRUTAL_COMMENTS.length];
}

// --- Main Evaluation ---

export function evaluateIdea(idea: string): EvaluationResult {
  const { score: originality, reason: originalityReason } = scoreOriginality(idea);
  const { score: buzzwordDensity, reason: buzzwordReason } = scoreBuzzwords(idea);
  const { score: realism, reason: realismReason } = scoreRealism(idea);
  const { score: executionDifficulty, reason: executionReason } = scoreExecution(idea);

  const pattern = detectPattern(idea);
  const existingIdea = detectExisting(idea, pattern, originality);
  const pitch = generatePitch(idea, pattern);

  // Overall score: weighted average favoring originality and realism
  // Higher is better: originality (high good), buzzwords (low good), realism (high good), execution (low good)
  const overallScore = Math.max(1, Math.min(10, Math.round(
    (originality * 0.3) +
    ((10 - buzzwordDensity) * 0.15) +
    (realism * 0.35) +
    ((10 - executionDifficulty) * 0.2)
  )));

  return {
    scores: {
      originality, originalityReason,
      buzzwordDensity, buzzwordReason,
      realism, realismReason,
      executionDifficulty, executionReason,
    },
    pattern,
    existingIdea,
    pitch,
    overallScore,
  };
}

// --- History ---

export interface HistoryEntry {
  id: string;
  idea: string;
  overallScore: number;
  timestamp: number;
  result: EvaluationResult;
}

const HISTORY_KEY = "idea-evaluator-history";

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(idea: string, result: EvaluationResult): HistoryEntry {
  const history = getHistory();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    idea,
    overallScore: result.overallScore,
    timestamp: Date.now(),
    result,
  };
  history.unshift(entry);
  // Keep max 50
  if (history.length > 50) history.length = 50;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return entry;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// --- Constants ---

export const RANDOM_IDEAS = [
  "Uber for plants",
  "AI that argues with my parents",
  "Netflix for studying",
  "Marketplace for renting pets",
  "A blockchain-powered toothbrush",
  "SaaS platform for competitive napping",
  "Tinder for finding WiFi passwords",
  "An app that translates baby cries into Slack messages",
  "AI-powered horoscope generator for startups",
  "Delivery service for single socks",
  "A subscription box for existential dread",
  "Airbnb for parking your emotional baggage",
  "An algorithm that predicts when your code will break",
  "Marketplace for selling your unused New Year resolutions",
  "A tool that auto-generates excuses for missing meetings",
  "Chrome extension that replaces LinkedIn jargon with honest language",
  "A website that rates your startup name",
  "AI financial advisor for impulse buyers",
  "Autonomous drone delivery for forgotten lunches",
  "Social network exclusively for introverts",
];

export const EXAMPLE_IDEAS = [
  "Uber for plants",
  "AI that argues with my parents",
  "Netflix for studying",
  "Marketplace for renting pets",
];

export const ANALYSIS_MESSAGES = [
  "Analysing idea…",
  "Detecting startup buzzwords…",
  "Running originality algorithms…",
  "Checking domain saturation data…",
  "Estimating execution complexity…",
  "Consulting imaginary investors…",
  "Cross-referencing startup patterns…",
  "Calculating likelihood of getting funded anyway…",
];
