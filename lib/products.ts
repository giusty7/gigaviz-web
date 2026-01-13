import type { Metadata } from "next";
import {
  moduleStatusLabel,
  modulesCatalog,
  topLevelModules,
  type ModuleIcon,
} from "@/lib/modules/catalog";

export type ProductStatus = "available" | "beta" | "coming";

export type Product = {
  slug: string;
  name: string;
  short: string;
  description: string;
  status: ProductStatus;
  icon: ProductIcon;
  categories: string[];
  features: string[];
  whoFor: string[];
  related: string[];
};

export type ProductIcon =
  | ModuleIcon;

export const productStatusLabel: Record<ProductStatus, string> = moduleStatusLabel;

export const products: Product[] = modulesCatalog.map((item) => ({
  slug: item.slug,
  name: item.name,
  short: item.short,
  description: item.description,
  status: item.status,
  icon: item.icon,
  categories: item.categories ?? [],
  features: item.features ?? [],
  whoFor: item.whoFor ?? [],
  related: item.related ?? [],
}));

export const productSlugs = products.map((product) => product.slug);

export const topLevelProducts: Product[] = topLevelModules.map((item) => ({
  slug: item.slug,
  name: item.name,
  short: item.short,
  description: item.description,
  status: item.status,
  icon: item.icon,
  categories: item.categories ?? [],
  features: item.features ?? [],
  whoFor: item.whoFor ?? [],
  related: item.related ?? [],
}));

export const productCategories = Array.from(
  new Set(topLevelProducts.flatMap((product) => product.categories))
).sort();

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const productsMetadata: Metadata = {
  title: "Gigaviz Products",
  description:
    "Explore every module in the Gigaviz ecosystem for create, automate, monetize, and manage.",
};
