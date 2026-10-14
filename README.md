# BESTCEMENT.CO.IN — Domain Recovery, Website Deployment & Debian IPv4 Repair

**Incident / deployment date:** Wednesday, 14 October 2026 (India Standard Time, UTC+05:30)  
**Project:** Best Cement website, `bestcement.co.in`  
**Source of record:** The terminal output, screenshots, DNS-zone exports and NCLT order shared during today's session.  
**Document type:** Technical incident report, deployment history and operational runbook.  
**Status at the end of the session:** **Apex domain confirmed serving the new CIRP website; `www` hostname returning 404 and not yet resolved.**

> **Scope and authority:** This records the technical changes and tests reported during the session. Technical access to a domain or server is not, by itself, proof of legal authority to issue corporate notices. Publication of any notice presented as a communication of J.U.D. Cements Limited during CIRP should be approved by the appointed IRP or another duly authorized person.

---

## 1. Executive summary

We set out to replace the existing Best Cement corporate homepage at **`https://bestcement.co.in`** with a website hosted from an accessible Debian server and maintained from GitHub. The replacement initially failed for **three independent reasons**, all of which had to be investigated:

1. **DNS and tunnel routing:** The apex domain still had a proxied **A record to `148.135.143.126`**, the previous website origin, despite existing Cloudflare Tunnel routes for related application subdomains.
2. **Debian outbound IPv4:** The Debian host had a **stale, manually configured IP/gateway (`192.168.20.250/24` via `192.168.20.1`)**, while DHCP on the actual LAN offered **`192.168.29.192/24` via `192.168.29.1`**. This prevented connectivity to GitHub Container Registry (GHCR).
3. **Registry authorization:** After fixing IPv4, `docker compose pull` reached GHCR but returned `unauthorized` because the container package was private and the organization restricted creation/publication of public packages. The workflow was successful; the repository being public did **not** make the container package public.

The website was ultimately running in a Docker container on Debian, and the apex DNS record was changed from the previous origin IP to a CNAME pointing to the existing Cloudflare Tunnel. A public HTTPS fetch of `bestcement.co.in` returned the new CIRP notice markup, and a Mac-side HEAD request returned HTTP 200. **That establishes a successful apex-domain cutover.**

A subsequent browser screenshot showed **`https://www.bestcement.co.in/` returning HTTP 404**. The `www` record was still a CNAME alias of the apex, but the tunnel had been configured for the **apex hostname**; a separate `www` published application route or a well-verified canonical redirect remains to be configured.

---

## 2. Infrastructure and identifiers

| Component | Confirmed details |
|---|---|
| Apex domain | `bestcement.co.in` |
| Domain registrar interface | Sysmic (domain registration screenshot) |
| DNS provider | Cloudflare |
| Authoritative nameservers | `benedict.ns.cloudflare.com`, `emily.ns.cloudflare.com` |
| Cloudflare account used for the existing tunnel | Account shown as **Brixtamail** in screenshots |
| Cloudflare Tunnel | `deb-salesapp-ho` |
| Tunnel UUID / CNAME destination | `43514652-8489-4883-a5ee-ae67707987ec.cfargotunnel.com` |
| Hosting machine | Debian, accessed as `debian@100.103.134.95` over Tailscale |
| Local website | `http://127.0.0.1:8090/` |
| Docker container | `bestcement-website` |
| Container image | `ghcr.io/brixta-bestcement/bestcement:latest` |
| Deployment directory | `/home/debian/bestcement/website` |
| Existing directories preserved | `/home/debian/bestcement/appserver`, `/home/debian/bestcement/dashboard` |
| GitHub repository | `https://github.com/BRIXTA-BESTCEMENT/bestcement` |
| Main Git branch | `main` |
| Local Mac source folder | `~/bestcement-site-starter-verified` |
| Existing related hostnames | `dashboard.bestcement.co.in`, `appbackend.bestcement.co.in` |

**Important distinction:** Another computer, previously used for BRIXTA and other sites, ran a separately managed tunnel called `brixta-secure-tunnel`. We did **not** repurpose it. The relevant Best Cement infrastructure was on the second Debian machine, behind `deb-salesapp-ho`.

