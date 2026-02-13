import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MessengerInboxClient } from '@/components/meta-hub/MessengerInboxClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metaHub');
  return {
    title: `${t('messengerTitle')} | Meta Hub`,
    description: t('messengerDesc'),
  };
}

export default async function MessengerInboxPage() {
  const t = await getTranslations('metaHub');

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('messengerTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('messengerDesc')}
        </p>
      </div>

      <MessengerInboxClient />
    </div>
  );
}
