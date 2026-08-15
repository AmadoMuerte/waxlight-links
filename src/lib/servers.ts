import { TtlCache } from "./cache";
import { normalizeServerAddress } from "./deep-links";

export interface ServerMetadata {
  name: string;
  address: string;
  description: string;
  players: number;
  modCount: number;
  requiresWhitelist: boolean;
  passwordProtected: boolean;
  joinable: boolean;
}

const catalogUrl = "https://servers.vintagestory.at/";
const timeoutMs = 4_000;
const maxReplyBytes = 4 * 1024 * 1024;
const cache = new TtlCache<ServerMetadata[]>();

function text(value: string, maxLength: number) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|#38);/gi, "&")
    .replace(/&(?:lt|#60);/gi, "<")
    .replace(/&(?:gt|#62);/gi, ">")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function serverBlocks(html: string) {
  const blocks: string[] = [];
  const start = /<div\b[^>]*\bclass=(['"])server\1[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = start.exec(html))) {
    const from = match.index;
    const tags = /<\/?div\b[^>]*>/gi;
    tags.lastIndex = start.lastIndex;
    let depth = 1;
    let tag: RegExpExecArray | null;
    while ((tag = tags.exec(html))) {
      depth += tag[0].startsWith("</") ? -1 : 1;
      if (depth === 0) {
        blocks.push(html.slice(from, tags.lastIndex));
        start.lastIndex = tags.lastIndex;
        break;
      }
    }
  }
  return blocks;
}

export function parseServerCatalog(html: string): ServerMetadata[] {
  return serverBlocks(html).flatMap((block) => {
    const link = /<a\b[^>]*\bhref=(['"])vintagestoryjoin:\/\/([^'"]+)\1[^>]*>([\s\S]*?)<\/a>/i.exec(
      block,
    );
    if (!link) return [];
    const address = normalizeServerAddress(text(link[2], 259));
    if (!address) return [];
    const players = /<b>\s*(\d+)\s+players?\s*<\/b>/i.exec(block);
    const mods = /<img\b[^>]*\btitle=(['"])(\d+)\s+mods?\s+installed\1/i.exec(block);
    const description = /<div\b[^>]*\bclass=(['"])serverdesc\1[^>]*>([\s\S]*?)<\/div>/i.exec(block);
    return [
      {
        name: text(link[3], 120) || address,
        address,
        description: text(description?.[2] || "", 500),
        players: Number(players?.[1] || 0),
        modCount: Number(mods?.[2] || 0),
        requiresWhitelist: /title=(['"])whitelisted players only\1/i.test(block),
        passwordProtected: /title=(['"])password protected\1/i.test(block),
        joinable: true,
      },
    ];
  });
}

async function fetchCatalog() {
  const response = await fetch(catalogUrl, {
    headers: { Accept: "text/html" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return [];
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxReplyBytes) return [];
  const body = await response.text();
  return body.length > maxReplyBytes ? [] : parseServerCatalog(body);
}

export async function getServerMetadata(address: string) {
  try {
    const servers = await cache.get("official-catalog", 5 * 60_000, fetchCatalog);
    return servers.find((server) => server.address === address);
  } catch {
    return undefined;
  }
}
