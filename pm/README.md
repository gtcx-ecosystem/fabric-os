# PM — product roadmap & completion

**Single agile SoR (P35 v5).** Audits update scores; `pnpm audit:pm-reconcile` recalculates completion.

| Artifact                                               | Role                                   | Edit?     |
| ------------------------------------------------------ | -------------------------------------- | --------- |
| [`initiatives.json`](./roadmap/initiatives.json)       | Initiatives → epics → features         | **Yes**   |
| [`completion-model.json`](./completion-model.json)     | DoD gates, weights, 100/100 thresholds | **Yes**   |
| [`manifest.json`](./manifest.json)                     | Paths + reconcile config               | **Yes**   |
| [`readiness-snapshot.json`](./readiness-snapshot.json) | Latest audit scores                    | Generated |
| [`execution-roadmap.md`](./execution-roadmap.md)       | Human roadmap view                     | Generated |

```bash
pnpm pm:sync
pnpm pm:folder:check
```

Spec: `bridge-os/pm/spec/pm-folder-requirements.json`