---

## 3. Chronological event log

The following milestones are ordered as they occurred in the conversation. Screenshot clock times are included where available; other times are approximate or not established.

### A. Established domain access and investigated Cloudflare (late morning to early afternoon)

1. **Opened the Sysmic registrar dashboard.** It showed registration for `bestcement.co.in`, with a renewal/expiry date displayed as **31 August 2027**. We distinguished domain registration from website hosting and DNS management.
2. **Considered hosting on a Debian home server.** The initial proposal used the existing locally configured `brixta-secure-tunnel`, which had a `cloudflared` YAML config and hosted other domains. We later learned that this was **not** the Best Cement tunnel.
3. **Queried DNS nameservers:**
   ```bash
   dig +short NS bestcement.co.in
   # benedict.ns.cloudflare.com.
   # emily.ns.cloudflare.com.
   ```
   This proved DNS was delegated to Cloudflare, but nameservers alone do **not** identify which Cloudflare account owns a zone.
4. **Visited more than one Cloudflare login/account.** One account showed the domain-add/import flow and automatically discovered DNS records. The later screenshots located the relevant existing domain/tunnel under the **Brixtamail** account. A planned registrar nameserver change became unnecessary once the correct, existing account was found.
5. **Found the existing tunnel:** `deb-salesapp-ho`, on its **Routes** tab. Screenshots showed existing published applications including:
   - `dashboard.bestcement.co.in` → `http://localhost:55001`
   - `appbackend.bestcement.co.in` → `http://localhost:55000`
   - Other independent domain routes, including Eurofoam and Dulfer-related sites.
6. **Obtained SSH access to the server on which this tunnel runs:**
   ```bash
   ssh debian@100.103.134.95
   ```
   In `/home/debian/bestcement`, the existing directories were `appserver/` and `dashboard/`. We decided to leave them untouched and host the public website separately.

### B. Created and published the website repository (afternoon)

7. **Prepared a static starter site**, with HTML, CSS and JavaScript, Nginx, Docker Compose, a site-validation script, a deployment/update script and a GitHub Actions validation workflow.
8. **Initialized Git and pushed the repository** from the Mac:
   ```bash
   cd ~/bestcement-site-starter-verified
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/BRIXTA-BESTCEMENT/bestcement.git
   git push -u origin main
   ```
   The initial commit was **`cd42db3`**. The terminal confirmed creation of remote branch `main`.
9. **Added a Dockerfile and GHCR publishing workflow.** The workflow built a Linux container image tagged `ghcr.io/brixta-bestcement/bestcement:latest` and a commit-SHA tag, with a GitHub-provided Actions token for package publication. GitHub Actions screenshots showed both **Build and Publish Best Cement** and **Validate Best Cement site** succeeding for commit **`2f0f913`**.
10. **Created an isolated deployment** at `/home/debian/bestcement/website/compose.yaml`, binding Nginx to **`127.0.0.1:8090:80`** so as not to claim ports 80/443 or disrupt other services. Docker inspection showed no port 8090 listener at that point.

### C. Discovered Docker pull failures and diagnosed Debian networking

11. **First registry pull failed at the network layer:**
   ```text
   dial tcp 20.207.73.86:443: connect: no route to host
   ```
   `curl -4` to both `github.com` and `ghcr.io` failed to connect over HTTPS. This was **not** an SSL certificate failure: the TCP connection could not be established in the first place.
12. **Inspected the route:**
   ```text
   20.207.73.86 via 192.168.20.1 dev enp1s0 src 192.168.20.250
   ```
   The host had a route, but its gateway was unreachable. `ping -c 3 192.168.20.1`, `ping -c 3 1.1.1.1` and `arping -I enp1s0 -c 3 192.168.20.1` all failed. `ip neigh` showed **`192.168.20.1 FAILED`**.
