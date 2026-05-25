# Kimi — GTCX Infrastructure Agent Protocol

> **Read first:** `../AGENTS.md` (shared protocol for all agents)
> **This doc:** Kimi Code CLI specifics for GTCX Infrastructure
> **Date:** 2026-05-25
> **Version:** 1.0

---

## Kimi-Specific Setup

### Available Tools

Kimi Code CLI provides these tools for GTCX Infrastructure development:

| Tool | Best Use |
|------|----------|
| `ReadFile` | Read source files, docs, configs |
| `WriteFile` | Create new files. Use `append` mode after first write |
| `StrReplaceFile` | **Preferred** for edits. Can batch replacements |
| `Shell` | Run bash. Chain with `&&` |
| `Agent` | Delegate subtasks. Types: `coder`, `explore`, `plan` |
| `Grep` | Search code. Prefer over `Shell grep` |
| `Glob` | Find files. Use patterns like `src/**/*.ts` |

### Conventions

1. **Parallel reads:** Read multiple files in one turn when possible
2. **Grep over Shell:** Use `Grep` tool, never `Shell grep`
3. **Explore before code:** Use `explore` subagents for codebase research
4. **Quality gates:** Run tests before committing
