import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/** Reorder a department's ranks. Saving renumbers levels (top = highest)
 *  and re-syncs every member's rank_level so the roster sorts correctly. */
export default function RankOrderManager({ department, onSaved }) {
  const [ranks, setRanks] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setRanks([...(department.ranks || [])].sort((a, b) => (b.level || 0) - (a.level || 0)));
    setDirty(false);
  }, [department]);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= ranks.length) return;
    const next = [...ranks];
    [next[i], next[j]] = [next[j], next[i]];
    setRanks(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const renumbered = ranks.map((r, i) => ({ ...r, level: ranks.length - i }));
      await base44.entities.Department.update(department.id, { ranks: renumbered });
      const members = await base44.entities.RosterMember.filter({ department_id: department.id });
      const updates = members
        .map((m) => {
          const r = renumbered.find((x) => x.name === m.rank);
          return r && r.level !== m.rank_level ? { id: m.id, rank_level: r.level } : null;
        })
        .filter(Boolean);
      if (updates.length) await base44.entities.RosterMember.bulkUpdate(updates);
      setDirty(false);
      toast({ title: "Rank order saved" });
      onSaved?.();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (ranks.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white">Rank Order</h2>
          <p className="text-xs text-slate-500">Top rank outranks those below — reflected across the roster</p>
        </div>
        {dirty && <Button size="sm" onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Saving…" : "Save Order"}</Button>}
      </div>
      <div className="divide-y divide-slate-800/50">
        {ranks.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3 px-5 py-2">
            <GripVertical className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs font-mono text-slate-500 w-6">{ranks.length - i}</span>
            {r.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />}
            <span className="text-sm text-slate-300 flex-1">{r.name}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => move(i, 1)} disabled={i === ranks.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}