13. **Confirmed Ethernet physical link was present.** `enp1s0` was `UP, LOWER_UP`, carrier returned `1`, and the machine had working IPv6 addresses. This indicated an IPv4 LAN-configuration problem rather than a physically disconnected Ethernet cable.
14. **Confirmed IPv6 worked:**
   ```bash
   ping -6 -c 3 2606:4700:4700::1111
   # 3 transmitted, 3 received, 0% packet loss
   ```
   IPv6 default route was via `fe80::8e83:94ff:fee7:5bb0`, with router MAC `8c:83:94:e7:5b:b0`.
15. **Investigated DNS symptoms.** `/etc/resolv.conf` was generated by Tailscale and listed resolvers `100.100.100.100` and `fd7a:115c:a1e0::53`. Normal `curl -6` hostname resolution initially failed, while explicitly querying Cloudflare's IPv6 DNS resolved A records:
   ```text
   github.com A → 20.207.73.82
   ghcr.io   A → 20.207.73.86
   ```
   An empty AAAA response for GHCR is **not** proof that DNS is broken; the central blocker for reaching GHCR over IPv4 was the broken IPv4 gateway.
16. **Inspected the running Cloudflare daemon.** `cloudflared.service` was active and token-managed. Its logs showed an IPv6 QUIC tunnel connection successfully registered with Cloudflare at approximately **13:06 IST**. Repeated origin errors referred to **`eurofoam.in` on localhost port 55002**, not Best Cement. A daemon being `active` does not by itself prove that every public route or its origin is healthy.
17. **Read the static IPv4 profile:**
   ```text
   Connection: Wired connection 1
   ipv4.method: manual
   Address: 192.168.20.250/24
   Gateway: 192.168.20.1
   IPv4 DNS: 8.8.8.8, 1.1.1.1 (in NetworkManager profile)
   ```
18. **Spotted, but did not initially verify, a gateway clue.** An IPv6 router address ended with `c0a8:1d01`, corresponding to IPv4-like bytes `192.168.29.1`. A plain ARP probe for `192.168.29.1` from `192.168.20.250` had no response, so the clue was not treated as conclusive.
19. **Discovered BusyBox DHCP client (`udhcpc`) was available.** The machine lacked `nmap`, `dhclient` and `tcpdump`, but had `busybox udhcpc`. A temporary DHCP event script printed an offered lease without changing the live interface configuration:
   ```text
   udhcpc: broadcasting select for 192.168.29.192, server 192.168.29.1
   lease of 192.168.29.192 obtained from 192.168.29.1
   IP Offered: 192.168.29.192
   Subnet: 255.255.255.0
   Router: 192.168.29.1
   DNS: 192.168.29.1
   ```
   **This was the decisive root-cause evidence:** the LAN was on `192.168.29.0/24`, while the server remained manually configured for `192.168.20.0/24`.
20. **Tested the new subnet without initially removing the old address.** The temporary address `192.168.29.192/24` was added on `enp1s0`. A ping sourced from that address to `192.168.29.1` succeeded **3/3** with approximately **1.53 ms** average latency.

### D. Safely repaired IPv4 with NetworkManager

21. **Cloned the original connection profile** instead of overwriting it:
   ```bash
   sudo nmcli connection clone "Wired connection 1" "Wired DHCP"
   sudo nmcli connection modify "Wired DHCP" \
     ipv4.method auto \
     ipv4.addresses "" \
     ipv4.gateway "" \
     ipv4.dns "" \
     connection.autoconnect no
   ```
22. **Activated the DHCP profile using a rollback checkpoint:**
   ```bash
   sudo nmcli device checkpoint --timeout 180 enp1s0 -- \
     nmcli connection up "Wired DHCP" ifname enp1s0
   ```
   The console reported **Connection successfully activated** and the operator entered `Yes` at the checkpoint confirmation prompt.
23. **Verified the actual post-change state:**
   ```text
   enp1s0: 192.168.29.192/24 (dynamic)
   default via 192.168.29.1 dev enp1s0 proto dhcp
   ping -4 1.1.1.1: 3/3 packets received
   curl -4 -I https://ghcr.io/v2/: HTTP/2 405
   ```
   The GHCR `405` reply proved that the HTTPS endpoint was reachable; it reflected the HTTP method on `/v2/`, **not** a TLS/network failure. No further gateway correction was needed.
