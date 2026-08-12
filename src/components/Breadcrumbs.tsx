import Link from "next/link";
import { IconChevronRight } from "@/components/icons";

export interface Crumb {
  label: string;
  href?: string;
}

/** Trail above a PageHeader for the nested gallery routes. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex items-center gap-1.5 text-xs text-text-subtle flex-wrap">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-text transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "text-text-muted" : undefined} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <IconChevronRight className="w-3 h-3 shrink-0" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
