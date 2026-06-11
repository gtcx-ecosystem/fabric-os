# pm/ci — agent CI gates

Machine-readable CI expectations for agent sessions. Scores derive from evidence — not agent self-judgment.

| File                           | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `gates.json`                   | Required gate commands + min scores             |
| `feature-coverage-matrix.json` | Feature → test/demo evidence (enterprise pilot) |

Run: `pnpm ops:check` · `pnpm verify` · repo master audit when available.