24. **Post-repair persistence was recommended but not independently verified:** enable `connection.autoconnect yes` for `Wired DHCP`, and disable autoconnect for the old static `Wired connection 1`. See the outstanding verification checklist below.

### E. Solved the GHCR and Docker deployment stages

25. **The next `docker compose pull` reached GHCR but returned `unauthorized`.** This was a new, application-level permission issue—not the old network problem.
26. **Checked GitHub Actions:** publishing and validation jobs were green. This showed the image build/publish job had succeeded, but did not by itself prove the Debian host could pull the package anonymously.
27. **Checked the organization Packages page.** `BRIXTA-BESTCEMENT` listed one `bestcement` **Private** container package even though the source repository was **Public**. The package visibility dialog said **Public was disabled by organization administrators**. Organization-level package-creation/visibility settings or authenticated registry access were identified as the resolution paths.
28. **Successful running image was subsequently verified.** The transcript does **not** include the exact final authorization-setting change or the successful pull log, so this report does not assert whether access was fixed by package-publication policy or registry login. The server later demonstrably ran the intended GHCR-tagged image:
   ```text
   NAME                IMAGE
   bestcement-website  ghcr.io/brixta-bestcement/bestcement:latest
   STATUS: Up
   PORTS: 127.0.0.1:8090->80/tcp
   ```
29. **Validated live local content:**
   ```bash
   curl -sS http://127.0.0.1:8090/ | head -35
   ```
   The result contained `<title>J.U.D. Cements Limited | CIRP Information</title>`, plus the CIRP notice hero and order description. Docker and local Nginx were therefore correctly serving the updated files.

### F. Replaced the homepage with CIRP information

30. **Reviewed the supplied 27-page NCLT order** rather than guessing legal information. Its operative order is **NCLT Guwahati Bench, CP (IB)/40/GB/2026, pronounced and signed 12 October 2026**. It states that **J.U.D. Cements Limited** (not “JUD Cements Pvt Ltd”) was admitted into CIRP, with commencement effective that day, and a Section 14 moratorium.
31. **Identified the IRP:** **Mr. Avishek Gupta**, registration **IBBI/IPA-003/IP-NP00135/2017-2018/11499**, email shown in the order as `avishek@optimusresolution.net`.
32. **Replaced the static homepage** with a styled, responsive CIRP information page. It presented the company name, tribunal, case number, order date, CIRP status, IRP details, stakeholder caveat and the requested footer wording **“DESIGNED AND CREATION OF BRIXTA CORPORATION”**. The website itself was verified locally by its notice heading; the footer text was written into the source, but no separate public footer check was captured.
33. **Pushed the updated website via GitHub and GHCR deployment workflow.** A later `git add .`, `git commit`, `git push` output reported **nothing to commit / everything up-to-date**, so that particular later command did not change the site again.

### G. Corrected the apex DNS and proved public cutover

34. **Exported DNS before the cutover.** The earlier zone export contained:
   ```dns
   bestcement.co.in.  A  148.135.143.126        ; proxied
   appbackend.bestcement.co.in. CNAME 43514652-8489-4883-a5ee-ae67707987ec.cfargotunnel.com.
   dashboard.bestcement.co.in.  CNAME 43514652-8489-4883-a5ee-ae67707987ec.cfargotunnel.com.
   www.bestcement.co.in.        CNAME bestcement.co.in.
   ```
   MX, SPF, DKIM and DMARC records were also present and were to remain unchanged.
35. **Located the real blocker for the old homepage:** the apex A record was still pointed at the old origin. The relevant Cloudflare Tunnel application required a route for exactly `bestcement.co.in` to `http://127.0.0.1:8090`.
36. **Replaced the apex A record with a proxied CNAME/Tunnel record.** The second exported zone showed:
   ```dns
   bestcement.co.in. CNAME 43514652-8489-4883-a5ee-ae67707987ec.cfargotunnel.com. ; proxied
   ```
   The old apex A record was absent. `dashboard`, `appbackend`, `www`, MX and TXT records remained present. Cloudflare's UI labelled the apex entry as type **Tunnel**, linked to `deb-salesapp-ho`; zone export represented it as the flattened/proxied tunnel CNAME.
