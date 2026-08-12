import { getBannerAssets } from "@/actions/banners";
import BannerManager from "./BannerManager";
import { env } from "@/lib/env";
import PageHeader from "@/components/ui/PageHeader";
import ExternalLinkButton from "@/components/ui/ExternalLinkButton";
import Card from "@/components/ui/Card";

export default async function HomeBannerPage() {
  const assets = await getBannerAssets("kp-main-banner");
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Home Banner"
        description="Manage the home page slideshow. Changes saved to TEST."
        actions={env.siteTestUrl && <ExternalLinkButton href={env.siteTestUrl} label="View in Test" />}
      />
      <Card className="p-6">
        <BannerManager initialAssets={assets} folder="kp-main-banner" />
      </Card>
    </div>
  );
}
