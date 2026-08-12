import { notFound } from "next/navigation";
import { getCategory } from "@/actions/gallery";
import EventList from "./EventList";
import PageHeader from "@/components/ui/PageHeader";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Breadcrumbs
        items={[{ label: "Gallery", href: "/data/gallery" }, { label: category.name }]}
      />
      <PageHeader
        title={category.name}
        description={`Events in ${category.cloudinaryFolder}. Adding an event creates its sub-folder in Cloudinary.`}
      />
      <EventList category={category} />
    </div>
  );
}
