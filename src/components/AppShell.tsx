"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { IconMenu } from "@/components/icons";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text transition-colors"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
              K
            </div>
            <span className="text-text font-semibold text-sm">Kriva Pictures</span>
          </div>
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
