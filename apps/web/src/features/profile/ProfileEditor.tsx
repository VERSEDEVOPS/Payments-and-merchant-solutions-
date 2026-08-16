import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  concat,
  getAddress,
  keccak256,
  stringToBytes,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  usePublicClient,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { toast } from "sonner";
import {
  ACTIVE_CHAIN,
  CREATOR_REGISTRY_ADDRESS,
  creatorRegistryAbi,
  EXPLORER_URL,
  STORAGE_API_URL,
} from "../../lib/config";
import { readableError } from "../../lib/format";
import {
  CREATOR_CATEGORIES,
  normalizeProfileSlug,
  profileSlugHash,
} from "../../lib/profileMetadata";

type FormState = {
  slug: string;
  name: string;
  bio: string;
  category: string;
  xHandle: string;
  website: string;
};

const initialForm: FormState = {
  slug: "",
  name: "",
  bio: "",
  category: "Builder",
  xHandle: "",
  website: "",
};

export function ProfileEditor() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState<File>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");
  const confirmedHash = useRef<Hex | undefined>(undefined);
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signMessageAsync } = useSignMessage();
  const {
    data: registryHash,
    writeContractAsync,
    isPending,
    error: writeError,
  } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: registryHash });
  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image],
  );

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  useEffect(() => {
    if (
      !receipt.isSuccess ||
      !registryHash ||
      confirmedHash.current === registryHash
    )
      return;
    confirmedHash.current = registryHash;
    void queryClient.invalidateQueries({ queryKey: ["creator-catalog"] });
    toast.success("Creator profile published", {
      description: "Your IPFS metadata is now anchored on Polygon.",
      action: {
        label: publishedSlug ? "Open profile" : "View transaction",
        onClick: () => {
          if (publishedSlug) navigate(`/${publishedSlug}`);
          else
            window.open(
              `${EXPLORER_URL}/tx/${registryHash}`,
              "_blank",
              "noopener",
            );
        },
      },
    });
    queueMicrotask(() => setOpen(false));
  }, [navigate, publishedSlug, queryClient, receipt.isSuccess, registryHash]);

  const displayedError = error || (writeError ? readableError(writeError) : "");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function publishProfile(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!address || !image || !publicClient) return;
    if (chainId !== ACTIVE_CHAIN.id) {
      setError("Switch your wallet to Polygon mainnet.");
      return;
    }
    if (!STORAGE_API_URL) {
      setError("The signed IPFS storage service has not been configured yet.");
      return;
    }
    if (CREATOR_REGISTRY_ADDRESS === zeroAddress) {
      setError("The Polygon creator registry has not been deployed yet.");
      return;
    }

    const slug = normalizeProfileSlug(form.slug);
    if (slug.length < 3) {
      setError("Choose a slug with at least three letters or numbers.");
      return;
    }

    setUploading(true);
    try {
      const publishingWallet = getAddress(address);
      const slugHash = profileSlugHash(slug);
      const [existingSlugHash] = await publicClient.readContract({
        address: CREATOR_REGISTRY_ADDRESS,
        abi: creatorRegistryAbi,
        functionName: "profiles",
        args: [publishingWallet],
      });
      if (existingSlugHash !== zeroHash && existingSlugHash !== slugHash) {
        throw new Error(
          "This wallet already owns a different profile slug. Profile slugs cannot be changed.",
        );
      }
      const slugOwner = await publicClient.readContract({
        address: CREATOR_REGISTRY_ADDRESS,
        abi: creatorRegistryAbi,
        functionName: "creatorForSlug",
        args: [slugHash],
      });
      if (
        slugOwner !== zeroAddress &&
        getAddress(slugOwner) !== publishingWallet
      ) {
        throw new Error("That profile slug is already owned by another wallet.");
      }
      const healthResponse = await fetch(`${STORAGE_API_URL}/health`, {
        headers: { accept: "application/json" },
      });
      const health = (await healthResponse.json()) as {
        storage?: string;
      };
      if (!healthResponse.ok || health.storage !== "ready") {
        throw new Error(
          "The signed IPFS storage service is not ready. No wallet signature was requested.",
        );
      }
      const metadata = {
        version: 1 as const,
        kind: "profile" as const,
        slug,
        name: form.name.trim(),
        bio: form.bio.trim(),
        category: form.category.trim(),
        ...(form.xHandle.trim() && { xHandle: form.xHandle.trim() }),
        ...(form.website.trim() && { website: form.website.trim() }),
      };
      const metadataText = JSON.stringify(metadata);
      const imageBytes = new Uint8Array(await image.arrayBuffer());
      const contentHash = keccak256(
        concat([stringToBytes(metadataText), imageBytes]),
      );
      const issuedAt = Math.floor(Date.now() / 1_000);
      const signature = await signMessageAsync({
        message: uploadMessage({
          wallet: publishingWallet,
          contentHash,
          issuedAt,
        }),
      });
      const body = new FormData();
      body.set("metadata", metadataText);
      body.set("image", image);
      const response = await fetch(`${STORAGE_API_URL}/v1/storage/upload`, {
        method: "POST",
        headers: {
          "x-versetip-wallet": publishingWallet,
          "x-versetip-signature": signature,
          "x-versetip-issued-at": String(issuedAt),
        },
        body,
      });
      const result = (await response.json()) as {
        metadataURI?: string;
        error?: string;
      };
      if (!response.ok || !result.metadataURI) {
        throw new Error(result.error || "Metadata upload failed.");
      }

      setPublishedSlug(slug);
      await writeContractAsync({
        address: CREATOR_REGISTRY_ADDRESS,
        abi: creatorRegistryAbi,
        functionName: "setProfile",
        args: [slugHash, result.metadataURI],
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The creator profile could not be published.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="button secondary">
          <Settings2 size={16} />
          Profile
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content profile-dialog">
          <div className="dialog-icon">
            <ShieldCheck size={22} />
          </div>
          <Dialog.Title>Publish creator profile</Dialog.Title>
          <Dialog.Description>
            Public metadata is stored on IPFS. Your wallet permanently owns the
            selected slug.
          </Dialog.Description>
          <form onSubmit={publishProfile}>
            <label className="profile-image-input">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" />
              ) : (
                <ImagePlus size={20} />
              )}
              <span>{image ? image.name : "Choose profile image"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                onChange={(event) => setImage(event.target.files?.[0])}
              />
            </label>
            <div className="profile-form-grid">
              <label>
                <span>Display name</span>
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </label>
              <label>
                <span>Profile slug</span>
                <input
                  required
                  minLength={3}
                  maxLength={32}
                  placeholder="maya-builds"
                  value={form.slug}
                  onChange={(event) => update("slug", event.target.value)}
                />
              </label>
              <label>
                <span>Category</span>
                <span className="profile-select-wrap">
                  <select
                    required
                    aria-label="Category"
                    value={form.category}
                    onChange={(event) =>
                      update("category", event.target.value)
                    }
                  >
                    {CREATOR_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </span>
              </label>
              <label>
                <span>X handle</span>
                <input
                  maxLength={32}
                  placeholder="@creator"
                  value={form.xHandle}
                  onChange={(event) => update("xHandle", event.target.value)}
                />
              </label>
              <label className="full">
                <span>Website</span>
                <input
                  type="url"
                  maxLength={200}
                  placeholder="https://"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                />
              </label>
              <label className="full">
                <span>Bio</span>
                <textarea
                  required
                  maxLength={500}
                  value={form.bio}
                  onChange={(event) => update("bio", event.target.value)}
                />
              </label>
            </div>
            {displayedError && (
              <p className="profile-form-error" role="alert">
                {displayedError}
              </p>
            )}
            <button
              className="button primary full"
              disabled={uploading || isPending || receipt.isLoading}
            >
              {uploading || isPending || receipt.isLoading ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              {uploading
                ? "Signing and uploading"
                : isPending
                  ? "Confirm in wallet"
                  : receipt.isLoading
                    ? "Publishing on Polygon"
                    : "Publish profile"}
            </button>
          </form>
          <Dialog.Close className="dialog-close" aria-label="Close">
            <X size={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function uploadMessage(input: {
  wallet: Address;
  contentHash: Hex;
  issuedAt: number;
}) {
  return [
    "Publish public VerseTip metadata",
    `Wallet: ${input.wallet}`,
    "Kind: profile",
    `Content hash: ${input.contentHash}`,
    `Issued at: ${input.issuedAt}`,
    "Chain ID: 137",
  ].join("\n");
}
