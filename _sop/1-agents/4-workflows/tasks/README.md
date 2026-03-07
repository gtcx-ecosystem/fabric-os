# Agent Tasks

Step-by-step runbooks for the most common agentic work in `gtcx-infrastructure`.

## Tasks

| File                                                   | When to use                                              |
| ------------------------------------------------------ | -------------------------------------------------------- |
| [add-package.md](add-package.md)                       | Adding a new Node tooling package to the workspace       |
| [cut-release.md](cut-release.md)                       | Cutting a release and tagging a deployment               |
| [investigate-ci-failure.md](investigate-ci-failure.md) | Diagnosing and resolving a CI gate failure               |
| [write-adr.md](write-adr.md)                           | Authoring and publishing an Architecture Decision Record |

All tasks operate within the role boundaries defined in `_sop/1-agents/4-workflows/safety-rules.md`.

Infrastructure changes affect all GTCX services. Every task that touches live resources requires human approval of the plan before execution.
