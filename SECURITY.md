# Security Policy — Agent Account Lab

## 🛡️ Supported Versions

We take security and context-isolation integrity seriously. Security patches and updates are actively maintained for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.1.x   | :white_check_mark: | Active & Maintained (Current) |
| 1.0.x   | :white_check_mark: | Maintenance Mode |
| < 1.0   | :x:                | Deprecated / Foundation |

---

## 🔒 Security Principles of the Lab

Agent Account Lab is built upon strict security and isolation guarantees:

1. **Zero-Network In-Memory Mocking:**
   - All synthetic evaluation tools (`list_accounts`, `list_files`, `read_file`, `rename_file`, `move_file`, `ask_user`) run strictly in-memory inside `MockGateway`.
   - Tool calls never execute real operating system commands, never touch the physical disk, and never perform unauthorized network egress.

2. **Zero Credential Retention:**
   - The repository contains **no API keys, no bearer tokens, and no client secrets**.
   - Live LLM evaluation keys are stored solely in the client's local browser memory (`localStorage`), never logged to persistent disk or transmitted to any middleman server.

3. **Input Sanitization & Path Traversal Prevention:**
   - File modification tools reject relative directory traversal (`.` and `..`), forward/backward slashes, and NUL byte injections (`\0`).

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, credential exposure, or sandbox escape within this repository:

1. **Do NOT open a public GitHub Issue.**
2. Send a confidential report via GitHub Private Vulnerability Reporting or email the maintainer directly at:
   - **Lead Architect:** Eng. Mohamed Khairy
   - **GitHub Profile:** [@mohamed-khairy-5i](https://github.com/mohamed-khairy-5i)
3. Please include:
   - Description of the vulnerability or flaw.
   - Minimal reproduction script or prompt payload.
   - Potential impact on evaluating agents or user environments.

### Response Timeline
- **Initial Acknowledgement:** Within 24 hours.
- **Triage & Assessment:** Within 48 hours.
- **Remediation & Patch:** Within 5 business days, followed by a coordinated public disclosure with full credit to the researcher.
