export const PUBLIC_LOG_BLOCK_SPAN = 9_999n;

export async function getLogsInChunks<TLog>(
  getLogs: (range: {
    fromBlock: bigint;
    toBlock: bigint;
  }) => Promise<readonly TLog[]>,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<TLog[]> {
  const collected: TLog[] = [];
  for (const range of logBlockRanges(fromBlock, toBlock)) {
    collected.push(...(await getLogs(range)));
  }
  return collected;
}

export function logBlockRanges(
  fromBlock: bigint,
  toBlock: bigint,
  maxSpan = PUBLIC_LOG_BLOCK_SPAN,
): { fromBlock: bigint; toBlock: bigint }[] {
  if (toBlock < fromBlock || maxSpan < 1n) return [];
  const ranges: { fromBlock: bigint; toBlock: bigint }[] = [];
  let start = fromBlock;
  while (start <= toBlock) {
    const end = start + maxSpan - 1n;
    ranges.push({
      fromBlock: start,
      toBlock: end < toBlock ? end : toBlock,
    });
    start = end + 1n;
  }
  return ranges;
}
