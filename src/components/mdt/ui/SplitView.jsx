import React from "react";

/**
 * Master/detail workspace layout. Detail collapses away when nothing is selected,
 * so the master list always uses the full width instead of leaving dead space.
 */
export default function SplitView({ master, detail, detailWidth = 420, showDetail }) {
  return (
    <div className="flex flex-1 min-h-0 gap-px bg-mdt-line">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">{master}</div>
      {showDetail && (
        <div className="flex flex-col min-h-0 flex-shrink-0" style={{ width: detailWidth }}>
          {detail}
        </div>
      )}
    </div>
  );
}