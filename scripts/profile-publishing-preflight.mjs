import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const envPath = resolve(process.argv[2] || "apps/web/.env");
const env = parseEnv(await readFile(envPath, "utf8"));
const blockers = [];

const rpcUrl = env.VITE_POLYGON_RPC_URL || "";
const registry = env.VITE_CREATOR_REGISTRY_ADDRESS || "";
const storageUrl = (env.VITE_STORAGE_API_URL || "").replace(/\/$/, "");
const deploymentBlock = env.VITE_DEPLOYMENT_BLOCK || "";

const rpcConfigured = /^https:\/\//.test(rpcUrl);
const registryConfigured =
  /^0x[0-9a-fA-F]{40}$/.test(registry) && !/^0x0{40}$/i.test(registry);
const storageConfigured = /^https?:\/\//.test(storageUrl);

if (!rpcConfigured) {
  blockers.push("VITE_POLYGON_RPC_URL must be an HTTPS Polygon RPC URL.");
}
if (!registryConfigured) {
  blockers.push("VITE_CREATOR_REGISTRY_ADDRESS must be a deployed address.");
}
if (!/^\d+$/.test(deploymentBlock) || BigInt(deploymentBlock || "0") <= 0n) {
  blockers.push("VITE_DEPLOYMENT_BLOCK must be the registry deployment block.");
}
if (!storageConfigured) {
  blockers.push("VITE_STORAGE_API_URL must point to the deployed Worker.");
}

if (rpcConfigured) {
  try {
    const chainId = await rpc(rpcUrl, "eth_chainId", []);
    if (BigInt(chainId) !== 137n) {
      blockers.push(`RPC is connected to chain ${BigInt(chainId)}, not Polygon 137.`);
    }
    if (registryConfigured) {
      const code = await rpc(rpcUrl, "eth_getCode", [registry, "latest"]);
      if (code === "0x")
        blockers.push("The creator registry address has no bytecode.");
    }
  } catch (error) {
    blockers.push(`Polygon RPC check failed: ${message(error)}`);
  }
}

if (storageConfigured) {
  try {
    const response = await fetch(`${storageUrl}/health`, {
      headers: { accept: "application/json" },
    });
    const health = await response.json();
    if (!response.ok || health?.storage !== "ready") {
      blockers.push("The Worker is reachable but object storage is not ready.");
    }
  } catch (error) {
    blockers.push(`Storage Worker check failed: ${message(error)}`);
  }
}

if (blockers.length) {
  console.error("Profile publishing is not ready:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exitCode = 1;
} else {
  console.log("Profile publishing preflight passed on Polygon mainnet.");
}

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "")]),
  );
}

async function rpc(url, method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const payload = await response.json();
  if (!response.ok || payload.error || payload.result === undefined) {
    throw new Error(payload.error?.message || `HTTP ${response.status}`);
  }
  return payload.result;
}

function message(error) {
  return error instanceof Error ? error.message : "unknown error";
}
