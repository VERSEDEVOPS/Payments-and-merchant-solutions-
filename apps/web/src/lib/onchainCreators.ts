import { useQuery } from "@tanstack/react-query";
import { getAddress, parseAbiItem, type Address, type Hex } from "viem";
import { usePublicClient } from "wagmi";
import {
  CREATOR_REGISTRY_ADDRESS,
  creatorRegistryAbi,
  DEPLOYMENT_BLOCK,
} from "./config";
import { creators as demoCreators, type Creator } from "./data";
import {
  isCreatorCategory,
  profileSlugHash,
  type CreatorCategory,
} from "./profileMetadata";
import { ipfsGateways } from "./ipfs";

const profileUpdatedEvent = parseAbiItem(
  "event ProfileUpdated(address indexed creator, bytes32 indexed slugHash, string metadataURI, uint64 updatedAt)",
);
const gateways = ipfsGateways();

type ProfileMetadata = {
  version: 1;
  kind: "profile";
  slug: string;
  name: string;
  bio: string;
  category: CreatorCategory;
  xHandle?: string;
  website?: string;
  image: string;
  publisher: Address;
};

export function useCreatorCatalog(enabled = true) {
  const publicClient = usePublicClient();
  const configured =
    Boolean(publicClient) &&
    CREATOR_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000" &&
    DEPLOYMENT_BLOCK > 0n;
  const query = useQuery({
    queryKey: [
      "creator-catalog",
      CREATOR_REGISTRY_ADDRESS,
      DEPLOYMENT_BLOCK.toString(),
    ],
    enabled: configured && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!publicClient) return demoCreators;
      const logs = await publicClient.getLogs({
        address: CREATOR_REGISTRY_ADDRESS,
        event: profileUpdatedEvent,
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      });
      const addresses = [
        ...new Set(
          logs
            .map((log) => log.args.creator)
            .filter((value): value is Address => Boolean(value)),
        ),
      ];
      const results = await Promise.allSettled(
        addresses.map(async (address) => {
          const [slugHash, metadataURI, , active] =
            await publicClient.readContract({
              address: CREATOR_REGISTRY_ADDRESS,
              abi: creatorRegistryAbi,
              functionName: "profiles",
              args: [address],
            });
          if (!active) return null;
          const metadata = await fetchMetadata(metadataURI);
          if (!isProfileMetadataForRecord(metadata, address, slugHash))
            return null;
          return toCreator(metadata, address);
        }),
      );
      return results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
    },
  });

  return {
    creators: query.data?.length ? query.data : demoCreators,
    isLoading: configured && enabled && query.isPending,
    isFallback: !query.data?.length,
  };
}

async function fetchMetadata(uri: string): Promise<ProfileMetadata | null> {
  if (!/^ipfs:\/\/b[a-z2-7]+$/.test(uri)) return null;
  const cid = uri.slice("ipfs://".length);
  try {
    const metadata = await Promise.any(
      gateways.map(async (gateway) => {
        const response = await fetch(`${gateway}${cid}`, {
          signal: AbortSignal.timeout(6_000),
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("IPFS gateway failed");
        const length = Number(response.headers.get("content-length") ?? "0");
        if (length > 64_000) throw new Error("Metadata exceeds limit");
        return response.json() as Promise<unknown>;
      }),
    );
    return isProfileMetadata(metadata) ? metadata : null;
  } catch {
    return null;
  }
}

export function isProfileMetadata(value: unknown): value is ProfileMetadata {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return (
    profile.version === 1 &&
    profile.kind === "profile" &&
    typeof profile.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.slug) &&
    typeof profile.name === "string" &&
    profile.name.length > 0 &&
    profile.name.length <= 80 &&
    typeof profile.bio === "string" &&
    profile.bio.length <= 500 &&
    isCreatorCategory(profile.category) &&
    typeof profile.image === "string" &&
    /^ipfs:\/\/b[a-z2-7]+$/.test(profile.image) &&
    typeof profile.publisher === "string" &&
    /^0x[0-9a-fA-F]{40}$/.test(profile.publisher)
  );
}

export function isProfileMetadataForRecord(
  value: unknown,
  publisher: Address,
  slugHash: Hex,
): value is ProfileMetadata {
  if (!isProfileMetadata(value)) return false;
  try {
    return (
      getAddress(value.publisher) === getAddress(publisher) &&
      profileSlugHash(value.slug) === slugHash
    );
  } catch {
    return false;
  }
}

function toCreator(metadata: ProfileMetadata, address: Address): Creator {
  const accents = ["violet", "blue", "pink"];
  const accentIndex = Number.parseInt(address.slice(-2), 16) % accents.length;
  const initials = metadata.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return {
    slug: metadata.slug,
    name: metadata.name,
    handle: metadata.xHandle || "Onchain creator",
    bio: metadata.bio,
    address,
    initials,
    accent: accents[accentIndex] ?? "violet",
    verified: false,
    supporters: 0,
    raised: 0,
    goal: 1,
    campaign: "No active campaign",
    category: metadata.category,
    image: `${gateways[0]}${metadata.image.slice("ipfs://".length)}`,
    isDemo: false,
  };
}
