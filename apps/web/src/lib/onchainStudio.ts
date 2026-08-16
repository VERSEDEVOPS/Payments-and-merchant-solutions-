import { useQuery } from "@tanstack/react-query";
import {
  getAddress,
  parseAbiItem,
  type Address,
  type Hex,
} from "viem";
import { usePublicClient } from "wagmi";
import {
  DEPLOYMENT_BLOCK,
  TIP_VAULT_ADDRESS,
  tipVaultAbi,
} from "./config";
import { getLogsInChunks } from "./blockRanges";
import { fetchIpfsJson } from "./ipfs";

const campaignCreatedEvent = parseAbiItem(
  "event CampaignCreated(bytes32 indexed campaignId, address indexed creator, bytes32 indexed slugHash, address[] recipients, uint16[] shares, string metadataURI)",
);
const campaignTipEvent = parseAbiItem(
  "event CampaignTipReceived(address indexed supporter, bytes32 indexed campaignId, uint256 amount, bytes32 messageHash)",
);
const directVaultTipEvent = parseAbiItem(
  "event TipReceived(address indexed supporter, address indexed beneficiary, uint256 amount, bytes32 indexed campaignId, bytes32 messageHash)",
);
type CampaignMetadata = {
  version: 1;
  kind: "campaign";
  slug: string;
  title: string;
  description: string;
  goal: string;
  image: string;
  publisher: Address;
};

export type StudioCampaign = {
  id: Hex;
  title: string;
  slug: string;
  active: boolean;
  recipientCount: number;
  raised: bigint;
  goal: bigint;
  supporters: number;
};

type LoadedCampaign = StudioCampaign & { supporterAddresses: string[] };

const emptyStudio = {
  vaultSupport: 0n,
  supporters: 0,
  campaigns: [] as StudioCampaign[],
};

export function useOnchainStudio(creator?: Address) {
  const publicClient = usePublicClient();
  const configured =
    Boolean(publicClient && creator) &&
    TIP_VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000" &&
    DEPLOYMENT_BLOCK > 0n;

  return useQuery({
    queryKey: [
      "creator-studio",
      creator,
      TIP_VAULT_ADDRESS,
      DEPLOYMENT_BLOCK.toString(),
    ],
    enabled: configured,
    staleTime: 30_000,
    queryFn: async () => {
      if (!publicClient || !creator) return emptyStudio;
      const latestBlock = await publicClient.getBlockNumber();
      const [createdLogs, directLogs] = await Promise.all([
        getLogsInChunks(
          (range) =>
            publicClient.getLogs({
              address: TIP_VAULT_ADDRESS,
              event: campaignCreatedEvent,
              args: { creator },
              fromBlock: range.fromBlock,
              toBlock: range.toBlock,
            }),
          DEPLOYMENT_BLOCK,
          latestBlock,
        ),
        getLogsInChunks(
          (range) =>
            publicClient.getLogs({
              address: TIP_VAULT_ADDRESS,
              event: directVaultTipEvent,
              args: { beneficiary: creator },
              fromBlock: range.fromBlock,
              toBlock: range.toBlock,
            }),
          DEPLOYMENT_BLOCK,
          latestBlock,
        ),
      ]);

      const campaignLogs = createdLogs.slice(-20).reverse();
      const campaignResults = await Promise.allSettled(
        campaignLogs.map(async (log): Promise<LoadedCampaign | null> => {
          const campaignId = log.args.campaignId;
          if (!campaignId) return null;
          const [, active, recipientCount, metadataURI] =
            await publicClient.readContract({
              address: TIP_VAULT_ADDRESS,
              abi: tipVaultAbi,
              functionName: "campaigns",
              args: [campaignId],
            });
          const [metadata, tips] = await Promise.all([
            fetchCampaignMetadata(metadataURI),
            getLogsInChunks(
              (range) =>
                publicClient.getLogs({
                  address: TIP_VAULT_ADDRESS,
                  event: campaignTipEvent,
                  args: { campaignId },
                  fromBlock: range.fromBlock,
                  toBlock: range.toBlock,
                }),
              log.blockNumber,
              latestBlock,
            ),
          ]);
          if (
            !metadata ||
            getAddress(metadata.publisher) !== getAddress(creator)
          )
            return null;
          return {
            id: campaignId,
            title: metadata.title,
            slug: metadata.slug,
            active,
            recipientCount,
            raised: tips.reduce(
              (sum, tip) => sum + (tip.args.amount ?? 0n),
              0n,
            ),
            goal: BigInt(metadata.goal),
            supporters: new Set(
              tips.flatMap((tip) =>
                tip.args.supporter ? [tip.args.supporter.toLowerCase()] : [],
              ),
            ).size,
            supporterAddresses: tips.flatMap((tip) =>
              tip.args.supporter ? [tip.args.supporter.toLowerCase()] : [],
            ),
          };
        }),
      );
      const loadedCampaigns = campaignResults.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
      const supporterAddresses = new Set(
        directLogs.flatMap((log) =>
          log.args.supporter ? [log.args.supporter.toLowerCase()] : [],
        ),
      );
      const directSupport = directLogs.reduce(
        (sum, log) => sum + (log.args.amount ?? 0n),
        0n,
      );
      for (const campaign of loadedCampaigns) {
        for (const supporter of campaign.supporterAddresses)
          supporterAddresses.add(supporter);
      }
      const campaigns = loadedCampaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        active: campaign.active,
        recipientCount: campaign.recipientCount,
        raised: campaign.raised,
        goal: campaign.goal,
        supporters: campaign.supporters,
      }));
      return {
        vaultSupport:
          directSupport +
          campaigns.reduce((sum, campaign) => sum + campaign.raised, 0n),
        supporters: supporterAddresses.size,
        campaigns,
      };
    },
  });
}

async function fetchCampaignMetadata(
  uri: string,
): Promise<CampaignMetadata | null> {
  if (!/^ipfs:\/\/b[a-z2-7]+$/.test(uri)) return null;
  const cid = uri.slice("ipfs://".length);
  try {
    const value = await fetchIpfsJson(cid);
    return isCampaignMetadata(value) ? value : null;
  } catch {
    return null;
  }
}

function isCampaignMetadata(value: unknown): value is CampaignMetadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Record<string, unknown>;
  return (
    metadata.version === 1 &&
    metadata.kind === "campaign" &&
    typeof metadata.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug) &&
    typeof metadata.title === "string" &&
    metadata.title.length > 0 &&
    metadata.title.length <= 100 &&
    typeof metadata.description === "string" &&
    typeof metadata.goal === "string" &&
    /^\d{1,78}$/.test(metadata.goal) &&
    BigInt(metadata.goal) > 0n &&
    typeof metadata.image === "string" &&
    /^ipfs:\/\/b[a-z2-7]+$/.test(metadata.image) &&
    typeof metadata.publisher === "string" &&
    /^0x[0-9a-fA-F]{40}$/.test(metadata.publisher)
  );
}
