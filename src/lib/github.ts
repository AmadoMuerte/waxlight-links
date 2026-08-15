import { TtlCache } from "./cache";
import { config } from "./config";

export interface DownloadAsset {
  label: string;
  url: string;
  platform: "windows" | "linux";
  primary?: boolean;
}

interface ReleaseResponse {
  html_url?: string;
  assets?: Array<{ name?: string; browser_download_url?: string }>;
}

const cache = new TtlCache<{ latestUrl: string; assets: DownloadAsset[] }>();

function classifyAsset(name: string, url: string): DownloadAsset | undefined {
  const lower = name.toLowerCase();
  if (lower.endsWith(".exe") && lower.includes("installer")) {
    return { label: "Windows installer", url, platform: "windows", primary: true };
  }
  if (lower.endsWith(".zip") && (lower.includes("portable") || lower.includes("windows"))) {
    return { label: "Windows portable (.zip)", url, platform: "windows" };
  }
  if (lower.endsWith(".deb"))
    return { label: "Linux (.deb)", url, platform: "linux", primary: true };
  if (lower.endsWith(".rpm")) return { label: "Linux (.rpm)", url, platform: "linux" };
  if (lower.endsWith(".tar.gz")) return { label: "Linux (.tar.gz)", url, platform: "linux" };
}

async function fetchRelease() {
  const latestUrl = `https://github.com/${config.githubRepository}/releases/latest`;
  const response = await fetch(
    `https://api.github.com/repos/${config.githubRepository}/releases/latest`,
    {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "waxlight-links" },
      signal: AbortSignal.timeout(4_000),
    },
  );
  if (!response.ok) return { latestUrl, assets: [] };
  const release = (await response.json()) as ReleaseResponse;
  return {
    latestUrl: release.html_url || latestUrl,
    assets: (release.assets || []).flatMap((asset) => {
      if (!asset.name || !asset.browser_download_url) return [];
      const download = classifyAsset(asset.name, asset.browser_download_url);
      return download ? [download] : [];
    }),
  };
}

export async function getDownloads() {
  try {
    return await cache.get("latest", 10 * 60_000, fetchRelease);
  } catch {
    return {
      latestUrl: `https://github.com/${config.githubRepository}/releases/latest`,
      assets: [],
    };
  }
}
