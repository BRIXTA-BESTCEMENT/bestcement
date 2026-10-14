# Best Cement — website starter and deployment

This repository serves a **temporary, intentionally labeled preview** for `bestcement.co.in` through the existing Cloudflare Tunnel `deb-salesapp-ho`. It is NOT the finished corporate site.

## 1. Publish to GitHub from your Mac

Download/extract this project, then run these commands **in the extracted project directory**:

```bash
# Check the GitHub account you intend to publish under.
gh auth status

git init -b main
git add .
git commit -m "Initial Best Cement website preview"
# Easiest for a website without private credentials: public source repository.
gh repo create bestcement-website --public --source=. --remote=origin --push
```

The project must not contain secret keys, tokens, or private company information. To keep source private, choose `--private` instead, then configure a read-only deploy key on the Debian machine before `git clone` (not covered in the quick-start).

## 2. Deploy to the Debian machine carrying deb-salesapp-ho

```bash
ssh debian@100.103.134.95
sudo ss -ltnp | grep ':8090 ' || true
# Confirm that an existing tunnel route (55001) points to THIS machine:
curl -I --max-time 5 http://127.0.0.1:55001 || true
# Replace OWNER with the user/org who owns the GitHub repository:
git clone https://github.com/OWNER/bestcement-website.git ~/bestcement-website
cd ~/bestcement-website
docker compose up -d
curl -I --max-time 5 http://127.0.0.1:8090
```

`compose.yaml` binds port 8090 **only** to `127.0.0.1` and uses the distinct name `bestcement-preview`. Do not modify `~/bestcement/appserver`, `~/bestcement/dashboard`, or any existing containers.

## 3. Preview route — NO existing website cutover yet

In the account whose Cloudflare DNS zone for `bestcement.co.in` is **active**, navigate to **Networking > Tunnels > deb-salesapp-ho > Routes > Add route > Published application**:

- Hostname: `preview.bestcement.co.in`
- Service type: HTTP
- Service URL: `http://localhost:8090`

This requires a healthy connector on the same host (or with reachability to that host). Check that `https://preview.bestcement.co.in` displays **NEW WEBSITE TEST BUILD**. Ensure the zone's assigned nameservers match the authoritative NS records before proceeding.

## 4. Apex cutover (after preview works)

1. Back up DNS records, including all apex A/AAAA/CNAME records, `www` and all MX/TXT/email authentication records. Check the existing published application routes **including the collapsed + more entries**; if an apex route already exists, **edit it** instead of adding another.
2. Keep **all other Cloudflare tunnel routes** (including `dashboard.bestcement.co.in` and `appbackend.bestcement.co.in`) unchanged.
3. At cutover, remove/replace **only** conflicting apex website A/AAAA/CNAME records; never remove apex MX/TXT records or other unrelated records.
4. Add/update the apex (`bestcement.co.in`, blank subdomain) Published application route, pointing to `http://localhost:8090`. Leave `www` unchanged unless you want to cut over that name too, in which case give it a separate route.
5. Verify root HTTPS, preview, dashboard, backend, and email operation. Keep DNS backup for rollback.

The old public homepage will be replaced by the marked preview. Do not make the cutover without explicit approval from the authorized website administrator and a suitable launch window.

## 5. Updating the site

Changes inside `site/` take effect in the running Nginx container once the server clone gets the newest files. In GitHub, `.github/workflows/validate.yml` validates on push and PR. On Debian, after the GitHub push:

```bash
cd ~/bestcement-website
./scripts/update.sh
```

The updater requires a clean `main` checkout, performs `git pull --ff-only`, runs `docker compose up -d --no-deps`, and checks the local web endpoint. Review and test every update before running the updater on the production site.

### Included files

- `site/`: HTML, CSS, JS (preview uses `noindex,nofollow`)
- `nginx/default.conf`: Nginx configuration
- `compose.yaml`: dedicated website container bound to localhost:8090
- `.github/workflows/validate.yml`: GitHub Actions validation
- `scripts/check_site.py`: standard-library asset and anchor validator
- `scripts/update.sh`: update script for a dedicated server clone

For a real corporate launch, replace preview copy, graphics and contact details with approved content, enable indexing, and test the final site before switching the apex domain.
