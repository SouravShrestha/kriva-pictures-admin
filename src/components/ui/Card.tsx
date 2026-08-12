interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-surface rounded-xl border border-border ${className}`}>
      {children}
    </div>
  );
}
