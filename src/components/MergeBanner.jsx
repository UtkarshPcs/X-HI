/**
 * MergeBanner.jsx — thin wrapper delegating to the centralized CampaignBanner.
 */
import CampaignBanner from '../ux/components/CampaignBanner';

export default function MergeBanner() {
  return <CampaignBanner campaignId="merge-banner-v1" />;
}
