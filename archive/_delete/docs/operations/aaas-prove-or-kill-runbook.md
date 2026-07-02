# AaaS — prove-or-kill runbook (instructions for the parked framework)

_The framework is PARKED (off-moat, unused, unproven). Do NOT keep building it. These are the only
instructions worth following: run ONE decisive test that either proves real value or kills it. No
further investment until this test passes._

## Precondition (externally blocked)

The autonomous runner (`aaas:loop` / `aaas-loop.yml`) **cannot operate** while the org GitHub Actions
billing lock is in place — jobs fail in ~2s before running. Until an account owner clears billing, the
framework physically cannot run in production. **While blocked, it stays PARKED.** This is not a code fix.

## The test — drive ONE real remediation end-to-end (do this, or kill)

1. **Pick a target product repo** with a fresh, valid `audit/evidence/mpr-repo-latest.json` AND a real,
   user/quality-facing gap (not pure hygiene).
2. **Run the loop for real:**
   ```bash
   pnpm aaas:audit --lens all --repo <X> --write
   pnpm aaas:handoff --repo <X> --write   # read audit/handoff/handoff-<date>.md
   ```
3. **Gate the handoff itself.** Is the top action a genuine improvement, or "raise pillar to 85 via P35 layout"?
   - **Hygiene-only → the framework FAILED its purpose** (it directs to off-moat busywork) → go to Kill.
   - **Real fix → proceed.**
4. **Actually remediate it** — real code/doc/config change in repo X (Class R, commit in-session). Not a
   metric game — a real improvement that serves users or quality.
5. **Close the loop:** write `reports/<action>-<date>.md` that **cites the handoff**, then re-run
   `pnpm aaas:audit --lens all --repo <X>` and confirm the gate clears. This is the FIRST time the
   framework fulfills its purpose. One real data point = it has earned a second look.

## Kill criteria (any one → retire it)

- Billing stays locked and no runner can operate, OR
- The handoff only ever produces hygiene busywork (step 3), OR
- No real remediation gets driven within one focused session.

**To kill:** move `platform/scripts/aaas-*.mjs` + `lib/aaas-*.mjs` + the workflows to an `experimental/`
branch (or delete — they're in git history), remove the AaaS command-surface claims from `.claude/CLAUDE.md`,
and retire `machine/spec/aaas-audit-contract.json`. Don't leave zombie infra rotting in `main`.

## The actual pivot (regardless of prove/kill)

The real lesson of the session that built this: **spend the next effort on product/UX craft in a
user-facing repo** (terminal-os, ledger-ui, mobile) — the org's stated moat — not on measurement
infrastructure. Measure less; build the product more.
