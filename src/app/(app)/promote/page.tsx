import { getDiffCounts } from "@/actions/promote";
import PromotePanel from "./PromotePanel";
import { env } from "@/lib/env";
import PageHeader from "@/components/ui/PageHeader";
import ExternalLinkButton from "@/components/ui/ExternalLinkButton";

export default async function PromotePage() {
  const diffs = await getDiffCounts();
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Promote to Production"
        description="Select what to promote from TEST to PROD. This copies KV data and syncs Cloudinary assets."
        actions={
          <>
            {env.siteTestUrl && <ExternalLinkButton href={env.siteTestUrl} label="View Test" />}
            {env.siteProdUrl && <ExternalLinkButton href={env.siteProdUrl} label="View Prod" variant="accent" />}
          </>
        }
      />
      <PromotePanel diffs={diffs} />
    </div>
  );
}
