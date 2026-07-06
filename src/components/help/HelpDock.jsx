import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { HelpCircle, X, Search, ChevronRight, Lightbulb, Sparkles, Send } from "lucide-react";
import { TIPS_AND_TRICKS, HELP_CATEGORIES } from "@/lib/helpContent";

export default function HelpDock() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [mode, setMode] = useState("search");
  const navigate = useNavigate();

  const searchResults = query.trim()
    ? HELP_CATEGORIES.flatMap((c) =>
        c.articles
          .filter(
            (a) =>
              a.title.toLowerCase().includes(query.toLowerCase()) ||
              a.summary.toLowerCase().includes(query.toLowerCase()) ||
              a.tags.some((t) => t.includes(query.toLowerCase()))
          )
          .map((a) => ({ ...a, category: c.title, categoryId: c.id }))
      )
    : [];

  const topTips = TIPS_AND_TRICKS.slice(0, 4);

  const handleAskAI = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a help assistant for RPCommand, a FiveM CAD/Roster management system. Answer this question concisely (max 3 paragraphs). The system has: MDT with Dispatch/Lookups/Records/MyCall/Groups views, keybinds (F1-F5 for views, 1-4 for status, P for panic), Civilian suite (characters, DMV, vehicles, firearms), EMS (PCRs with AI narratives), Fire dashboards, Admin panel (community settings, personnel, penal codes), and Discord integration for role-based access. Question: ${aiQuestion}`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            related_topic: { type: "string" },
          },
        },
      });
      setAiAnswer(res.answer);
    } catch {
      setAiAnswer("Sorry, I couldn't process that right now. Try the search tab or open the full Help Center.");
    } finally {
      setAiLoading(false);
    }
  };

  const goToArticle = (categoryId) => {
    setOpen(false);
    navigate(`/help?cat=${categoryId}`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-cad-accent text-white shadow-lg shadow-cad-accent/30 hover:scale-105 transition-all cad-font"
        title="Help & Tips"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Help</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] max-h-[70vh] flex flex-col cad-glass-strong border border-cad-border/50 rounded-2xl shadow-2xl cad-font overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-cad-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cad-accent/15 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-cad-accent" />
          </div>
          <span className="font-bold text-cad-text">Quick Help</span>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-cad-surface-2/50 text-cad-muted hover:text-cad-text">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-1 p-2 border-b border-cad-border/50">
        <button
          onClick={() => setMode("search")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === "search" ? "bg-cad-accent/15 text-cad-accent" : "text-cad-muted hover:text-cad-text hover:bg-cad-surface-2/40"}`}
        >
          <Search className="w-3.5 h-3.5" /> Search
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === "ai" ? "bg-cad-accent/15 text-cad-accent" : "text-cad-muted hover:text-cad-text hover:bg-cad-surface-2/40"}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Ask AI
        </button>
        <button
          onClick={() => setMode("tips")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === "tips" ? "bg-cad-accent/15 text-cad-accent" : "text-cad-muted hover:text-cad-text hover:bg-cad-surface-2/40"}`}
        >
          <Lightbulb className="w-3.5 h-3.5" /> Tips
        </button>
      </div>

      <div className="flex-1 overflow-y-auto cad-scroll p-3">
        {mode === "search" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cad-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guides..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-cad-surface-2/50 border border-cad-border/50 text-sm text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent/50"
              />
            </div>
            {query.trim() === "" ? (
              HELP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => goToArticle(cat.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-cad-surface-2/40 transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cad-text truncate">{cat.title}</p>
                    <p className="text-xs text-cad-dim">{cat.articles.length} guides</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cad-dim ml-auto flex-shrink-0" />
                </button>
              ))
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-cad-dim py-8">No results for "{query}"</p>
            ) : (
              searchResults.map((a) => (
                <button
                  key={a.id}
                  onClick={() => goToArticle(a.categoryId)}
                  className="w-full p-2.5 rounded-lg hover:bg-cad-surface-2/40 transition-all text-left border border-cad-border/30"
                >
                  <p className="text-sm font-medium text-cad-text">{a.title}</p>
                  <p className="text-xs text-cad-dim mt-0.5 line-clamp-2">{a.summary}</p>
                  <span className="text-[10px] text-cad-accent mt-1">{a.category}</span>
                </button>
              ))
            )}
          </div>
        )}

        {mode === "ai" && (
          <div className="space-y-3">
            <p className="text-xs text-cad-muted">Ask a question about the CAD system and get an instant answer.</p>
            <textarea
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="e.g. How do I clock in?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-cad-surface-2/50 border border-cad-border/50 text-sm text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent/50 resize-none"
            />
            <button
              onClick={handleAskAI}
              disabled={!aiQuestion.trim() || aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cad-accent text-white text-sm font-medium hover:bg-cad-accent/90 disabled:opacity-50 transition-all"
            >
              {aiLoading ? "Thinking..." : <><Send className="w-3.5 h-3.5" /> Ask</>}
            </button>
            {aiAnswer && (
              <div className="p-3 rounded-lg bg-cad-surface-2/30 border border-cad-border/30 text-sm text-cad-muted leading-relaxed whitespace-pre-wrap">
                {aiAnswer}
              </div>
            )}
          </div>
        )}

        {mode === "tips" && (
          <div className="space-y-2">
            {topTips.map((tip) => (
              <div key={tip.id} className="p-2.5 rounded-lg bg-cad-surface-2/30 border border-cad-border/30">
                <div className="flex items-start gap-2">
                  <tip.icon className="w-4 h-4 text-cad-accent flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cad-text">{tip.title}</p>
                    <p className="text-xs text-cad-dim mt-0.5">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => { setOpen(false); navigate("/help?tab=tips"); }}
              className="w-full text-center py-2 text-xs text-cad-accent hover:underline"
            >
              View all tips →
            </button>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-cad-border/50">
        <button
          onClick={() => { setOpen(false); navigate("/help"); }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-cad-muted hover:text-cad-accent hover:bg-cad-accent/10 transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" /> Open Full Help Center
        </button>
      </div>
    </div>
  );
}