import { getGallery } from "@/actions/gallery";
import CategoryList from "./CategoryList";
import PageHeader from "@/components/ui/PageHeader";

export default async function GalleryPage() {
  const categories = await getGallery();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Gallery"
        description="Each category is a folder under kp-gallery. Open one to manage its events and images."
      />
      <CategoryList initialItems={categories} />
    </div>
  );
}
