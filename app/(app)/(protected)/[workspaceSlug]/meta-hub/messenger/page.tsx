import { Metadata } from 'next';
import { MessengerInboxClient } from '@/components/meta-hub/MessengerInboxClient';

export const metadata: Metadata = {
  title: 'Facebook Messenger | Meta Hub',
  description: 'Manage Facebook Messenger conversations',
};

export default function MessengerInboxPage() {
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facebook Messenger</h1>
        <p className="text-muted-foreground mt-2">
          Manage and respond to Facebook Messenger conversations from your connected Pages
        </p>
      </div>

      <MessengerInboxClient />
    </div>
  );
}
