import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ImagePlus, LoaderCircle, Plus, Trash2, Users, X } from "lucide-react";
import {
  concat,
  getAddress,
  isAddress,
  keccak256,
  parseUnits,
  stringToBytes,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { toast } from "sonner";
import {
  ACTIVE_CHAIN,
  EXPLORER_URL,
  STORAGE_API_URL,
  TIP_VAULT_ADDRESS,
  tipVaultAbi,
} from "../../lib/config";
import { readableError } from "../../lib/format";

type Collaborator = { address: string; percentage: string };

export function CampaignEditor() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [image, setImage] = useState<File>();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    data: campaignHash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: campaignHash });
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
    if (!receipt.isSuccess || !campaignHash) return;
    toast.success("Campaign created", {
      description: "The collaborator split is now enforced on Polygon.",
      action: {
        label: "View",
        onClick: () =>
          window.open(
            `${EXPLORER_URL}/tx/${campaignHash}`,
            "_blank",
            "noopener",
          ),
      },
    });
    queueMicrotask(() => setOpen(false));
  }, [campaignHash, receipt.isSuccess]);

  const displayedError = error || (writeError ? readableError(writeError) : "");
  const collaboratorBps = collaborators.reduce(
    (sum, item) => sum + percentageToBps(item.percentage),
    0,
  );
  const creatorPercentage = Math.max(0, (10_000 - collaboratorBps) / 100);

  function updateCollaborator(
    index: number,
    key: keyof Collaborator,
    value: string,
  ) {
    setCollaborators((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  async function createCampaign(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!address || !image) return;
    if (chainId !== ACTIVE_CHAIN.id) {
      setError("Switch your wallet to Polygon mainnet.");
      return;
    }
    if (
      !STORAGE_API_URL ||
      TIP_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000"
    ) {
      setError(
        "Campaign publishing will activate after the audited vault deployment.",
      );
      return;
    }

    const normalizedSlug = normalizeSlug(slug);
    if (normalizedSlug.length < 3) {
      setError(
        "Choose a campaign slug with at least three letters or numbers.",
      );
      return;
    }
    let goalAmount: bigint;
    try {
      goalAmount = parseUnits(goal, 18);
      if (goalAmount <= 0n) throw new Error();
    } catch {
      setError("Enter a valid campaign goal.");
      return;
    }
    if (collaboratorBps >= 10_000) {
      setError(
        "The creator must retain a positive share of every campaign tip.",
      );
      return;
    }

    const publishingWallet = getAddress(address);
    const recipientSet = new Set<string>([publishingWallet.toLowerCase()]);
    const collaboratorAddresses: Address[] = [];
    const collaboratorShares: number[] = [];
    for (const collaborator of collaborators) {
      if (!isAddress(collaborator.address)) {
        setError("Every collaborator needs a valid Polygon wallet address.");
        return;
      }
      const collaboratorAddress = getAddress(collaborator.address);
      const key = collaboratorAddress.toLowerCase();
      const share = percentageToBps(collaborator.percentage);
      if (recipientSet.has(key) || share <= 0) {
        setError("Collaborator wallets must be unique with a positive share.");
        return;
      }
      recipientSet.add(key);
      collaboratorAddresses.push(collaboratorAddress);
      collaboratorShares.push(share);
    }

    setUploading(true);
    try {
      const metadata = {
        version: 1 as const,
        kind: "campaign" as const,
        slug: normalizedSlug,
        title: title.trim(),
        description: description.trim(),
        goal: goalAmount.toString(),
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
        throw new Error(result.error || "Campaign metadata upload failed.");
      }

      writeContract({
        address: TIP_VAULT_ADDRESS,
        abi: tipVaultAbi,
        functionName: "createCampaign",
        args: [
          keccak256(stringToBytes(normalizedSlug)),
          [publishingWallet, ...collaboratorAddresses],
          [10_000 - collaboratorBps, ...collaboratorShares],
          result.metadataURI,
        ],
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The campaign could not be created.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="button primary">
          <Plus size={16} />
          New campaign
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content profile-dialog">
          <div className="dialog-icon">
            <Users size={22} />
          </div>
          <Dialog.Title>Create split campaign</Dialog.Title>
          <Dialog.Description>
            Campaign metadata lives on IPFS. Polygon automatically allocates
            each vault tip using the shares below.
          </Dialog.Description>
          <form onSubmit={createCampaign}>
            <label className="profile-image-input">
              {imagePreview ? (
                <img src={imagePreview} alt="Campaign preview" />
              ) : (
                <ImagePlus size={20} />
              )}
              <span>{image ? image.name : "Choose campaign cover"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                onChange={(event) => setImage(event.target.files?.[0])}
              />
            </label>
            <div className="profile-form-grid">
              <label>
                <span>Campaign title</span>
                <input
                  required
                  maxLength={100}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                <span>Campaign slug</span>
                <input
                  required
                  minLength={3}
                  maxLength={32}
                  placeholder="self-custody-kit"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </label>
              <label className="full">
                <span>Goal in fxVERSE</span>
                <input
                  required
                  inputMode="decimal"
                  placeholder="100000"
                  value={goal}
                  onChange={(event) =>
                    setGoal(event.target.value.replace(/[^0-9.]/g, ""))
                  }
                />
              </label>
              <label className="full">
                <span>Description</span>
                <textarea
                  required
                  maxLength={1_000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </div>
            <div className="split-editor">
              <div>
                <strong>Collaborator split</strong>
                <span>Creator receives {creatorPercentage}%</span>
              </div>
              {collaborators.map((collaborator, index) => (
                <div className="split-row" key={index}>
                  <input
                    aria-label={`Collaborator ${index + 1} wallet`}
                    placeholder="0x collaborator wallet"
                    value={collaborator.address}
                    onChange={(event) =>
                      updateCollaborator(index, "address", event.target.value)
                    }
                  />
                  <input
                    aria-label={`Collaborator ${index + 1} percentage`}
                    inputMode="decimal"
                    placeholder="10%"
                    value={collaborator.percentage}
                    onChange={(event) =>
                      updateCollaborator(
                        index,
                        "percentage",
                        event.target.value.replace(/[^0-9.]/g, ""),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove collaborator ${index + 1}`}
                    onClick={() =>
                      setCollaborators((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {collaborators.length < 7 && (
                <button
                  type="button"
                  className="add-collaborator"
                  onClick={() =>
                    setCollaborators((current) => [
                      ...current,
                      { address: "", percentage: "" },
                    ])
                  }
                >
                  <Plus size={14} /> Add collaborator
                </button>
              )}
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
                <Plus size={16} />
              )}
              {uploading
                ? "Signing and uploading"
                : isPending
                  ? "Confirm in wallet"
                  : receipt.isLoading
                    ? "Creating on Polygon"
                    : "Create campaign"}
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

function percentageToBps(value: string) {
  const percentage = Number(value);
  return Number.isFinite(percentage) ? Math.round(percentage * 100) : 0;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uploadMessage(input: {
  wallet: Address;
  contentHash: Hex;
  issuedAt: number;
}) {
  return [
    "Publish public VerseTip metadata",
    `Wallet: ${input.wallet}`,
    "Kind: campaign",
    `Content hash: ${input.contentHash}`,
    `Issued at: ${input.issuedAt}`,
    "Chain ID: 137",
  ].join("\n");
}
