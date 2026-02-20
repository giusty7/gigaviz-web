import { getTranslations } from "next-intl/server";
import { ContentHubClient } from "@/components/meta-hub/content/ContentHubClient";

export async function generateMetadata() {
  const t = await getTranslations("metaHub.content");
  return {
    title: `${t("title")} | Meta Hub`,
    description: t("description"),
  };
}

export default async function ContentHubPage() {
  return <ContentHubClient />;
}
