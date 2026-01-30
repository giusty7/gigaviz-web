import { Metadata } from 'next';
import { MetaAdsManagerClient } from '@/components/meta-hub/MetaAdsManagerClient';

export const metadata: Metadata = {
  title: 'Meta Ads Manager | Meta Hub',
  description: 'Monitor and analyze your Meta advertising campaigns',
};

export default function MetaAdsPage() {
  return (
    <div className="container py-8">
      <MetaAdsManagerClient />
    </div>
  );
}

