import React from "react";

export default function RetroFrame({ title, children, className = "", actions = null }) {
  return (
    <div className={`retro-frame ${className}`}>
      {title && (
        <div className="retro-frame-header flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-cad-dim">&brvbar;</span>
            <span>{title}</span>
            <span className="text-cad-dim">&brvbar;</span>
          </span>
          {actions}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}