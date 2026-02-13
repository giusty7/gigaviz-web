import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { InstagramInboxClient } from '@/components/meta-hub/InstagramInboxClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metaHub');
  return {
    title: `${t('instagramTitle')} | Meta Hub`,
    description: t('instagramDesc'),
  };
}

export default async function InstagramInboxPage() {
  const t = await getTranslations('metaHub');
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('instagramTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('instagramDesc')}
        </p>
      </div>

      <InstagramInboxClient />
    </div>
  );
}
