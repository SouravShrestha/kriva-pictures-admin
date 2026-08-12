import { getSectionAssets } from "@/actions/sections";
import SectionsManager from "./SectionsManager";
import PageHeader from "@/components/ui/PageHeader";

export const SLOTS = [
  { label: "Section 2A", tag: "section-2a" },
  { label: "Section 2B", tag: "section-2b" },
  { label: "Section 2C", tag: "section-2c" },
  { label: "Section 4A", tag: "section-4a" },
];

export default async function SectionsPage() {
  const assets = await getSectionAssets();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Section Images"
        description="Replace fixed image slots. Slots are predefined - adding new ones requires a code change."
      />
      <SectionsManager slots={SLOTS} assets={assets} />
    </div>
  );
}
