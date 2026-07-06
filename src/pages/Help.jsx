import React, { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Home, BookOpen, CheckSquare, Lightbulb, Keyboard, HelpCircle, Sparkles, ChevronLeft
} from "lucide-react";
import GuidesView from "@/components/help/GuidesView";
import SetupChecklist from "@/components/help/SetupChecklist";
import AIHelpAssistant from "@/components/help/AIHelpAssistant";
import { TIPS_AND_TRICKS, KEYBOARD_SHORTCUTS, FAQ_ITEMS } from "@/lib/helpContent";

const TABS = [
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "setup", label: "Setup", icon: CheckSquare },
  { id: "tips", label: "Tips & Tricks", icon: Lightbulb },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
];

export default function Help() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get("tab") || "guides";
  const initialCategory = params.get("cat");

  const setTab = (tab) => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    if (tab !== "guides") next.delete("cat");
    setParams(next);
  };

  const tipsByCategory = useMemo(() => {
    const groups = {};
    TIPS_AND_TRICKS.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, []);

  return (
    <div className="min-h-screen cad-gradient-bg cad-font flex flex-col">
      <header className="border-b border-cad-border/50 cad-glass sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-cad-surface-2/50 text-cad-muted hover:text-cad-text transition-all">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cad-accent/15 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-cad-accent" />
              </div>
              <h1 className="font-bold text-cad-text text-lg">Help Center</h1>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-cad-muted hover:text-cad-text transition-colors">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      <div className="sticky top-[57px] z-20 border-b border-cad-border/50 cad-glass">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto cad-scroll py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-cad-accent/15 text-cad-accent border border-cad-accent/20"
                    : "text-cad-muted hover:text-cad-text hover:bg-cad-surface-2/40 border border-transparent"
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-8">
        {activeTab === "guides" && <GuidesView initialCategory={initialCategory} />}
        {activeTab === "setup" && <SetupChecklist />}
        {activeTab === "tips" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-cad-text mb-1">Tips & Tricks</h2>
              <p className="text-sm text-cad-muted">Pro tips to help you get the most out of the CAD system.</p>
            </div>
            {Object.entries(tipsByCategory).map(([category, tips]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-bold text-cad-accent uppercase tracking-wider mb-3">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tips.map((tip) => (
                    <div key={tip.id} className="cad-card p-4 cad-card-hover">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cad-accent/10 flex items-center justify-center flex-shrink-0">
                          <tip.icon className="w-4 h-4 text-cad-accent" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-cad-text">{tip.title}</h4>
                          <p className="text-xs text-cad-muted mt-1 leading-relaxed">{tip.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "shortcuts" && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-cad-text mb-1">Keyboard Shortcuts</h2>
              <p className="text-sm text-cad-muted">These work inside the MDT when you're not typing in a field.</p>
              <Link to="/keybinds" className="inline-block mt-2 text-xs text-cad-accent hover:underline">
                Customize your keybinds →
              </Link>
            </div>
            <div className="cad-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cad-border/50 bg-cad-surface-2/30">
                    <th className="text-left p-3 text-xs font-bold text-cad-muted uppercase tracking-wider">Action</th>
                    <th className="text-left p-3 text-xs font-bold text-cad-muted uppercase tracking-wider">Key</th>
                    <th className="text-left p-3 text-xs font-bold text-cad-muted uppercase tracking-wider hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cad-border/20">
                  {KEYBOARD_SHORTCUTS.map((s) => (
                    <tr key={s.action} className="hover:bg-cad-surface-2/20 transition-colors">
                      <td className="p-3 text-sm text-cad-text font-medium">{s.action}</td>
                      <td className="p-3">
                        <kbd className="inline-block px-2.5 py-1 rounded-lg bg-cad-surface-3 border border-cad-border/50 text-xs font-mono font-bold text-cad-accent">
                          {s.keys}
                        </kbd>
                      </td>
                      <td className="p-3 text-xs text-cad-muted hidden sm:table-cell">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "faq" && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-cad-text mb-1">Frequently Asked Questions</h2>
              <p className="text-sm text-cad-muted">Quick answers to common questions about the CAD system.</p>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <details key={i} className="cad-card overflow-hidden group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="text-sm font-semibold text-cad-text">{item.question}</span>
                    <ChevronLeft className="w-4 h-4 text-cad-dim -rotate-90 group-open:rotate-90 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-cad-muted leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
        {activeTab === "ai" && <AIHelpAssistant />}
      </main>
    </div>
  );
}