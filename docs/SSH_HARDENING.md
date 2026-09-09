# SSH Hardening Guide — AI Arena Production

**Status:** Prepared (not applied)  
**Server:** Ubuntu 24.04, port **23456**, user **ccne**

> **Never disable password authentication until SSH key login is verified in a second terminal.**

---

## Current State (audit 2026-09-08)

| Setting | Value |
|---------|-------|
| Port | 23456 |
| PasswordAuthentication | **yes** (`/etc/ssh/sshd_config.d/50-cloud-init.conf`) |
| PubkeyAuthentication | yes |
| PermitRootLogin | prohibit-password |
| Authorized keys (ccne) | 1 key present |
| X11Forwarding | yes (should disable) |

---

## STEP A — Test SSH key in second terminal

Open a **new** terminal (keep existing session open):

```bash
ssh -p 23456 -i /path/to/your/private_key ccne@<SERVER_IP>
```

Expected: login succeeds **without** password prompt.

If this fails, **stop** — add your public key to `~/.ssh/authorized_keys` first.

---

## STEP B — Verify sudo works in key session

```bash
sudo -n true && echo "sudo ok" || sudo -v
```

---

## STEP C — Backup SSH config

```bash
sudo cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F)
sudo cp -a /etc/ssh/sshd_config.d /etc/ssh/sshd_config.d.bak.$(date +%F)
```

---

## STEP D — Validate configuration before reload

Create override file (do not edit live config until validated):

```bash
sudo tee /etc/ssh/sshd_config.d/99-ai-arena-hardening.conf << 'EOF'
PasswordAuthentication no
PermitRootLogin prohibit-password
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

sudo sshd -t
```

`sshd -t` must print nothing and exit 0.

---

## STEP E — Apply (only after STEP A succeeds)

```bash
sudo systemctl reload ssh
# or: sudo systemctl reload sshd   (depending on Ubuntu alias)
```

**Do NOT reboot server.**  
**Do NOT close original SSH session** until key session is confirmed working.

Test again from second terminal with key.

---

## STEP F — Rollback if locked out

From original still-open session:

```bash
sudo rm /etc/ssh/sshd_config.d/99-ai-arena-hardening.conf
sudo sshd -t && sudo systemctl reload ssh
```

Or restore backup:

```bash
sudo cp -a /etc/ssh/sshd_config.bak.* /etc/ssh/sshd_config
sudo systemctl reload ssh
```

If completely locked out: use hosting provider console (VNC/IPMI).

---

## Verification Checklist

- [ ] Key login works (second terminal)
- [ ] Password login rejected (after hardening)
- [ ] sudo works
- [ ] Port 23456 still reachable
- [ ] UFW still allows 23456/tcp

---

## Security Finding Reference

| ID | Status after guide |
|----|-------------------|
| SEC-001 | OPEN until STEP E applied and verified |
| SEC-012 | OPEN until X11Forwarding disabled |
