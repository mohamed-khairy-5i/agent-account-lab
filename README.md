# Agent Account Lab — AI Agent Multi-Account Testing

Open-source, local-first testing for a specific AI agent failure: **the tool call succeeds, but it acts in the wrong account**.

Both accounts may be authorized. This lab checks whether the action matches the user's intended account, file, and operation.

**Status: runnable foundation, not a finished web app. No real-model benchmark results are claimed.** [الشرح بالعربي](README_AR.md).

## What it tests
- Wrong-account tool calls with duplicate file names.
- Bias toward the first or default account.
- Account identity versus folder names and stale conversational preferences.
- Clarification instead of guessing.
- Attempts versus executed side effects, including errors later undone.

## Implemented foundation
- 20 synthetic base scenarios and 5 variants: 100 generated cases in 20 related families.
- Six in-memory mock tools, a deterministic evaluator, and isolated run state.
- 52 passing functional tests in the recorded environment.
- Zero live-account integrations and zero real model calls.

## Quick start
Node.js 24+; no dependency installation is needed for the foundation.

```sh
node scripts/validate.ts
node --test --test-reporter=tap tests/core.test.ts
node scripts/demo.ts
```

Reports are written inside `reports/`. Mock tool actions change synthetic objects in memory, not files on your disk or connected accounts.

## Evidence and limits
The oracle-reference adapter intentionally knows expected answers; it validates harness consistency, not LLM performance. First-account and default-account adapters are deliberately weak scripted controls, not representative AI models.

The web UI, real model adapters, MCP server, independent static type-checking, CI, and independent scenario review remain pending. Node's TypeScript type stripping is not a static type-check.

## Documentation
- [Arabic project guide](README_AR.md)
- [Scenario catalog](docs/SCENARIOS_AR.md)
- [Tools and roles](docs/TOOLS_AND_ROLES_AR.md)
- [Evaluation rules](docs/EVALUATION_RULES_AR.md)
- [Architecture and plan](docs/PROJECT_PLAN_AR.md)
- [Technical decisions](docs/DECISIONS_AR.md)
- [Roadmap](docs/ROADMAP_AR.md)
- [Security and data boundaries](docs/SECURITY_AND_DATA_AR.md)
- [Related work and novelty limits](docs/RESEARCH_BOUNDARIES_AR.md)

MIT. No first-in-the-world or security-certification claim. The owner's personal learning guide is distributed separately and is not part of this repository.

Recorded diagnostic snapshots are compressed in `reports/*.gz`; running the commands regenerates readable reports locally.
