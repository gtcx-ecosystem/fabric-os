# machine/retrospectives — agent session learning

Each agent session and sprint produces a retrospective for 1000x improvement.

| Path                                | Purpose                     |
| ----------------------------------- | --------------------------- |
| `TEMPLATE-session-retrospective.md` | Copy per session            |
| `sprint-*/`                         | Sprint-bound retrospectives |
| `sessions/`                         | Per-session JSON + markdown |

Generate: `pnpm ecosystem:session:retrospective --write` (bridge-os fleet) or repo-local template.
