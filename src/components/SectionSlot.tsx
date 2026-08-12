import Image from "next/image";
import Button from "@/components/ui/Button";

interface Props {
  label: string;
  tag: string;
  currentUrl: string | null;
  onReplace: (file: File, tag: string) => Promise<void>;
}

export default function SectionSlot({ label, tag, currentUrl, onReplace }: Props) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await onReplace(file, tag);
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="aspect-video relative bg-surface-hover">
        {currentUrl ? (
          <Image src={currentUrl} alt={label} fill className="object-cover" sizes="300px" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-subtle text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-text">{label}</div>
          <div className="text-xs text-text-subtle font-mono">{tag}</div>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
          <Button size="sm" variant="outline" type="button" onClick={(e) => { (e.currentTarget.previousElementSibling as HTMLInputElement)?.click(); }}>
            Replace
          </Button>
        </label>
      </div>
    </div>
  );
}
