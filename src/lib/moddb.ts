import { TtlCache } from "./cache";
import { config } from "./config";

export interface ModMetadata {
  id: string;
  name: string;
  author: string;
  summary: string;
  imageUrl?: string;
  latestVersion?: string;
  moddbUrl: string;
}

interface ModDbResponse {
  statuscode?: string;
  mod?: {
    name?: string;
    text?: string;
    author?: string;
    urlalias?: string;
    logfile?: string;
    logofile?: string;
    releases?: Array<{ modversion?: string }>;
  };
}

const cache = new TtlCache<ModMetadata | undefined>();
const timeoutMs = 4_000;
const maxReplyBytes = 16 * 1024 * 1024;

function safeHttpsUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

async function fetchMetadata(id: string): Promise<ModMetadata | undefined> {
  const response = await fetch(`${config.moddbApiBaseUrl}/mod/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return undefined;
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxReplyBytes) return undefined;
  const body = await response.text();
  if (body.length > maxReplyBytes) return undefined;

  const parsed = JSON.parse(body) as ModDbResponse;
  const mod = parsed.statuscode === "200" ? parsed.mod : undefined;
  if (!mod) return undefined;
  const slug = text(mod.urlalias, 64) || id;
  return {
    id: slug,
    name: text(mod.name, 120) || id,
    author: text(mod.author, 120),
    summary: text(mod.text, 400),
    imageUrl: safeHttpsUrl(mod.logofile),
    latestVersion: text(mod.releases?.[0]?.modversion, 80) || undefined,
    moddbUrl: `https://mods.vintagestory.at/${encodeURIComponent(slug)}`,
  };
}

export async function getModMetadata(id: string) {
  try {
    return await cache.get(id, 20 * 60_000, () => fetchMetadata(id));
  } catch {
    return undefined;
  }
}
