import React from "react";

/** Classic desktop menu strip. */
export default function MenuStrip({ onSearch }) {
  return (
    <div className="flex items-center gap-1 h-9 px-2 bg-mdt-bg border-b border-mdt-line flex-shrink-0">
      {["File", "Edit", "View", "Window", "Help"].map((m) => (
        <button key={m} className="h-6 px-2.5 text-[13px] text-mdt-text hover:bg-mdt-surface-3">
          {m}
        </button>
      ))}
      <button onClick={onSearch} className="h-6 px-2.5 text-[13px] text-mdt-text bg-mdt-surface-3 hover:bg-mdt-surface-4">
        Search
      </button>
    </div>
  );
}