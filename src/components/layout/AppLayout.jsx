import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { useCadTheme } from "@/hooks/useCadTheme";

export default function AppLayout() {
  useCommunityBranding();
  useCadTheme();
  return (
    <div className="flex h-screen overflow-hidden cad-gradient-bg cad-font">
      <Sidebar />
      <main className="flex-1 overflow-y-auto cad-scroll">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}