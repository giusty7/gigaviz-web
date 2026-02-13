/**
 * WhatsApp Contacts Page
 * /[workspaceSlug]/meta-hub/messaging/whatsapp/contacts
 */

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { ContactsListClient } from "@/components/meta-hub/ContactsListClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("contactsTitle")} | Meta Hub`,
    description: t("contactsDesc"),
  };
}

export default async function WhatsAppContactsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);

  if (!ctx.user) {
    redirect(`/login?redirect=/${workspaceSlug}/meta-hub/messaging/whatsapp/contacts`);
  }

  if (!ctx.currentWorkspace) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <ContactsListClient
        workspaceId={ctx.currentWorkspace.id}
      />
    </div>
  );
}
