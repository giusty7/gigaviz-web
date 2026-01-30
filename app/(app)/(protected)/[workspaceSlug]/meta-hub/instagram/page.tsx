import { Metadata } from 'next';
import { InstagramInboxClient } from '@/components/meta-hub/InstagramInboxClient';

export const metadata: Metadata = {
  title: 'Instagram Direct Messages | Meta Hub',
  description: 'Manage Instagram Direct Messages conversations',
};

export default function InstagramInboxPage() {
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instagram Direct Messages</h1>
        <p className="text-muted-foreground mt-2">
          Manage and respond to Instagram Direct Messages from your connected accounts
        </p>
      </div>

      <InstagramInboxClient />
    </div>
  );
}
