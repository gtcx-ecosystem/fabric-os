# GTCX Migration Stack - Infrastructure & Orchestration

This directory contains the configurations and scripts for orchestrating the GTCX Migration Stack (MABA, KORA, AMANI).

---

## ⚠️ Important Notice

The source code and functional logic for these components have been migrated to the **[sensei-ai](https://github.com/gtcx-ecosystem/sensei-ai)** repository. This directory is reserved for:

1.  **Orchestration Configs:** Environment-specific YAML definitions.
2.  **Deployment Documentation:** `agile-pm` structures for infrastructure-specific requirements.
3.  **Local Dev Integration:** Docker Compose and local testing scripts.

---

## Components

- **MABA:** Universal Transformation Engine
- **KORA:** Multi-Source Verification Oracle (Part of Sensei-OS)
- **AMANI:** Multilingual Guidance Layer

---

## Quick Start

### Local Integration Test

To start the integration environment:

```bash
cd ../../
docker compose -f infra/docker/docker-compose.dev.yml up maba kora amani
```

### Documentation Audit

To audit the documentation for these components (within this repo):

```bash
python scripts/check_docs.py
```

### Configuration

Domain-specific configurations live in `config/`. These should be updated to point to the correct `sensei-ai` endpoints.

---

_Part of the GTCX Infrastructure Stack_
