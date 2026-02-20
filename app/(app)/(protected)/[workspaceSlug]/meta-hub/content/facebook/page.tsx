import { getTranslations } from "next-intl/server";
import { FacebookContentClient } from "@/components/meta-hub/content/FacebookContentClient";

export async function generateMetadata() {
  const t = await getTranslations("metaHub.content");
  return {
    title: `${t("facebookContent")} | Meta Hub`,
    description: t("facebookContentDesc"),
  };
}

export default async function FacebookContentPage() {
  return <FacebookContentClient />;
}
