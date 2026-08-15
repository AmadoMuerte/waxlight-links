# Waxlight Links

Small public deep-link pages for [Waxlight Launcher](https://github.com/AmadoMuerte/Waxlight-launcher). No accounts, database, cookies, analytics, or telemetry.

## Supported links

```text
https://waxlight.by/mod/mod-slug
->
waxlight://mod/mod-slug

https://waxlight.by/server/server-address
->
waxlight://server/server-address
```

ModDB and public-server metadata are optional. Pages try the launcher once, while the manual button and download links always remain available.

Server addresses are the identifier: links are not stored in a database and do not map through server IDs. A server link only shows the server in the launcher; the user must explicitly confirm Play.

## Development

```sh
cp .env.example .env
npm ci
npm run dev
```

## Build

```sh
npm run format:check
npm run lint
npm run check
npm test
npm run build
```

## Docker

```sh
docker build -t waxlight-links .
docker run --rm -p 4321:4321 --env-file .env waxlight-links
curl http://127.0.0.1:4321/healthz
```

The production compose example is `deploy/docker-compose.yml`. See [deployment documentation](docs/DEPLOYMENT.md).

## Configuration

| Variable                     | Default                            | Purpose                              |
| ---------------------------- | ---------------------------------- | ------------------------------------ |
| `PUBLIC_BASE_URL`            | `https://waxlight.by`              | Canonical and OpenGraph base URL.    |
| `WAXLIGHT_PROTOCOL`          | `waxlight`                         | The only accepted custom URI scheme. |
| `WAXLIGHT_GITHUB_REPOSITORY` | `AmadoMuerte/Waxlight-launcher`    | Official release source.             |
| `MODDB_API_BASE_URL`         | `https://mods.vintagestory.at/api` | Vintage Story ModDB API.             |
| `PORT`                       | `4321`                             | HTTP listen port.                    |

## Deployment

Docker images are published to `ghcr.io/amadomuerte/waxlight-links` as `latest` and immutable `sha-<commit>` tags. Pushes to `main` deploy the matching SHA image. Required GitHub Environment secrets are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Waxlight Integration Contract

Waxlight Links only opens a page. Waxlight Launcher must register and handle:

```text
waxlight://mod/{modSlug}
waxlight://server/{serverAddress}
```

The launcher must bring an existing process forward or start one, validate and resolve the ModDB slug, open its existing Mod Details page, and use its normal ModDB flow. It must let the user choose an instance and explicitly install the mod.

For a server link, the launcher must validate the address, open Servers and show its Server Details page. It must never launch the game automatically: the user explicitly selects Play and then an instance.

**A deep link must never install a mod or auto-join a server.**
