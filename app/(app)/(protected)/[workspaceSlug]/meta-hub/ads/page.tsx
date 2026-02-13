import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MetaAdsManagerClient } from '@/components/meta-hub/MetaAdsManagerClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metaHub');
  return {
    title: `${t('adsTitle')} | Meta Hub`,
    description: t('adsDesc'),
  };
}

export default function MetaAdsPage() {
  return (
    <div className="container py-8">
      <MetaAdsManagerClient />
    </div>
  );
}

