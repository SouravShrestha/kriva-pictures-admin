import { getFaqs } from "@/actions/faqs";
import FaqsEditor from "./FaqsEditor";
import PageHeader from "@/components/ui/PageHeader";

export default async function FaqsPage() {
  const categories = await getFaqs();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="FAQs" description="Changes are saved to TEST KV." />
      <FaqsEditor initialItems={categories} />
    </div>
  );
}