37. **Verified public delivery of the replacement content:**
   ```bash
   curl -sSL https://bestcement.co.in/ \
     | grep -F "CIRP ADMISSION ORDER PASSED"
   # <div class="status-pill">CIRP ADMISSION ORDER PASSED</div>
   ```
   A separate request from the Mac returned `HTTP/2 200`, `server: cloudflare`, `cf-cache-status: DYNAMIC`. Together these establish the apex was serving the new website over HTTPS.

### H. Subsequent `www` 404 investigation — unresolved

38. **Later browser visit unexpectedly showed `https://www.bestcement.co.in/` and an HTTP 404** even though the user typed or intended `bestcement.co.in`.
39. **Checked the Cloudflare rules UI:** screenshots showed **no Page Rules** and **no Bulk Redirect lists**. This does not rule out a newer **Redirect Rule**, an origin/app redirect, a browser-cached permanent redirect, or a user/browser navigation setting. A server-side apex → `www` redirect was **not proven** in the provided output.
40. **Identified a likely hostname mismatch:** DNS for `www.bestcement.co.in` was an alias of the apex, but Cloudflare Tunnel ingress/published applications match the **incoming HTTP hostname**, and an apex published-application route does not automatically imply a `www` route.
41. **Recommended remediation, not yet confirmed executed:** either add `www.bestcement.co.in` as a separate published application to the same local service on `http://127.0.0.1:8090`, or create a **one-way** Cloudflare `www` → apex redirect after first proving there is no opposing apex → `www` redirect. The screenshots do not show either fix completed.

---

## 4. Root-cause analysis: What was wrong with IPv4?

### Symptom

On the second Debian server, `docker compose pull` failed with `no route to host`, and ordinary `curl` calls to `github.com` and `ghcr.io` over IPv4 could not establish connections. `ping 1.1.1.1` also returned `Destination Host Unreachable`.

### Actual cause — confirmed

NetworkManager was holding a **manual/static IPv4 profile from the old LAN**:

```text
IPv4 address: 192.168.20.250/24
Default gateway: 192.168.20.1
Method: manual
```

The connected router's DHCP service was in a **different subnet**:

```text
Offered IPv4 address: 192.168.29.192/24
Default gateway: 192.168.29.1
DNS offered: 192.168.29.1
Method: DHCP
```

The server's Ethernet remained physically connected, but it could not find the old `192.168.20.1` gateway by ARP. With no reachable IPv4 next hop, IPv4 connections to external sites failed. **The broken configuration was at Layer 3 / local network addressing—not an SSL certificate issue, GHCR outage or Docker engine failure.**

### Why some internet-dependent services appeared to work

IPv6 operated independently of the broken IPv4 gateway. The host could ping `2606:4700:4700::1111` and the existing `cloudflared` process had registered a QUIC tunnel connection over IPv6. This explains how some Cloudflare connectivity could coexist with a failed IPv4 image pull. DNS also showed symptoms because the normal resolver was managed through Tailscale, but direct IPv6 DNS queries worked. DNS-only checks did not fix the broken IPv4 next hop.

### Repair used

- Discovered DHCP offer with **BusyBox `udhcpc`** and a print-only hook.
- Tested temporary `192.168.29.192/24` address against gateway `192.168.29.1` without first removing the old profile.
- Cloned NetworkManager's original profile to **`Wired DHCP`**.
- Changed the cloned profile to `ipv4.method auto`.
- Activated it with a **180-second NetworkManager checkpoint** to protect remote SSH access.
- Confirmed dynamic address, new default route, successful IPv4 ping, and actual HTTPS response from GHCR.

### Why this matters operationally

When routers or VLANs change subnets, servers with manually configured static addresses can silently retain stale gateway details even while Ethernet link state and IPv6 connectivity remain good. Future changes should either reserve a fixed IP via the router's DHCP reservation or coordinate static addressing with the actual LAN subnet and gateway.

---

## 5. DNS before and after

