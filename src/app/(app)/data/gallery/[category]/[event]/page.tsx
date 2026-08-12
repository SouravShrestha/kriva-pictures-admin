import { notFound } from "next/navigation";
import { getCategory, listEventAssets } from "@/actions/gallery";
import EventImageManager from "./EventImageManager";
import PageHeader from "@/components/ui/PageHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import Card from "@/components/ui/Card";

export default async function EventPage({
  params,
}: {
  params: Promise<{ category: string; event: string }>;
}) {
  const { category: categorySlug, event: eventSlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) notFound();

  const event = category.events.find((e) => e.slug === eventSlug);
  if (!event) notFound();

  const assets = await listEventAssets(categorySlug, eventSlug);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Breadcrumbs
        items={[
          { label: "Gallery", href: "/data/gallery" },
          { label: category.name, href: `/data/gallery/${category.slug}` },
          { label: event.name },
        ]}
      />
      <PageHeader
        title={event.name}
        description={`${event.date || "No date"} · ${event.folder ?? `${category.cloudinaryFolder}/${event.slug}`}`}
      />
      <Card className="p-6">
        <EventImageManager
          categorySlug={category.slug}
          eventSlug={event.slug}
          initialAssets={assets}
          initialCoverPublicId={event.cover?.publicId ?? null}
        />
      </Card>
    </div>
  );
}
