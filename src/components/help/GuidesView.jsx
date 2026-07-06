import React, { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { HELP_CATEGORIES } from "@/lib/helpContent";

export default function GuidesView({ initialCategory }) {
  const [expanded, setExpanded] = useState(initialCategory || HELP_CATEGORIES[0].id);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? HELP_CATEGORIES.map((c) => ({
        ...c,
        articles: c.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.summary.toLowerCase().includes(query.toLowerCase()) ||
            a.tags.some((t) => t.includes(query.toLowerCase()))
        ),
      })).filter((c) => c.articles.length > 0)
    : HELP_CATEGORIES;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-cad-text mb-1">Knowledge Base</h2>
        <p className="text-sm text-cad-muted">Browse guides by category or search for a specific topic.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cad-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all guides..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cad-surface-2/50 border border-cad-border/50 text-sm text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent/50"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-cad-dim py-8">No guides found for "{query}"</p>
        )}
        {filtered.map((cat) => (
          <div key={cat.id} className="cad-card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-cad-surface-2/30 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                <cat.icon className={`w-5 h-5 ${cat.color}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-sm font-bold text-cad-text">{cat.title}</h3>
                <p className="text-xs text-cad-dim">{cat.articles.length} guides</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-cad-dim transition-transform flex-shrink-0 ${expanded === cat.id ? "rotate-180" : ""}`} />
            </button>
            {expanded === cat.id && (
              <div className="border-t border-cad-border/30 divide-y divide-cad-border/20">
                {cat.articles.map((article) => (
                  <div key={article.id} className="p-4">
                    <h4 className="text-sm font-semibold text-cad-text mb-1">{article.title}</h4>
                    <p className="text-xs text-cad-muted mb-3">{article.summary}</p>
                    <ol className="space-y-2">
                      {article.steps.map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-cad-muted">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cad-accent/10 text-cad-accent text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {article.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-cad-surface-2/50 text-cad-dim border border-cad-border/30">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}