import { polygon } from "wagmi/chains";
import { getAddress, zeroAddress } from "viem";
import { publicServiceUrl } from "./serviceUrl";

export const ACTIVE_CHAIN = polygon;
export const NETWORK_NAME = "Polygon mainnet";
export const TOKEN_SYMBOL = "fxVERSE";
export const EXPLORER_URL = "https://polygonscan.com";
export const VERSE_ADDRESS = getAddress(
  "0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc",
);
export const TIP_VAULT_ADDRESS = import.meta.env.VITE_TIP_VAULT_ADDRESS
  ? getAddress(import.meta.env.VITE_TIP_VAULT_ADDRESS as `0x${string}`)
  : zeroAddress;
export const CREATOR_REGISTRY_ADDRESS = import.meta.env
  .VITE_CREATOR_REGISTRY_ADDRESS
  ? getAddress(import.meta.env.VITE_CREATOR_REGISTRY_ADDRESS as `0x${string}`)
  : zeroAddress;
export const STORAGE_API_URL = publicServiceUrl(
  import.meta.env.VITE_STORAGE_API_URL || "",
  import.meta.env.PROD,
);
export const RELAYER_URL = publicServiceUrl(
  import.meta.env.VITE_RELAYER_URL || "",
  import.meta.env.PROD,
);
export const DEPLOYMENT_BLOCK = BigInt(
  import.meta.env.VITE_DEPLOYMENT_BLOCK || "0",
);
export const POLYGON_RPC_URL =
  import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon.drpc.org";
export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const tipVaultAbi = [
  {
    type: "function",
    name: "campaigns",
    stateMutability: "view",
    inputs: [{ name: "campaignId", type: "bytes32" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "active", type: "bool" },
      { name: "recipientCount", type: "uint8" },
      { name: "metadataURI", type: "string" },
    ],
  },
  {
    type: "function",
    name: "createCampaign",
    stateMutability: "nonpayable",
    inputs: [
      { name: "slugHash", type: "bytes32" },
      { name: "recipients", type: "address[]" },
      { name: "shares", type: "uint16[]" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "campaignId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "tip",
    stateMutability: "nonpayable",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "messageHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimNonces",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

export const creatorRegistryAbi = [
  {
    type: "function",
    name: "creatorForSlug",
    stateMutability: "view",
    inputs: [{ name: "slugHash", type: "bytes32" }],
    outputs: [{ name: "creator", type: "address" }],
  },
  {
    type: "function",
    name: "profiles",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      { name: "slugHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "updatedAt", type: "uint64" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "setProfile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "slugHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
  },
] as const;
