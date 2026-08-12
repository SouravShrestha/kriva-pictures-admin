import Link from "next/link";
import { env } from "@/lib/env";
import ExternalLinkButton from "@/components/ui/ExternalLinkButton";
import {
  IconImage,
  IconLayout,
  IconMessage,
  IconPackage,
  IconHelp,
  IconFolder,
  IconRocket,
} from "@/components/icons";

const sections = [
  { label: "Home Banner", href: "/banners/home", icon: IconImage, desc: "Manage home page slideshow images" },
  { label: "Footer Gallery", href: "/banners/footer", icon: IconImage, desc: "Manage footer gallery images" },
  { label: "Gallery Banner", href: "/banners/gallery", icon: IconImage, desc: "Manage gallery page banner images" },
  { label: "Section Images", href: "/images/sections", icon: IconLayout, desc: "Replace fixed section image slots" },
  { label: "Testimonials", href: "/data/testimonials", icon: IconMessage, desc: "Add, edit, and delete testimonials" },
  { label: "Packages", href: "/data/packages", icon: IconPackage, desc: "Manage photography packages" },
  { label: "FAQs", href: "/data/faqs", icon: IconHelp, desc: "Manage FAQ categories and questions" },
  { label: "Gallery", href: "/data/gallery", icon: IconFolder, desc: "Manage gallery categories and events" },
];

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            All changes go to TEST first. Use Promote to push to production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {env.siteTestUrl && <ExternalLinkButton href={env.siteTestUrl} label="View Test" />}
          {env.siteProdUrl && <ExternalLinkButton href={env.siteProdUrl} label="View Prod" variant="accent" />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-text">{s.label}</div>
              <div className="text-xs text-text-muted mt-1">{s.desc}</div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/promote"
        className="flex items-center gap-4 bg-accent hover:bg-accent-hover transition-colors text-white rounded-xl p-5 max-w-sm"
      >
        <span className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <IconRocket className="w-5 h-5" />
        </span>
        <div>
          <div className="font-semibold text-sm">Promote to Production</div>
          <div className="text-xs text-white/70 mt-0.5">Push tested changes to the live site</div>
        </div>
      </Link>
    </div>
  );
}
