// Rule-based scoring engine for idea evaluation

const UBER_PATTERNS = ["uber for", "airbnb for", "tinder for", "amazon for", "netflix for", "spotify for", "doordash for"];
const AI_PATTERNS = ["ai that", "ai for", "ai-powered", "ai powered", "chatgpt for", "gpt for"];
const PLATFORM_PATTERNS = ["platform for", "marketplace for", "app for", "service for", "tool for"];
const BUZZWORDS = ["ai", "platform", "saas", "marketplace", "blockchain", "web3", "disrupt", "automation", "metaverse", "crypto", "nft", "machine learning", "deep learning", "cloud", "scalable", "synergy", "ecosystem", "paradigm", "leverage", "innovate", "revolutionize", "decentralized", "tokenize"];
const UNREALISTIC_WORDS = ["teleport", "time travel", "immortal", "infinite", "magic", "flying", "invisible", "mind reading", "telepathy"];
const HARD_LOGISTICS = ["delivery", "logistics", "shipping", "fleet", "warehouse", "supply chain", "infrastructure", "hardware", "manufacturing", "satellite"];
const SIMPLE_WORDS = ["app", "website", "tool", "calculator", "tracker", "timer", "list", "reminder", "note"];

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

function countMatches(text: string, patterns: string[]): number {
  return patterns.filter(p => text.includes(p)).length;
}

function scoreOriginality(idea: string): { score: number; reason: string } {
  const lower = idea.toLowerCase();
  const uberMatch = UBER_PATTERNS.some(p => lower.includes(p));
  const aiMatch = AI_PATTERNS.some(p => lower.includes(p));
  const platformMatch = PLATFORM_PATTERNS.some(p => lower.includes(p));
  const wordCount = idea.split(/\s+/).length;

  let score = 6;
  const reasons: string[] = [];

  if (uberMatch) { score -= 3; reasons.push("follows the common 'X for Y' startup pattern"); }
  if (aiMatch) { score -= 2; reasons.push("uses the overused 'AI that does X' formula"); }
  if (platformMatch) { score -= 2; reasons.push("generic platform concept"); }
  if (wordCount > 10) { score += 1; reasons.push("has some specificity"); }
  if (wordCount > 20) { score += 1; reasons.push("unusually detailed"); }
  if (!uberMatch && !aiMatch && !platformMatch && wordCount > 3) { score += 2; reasons.push("doesn't follow common startup templates"); }

  score = Math.max(1, Math.min(10, score));
  const reason = reasons.length > 0 ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + "." : "Reasonably original concept.";
  return { score, reason };
}

function scoreBuzzwords(idea: string): { score: number; reason: string } {
  const lower = idea.toLowerCase();
  const matches = BUZZWORDS.filter(b => lower.includes(b));
  const count = matches.length;

  let score = Math.min(10, count * 2);
  let reason: string;

  if (count === 0) { reason = "Refreshingly buzzword-free."; }
  else if (count <= 2) { reason = `Contains "${matches[0]}" — light buzzword usage.`; }
  else if (count <= 4) { reason = `Loaded with buzzwords like "${matches.slice(0, 2).join('", "')}".`; }
  else { reason = `A buzzword bonanza — investors would love the pitch deck.`; }

  return { score, reason };
}

function scoreRealism(idea: string): { score: number; reason: string } {
  const lower = idea.toLowerCase();
  const unrealistic = UNREALISTIC_WORDS.some(w => lower.includes(w));
  const uberMatch = UBER_PATTERNS.some(p => lower.includes(p));
  const simpleMatch = SIMPLE_WORDS.some(w => lower.includes(w));

  let score = 6;
  const reasons: string[] = [];

  if (unrealistic) { score -= 4; reasons.push("involves concepts that defy physics or logic"); }
  if (uberMatch) { score -= 1; reasons.push("on-demand models have mixed track records"); }
  if (simpleMatch) { score += 2; reasons.push("seems technically feasible"); }
  if (lower.includes("pet") || lower.includes("animal")) { score -= 1; reasons.push("animals add unpredictability"); }
  if (lower.includes("rent")) { score -= 1; reasons.push("rental models have liability issues"); }

  score = Math.max(1, Math.min(10, score));
  const reason = reasons.length > 0 ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + "." : "Seems plausible enough.";
  return { score, reason };
}

