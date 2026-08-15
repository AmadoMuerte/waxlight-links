# Deployment

Waxlight Links runs behind any TLS reverse proxy. Docker exposes it only on `127.0.0.1:4321`.

```text
Internet -> DNS/Cloudflare (optional) -> Caddy or nginx :443 -> 127.0.0.1:4321 -> Docker
```

## 1. Prepare the VPS

Use a supported Linux distribution and install Docker Engine plus the Docker Compose plugin using Docker's official installation documentation. Then create a restricted deployment user and its directory:

```sh
sudo adduser --disabled-password --gecos "" waxlight-deploy
sudo usermod -aG docker waxlight-deploy
sudo install -d -o waxlight-deploy -g waxlight-deploy /opt/waxlight-links
sudo install -d -m 700 -o waxlight-deploy -g waxlight-deploy /home/waxlight-deploy/.ssh
```

Add only the GitHub Actions deploy public key to `/home/waxlight-deploy/.ssh/authorized_keys`, then validate that it can SSH without a password. Docker group access is privileged; do not use this account for interactive administration.

## 2. Add Compose and configuration

Copy `deploy/docker-compose.yml` from this repository to `/opt/waxlight-links/docker-compose.yml`. Create `/opt/waxlight-links/.env` owned by `waxlight-deploy`:

```dotenv
PUBLIC_BASE_URL=https://waxlight.by
WAXLIGHT_PROTOCOL=waxlight
WAXLIGHT_GITHUB_REPOSITORY=AmadoMuerte/Waxlight-launcher
MODDB_API_BASE_URL=https://mods.vintagestory.at/api
PORT=4321
```

Initial pull and start:

```sh
sudo -u waxlight-deploy -H sh -c 'cd /opt/waxlight-links && docker compose pull && docker compose up -d --remove-orphans'
curl --fail http://127.0.0.1:4321/healthz
```

Expected response:

```json
{ "status": "ok" }
```

Logs and state:

```sh
sudo -u waxlight-deploy -H sh -c 'cd /opt/waxlight-links && docker compose logs -f'
sudo -u waxlight-deploy -H sh -c 'cd /opt/waxlight-links && docker compose ps'
```

## 3. DNS and HTTPS

Create an `A` record for `waxlight.by` pointing to the VPS public IPv4 address. Add an `AAAA` record only if IPv6 routing and the firewall are configured. Allow inbound TCP 80 and 443; do not expose port 4321 publicly.

### Caddy

`/etc/caddy/Caddyfile`:

```caddy
waxlight.by {
  reverse_proxy 127.0.0.1:4321
}
```

Caddy obtains and renews TLS certificates after DNS resolves and ports 80/443 are reachable.

### nginx

```nginx
server {
    listen 80;
    server_name waxlight.by;
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Obtain a certificate with Certbot or your existing TLS process, then add the standard `listen 443 ssl` server block. TLS terminates at nginx, not this service.

## 4. GitHub Environment Secrets

Create a protected `production` Environment and set:

| Secret               | Value                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `DEPLOY_HOST`        | VPS hostname or IP.                                                                       |
| `DEPLOY_PORT`        | SSH port, usually `22`.                                                                   |
| `DEPLOY_USER`        | `waxlight-deploy`.                                                                        |
| `DEPLOY_SSH_KEY`     | Private key matching `authorized_keys`.                                                   |
| `DEPLOY_PATH`        | `/opt/waxlight-links`.                                                                    |
| `DEPLOY_KNOWN_HOSTS` | Exact host-key line from `ssh-keyscan -H <host>` verified out of band. Prevents SSH MITM. |

`GITHUB_TOKEN` is supplied automatically and publishes to GHCR. No personal access token, password login, or private key is committed.

Push to `main` to publish `ghcr.io/amadomuerte/waxlight-links:sha-<commit>` and deploy it. Deploys are serialized; an already running production deploy is never cancelled.

## Rollback

Pick the previous successful immutable tag from the GitHub package page, then run:

```sh
sudo -u waxlight-deploy -H sh -c 'cd /opt/waxlight-links && IMAGE_TAG=sha-REPLACE_ME docker compose pull && IMAGE_TAG=sha-REPLACE_ME docker compose up -d --remove-orphans'
curl --fail http://127.0.0.1:4321/healthz
```

The automatic workflow fails after showing compose status and recent logs if the post-deploy health check does not become healthy. It deliberately does not guess a rollback image.
