# Fail2ban Setup — AI Arena Production

**Status:** Prepared (not installed)  
**Prerequisite:** Complete SSH key verification per `docs/SSH_HARDENING.md` first.

---

## Why

SSH port 23456 with password auth enabled is vulnerable to brute force. Fail2ban blocks repeated failed attempts.

---

## Installation

```bash
sudo apt update
sudo apt install -y fail2ban
```

---

## Jail Configuration

```bash
sudo tee /etc/fail2ban/jail.d/ai-arena-ssh.local << 'EOF'
[sshd]
enabled = true
port = 23456
filter = sshd
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
ignoreip = 127.0.0.1/8 ::1
EOF
```

**Important:** Add your office/home static IP to `ignoreip` if you have one:

```
ignoreip = 127.0.0.1/8 ::1 YOUR.OFFICE.IP.ADDRESS
```

---

## Enable and Verify

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status sshd
```

---

## Unban (if you lock yourself out)

```bash
sudo fail2ban-client status sshd
sudo fail2ban-client set sshd unbanip <YOUR_IP>
```

---

## Disable / Rollback

```bash
sudo rm /etc/fail2ban/jail.d/ai-arena-ssh.local
sudo systemctl restart fail2ban
```

Or fully remove:

```bash
sudo apt remove -y fail2ban
```

---

## Monitoring

```bash
sudo fail2ban-client status sshd
sudo journalctl -u fail2ban --since "1 hour ago"
```

---

## Security Finding Reference

| ID | Status |
|----|--------|
| SEC-002 | OPEN until installed and verified |
