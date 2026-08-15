import { config } from "./config";

const modIdPattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function isValidModId(value: string | undefined): value is string {
  return Boolean(value && modIdPattern.test(value));
}

export function modDeepLink(modId: string) {
  if (!isValidModId(modId)) throw new Error("Invalid mod ID");
  return `${config.protocol}://mod/${encodeURIComponent(modId)}`;
}
