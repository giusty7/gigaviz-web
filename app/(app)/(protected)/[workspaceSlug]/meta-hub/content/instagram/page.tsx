import { getTranslations } from "next-intl/server";
import { InstagramContentClient } from "@/components/meta-hub/content/InstagramContentClient";

export async function generateMetadata() {
  const t = await getTranslations("metaHub.content");
  return {
    title: `${t("instagramContent")} | Meta Hub`,
    description: t("instagramContentDesc"),
  };
}

export default async function InstagramContentPage() {
  return <InstagramContentClient />;
}
