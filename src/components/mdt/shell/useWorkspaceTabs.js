import { useState, useCallback } from "react";

let nextId = 1;

/**
 * Browser-style workspace tabs. Tabs are independent of the toolbar:
 * - toolbar / menu navigation changes the ACTIVE tab's view (never opens a tab)
 * - only the "+" button opens a new tab
 */
export default function useWorkspaceTabs(initialView) {
  const [tabs, setTabs] = useState([{ id: nextId++, view: initialView }]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];
  const activeView = activeTab?.view || initialView;

  // Change the view shown in the current tab
  const setView = useCallback((view) => {
    setTabs((ts) => ts.map((t) => (t.id === activeId ? { ...t, view } : t)));
  }, [activeId]);

  // Open a brand new tab (only from the "+" control)
  const addTab = useCallback((view) => {
    const id = nextId++;
    setTabs((ts) => [...ts, { id, view: view || initialView }]);
    setActiveId(id);
  }, [initialView]);

  const closeTab = useCallback((id) => {
    setTabs((ts) => {
      if (ts.length <= 1) return ts;
      const idx = ts.findIndex((t) => t.id === id);
      const next = ts.filter((t) => t.id !== id);
      setActiveId((cur) => (cur === id ? next[Math.max(0, idx - 1)].id : cur));
      return next;
    });
  }, []);

  return { tabs, activeId, activeView, setActiveId, setView, addTab, closeTab };
}