import React from "react";
import { Outlet } from "react-router-dom";
import CADRail from "./CADRail";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";

export default function CADLayout() {
  useCommunityBranding();

  return (
    <div className="mdt flex h-screen overflow-hidden bg-mdt-bg text-mdt-text">
      <CADRail />
      <main className="flex-1 min-w-0 overflow-auto mdt-scroll">
        <Outlet />
      </main>
    </div>
  );
}