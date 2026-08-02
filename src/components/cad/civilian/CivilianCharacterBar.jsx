import React from "react";
import { ConsolePanel, ConsoleBtn, ConsoleSelect } from "@/components/cad/console/ConsoleUI";
import { UserPlus, Pencil, FileText, Car, Phone } from "lucide-react";

export default function CivilianCharacterBar({ characters, selectedChar, onSelect, panel, setPanel, onNew, onEdit, on911 }) {
  return (
    <ConsolePanel title="Character" scroll={false}>
      <div className="p-3 space-y-3">
        <ConsoleSelect
          value={selectedChar?.id || ""}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="Select a character…"
          options={characters.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <ConsoleBtn variant="primary" icon={UserPlus} onClick={onNew}>New Character</ConsoleBtn>
          {selectedChar && <ConsoleBtn icon={Pencil} onClick={onEdit}>Edit</ConsoleBtn>}
          {selectedChar && (
            <ConsoleBtn icon={FileText} variant={panel === "records" ? "active" : "default"} onClick={() => setPanel(panel === "records" ? null : "records")}>Records</ConsoleBtn>
          )}
          {selectedChar && (
            <ConsoleBtn icon={Car} variant={panel === "dmv" ? "active" : "default"} onClick={() => setPanel(panel === "dmv" ? null : "dmv")}>DMV</ConsoleBtn>
          )}
          {selectedChar && (
            <ConsoleBtn icon={Phone} variant="danger" onClick={on911}>Call 911</ConsoleBtn>
          )}
        </div>
      </div>
    </ConsolePanel>
  );
}