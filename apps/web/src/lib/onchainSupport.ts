import { useQuery } from "@tanstack/react-query";
import {
  getAddress,
  parseAbiItem,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import { usePublicClient } from "wagmi";
import { getLogsInChunks } from "./blockRanges";
import {
  DEPLOYMENT_BLOCK,
  TIP_VAULT_ADDRESS,
  VERSE_ADDRESS,
} from "./config";

const vaultTipEvent = parseAbiItem(
  "event TipReceived(address indexed supporter, address indexed beneficiary, uint256 amount, bytes32 indexed campaignId, bytes32 messageHash)",
);
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export type SupportItem = {
  hash: Hex;
  from: Address;
  amount: bigint;
  rail: "direct" | "vault";
  messageHash?: Hex;
  timestamp: number;
};

export function sortSupportItems(items: SupportItem[]): SupportItem[] {
  return [...items]
    .sort((left, right) => {
      if (right.timestamp !== left.timestamp)
        return right.timestamp - left.timestamp;
      return right.hash.localeCompare(left.hash);
    })
    .slice(0, 20);
}

export function useRecentSupport(beneficiary?: Address) {
  const publicClient = usePublicClient();
  const configured =
    Boolean(publicClient && beneficiary) && DEPLOYMENT_BLOCK > 0n;

  return useQuery({
    queryKey: [
      "recent-support",
      beneficiary,
      TIP_VAULT_ADDRESS,
      DEPLOYMENT_BLOCK.toString(),
    ],
    enabled: configured,
    staleTime: 30_000,
    queryFn: async (): Promise<SupportItem[]> => {
      if (!publicClient || !beneficiary) return [];
      const latestBlock = await publicClient.getBlockNumber();
      const [vaultLogs, transferLogs] = await Promise.all([
        TIP_VAULT_ADDRESS !== zeroAddress
          ? getLogsInChunks(
              (range) =>
                publicClient.getLogs({
                  address: TIP_VAULT_ADDRESS,
                  event: vaultTipEvent,
                  args: { beneficiary },
                  fromBlock: range.fromBlock,
                  toBlock: range.toBlock,
                }),
              DEPLOYMENT_BLOCK,
              latestBlock,
            )
          : Promise.resolve([]),
        getLogsInChunks(
          (range) =>
            publicClient.getLogs({
              address: VERSE_ADDRESS,
              event: transferEvent,
              args: { to: beneficiary },
              fromBlock: range.fromBlock,
              toBlock: range.toBlock,
            }),
          DEPLOYMENT_BLOCK,
          latestBlock,
        ),
      ]);

      type Pending = SupportItem & { blockNumber: bigint };
      const pending: Pending[] = [];
      for (const log of vaultLogs) {
        if (!log.args.supporter || log.args.amount === undefined || !log.transactionHash)
          continue;
        pending.push({
          hash: log.transactionHash,
          from: log.args.supporter,
          amount: log.args.amount,
          rail: "vault",
          messageHash:
            log.args.messageHash && log.args.messageHash !== zeroHash
              ? log.args.messageHash
              : undefined,
          timestamp: 0,
          blockNumber: log.blockNumber,
        });
      }
      for (const log of transferLogs) {
        if (
          !log.args.from ||
          log.args.value === undefined ||
          !log.transactionHash
        )
          continue;
        if (getAddress(log.args.from) === getAddress(beneficiary)) continue;
        if (
          TIP_VAULT_ADDRESS !== zeroAddress &&
          getAddress(log.args.from) === getAddress(TIP_VAULT_ADDRESS)
        )
          continue;
        if (pending.some((item) => item.hash === log.transactionHash)) continue;
        pending.push({
          hash: log.transactionHash,
          from: log.args.from,
          amount: log.args.value,
          rail: "direct",
          timestamp: 0,
          blockNumber: log.blockNumber,
        });
      }

      const uniqueBlocks = [...new Set(pending.map((item) => item.blockNumber))];
      const timestamps = new Map<bigint, number>();
      await Promise.all(
        uniqueBlocks.map(async (blockNumber) => {
          const block = await publicClient.getBlock({ blockNumber });
          timestamps.set(blockNumber, Number(block.timestamp));
        }),
      );
      return sortSupportItems(
        pending.map(({ blockNumber, ...item }) => ({
          ...item,
          timestamp: timestamps.get(blockNumber) ?? 0,
        })),
      );
    },
  });
}