function scoreExecution(idea: string): { score: number; reason: string } {
  const lower = idea.toLowerCase();
  const hardMatches = HARD_LOGISTICS.filter(w => lower.includes(w));
  const simpleMatches = SIMPLE_WORDS.filter(w => lower.includes(w));
  const uberMatch = UBER_PATTERNS.some(p => lower.includes(p));

  let score = 5;
  const reasons: string[] = [];

  score += hardMatches.length * 2;
  if (hardMatches.length > 0) reasons.push(`involves ${hardMatches[0]} — complex operations`);
  if (uberMatch) { score += 2; reasons.push("two-sided marketplace requires massive coordination"); }
  if (simpleMatches.length > 0) { score -= 2; reasons.push("relatively straightforward to build"); }

  score = Math.max(1, Math.min(10, score));
  const reason = reasons.length > 0 ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) + "." : "Moderate complexity.";
  return { score, reason };
}

function detectPattern(idea: string): StartupPattern {
  const lower = idea.toLowerCase();

  if (UBER_PATTERNS.some(p => lower.includes(p)))
    return { pattern: "On-Demand Platform", similarity: "High", explanation: "This idea follows the typical 'Uber for X' startup model." };
  if (lower.includes("marketplace") || lower.includes("rent"))
    return { pattern: "Marketplace Platform", similarity: "High", explanation: "Classic two-sided marketplace connecting buyers and sellers." };
  if (AI_PATTERNS.some(p => lower.includes(p)))
    return { pattern: "AI Assistant", similarity: "High", explanation: "Follows the 'AI that does X for you' pattern." };
  if (lower.includes("subscription") || lower.includes("netflix") || lower.includes("spotify"))
    return { pattern: "Subscription Service", similarity: "Medium", explanation: "Subscription-based content or service model." };
  if (lower.includes("delivery") || lower.includes("shipping"))
    return { pattern: "Delivery Service", similarity: "Medium", explanation: "Logistics and delivery-focused business model." };
  if (SIMPLE_WORDS.some(w => lower.includes(w)))
    return { pattern: "Productivity Tool", similarity: "Medium", explanation: "Utility-style tool for everyday tasks." };

  return { pattern: "Unusual Concept", similarity: "None", explanation: "This idea doesn't match common startup models. Could be genius, could be madness." };
}

function detectExisting(idea: string, pattern: StartupPattern): ExistingIdeaResult {
  if (pattern.similarity === "High")
    return { probability: "High", explanation: "This idea resembles many existing startups in the same space." };
  if (pattern.similarity === "Medium")
    return { probability: "Medium", explanation: "Similar concepts exist but your angle might be different." };
  return { probability: "Low", explanation: "This concept appears unusual compared to common startup patterns." };
}

function generatePitch(idea: string): string {
  const lower = idea.toLowerCase();
  const pitches: string[] = [];

  if (UBER_PATTERNS.some(p => lower.includes(p))) {
    const subject = idea.replace(/uber for|airbnb for|tinder for/gi, "").trim();
    pitches.push(`We're building the world's first on-demand ${subject} logistics platform, connecting ${subject} enthusiasts with a distributed network of providers. Think Uber, but for ${subject}.`);
  } else if (AI_PATTERNS.some(p => lower.includes(p))) {
    const subject = idea.replace(/ai that|ai for|ai-powered/gi, "").trim();
    pitches.push(`Introducing an AI-powered solution that ${subject}. Our proprietary machine learning algorithms understand context, nuance, and deliver results 10x faster than doing it yourself.`);
  } else if (lower.includes("marketplace")) {
    pitches.push(`We're disrupting the ${idea.replace(/marketplace for/gi, "").trim()} industry with a peer-to-peer marketplace that eliminates middlemen and creates value for both sides of the transaction.`);
  } else {
    pitches.push(`Imagine a world where ${idea.toLowerCase()}. That's the future we're building. Our team of passionate engineers is creating a scalable solution that will change the way people think about ${idea.split(" ").slice(-2).join(" ")}.`);
  }

  return pitches[0];
}

export function makeBrutal(reason: string): string {
  const brutals = [
    "This sounds like something invented at 3am during a hackathon.",
    "Your parents would pretend to be proud of this.",
    "A VC might fund this ironically.",
    "This idea has 'pivot within 6 months' written all over it.",
    "Bold of you to assume anyone asked for this.",
  ];
  return reason + " " + brutals[Math.floor(Math.random() * brutals.length)];
}

export function evaluateIdea(idea: string): EvaluationResult {
  const { score: originality, reason: originalityReason } = scoreOriginality(idea);
  const { score: buzzwordDensity, reason: buzzwordReason } = scoreBuzzwords(idea);
  const { score: realism, reason: realismReason } = scoreRealism(idea);
  const { score: executionDifficulty, reason: executionReason } = scoreExecution(idea);

  const pattern = detectPattern(idea);
  const existingIdea = detectExisting(idea, pattern);
  const pitch = generatePitch(idea);
  const overallScore = Math.round((originality + (10 - buzzwordDensity) + realism + (10 - executionDifficulty)) / 4);

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
  "Consulting imaginary investors…",
  "Calculating likelihood of getting funded anyway…",
];
