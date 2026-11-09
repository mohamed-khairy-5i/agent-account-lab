# Changelog

## 0.2.0-local-ui — 2026-11-09

- Built complete local interactive web interface (`ui/`) using React 19, Vite 6, and TypeScript in strict mode.
- Interactive scenario library supporting all 20 base scenarios and 100 generated variants.
- Real-time client-side simulation engine executing test cases in milliseconds without external backend requirements.
- Color-coded tool call traces distinguishing legitimate operations from mistargeted mutations in the wrong account.
- Side-by-side before/after file diff visualizer highlighting erroneous modifications in personal accounts.
- Added comprehensive batch simulation mode (100 cases × 3 agents = 300 runs) with JSON report export.
- Added root development scripts: `npm run ui`, `npm run ui:build`, and `npm run ui:preview`.

## 0.1.1-quality-and-community — 2026-11-09

- Added independent TypeScript static type checking (`typescript 5.8+`, `@types/node`, `package-lock.json`, `npm run typecheck`).
- Fixed implicit any type annotation in `scripts/demo.ts`.
- Configured GitHub Actions continuous integration workflow (`.github/workflows/ci.yml`) covering validation, type checking, test execution, and demo simulation.
- Added comprehensive community contribution files: root `CONTRIBUTING.md` linked to Arabic guide, GitHub issue templates for scenario proposals and bug reports, and pull request template.
- Expanded `README.md` and `README_AR.md` with a detailed walkthrough of Scenario S01 (authorized vs. intended failure mode) and explicit CLI simulation output.
- Prepared bilingual community introduction blurbs in `docs/COMMUNITY_BLURBS.md`.

## 0.1.0-foundation — 2026-11-09

- Added 20 synthetic scenarios and five semantics-preserving variants (100 generated cases).
- Implemented six in-memory tools, strict argument handling, independent state, and a deterministic evaluator.
- Added an explicitly oracle-informed reference and two deliberately weak scripted controls.
- Ran 52 functional tests successfully; ran 300 synthetic demonstrations with zero real model calls.
- Documented scope, rules, roles, architecture, technical decisions, roadmap, security, and research limitations in Arabic.
- Owner-only explanation files are distributed separately, not as part of this project bundle.
- Web UI, real model adapters, static type-checking, CI, remain pending; the foundation repository is public.
- Prepared the Agent Account Lab name, descriptive README, repository topics, shared-world fixture storage, and compact trace samples.
