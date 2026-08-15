const defaultBaseUrl = "https://waxlight.by";

function configuredUrl(value: string | undefined, fallback: string) {
  try {
    return new URL(value || fallback).origin;
  } catch {
    return fallback;
  }
}

export const config = {
  baseUrl: configuredUrl(process.env.PUBLIC_BASE_URL, defaultBaseUrl),
  githubRepository: process.env.WAXLIGHT_GITHUB_REPOSITORY || "AmadoMuerte/Waxlight-launcher",
  moddbApiBaseUrl: (process.env.MODDB_API_BASE_URL || "https://mods.vintagestory.at/api").replace(
    /\/$/,
    "",
  ),
  protocol: process.env.WAXLIGHT_PROTOCOL === "waxlight" ? "waxlight" : "waxlight",
};
