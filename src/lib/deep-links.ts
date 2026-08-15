import { config } from "./config";

const modIdPattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const hostnamePattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const ipv4Pattern = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const maxServerAddressLength = 259;

export function isValidModId(value: string | undefined): value is string {
  return Boolean(value && modIdPattern.test(value));
}

export function modDeepLink(modId: string) {
  if (!isValidModId(modId)) throw new Error("Invalid mod ID");
  return `${config.protocol}://mod/${encodeURIComponent(modId)}`;
}

export function normalizeServerAddress(value: string | undefined) {
  const address = value?.trim();
  if (!address || address.length > maxServerAddressLength || /[/?#@\\\s]/.test(address)) {
    return undefined;
  }

  const match = /^(.*?)(?::(\d{1,5}))?$/.exec(address);
  if (!match) return undefined;
  const [, host, port] = match;
  if (!host || (!hostnamePattern.test(host) && !ipv4Pattern.test(host))) return undefined;
  if (port && (Number(port) < 1 || Number(port) > 65_535)) return undefined;
  return `${host.toLowerCase()}${port ? `:${Number(port)}` : ""}`;
}

export function isValidServerAddress(value: string | undefined): value is string {
  return normalizeServerAddress(value) !== undefined;
}

export function serverDeepLink(address: string) {
  const normalized = normalizeServerAddress(address);
  if (!normalized) throw new Error("Invalid server address");
  return `${config.protocol}://server/${encodeURIComponent(normalized)}`;
}
