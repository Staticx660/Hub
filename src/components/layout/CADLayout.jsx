import React from "react";
import { Outlet } from "react-router-dom";
import CADSidebar from "./CADSidebar";
import RetroCADShell from "./RetroCADShell";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { useCadTheme } from "@/hooks/useCadTheme";

export default function CADLayout() {
  useCommunityBranding();
  const { theme } = useCadTheme();

  if (theme === "retro") return <RetroCADShell />;

  return (
    <div className="flex h-screen overflow-hidden cad-gradient-bg cad-font">
      <CADSidebar />
      <main className="flex-1 overflow-y-auto cad-scroll">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}