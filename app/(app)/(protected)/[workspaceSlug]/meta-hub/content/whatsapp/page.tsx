import { getTranslations } from "next-intl/server";
import { WhatsAppStatusClient } from "@/components/meta-hub/content/WhatsAppStatusClient";

export async function generateMetadata() {
  const t = await getTranslations("metaHub.content");
  return {
    title: `${t("whatsappStatus")} | Meta Hub`,
    description: t("whatsappStatusDesc"),
  };
}

export default async function WhatsAppStatusPage() {
  return <WhatsAppStatusClient />;
}
