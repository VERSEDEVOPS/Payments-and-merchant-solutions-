import {
  handleStorageUpload,
  json,
  readAddressedObject,
  type StorageEnv,
} from "./storage";
import { RelayerCoordinator, routeClaimRelay, type ClaimEnv } from "./claim";
import { isRawCidv1 } from "./cid";

interface Env extends StorageEnv, ClaimEnv {}

export { RelayerCoordinator };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!isAllowedOrigin(request, env)) {
      return json({ error: "Origin not allowed." }, 403);
    }
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    let response: Response;
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        response = json({
          ok: true,
          service: "versetip-api",
          storage: env.METADATA_BUCKET ? "ready" : "unconfigured",
          relayer: env.RELAYER_PRIVATE_KEY ? "ready" : "unconfigured",
        });
      } else if (request.method === "GET" && url.pathname.startsWith("/ipfs/")) {
        const cid = url.pathname.slice("/ipfs/".length);
        response = isRawCidv1(cid)
          ? await readAddressedObject(env, cid)
          : json({ error: "Not found." }, 404);
      } else if (
        request.method === "POST" &&
        url.pathname === "/v1/storage/upload"
      ) {
        response = await handleStorageUpload(request, env);
      } else if (
        request.method === "POST" &&
        url.pathname === "/v1/claims/relay"
      ) {
        response = await routeClaimRelay(request, env);
      } else {
        response = json({ error: "Not found." }, 404);
      }
    } catch (error) {
      console.error("request_failed", error);
      response = json({ error: "The request could not be completed." }, 500);
    }

    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  },
};

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers":
      "content-type, x-versetip-wallet, x-versetip-signature, x-versetip-issued-at",
    vary: "origin",
  };
  if (origin && allowedOrigins(env).has(origin)) {
    headers["access-control-allow-origin"] = origin;
  }
  return headers;
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins(env).has(origin);
}

function allowedOrigins(env: Env): Set<string> {
  return new Set(
    env.ALLOWED_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}
