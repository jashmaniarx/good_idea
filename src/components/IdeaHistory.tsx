import { useState, useEffect } from "react";
import { History, Trash2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { getHistory, clearHistory, type HistoryEntry, type EvaluationResult } from "@/lib/scoring";
import { toast } from "sonner";

interface IdeaHistoryProps {
  onRestore: (idea: string, result: EvaluationResult) => void;
  refreshKey: number;
}

const IdeaHistory = ({ onRestore, refreshKey }: IdeaHistoryProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, [refreshKey]);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    toast.success("History cleared!");
  };

  if (history.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const displayed = expanded ? history : history.slice(0, 3);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Idea History</h3>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={13} />
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {displayed.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onRestore(entry.idea, entry.result)}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/30 bg-background transition-all text-left group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{entry.idea}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatTime(entry.timestamp)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-foreground">{entry.overallScore}<span className="text-muted-foreground text-xs font-normal">/10</span></span>
              <RotateCcw size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {history.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 mt-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : `Show ${history.length - 3} more`}
        </button>
      )}
    </div>
  );
};

export default IdeaHistory;
