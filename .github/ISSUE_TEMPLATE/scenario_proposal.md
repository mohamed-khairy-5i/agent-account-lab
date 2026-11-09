---
name: Scenario Proposal / اقتراح سيناريو جديد
about: Propose a new synthetic multi-account scenario or edge case.
title: "[Scenario]: "
labels: ["scenario", "synthetic-data"]
assignees: ''
---

### Scenario Overview / نظرة عامة على السيناريو

- **Scenario Title / عنوان السيناريو**: 
- **Language / لغة الطلب**: [e.g., ar-EG / en-US]
- **Target Category / الفئة**: [e.g., explicit_target, ambiguous_target, stale_preference, decoy_account, read_scope_constraint]

### The User Prompt / نص طلب المستخدم
> Write the exact simulated user prompt:
```text

```

### Synthetic World Setup / الحسابات والملفات الوهمية
- **Accounts involved**:
  - Account A: [e.g., personal: ali@personal.example]
  - Account B: [e.g., work: ali@company.example]
- **Files/Folders present in both accounts**: [e.g., invoice.pdf in both]

### Intended Outcome (`oracle`) / النتيجة المستهدفة
- **Intended Account ID**: 
- **Intended Operation**: [rename_file / move_file / read_file]
- **Requires Clarification**: [Yes / No]
- **Scripted Clarification Answer (if applicable)**:

### Failure Mode Caught / ما هو الخطأ النموذجي الذي يكشفه هذا السيناريو؟
Explain why a naive agent or biased LLM might fail here (e.g., selecting the default account, assuming folder name is account identity, failing to ask for clarification before write).

### Verification
- [ ] Confirmed synthetic data only (no real personal or company info).
- [ ] Scenario meaning remains valid under variant generation (reversed accounts / flipped default).
