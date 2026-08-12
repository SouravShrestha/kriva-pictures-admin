import { getPackages } from "@/actions/packages";
import PackagesEditor from "./PackagesEditor";
import PageHeader from "@/components/ui/PageHeader";

export default async function PackagesPage() {
  const packages = await getPackages();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Packages" description="Changes are saved to TEST KV." />
      <PackagesEditor initialItems={packages} />
    </div>
  );
}
