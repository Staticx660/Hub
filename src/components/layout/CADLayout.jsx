import React from "react";
import { Outlet } from "react-router-dom";
import CADSidebar from "./CADSidebar";

export default function CADLayout() {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <CADSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}