| DNS item | Before | After / final observed |
|---|---|---|
| Apex website | Proxied A `148.135.143.126` | Proxied CNAME/Tunnel → `43514652-8489-4883-a5ee-ae67707987ec.cfargotunnel.com` |
| `appbackend` | Tunnel CNAME | Preserved |
| `dashboard` | Tunnel CNAME | Preserved |
| `www` | CNAME → apex | Preserved as DNS record, but HTTP route returned 404 |
| Authoritative nameservers | Benedict / Emily (Cloudflare) | Unchanged |
| MX for apex | IceWarp/Immenzaces mail cluster hosts | Preserved |
| `send` MX | Amazon SES feedback host | Preserved |
| SPF, DKIM, DMARC | Existing TXT records | Preserved |

**Mail caution:** The original root SPF included `a` and an explicit IPv4 sender. Moving the apex's address from an A origin to a tunnel CNAME can change SPF `a` semantics even if the TXT record itself is untouched. Mail delivery/receiving was not independently checked; a mail administrator should validate SPF and related email services after cutover.

**Important:** The snapshot shows proxied Cloudflare records; public recursive DNS answers may return Cloudflare edge IPs rather than the underlying tunnel UUID. The Cloudflare export is the record of the zone configuration.

---

## 6. Existing services deliberately protected

We did **not** intend to overwrite or remove any of these:

- Existing `bestcement/appserver` and `bestcement/dashboard` directories on Debian.
- `dashboard.bestcement.co.in` tunnel route (`localhost:55001`).
- `appbackend.bestcement.co.in` tunnel route (`localhost:55000`).
- Other `deb-salesapp-ho` routes on the machine, including unrelated brands.
- DNS for unrelated subdomains, and mail MX/TXT entries.
- The separate `brixta-secure-tunnel` on the other Debian server.

The new website was placed in its own Docker container and bound to loopback port `8090`. The public apex DNS and published-application route were the intended production cutover points.

---

## 7. Current operating procedure

### Edit and publish code (Mac)

```bash
cd ~/bestcement-site-starter-verified
# Edit the site files in site/ and validate changes.
python3 scripts/check_site.py

git add .
git commit -m "Update Best Cement website"
git push origin main
```

Wait until the **Build and Publish Best Cement** GitHub Actions workflow succeeds. If there are no working-tree changes, Git correctly reports `nothing to commit`; that is not a deployment error.

### Pull and deploy (Debian)

```bash
ssh debian@100.103.134.95
cd ~/bestcement/website
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps
curl -sS http://127.0.0.1:8090/ | grep -F 'CIRP ADMISSION ORDER PASSED'
```

**Registry note:** A successful GitHub Actions run does not grant anonymous pull access to a private GHCR package. If `unauthorized` returns again, verify the package's visibility or authenticate using an approved GitHub token scoped for package reads. Never put that token in a repository, command screenshot, or this report.

### Confirm public apex

```bash
curl -sSI https://bestcement.co.in/ | grep -iE 'HTTP/|location:'
curl -sSL https://bestcement.co.in/ | grep -F 'CIRP ADMISSION ORDER PASSED'
```

### Diagnose the remaining `www` problem

```bash
curl -sSI https://bestcement.co.in/ | grep -iE 'HTTP/|location:'
curl -sSI https://www.bestcement.co.in/ | grep -iE 'HTTP/|location:'
curl -sSL -o /dev/null -w 'HTTP: %{http_code}; redirects: %{num_redirects}; final URL: %{url_effective}\n' https://bestcement.co.in/
```

If the apex is truly HTTP 200 with no redirect, a browser changing to `www` may be using cached redirect/navigation data. If the apex sends a `Location:` header to `www`, locate that rule or app setting **before** creating a redirect in the opposite direction. Avoid redirect loops.

### Ensure IPv4 settings survive a reboot

These profile edits were recommended earlier but their execution was **not** shown in the conversation:

```bash
sudo nmcli connection modify 'Wired DHCP' connection.autoconnect yes
sudo nmcli connection modify 'Wired connection 1' connection.autoconnect no
nmcli -f NAME,DEVICE,AUTOCONNECT connection show
ip -4 route show default
```

