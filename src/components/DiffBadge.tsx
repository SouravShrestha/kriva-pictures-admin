interface Props {
  count: number;
  label?: string;
}

export default function DiffBadge({ count, label }: Props) {
  if (count === 0) {
    return <span className="text-xs text-text-subtle">No changes</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      {count} {label ?? (count === 1 ? "change" : "changes")}
    </span>
  );
}
