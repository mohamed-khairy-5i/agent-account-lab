# Security Policy — Agent Account Lab

## 🛡️ Supported Versions

We take security and context-isolation integrity seriously. Security patches and updates are actively maintained for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.1.x   | :white_check_mark: | Active & Maintained (Current) |
| 1.0.x   | :white_check_mark: | Maintenance Mode |
| < 1.0   | :x:                | Deprecated / Foundation |

---

## 🔒 Security Principles & Data Boundaries

Agent Account Lab implements rigorous isolation guarantees and transparent data flow:

1. **Synthetic Evaluation Tool Isolation (Zero-Network Mocking):**
   - All synthetic mock tools (`list_accounts`, `list_files`, `read_file`, `rename_file`, `move_file`, `ask_user`) operate strictly in-memory inside `MockGateway`.
   - Tool calls during evaluations never execute operating system processes, never touch the physical disk, and never perform external network requests.

2. **API Key Storage & Data Path:**
   - **Repository Hygiene:** The repository contains **zero API keys, zero bearer tokens, and zero client secrets**.
   - **Local Browser Storage:** In the interactive Web UI, custom API keys are saved on the user's local machine in browser `localStorage`. Users must treat their local environment as trusted, as any script running on the same origin can access `localStorage`.
   - **Network Routing:**
     - In local development and preview modes (`npm run ui` / `npm run ui:preview`), requests to `/api/llm` route through a local Vite reverse proxy to avoid browser CORS restrictions when contacting remote endpoints.
     - When using custom endpoints (e.g. OpenAI, OpenRouter, or Ollama), the UI enforces strict WHATWG URL validation: HTTPS is mandated for all remote providers, while HTTP is strictly restricted to trusted local addresses (`localhost`, `127.0.0.1`, `[::1]`).
   - The project operates no remote backend, no telemetry server, and no third-party credential caching.

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
