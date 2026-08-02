import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";

export default function AIHelpAssistant() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "How do I clock in and start my shift?",
    "How do I create a BOLO?",
    "What are the keyboard shortcuts?",
    "How does the AI narrative work?",
    "How do I link my Discord account?",
  ];

  const ask = async (q) => {
    const questionText = q || question;
    if (!questionText.trim() || loading) return;
    setLoading(true);
    setQuestion("");
    const userMsg = { role: "user", content: questionText };
    setHistory((h) => [...h, userMsg]);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful assistant for OCRP Hub, a FiveM CAD (Computer-Aided Dispatch) and Roster management system. Answer the user's question clearly and concisely. Use bullet points or numbered steps when appropriate.

System features:
- Two modules: Roster System (departments, members, shifts, LOA, documents) and CAD System (MDT, dispatch, records, civilians)
- MDT views: Dispatch (F1), Lookups (F2), Records (F3), My Call (F4), Groups (F5)
- Status shortcuts: 1=Available, 2=Busy, 3=On Call, 4=Unavailable, P=Panic
- Civilian suite: characters (max 5), DMV licenses, vehicles, firearms
- EMS: Patient Care Reports with AI narrative generation, tabbed workflow
- Fire: fire reports with alarm levels and apparatus tracking
- Police: 13 report types, charges auto-populate from penal codes
- Admin panel: community settings, personnel management, penal codes, Discord sync
- Discord integration: role-based department access, verified linking via Bot DM or OAuth
- Interface: a single Enterprise Graphite theme across the whole CAD
- Real-time WebSocket updates for calls and units

User question: ${questionText}`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
          },
        },
      });
      setHistory((h) => [...h, { role: "assistant", content: res.answer }]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: "assistant", content: "Sorry, I couldn't process that request. Please try the Guides or FAQ tabs for help." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-cad-accent/15 items-center justify-center mb-3">
          <Sparkles className="w-7 h-7 text-cad-accent" />
        </div>
        <h2 className="text-xl font-bold text-cad-text mb-1">AI Help Assistant</h2>
        <p className="text-sm text-cad-muted">Ask anything about the CAD system and get an instant answer.</p>
      </div>

      {history.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-left p-3 rounded-xl cad-card cad-card-hover text-sm text-cad-muted hover:text-cad-text"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 mb-4">
        {history.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-cad-accent/15 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-cad-accent" />
              </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-cad-accent text-white rounded-br-sm"
                : "cad-card text-cad-muted rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-cad-surface-3 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-cad-muted" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-cad-accent/15 flex items-center justify-center flex-shrink-0 mt-1">
              <Loader2 className="w-4 h-4 text-cad-accent animate-spin" />
            </div>
            <div className="cad-card p-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-cad-dim animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-cad-dim animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-cad-dim animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-cad-bg-solid/80 backdrop-blur-sm p-2 -mx-2 rounded-xl">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Type your question..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-cad-surface-2/50 border border-cad-border/50 text-sm text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent/50"
        />
        <button
          onClick={() => ask()}
          disabled={!question.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-cad-accent text-white hover:bg-cad-accent/90 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          Ask
        </button>
      </div>
    </div>
  );
}