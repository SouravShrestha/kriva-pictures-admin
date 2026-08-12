interface Props {
  label: string;
  variant?: "default" | "success" | "warning" | "info";
}

export default function Badge({ label, variant = "default" }: Props) {
  const variants = {
    default: "bg-surface-hover text-text-muted",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "bg-accent/10 text-accent",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
