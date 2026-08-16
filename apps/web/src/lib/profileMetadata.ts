import { keccak256, stringToBytes, type Hex } from "viem";

export const CREATOR_CATEGORIES = [
  "Builder",
  "Product design",
  "Open source",
  "Visual art",
  "Education",
  "Community",
  "Music",
  "Writing",
] as const;

export type CreatorCategory = (typeof CREATOR_CATEGORIES)[number];

export function isCreatorCategory(value: unknown): value is CreatorCategory {
  return (
    typeof value === "string" &&
    (CREATOR_CATEGORIES as readonly string[]).includes(value)
  );
}

export function normalizeProfileSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function profileSlugHash(slug: string): Hex {
  return keccak256(stringToBytes(slug));
}
