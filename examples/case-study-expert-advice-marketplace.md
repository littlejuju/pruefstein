# Example verdict — a paid expert-advice / "coffee-chat" marketplace

> A worked example of what `/biz-feasibility` (Prüfstein) returns on a real, **de-identified** idea — a common archetype: an app that lets people book **paid 1:1 advice / coffee-chat sessions with vetted experts**, starting in one small market.
>
> Subject anonymized: no names, companies, locations, or personal details. Numbers are **illustrative** and labelled by confidence — the point is the *structure* of the verdict, not the digits. The tool reports in your language; this example is in English.
> 一个**去标识化**的真实点子样例：一个让用户**付费预约 1:1 专家建议 / coffee-chat** 的双边市场。主体已匿名，数字仅为示意。

---

## The pitch (as brought to the tool)

> "A marketplace where people book paid 1:1 sessions with vetted experts — advice, mentorship, a smart coffee chat. Two sides: experts list availability, seekers pay per session, we take a cut. There's a *lot* of warm interest — people keep telling me they'd use it."

## Step 0 — classify

Two-sided **platform / marketplace** → run the three platform mother-deaths **+** the frequency–density–WTP deadlock. (Don't free-style death-causes; attach the module the type calls for.)

## Business model & load-bearing parameters

`revenue = seekers × paid-conversion × price/session × take% × frequency × lifetime − CAC`

| Load-bearing parameter | Illustrative value | Source / confidence |
|---|---|---|
| Real WTP per session (stranger, no prior trust) | "warm, unpriced" | 🔴 load-bearing, **unproven** |
| Sessions / seeker / year | ~1–2 (advice is episodic) | 🔴 load-bearing, structural |
| Does the supply already operate today? | No — experts don't currently sell 1:1s to strangers | 🔵 fact |
| Take % that survives after the first match | → trends to 0 | 🟡 inferred |

Confidence floor = the weakest load-bearing pillar → **🔴 low-confidence inputs on the two pillars that decide it** (WTP, frequency). A verdict pressed on 🔴 stays "structural," not "certain" — but here both bounds point the same way.

## BLUF — verdict: **KILL**

**Verdict vector** (pin the verdict to the object; don't let one label cover the whole space):

| Object | Verdict |
|---|---|
| Current form — paid 1:1 sessions, platform, small market | **KILL** |
| Founder full-time | **KILL** |
| Venture / VC-scale | **KILL** |
| Cheapest wedge — concierge, hand-matched, no product | **CONDITIONAL → caps at 副业·CAPPED** |
| Community / reputation option | out of this verdict's scope |

## Why it dies — the death-modules that fire

1. **New-supply trap (mother-death #2).** The supply you need — experts who treat selling 1:1s to strangers as a standing activity — *does not already exist*. You'd have to make a population **start** doing it. In a small market that's a physics problem (changing people's behaviour), not a marketing one. Harvesting existing supply is light; igniting new supply is heavy.
2. **De-intermediation (mother-death #1).** Revenue rides on a **one-off match**. Once two people have one good session, they exchange contacts and go direct — take% → 0. Nothing structural keeps the transaction on-platform (no continuous, workflow-embedded metering).
3. **Engine in the wrong place (mother-death #3).** This charges **directly for the connection** — the one seat the engine can't take. The defensible engine sits *beside* "readable talent → hiring / capital / deals," never on the conversation itself.
4. **Frequency–density–WTP deadlock (the capping filter).** The only legitimate low-frequency engine needs supply **density** to feel alive. A small market has thin *standing* supply, so you're forced to either (a) fabricate thin supply → buyers' WTP → 0, or (b) harvest the real thin supply → TAM ceiling = a studio, not a platform. **Swap in every supply source you can think of; the wall doesn't move.** That's a structural death, not an angle problem.
5. **Wish-market.** Warm demand, real WTP ≈ 0. `revenue = reach × WTP × frequency`; multiply by a near-zero WTP and the rest is decoration. "People say they'd use it" is the symptom, not the signal.

## Unit-economics sketch

Episodic use (1–2×/yr) × a take% that decays toward zero after the first match × a CAC you pay to acquire *both* sides → **LTV : CAC < 1**. It can't even clear its own cash on the platform model; the only positive-margin shape is a hands-on, un-scalable matchmaking service.

## What would have to be true (and isn't)

- Experts treat paid stranger-1:1s as a **standing** activity. *(They don't — supply has to be ignited.)*
- Seekers pay real money, **repeatedly**. *(Warm ≠ paid; advice is episodic.)*
- The match **stays on-platform**. *(It doesn't — one good chat and they go direct.)*

## Cheapest falsification test (before building anything)

**Concierge it.** Hand-match **10 paid sessions yourself**, no product, no app. **Kill criterion:** if you cannot get N strangers to pay \$X for a session **twice within 4 weeks** — without you personally subsidizing either side — the WTP pillar is dead and so is the platform. Zero code. Run this before writing a line.

## Opportunity-cost line

Against the founder's real best alternative (a salaried role / an already-validated direction), a hands-on matchmaking studio that *can't clear opportunity cost* is a **KILL for full-time**, and at most a **副业 · CAPPED** weekend experiment. "Capped" describes scalability, not worth — but here it doesn't even clear the founder's opportunity-cost line full-time.

## Third-party glance + red-team (closing)

An outsider skims it and says *"obviously promising — everyone wants smarter coffee chats."* The verdict disagrees on purpose: **warmth isn't WTP, and the supply doesn't pre-exist.** Red-teaming the other way (am I too harsh?): the **concierge wedge survives as CONDITIONAL** — that single branch is worth a cheap test; the platform/venture framing is not. No false-kill on the wedge; the KILL is on the platform-at-scale object, which is where it belongs.

---

*De-identified, illustrative example. Not any real company's confidential data. The framework, four verdicts, and death-modules are documented in [`../SKILL.md`](../SKILL.md).*
