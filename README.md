# Prüfstein

**A cold, audited business-feasibility evaluator that dares to say no.** Named after the German word for *touchstone* — the acid test an idea has to survive. Under the hood it's a kill-criteria `biz-feasibility` evaluator **+ an independent audit layer that refuses to ship an un-audited or structurally-broken verdict** — packaged for [Claude Code](https://claude.com/claude-code).

**Prüfstein**（德语「试金石」）—— 一个冷峻、敢说不、而且自带独立审计的商业可行性评估器。底层是 kill-criteria 的「证伪」筛 **+ 一层独立审计：未经审计、或结构上站不住的裁决不许交付。**

> **The point is not to cheerlead an idea — it's to falsify it.** It defaults to skepticism and dares to return KILL.
> **目的不是给点子打气，是用 kill-criteria 思维冷峻地证伪。** 默认怀疑，敢下「放弃」。

---

## What's here / 内容

| Path | What it is |
|---|---|
| `SKILL.md` | The whole evaluator framework. This is the skill. / 评估器框架全文，即 skill 本体。 |
| `feasibility-workflow.js` | Optional deep-mode multi-agent [Workflow](https://docs.claude.com/en/docs/claude-code) template. / 可选「深评」多智能体编排模板。 |
| `audit/` | **The independent audit layer** (new): an auditor spec + a check registry + a deterministic finalizer + an optional Stop-hook gate. / **独立审计层**（新）：审计员 spec + 检查注册表 + 确定性裁决器 + 可选的 Stop-hook 强制闸。 |
| `audit/test/` | A runnable test suite (deterministic routing test + synthetic fixtures). / 可运行的测试套件（确定性路由测试 + 合成 fixture）。 |

## Four verdicts (one action each) / 四档裁决（每档一个动作）

- **PROMISING** — clears opportunity cost, investable / scalable → go. / 清得掉机会成本、可投可放大 → 做。
- **副业 · CAPPED** — clears cash but can't scale / can't be invested; whether it clears *opportunity* cost depends on *this* founder. / 清得掉现金、但封顶不可放大；过不过机会成本看本人基准。
- **KILL** — can't even clear cash (chronic bleed) or structurally doesn't stand up → don't / exit. / 连现金都清不掉或结构性死 → 别做 / 退出。
- **CONDITIONAL** — an untested swing variable routes to one of the above → run the cheapest falsification test first. / 有个没测的关键变量 → 先跑最便宜的证伪测试。

### See it in action / 看一份完整裁决

A full, de-identified verdict on a real idea (a paid expert-advice / coffee-chat marketplace) → [`examples/case-study-expert-advice-marketplace.md`](./examples/case-study-expert-advice-marketplace.md).
一份对真实点子的完整去标识化裁决（付费专家建议 / coffee-chat 市场）见上方链接。

---

# Deploy / 部署

## English

**1 · The skill (the evaluator).** Clone into your Claude Code skills dir:
```bash
git clone https://github.com/littlejuju/pruefstein.git ~/.claude/skills/biz-feasibility
```
Then type `/biz-feasibility` or just pitch a venture — it auto-triggers, asks for any missing load-bearing info (supply side / real WTP + who pays / founder assets), then returns a verdict. The report is generated in **your** language (pitch in English → English report).

**2 · The audit layer (optional but recommended).** Two ways to wire it:

- **As a plugin (auto-enforced)** — the sibling repo [`littlejuju/pruefstein-plugin`](https://github.com/littlejuju/pruefstein-plugin) packages the skill + a **`Stop` hook** that won't let a turn end until an *independent* auditor + the deterministic finalizer clear the verdict. Loading the plugin *is* the install; nothing to edit:
  ```
  /plugin marketplace add littlejuju/pruefstein-plugin
  /plugin install biz-feasibility@pruefstein-plugin
  ```
- **Manually (this repo's `audit/`)** — add a `Stop` hook in `~/.claude/settings.json` pointing at `audit/audit_gate.py` (see `audit/hooks.json` for the exact shape). On every turn-end the gate checks whether a real verdict was emitted and, if so, requires a fresh independent audit:
  1. A clean **auditor subagent** (system prompt = `audit/auditor.md`) reads **only** the report + its brief — never the generation reasoning — and writes a per-check JSON verdict to `.bizfeas/pending_audit.json` (stamped with the report's hash).
  2. **`audit/finalizer.js`** recomputes `OK | BLOCK_UNRESOLVED` from that JSON by the registry's routing rules — it does **not** trust the auditor's own proposed verdict, and ignores any self-stamped "AUDIT_OK".
  3. `OK` → the turn may end. `BLOCK` → the gate holds the turn open with the *specific* structural reason + the required fix. Escape: a human-set `.bizfeas/override` file (logged).

> Requires `python3` (gate) and `node` (finalizer). No other dependencies.

## 中文

**1 · skill（评估器）。** clone 进 Claude Code 的 skills 目录：
```bash
git clone https://github.com/littlejuju/pruefstein.git ~/.claude/skills/biz-feasibility
```
然后输入 `/biz-feasibility` 或直接陈述一个生意——它自动触发，先问缺失的载重信息（供给侧 / 真实 WTP + 谁付钱 / 创始人资产），再给裁决。报告用**你的**语言生成（中文陈述→中文报告）。

**2 · 审计层（可选但推荐）。** 两种接法：

- **作为 plugin（自动强制）**——配套的 plugin 仓 [`littlejuju/pruefstein-plugin`](https://github.com/littlejuju/pruefstein-plugin) 把 skill + 一个 **`Stop` hook** 打包：未经**独立**审计员 + 确定性裁决器放行，这一轮就结束不了。装上 plugin = 装上强制，无需改配置：
  ```
  /plugin marketplace add littlejuju/pruefstein-plugin
  /plugin install biz-feasibility@pruefstein-plugin
  ```
- **手动接（用本仓 `audit/`）**——在 `~/.claude/settings.json` 加一个 `Stop` hook 指向 `audit/audit_gate.py`（确切写法见 `audit/hooks.json`）。每轮结束时闸检查是否产出了真裁决，若是则要求一份**新鲜的独立审计**：
  1. 一个干净的**审计员子代理**（system prompt = `audit/auditor.md`）**只**看报告 + brief，**绝不**看生成推理，逐条 check 出 JSON 裁决，写到 `.bizfeas/pending_audit.json`（带报告哈希）。
  2. **`audit/finalizer.js`** 按注册表的路由规则从那份 JSON **重算** `OK | BLOCK_UNRESOLVED`——**不信**审计员自己提议的裁决，也忽略任何自盖的「AUDIT_OK」。
  3. `OK` → 可结束本轮。`BLOCK` → 闸挡住本轮，并给出**具体**的结构性原因 + 该怎么修。逃生口：人工放置 `.bizfeas/override` 文件（留痕）。

> 依赖 `python3`（闸）+ `node`（裁决器），无其它依赖。

---

# Test / 测试

## English

**Deterministic routing test (no LLM, runs in a second):**
```bash
node audit/test/smoke_test.js
# expect: 11 passed, 0 failed
```
This proves the finalizer's two-sided routing: a P0 / verdict-affecting defect → BLOCK; a non-load-bearing / decorative defect → OK (it will **not** false-kill a robust verdict); a self-stamp is neutralized; missing checks fail closed.

**Auditor behaviour test (with an agent):** point an auditor subagent (`audit/auditor.md`) at the synthetic fixtures and finalize each:
- `audit/test/fixtures/poison/*.md` — each embeds one load-bearing defect (harm test / legal-stated-as-final / unsourced load-bearing fact / BLUF-vs-vector conflict / current-mislabelled-as-passed / cross-case contamination). **Every one must finalize to `BLOCK_UNRESOLVED`.**
- `audit/test/fixtures/control/*.md` — clean, correct reports (a robust KILL, an existing-cash CAPPED, a real-pull PROMISING). **Every one must finalize to `OK`** — blocking one would be a false-kill.

Flow per fixture: auditor reads the fixture → emits the JSON verdict → `node audit/finalizer.js <verdict.json>` → check the `decision`.

## 中文

**确定性路由测试（不调 LLM，一秒跑完）：**
```bash
node audit/test/smoke_test.js
# 期望：11 passed, 0 failed
```
它验证裁决器的两侧路由：P0 / 影响裁决的缺陷 → BLOCK；非载重 / 装饰性缺陷 → OK（**不会**误杀鲁棒裁决）；自盖章被中和；缺 check 则 fail-closed。

**审计员行为测试（需一个 agent）：** 让审计员子代理（`audit/auditor.md`）审合成 fixture，逐个 finalize：
- `audit/test/fixtures/poison/*.md`——每个埋了一个载重缺陷（有害测试 / 法律写成最终定性 / 载重 fact 无源 / BLUF 与 verdict-vector 矛盾 / 现状误标成测试通过档 / 串案污染）。**每个都必须 finalize 成 `BLOCK_UNRESOLVED`。**
- `audit/test/fixtures/control/*.md`——干净、正确的报告（鲁棒 KILL、有现金的 CAPPED、有真实买家拉力的 PROMISING）。**每个都必须 finalize 成 `OK`**——拦了就是误杀。

每个 fixture 的流程：审计员读 fixture → 出 JSON 裁决 → `node audit/finalizer.js <verdict.json>` → 看 `decision`。

---

## How the audit layer works / 审计层原理（简）

The design separates **judgment** (an LLM auditor — fallible, but blind to the generation reasoning) from **routing** (deterministic code that recomputes OK/BLOCK and can't be talked out of it). A finding only flips the decision if it is **load-bearing** — the business verdict actually changes if it's wrong — *except* integrity/safety violations (harm, cross-case contamination, law-stated-as-final, headline-vs-vector contradiction, current-state mislabelled as a passed state), which block regardless. The fix for a collapse/legal block is **relabel/reword — never turn a robust verdict into KILL just to clear it** (that would be a false-kill).

把**判断**（LLM 审计员——会错，但对生成推理是盲的）和**路由**（确定性代码，重算 OK/BLOCK、说不动）分开。一条缺陷只有**载重**（它错了商业裁决会变）才翻决定——**除了**完整性/安全违规（有害、串案污染、法律写成最终定性、标题与 vector 矛盾、现状误标成测试通过档），这些一律拦。坍缩/法律类的修法是**改标签/改措辞——绝不为了过闸把鲁棒裁决翻成 KILL**（那是误杀）。

## Scope boundary / 责任边界

It judges the **idea**, not the person. It never coaches, never prescribes a life/career vehicle. When the question turns into "what should I do with my life / am I finished," it declares its boundary and refers out.
它只判 **idea**，不判人，不开人生/职业处方。问题变成「我该做什么 / 我是不是完了」时，声明能力边界并 refer 给真人。

## Provenance of the examples / 案例出处

The framework was hardened case-by-case on real evaluations. Case codes (`A1–A14 / S1–S20`, aliases like `化名 J`) are **anonymized** — subjects de-identified, kept because the concrete failures ground the abstract rules. Named real companies (LinkedIn, Clubhouse, Quibi, Rover/Wag, Character.AI, Strava, …) are public facts cited as teaching examples. The `audit/test/` fixtures are **synthetic** (no real subjects).
框架是逐案在真实评估上磨出来的。案例代号（`A1–A14 / S1–S20`、`化名 J` 等）均**匿名**，保留是因为具体「实犯」是抽象规则的地基。点名的真实公司是公开事实、当教学例子。`audit/test/` 的 fixture 是**合成**的（无真实主体）。

## License

MIT — see [`LICENSE`](./LICENSE).
