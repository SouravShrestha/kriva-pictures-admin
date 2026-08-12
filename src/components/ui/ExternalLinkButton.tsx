import { IconExternalLink } from "@/components/icons";

interface Props {
  href: string;
  label: string;
  variant?: "default" | "accent";
}

export default function ExternalLinkButton({ href, label, variant = "default" }: Props) {
  const variants = {
    default: "border-border text-text-muted hover:bg-surface-hover hover:text-text",
    accent: "border-accent/30 text-accent hover:bg-accent/10",
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${variants[variant]}`}
    >
      {label}
      <IconExternalLink className="w-3.5 h-3.5" />
    </a>
  );
}
