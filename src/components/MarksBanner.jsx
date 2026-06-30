/**
 * MarksBanner.jsx — thin wrapper delegating to the centralized CampaignBanner.
 */
import CampaignBanner from '../ux/components/CampaignBanner';

export default function MarksBanner() {
  return <CampaignBanner campaignId="marks-banner-v1" />;
}
