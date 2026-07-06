import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { CheckCircle2, Circle, ChevronRight, Lock } from "lucide-react";
import { SETUP_STEPS } from "@/lib/helpContent";

const STORAGE_KEY = "ocrp_help_setup_progress";

export default function SetupChecklist() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(JSON.parse(saved));
    } catch {}
  }, []);

  const toggle = (id) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visibleSteps = SETUP_STEPS.filter((s) => !s.adminOnly || isAdmin);
  const completedCount = visibleSteps.filter((s) => completed[s.id]).length;
  const progress = Math.round((completedCount / visibleSteps.length) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-cad-text mb-1">Setup Checklist</h2>
        <p className="text-sm text-cad-muted">Complete these steps to get your CAD system fully configured.</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-cad-muted">Progress</span>
          <span className="text-sm font-bold text-cad-accent">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-cad-surface-2/50 overflow-hidden">
          <div
            className="h-full bg-cad-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {visibleSteps.map((step) => {
          const isDone = !!completed[step.id];
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                isDone
                  ? "bg-green-500/5 border-green-500/20"
                  : "cad-card hover:border-cad-accent/30"
              }`}
            >
              <button
                onClick={() => toggle(step.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-cad-dim hover:text-cad-accent transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${isDone ? "text-cad-muted line-through" : "text-cad-text"}`}>
                    {step.title}
                  </h3>
                  {step.adminOnly && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                      <Lock className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-cad-dim mt-1">{step.description}</p>
              </div>
              {step.link && (
                <Link
                  to={step.link}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-cad-surface-2/50 text-cad-muted hover:text-cad-accent transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}