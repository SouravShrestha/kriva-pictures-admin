import { getBannerAssets } from "@/actions/banners";
import BannerManager from "../home/BannerManager";
import { env } from "@/lib/env";
import PageHeader from "@/components/ui/PageHeader";
import ExternalLinkButton from "@/components/ui/ExternalLinkButton";
import Card from "@/components/ui/Card";

export default async function FooterBannerPage() {
  const assets = await getBannerAssets("kp-footer-banner");
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Footer Gallery"
        description="Manage footer gallery images. Changes saved to TEST."
        actions={env.siteTestUrl && <ExternalLinkButton href={env.siteTestUrl} label="View in Test" />}
      />
      <Card className="p-6">
        <BannerManager initialAssets={assets} folder="kp-footer-banner" />
      </Card>
    </div>
  );
}
