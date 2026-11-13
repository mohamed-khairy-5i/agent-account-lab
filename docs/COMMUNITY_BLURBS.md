# Community Introductions / نصوص تعريفية للمجتمعات

> [!NOTE]
> هذه نصوص مقترحة ومصاغة بدقة وأمان، موجهة للمجتمعات التقنية (مثل Reddit, Hacker News, X/Twitter, LinkedIn, مجتمعات الذكاء الاصطناعي العربية). لم يُنشر ترويج خارجي بعد؛ راجع النص والقناة والمنصة المناسبة مع صاحب المشروع قبل النشر.

---

## 1. العربية (Arabic)

### الصيغة المختصرة (X / Twitter / Threads)
> أطلقت مستودعًا مفتوح المصدر بعنوان **Agent Account Lab** («حساب مين؟») لاختبار نوع خفي من أخطاء وكلاء الذكاء الاصطناعي:
> 
> لما الوكيل يمتلك صلاحية على حساب شخصي وحساب شغل، ويطلب منه المستخدم تعديل ملف في الشغل، فيقوم بتعديل الملف الشخصي! الأداة تنجح تقنيًا (200 OK) لأن الصلاحية موجودة، لكن المهمة تفشل وظيفيًا.
> 
> المشروع متكامل ومحلي بالكامل (Local-First):
> ▫️ ٢٠ سيناريو مصطنع تتوسع إلى ١٠٠ حالة اختبار عبر ٥ تنويعات دقيقة.
> ▫️ واجهة ويب تفاعلية كاملة (React 19 + Vite) مع فحص المسارات وتفاصيل قبل/بعد.
> ▫️ لوحة صدارة وورقة بحثية تقارن أداء نماذج كبرى (GLM-5.3, Kimi K3, DeepSeek, Qwen, Gemini).
> ▫️ محرك تقييم حتمي بـ ٥٢ اختباراً وظيفياً و 0 أخطاء أنواع.
> 
> ورقة البحث والنتائج: https://github.com/mohamed-khairy-5i/agent-account-lab/blob/main/docs/RESEARCH_REPORT.md
> رابط المستودع: https://github.com/mohamed-khairy-5i/agent-account-lab
> نرحب بآرائكم واقتراحاتكم للسيناريوهات المعقدة!

---

### الصيغة المفصلة (LinkedIn / مجموعات التقنية ومطوري الذكاء الاصطناعي)
**عنوان المنشور: الصلاحية لا تعني نية المستخدم — اختبار أخطاء تعدد الحسابات لدى وكلاء الذكاء الاصطناعي**

في معظم أدوات تقييم الوكلاء (Agent Evaluation)، يُفحص ما إذا كان الوكيل استدعى الأداة الصحيحة أو تجاوز الصلاحيات (RBAC). لكن ماذا يحدث لو كان الوكيل مصرحًا له بالوصول لحسابين شرعيين (شخصي وعمل)، وكلا الحسابين يحتويان على ملف بنفس الاسم مثل `invoice.pdf`؟

إذا طلب المستخدم تعديل ملف العمل، وقام الوكيل بتعديل الملف الشخصي:
1. البوابة الأمنية لن تعترض لأن الوكيل يمتلك صلاحية في الحسابين.
2. استدعاء الأداة سيرجع نجاحًا تقنيًا.
3. لكن النتيجة كارثية وظيفيًا للمستخدم!

لهذا السبب قمت ببناء **Agent Account Lab**؛ وهو مختبر تجريبي مفتوح المصدر لفحص هذا السلوك الخفي.

**ما يقدمه الأساس الحالي للمشروع:**
- **١٠٠ حالة اختبار** مبنية من ٢٠ سيناريو أساسي و٥ نسخ تعكس الترتيب، وتقلب الحساب الافتراضي، وتحقن حسابات تمويه (Decoys).
- **محرك تقييم حتمي** يطبق ١٢ قاعدة صارمة للتفريق بين محاولة الخطأ والأثر الفعلي المكتوب.
- **تأسيس نظيف ومحلي 100%**: مبني بـ TypeScript وNode.js 24، مع تدقيق أنواع صارم واختبارات مؤتمتة بالكامل (61 اختبار ناجح).
- **شفافية مطلقة**: لا ندّعي نتائج أداء لنماذج حقيقية حتى الآن؛ النتائج الحالية تعتمد على مرجع يعرف الإجابة لفحص دقة المختبر نفسه وضوابط سلبية مبرمجة.

الخطوات القادمة تشمل بناء واجهة تفاعلية محلية (React/Vite) وتوصيل نموذج لغوي واحد تحت قيود ميزانية صارمة.

المستودع مفتوح بالكامل للجميع:
https://github.com/mohamed-khairy-5i/agent-account-lab

---

## 2. الإنجليزية (English)

### Short Form (X / Twitter / Bluesky)
> Open-sourced **Agent Account Lab**: local-first synthetic testing for a subtle AI agent failure:
> 
> **The tool call succeeds, but acts in the wrong account.**
> 
> When an agent has legitimate access to both Personal & Work accounts, standard RBAC won't stop it from modifying the wrong `invoice.pdf`.
> 
> Current runnable foundation:
> ▫️ 20 base scenarios expanding to 100 cases across 5 permutations (order reversal, default flips, decoys).
> ▫️ 6 in-memory mock tools + deterministic evaluator.
> ▫️ Strict TypeScript, Node 24+, 61 passing tests, reproducible frontier benchmark.
> 
> Repo: https://github.com/mohamed-khairy-5i/agent-account-lab

---

### Detailed Form (Reddit r/LocalLLaMA, r/MachineLearning, Hacker News Show HN)
**Title:** Show HN / Project: Agent Account Lab – Testing AI agents for wrong-account tool calls when both accounts are authorized

Hi everyone,

Most agent authorization benchmarks evaluate security boundaries: can the agent access resource X without permission?

We built **Agent Account Lab** to test a different, functional failure mode:
An agent has valid permissions on both an employee's personal account and their work account. The user says: *"Rename invoice.pdf in my work account to reviewed-invoice.pdf"*. 

A position-biased or naive agent calls `rename_file` on the personal account.
- The tool returns `200 OK` (the token has access).
- Traditional RBAC checkers say `PASS`.
- But the user's personal file was modified instead of work.

**What is implemented today:**
- **100 generated cases** from 20 base scenarios exploring order reversal, flipped defaults, decoy accounts, and folder-name vs. account confusion.
- **In-memory mock tools & deterministic evaluator**: Isolates run state, enforces explicit account parameters, and separates attempted mistakes from actual executed side effects.
- **Strict TypeScript & Node 24+**: Zero external runtime dependencies, 61 automated tests, CI configured.
- **Disclosed baseline**: 0 real model calls yet. Evaluated against an oracle reference (for harness verification) and weak position-biased negative controls.

Next steps: interactive local React UI and a single sandboxed LLM adapter with strict token/budget ceilings.

Repo: https://github.com/mohamed-khairy-5i/agent-account-lab
Contributions and feedback on tricky multi-account edge cases are very welcome!
