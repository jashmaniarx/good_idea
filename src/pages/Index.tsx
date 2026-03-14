import { useState, useEffect, useRef } from "react";
import { Zap, Copy, Share2, Shuffle, ArrowRight, GitCompare, Lightbulb, Github, Codepen } from "lucide-react";
import { evaluateIdea, makeBrutal, RANDOM_IDEAS, EXAMPLE_IDEAS, ANALYSIS_MESSAGES, type EvaluationResult } from "@/lib/scoring";
import { toast } from "sonner";

const ScoreCard = ({ label, score, reason, brutal, delay, barClass }: {
  label: string; score: number; reason: string; brutal: boolean; delay: number; barClass: string;
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [fillWidth, setFillWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setDisplayScore(current);
      if (current >= score) clearInterval(interval);
    }, 60);
    const fillTimer = setTimeout(() => setFillWidth(score * 10), 100);
    return () => { clearInterval(interval); clearTimeout(fillTimer); };
  }, [visible, score]);

  if (!visible) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 card-hover" style={{ animation: `card-enter 0.4s ease-out forwards` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground letter-tight">{label}</h3>
        <span className="text-2xl font-bold text-foreground letter-tight">{displayScore}<span className="text-muted-foreground text-base font-normal">/10</span></span>
      </div>
      <div className="score-bar mb-3">
        <div className={barClass} style={{ width: `${fillWidth}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">{brutal ? makeBrutal(reason) : reason}</p>
    </div>
  );
};

const Index = () => {
  const [idea, setIdea] = useState("");
  const [idea2, setIdea2] = useState("");
  const [brutal, setBrutal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [result2, setResult2] = useState<EvaluationResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const barClass = brutal ? "score-bar-fill-warning" : "score-bar-fill";

  const handleAnalyze = () => {
    if (!idea.trim()) return;
    setResult(null);
    setResult2(null);
    setAnalyzing(true);

    let msgIndex = 0;
    setAnalysisMsg(ANALYSIS_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIndex++;
      if (msgIndex < ANALYSIS_MESSAGES.length) {
        setAnalysisMsg(ANALYSIS_MESSAGES[msgIndex]);
      }
    }, 400);

    setTimeout(() => {
      clearInterval(msgInterval);
      setAnalyzing(false);
      const r1 = evaluateIdea(idea);
      setResult(r1);
      if (compareMode && idea2.trim()) {
        setResult2(evaluateIdea(idea2));
      }
    }, 1800);
  };

  const handleRandom = () => {
    const randomIdea = RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)];
    setIdea(randomIdea);
    setResult(null);
    setResult2(null);
  };

  const handleExampleClick = (example: string) => {
    setIdea(example);
    setResult(null);
    setResult2(null);
    textareaRef.current?.focus();
  };

  const handleCopy = () => {
    if (!result) return;
    const s = result.scores;
    const text = `Is This a Good Idea? — "${idea}"\n\nOriginality: ${s.originality}/10 — ${s.originalityReason}\nBuzzword Density: ${s.buzzwordDensity}/10 — ${s.buzzwordReason}\nRealism: ${s.realism}/10 — ${s.realismReason}\nExecution Difficulty: ${s.executionDifficulty}/10 — ${s.executionReason}\n\nOverall: ${result.overallScore}/10\nPattern: ${result.pattern.pattern}\n\nPitch: ${result.pitch}`;
    navigator.clipboard.writeText(text);
    toast.success("Results copied to clipboard!");
  };

  const handleShare = () => {
    if (!result) return;
    const text = `I tested "${idea}" on "Is This a Good Idea?" and got ${result.overallScore}/10! 🤔`;
    if (navigator.share) {
      navigator.share({ title: "Is This a Good Idea?", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Share text copied to clipboard!");
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const renderResults = (res: EvaluationResult, ideaText: string) => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-muted-foreground text-sm">Overall Score</span>
          <span className="text-3xl font-bold text-foreground letter-tight">{res.overallScore}<span className="text-muted-foreground text-lg font-normal">/10</span></span>
        </div>
      </div>

      <ScoreCard label="Originality" score={res.scores.originality} reason={res.scores.originalityReason} brutal={brutal} delay={0} barClass={barClass} />
      <ScoreCard label="Buzzword Density" score={res.scores.buzzwordDensity} reason={res.scores.buzzwordReason} brutal={brutal} delay={100} barClass={barClass} />
      <ScoreCard label="Realism" score={res.scores.realism} reason={res.scores.realismReason} brutal={brutal} delay={200} barClass={barClass} />
      <ScoreCard label="Execution Difficulty" score={res.scores.executionDifficulty} reason={res.scores.executionReason} brutal={brutal} delay={300} barClass={barClass} />

      {/* Pattern Detection */}
      <div className="rounded-lg border border-border bg-card p-6 card-hover" style={{ animation: "card-enter 0.4s ease-out 0.5s forwards", opacity: 0 }}>
        <h3 className="font-semibold text-foreground letter-tight mb-3">Startup Pattern Detection</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-muted-foreground">Closest Pattern</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${brutal ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"}`}>{res.pattern.pattern}</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-muted-foreground">Similarity</span>
          <span className="text-sm text-foreground font-medium">{res.pattern.similarity}</span>
        </div>
        <p className="text-sm text-muted-foreground">{res.pattern.explanation}</p>
      </div>

      {/* Existing Idea */}
      <div className="rounded-lg border border-border bg-card p-6 card-hover" style={{ animation: "card-enter 0.4s ease-out 0.6s forwards", opacity: 0 }}>
        <h3 className="font-semibold text-foreground letter-tight mb-3">Existing Idea Probability</h3>
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            res.existingIdea.probability === "High" ? "bg-destructive/20 text-destructive" :
            res.existingIdea.probability === "Medium" ? "bg-warning/20 text-warning" :
            "bg-primary/20 text-primary"
          }`}>{res.existingIdea.probability}</span>
        </div>
        <p className="text-sm text-muted-foreground">{res.existingIdea.explanation}</p>
      </div>

      {/* Pitch */}
      <div className="rounded-lg border border-border bg-card p-6 card-hover" style={{ animation: "card-enter 0.4s ease-out 0.7s forwards", opacity: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground letter-tight">Startup Pitch Generator</h3>
          <button
            onClick={() => { navigator.clipboard.writeText(res.pitch); toast.success("Pitch copied!"); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-mono leading-relaxed italic">"{res.pitch}"</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen dot-grid flex flex-col">
      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lightbulb size={28} className={brutal ? "text-warning" : "text-primary"} />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground letter-tight">Is This a Good Idea?</h1>
        </div>
        <p className="text-muted-foreground text-lg">Honest evaluations for questionable concepts</p>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-16">
        {/* Brutal toggle */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setBrutal(!brutal)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all btn-press ${
              brutal
                ? "border-warning bg-warning/10 text-warning btn-glow-warning"
                : "border-border bg-card text-muted-foreground hover:text-foreground btn-glow"
            }`}
          >
            <Zap size={16} />
            <span className="text-sm font-medium">Brutal Honesty {brutal ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Input area */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(e) => { setIdea(e.target.value); autoResize(e.target); }}
            placeholder="Type your groundbreaking idea here…"
            className="w-full bg-transparent text-foreground text-lg placeholder:text-muted-foreground/50 resize-none outline-none min-h-[60px]"
            rows={2}
          />
          {compareMode && (
            <div className="border-t border-border mt-4 pt-4">
              <textarea
                value={idea2}
                onChange={(e) => { setIdea2(e.target.value); autoResize(e.target); }}
                placeholder="Type a second idea to compare…"
                className="w-full bg-transparent text-foreground text-lg placeholder:text-muted-foreground/50 resize-none outline-none min-h-[60px]"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Example ideas */}
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLE_IDEAS.map((ex) => (
            <button
              key={ex}
              onClick={() => handleExampleClick(ex)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all btn-press"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handleAnalyze}
            disabled={!idea.trim() || analyzing}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all btn-press disabled:opacity-40 disabled:cursor-not-allowed ${
              brutal
                ? "bg-warning text-warning-foreground btn-glow-warning"
                : "bg-primary text-primary-foreground btn-glow"
            }`}
          >
            <ArrowRight size={18} />
            Judge My Idea
          </button>
          <button
            onClick={handleRandom}
            className="flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-card text-foreground hover:border-primary/30 transition-all btn-press btn-glow"
          >
            <Shuffle size={18} />
            Random Idea
          </button>
          <button
            onClick={() => { setCompareMode(!compareMode); setResult(null); setResult2(null); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-all btn-press ${
              compareMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/30"
            } btn-glow`}
          >
            <GitCompare size={18} />
            Compare
          </button>
        </div>

        {/* Analyzing state */}
        {analyzing && (
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <div className={`progress-indeterminate mb-4 ${brutal ? "progress-indeterminate-warning" : ""}`} />
            <p className="text-sm text-muted-foreground text-center">{analysisMsg}</p>
          </div>
        )}

        {/* Results */}
        {result && !analyzing && (
          <div className="mb-8">
            {/* Action bar */}
            <div className="flex gap-3 mb-6">
              <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-all btn-press">
                <Copy size={14} /> Copy Results
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-all btn-press">
                <Share2 size={14} /> Share
              </button>
            </div>

            {compareMode && result2 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 letter-tight truncate">"{idea}"</h2>
                  {renderResults(result, idea)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 letter-tight truncate">"{idea2}"</h2>
                  {renderResults(result2, idea2)}
                </div>
              </div>
            ) : (
              renderResults(result, idea)
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <a href="https://github.com/jashmaniarx?tab=repositories" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github size={20} />
            </a>
            <a href="https://codepen.io/jashmaniarx" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Codepen size={20} />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">2026 © Jash Maniar | Is This a Good Idea?</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
