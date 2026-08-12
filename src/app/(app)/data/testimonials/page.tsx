import { getTestimonials } from "@/actions/testimonials";
import TestimonialsEditor from "./TestimonialsEditor";
import PageHeader from "@/components/ui/PageHeader";

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Testimonials" description="Changes are saved to TEST KV." />
      <TestimonialsEditor initialItems={testimonials} />
    </div>
  );
}
