import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";

export default function AppLayout() {
  useCommunityBranding();
  return (
    <div className="mdt flex h-screen bg-mdt-bg text-mdt-text overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto mdt-scroll">
        <div className="p-3 lg:p-4 pt-14 lg:pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}