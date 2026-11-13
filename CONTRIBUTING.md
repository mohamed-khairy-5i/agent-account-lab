# Contributing to Agent Account Lab

Thank you for your interest in contributing to **Agent Account Lab** (حساب مين؟).

This project focuses on evaluating a specific failure mode in AI agent tool calling: **executing technically authorized tool operations in the wrong account or context**.

> [!NOTE]
> إذا كنت تفضل القراءة بالعربية، يرجى مراجعة [دليل المساهمة بالعربية](docs/CONTRIBUTING_AR.md).

---

## Areas for Contribution

1. **New Scenarios**: Edge cases involving multi-account ambiguity, conversational preference shifts, decoy accounts, or subtle user clarifications.
2. **Evaluation Rules & Harness**: Enhancements to the deterministic evaluator, trace capture, or isolation guarantees.
3. **Model Adapters & Benchmark Suites**: Adding new model adapters or contributing test cases for expanded multi-operation benchmark suites (e.g. Move, Read, Scope constraints).
4. **Documentation & DX**: Clarifying guidelines, improving local test ergonomics, or expanding bilingual documentation.

---

## Contribution Workflow

### 1. Requirements
- **Node.js >= 20.0.0** (Officially verified and tested on Node 20 LTS and Node 24).
- Run `npm install` to set up development dependencies for static typechecking (`tsc`).

### 2. Proposing a New Scenario
When authoring scenarios in `data/scenarios.json`:
- **Synthetic data only**: Never include real user identities, tokens, private keys, or internal enterprise data.
- **Explicit ground truth (`oracle`)**: Define the exact intended account (`target_account_id`), target resource, operation, and whether human clarification is required (`require_clarification`).
- **Semantic stability across variants**: When the generator inverts account order (`reverse_accounts`) or swaps the default account (`flip_default`), ensure the prompt's intended meaning remains testable and unambiguous.
- **Run validation**: Every scenario must pass schema and referential integrity checks.

### 3. Local Verification Commands
Before submitting a pull request, run all verification gates:

```sh
# 1. Validate scenario data integrity and JSON contracts
npm run validate

# 2. Run static TypeScript typecheck
npm run typecheck

# 3. Execute all 69 automated tests (core suite + adapter edge cases + smoke tests)
npm test

# 4. Verify simulation demo and report generation
npm run demo
```

All 69 tests and type checks must pass with zero errors.

---

## Ground Rules & Evaluation Principles

- **Permissions ≠ Intent**: Never turn the tool gateway into an oracle gate that blocks wrong-account calls upfront. The mock tool must accept technically valid operations so the evaluator can observe and measure mistargeted actions.
- **Honest Benchmarking**: Scripted controls (`oracle-reference`, `first_account`, `default_account`) must never be represented as real LLM performance. The oracle deliberately knows expected answers to verify harness consistency.
- **Privacy & Boundaries**: Keep test data synthetic. Do not commit personal owner guides, private logs, or API keys. See our [Security Policy](SECURITY.md).

---

## Code of Conduct & Questions

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Open an issue using our [GitHub Issue Templates](.github/ISSUE_TEMPLATE/) or discuss scenario design via pull requests.