Do not restart NetworkManager unnecessarily while connected through Tailscale. If changing addresses or gateways again, use a rollback checkpoint and a second SSH session.

---

## 8. Remaining work / verification checklist

- [x] Identify the correct Cloudflare DNS zone for `bestcement.co.in`.
- [x] Identify existing `deb-salesapp-ho` tunnel and its application routes.
- [x] Obtain SSH access to the Debian machine that runs the tunnel.
- [x] Push a Best Cement website repository to GitHub.
- [x] Configure GitHub Actions to publish a Docker container image.
- [x] Diagnose broken outbound IPv4 to the stale gateway.
- [x] Discover correct DHCP subnet and gateway.
- [x] Activate DHCP profile and verify restored IPv4/HTTPS connectivity.
- [x] Confirm the CIRP page runs locally in Docker on `127.0.0.1:8090`.
- [x] Replace apex DNS with the existing Cloudflare Tunnel destination.
- [x] Confirm `https://bestcement.co.in/` serves the CIRP notice and returns HTTPS 200.
- [ ] Confirm `Wired DHCP` is configured to autoconnect on reboot and the old static profile is not preferred.
- [ ] Record the exact method used to resolve GHCR `unauthorized` (visibility policy or authenticated pull); check future pulls remain reproducible.
- [ ] Confirm tunnel connector health and the apex published-application route in Cloudflare's UI after cutover.
- [ ] Resolve `https://www.bestcement.co.in/` 404 using **a separate `www` route** or **a validated one-way `www` → apex redirect**.
- [ ] Check for newer Redirect Rules or browser-cached redirects; Page Rules and Bulk Redirects alone were checked and empty.
- [ ] Verify mail flow and SPF evaluation after the apex DNS change.
- [ ] Obtain IRP/legal authorization for presenting the website as an official company CIRP notice and confirm that subsequent court orders have not changed its status.
- [ ] If desired, add an authenticated link to the source tribunal order and a publication/update date on the page.

---

## 9. Evidence and provenance

The report is grounded in records supplied during the session, including:

1. Sysmic `bestcement.co.in` domain registration screenshot.
2. Cloudflare account and `deb-salesapp-ho` screenshots showing published application routes.
3. Git terminal output showing initial push `cd42db3` to `BRIXTA-BESTCEMENT/bestcement`.
4. GitHub Actions screenshot showing green Publish and Validate workflows at commit `2f0f913`.
5. Debian network, `cloudflared`, `docker compose`, `curl`, `nmcli`, DHCP and ping output copied into the chat.
6. Cloudflare DNS exports `bestcement.co.in.txt` (before apex change) and `bestcement.co.in (1).txt` (after change).
7. NCLT Guwahati Bench order, `ordersview(1).pdf`, for case **CP (IB)/40/GB/2026**, pronounced **12 October 2026**.
8. Browser screenshots: original Best Cement homepage, later `www` 404, and Cloudflare Page Rules / Bulk Redirects empty states.

**Not established by the shared evidence:** the precise last step by which GHCR access became authorized; any successful `www` remediation; successful receipt of company emails following the apex change; and whether all legal/IRP approvals for the public notice had been obtained.

---

## 10. Final outcome

**Confirmed successful:** The main hostname **`bestcement.co.in`** was moved away from its earlier origin, routed to the existing `deb-salesapp-ho` Cloudflare Tunnel, and served the new J.U.D. Cements Limited CIRP information website from Docker on Debian. The Debian IPv4 outage was resolved by switching from an obsolete static `192.168.20.0/24` configuration to DHCP on the live `192.168.29.0/24` LAN.

**Open issue:** `www.bestcement.co.in` returned HTTP 404 in Brave. That is a **hostname routing/canonicalization problem**, not evidence that the apex migration failed. The `www` fix was proposed but was not shown as completed.

**One-line lesson:** *A working physical Ethernet link and IPv6 Cloudflare tunnel did not guarantee outbound IPv4: an old static gateway blocked GHCR, while a separate apex DNS record kept public traffic on the previous website until it was deliberately replaced.*
