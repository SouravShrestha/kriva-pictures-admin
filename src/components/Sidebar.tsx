"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import {
  IconGrid,
  IconImage,
  IconLayout,
  IconMessage,
  IconPackage,
  IconHelp,
  IconFolder,
  IconLogout,
  IconX,
} from "@/components/icons";

const nav = [
  { label: "Dashboard", href: "/", icon: IconGrid },
  { label: "Banners", section: true },
  { label: "Home Banner", href: "/banners/home", icon: IconImage },
  { label: "Footer Gallery", href: "/banners/footer", icon: IconImage },
  { label: "Gallery Banner", href: "/banners/gallery", icon: IconImage },
  { label: "Images", section: true },
  { label: "Section Images", href: "/images/sections", icon: IconLayout },
  { label: "Content", section: true },
  { label: "Testimonials", href: "/data/testimonials", icon: IconMessage },
  { label: "Packages", href: "/data/packages", icon: IconPackage },
  { label: "FAQs", href: "/data/faqs", icon: IconHelp },
  { label: "Gallery", href: "/data/gallery", icon: IconFolder },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-semibold shrink-0">
            K
          </div>
          <div className="flex-1">
            <div className="text-text font-semibold text-sm leading-tight">Kriva Pictures</div>
            <div className="text-text-subtle text-xs leading-tight">Admin</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden -mr-1 p-1.5 rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((item, i) =>
            "section" in item ? (
              <div key={i} className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                {item.label}
              </div>
            ) : (
              (() => {
                const Icon = item.icon;
                // Nested routes (e.g. /data/gallery/newborn/shailza) keep their
                // top-level entry highlighted; "/" only matches exactly.
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent text-white"
                        : "text-text-muted hover:bg-sidebar-hover hover:text-text"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })()
            )
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border flex items-center gap-2">
          <form action={logoutAction} className="flex-1">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-sidebar-hover hover:text-text transition-colors"
            >
              <IconLogout className="w-4 h-4" /> Logout
            </button>
          </form>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
