export const SCHEMA_CONTEXT = "https://schema.org";
export const SITE_URL = "https://gigaviz.com";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const PERSON_ID = `${SITE_URL}/#giusty`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export type BlogPostingInput = {
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string | null;
};

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "PT Gigaviz Digital Indonesia",
    url: SITE_URL,
    brand: {
      "@type": "Brand",
      name: "Gigaviz",
    },
    founder: {
      "@id": PERSON_ID,
    },
  };
}

export function personSchema() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Giusty Adhyarachmat Eryan",
    alternateName: "Giusty",
    jobTitle: "Founder",
    worksFor: {
      "@id": ORGANIZATION_ID,
    },
    url: `${SITE_URL}/about`,
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Gigaviz",
    url: SITE_URL,
    publisher: {
      "@id": ORGANIZATION_ID,
    },
  };
}

export function blogPostingSchema(post: BlogPostingInput) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const schema: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": url,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@id": PERSON_ID,
    },
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  if (post.image) {
    schema.image = post.image;
  }

  return schema;
}
