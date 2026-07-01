import React from "react";
import { Link } from "react-router-dom";
import { Radio, ArrowLeft, Construction } from "lucide-react";

export default function CAD() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400" />
            CAD System
          </h1>
          <p className="text-slate-400 text-sm mt-1">Computer-Aided Dispatch</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">CAD System — Under Construction</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          The Computer-Aided Dispatch system is being built. It will support PD, Fire & EMS,
          and Civilian dispatch with full admin-configurable incident types and unit statuses.
        </p>
      </div>
    </div>
  );
}