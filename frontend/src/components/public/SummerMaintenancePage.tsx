import { SimpleCampaignPage } from "./SimpleCampaignPage";

interface SummerMaintenancePageProps {
  onNavigate: (page: string) => void;
}

export function SummerMaintenancePage({ onNavigate }: SummerMaintenancePageProps) {
  return (
    <SimpleCampaignPage
      onNavigate={onNavigate}
      campaignId="summer-maintenance"
    />
  );
}