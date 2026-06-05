# @gtcx/ussd-handler

Feature-phone USSD gateway for GTCX trade compliance — low-bandwidth, multi-language, Redis-backed sessions.

## Endpoints

| Path       | Purpose                      |
| ---------- | ---------------------------- |
| `/ussd`    | USSD webhook (operator POST) |
| `/health`  | Liveness                     |
| `/metrics` | Prometheus exposition        |

## Features

- Six-language localization (EN, Shona, Ndebele, Swahili, Zulu, FR)
- PBKDF2 PIN auth with lockout
- Redis + in-memory session stores
- Branch coverage gate ≥90% in CI

## Commands

```bash
pnpm --filter @gtcx/ussd-handler test
pnpm --filter @gtcx/ussd-handler start
```

**Soak:** [`tools/load-tests/ussd-handler-soak.js`](../load-tests/ussd-handler-soak.js) · **Spec:** [`docs/specs/ussd-protocol.md`](../../docs/specs/ussd-protocol.md)
