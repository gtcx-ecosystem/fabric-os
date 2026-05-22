# Changelog

All notable changes to `@gtcx/audit-signer` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-22

### Added

- `generateKeyPair()` — Ed25519 keypair from Node's `crypto.generateKeyPairSync`.
- `createRecord({ actor, action, target, reason?, payload? })` — builds an unsigned record with RFC 8785 (JCS) canonical hash of the payload.
- `signRecord` / `verifyRecord` — single-record signing and verification using the embedded public key.
- `createChain` / `append` — hash-linked chain construction; each record's `prevHash` anchors to the previous record's canonical hash.
- `verifyChain` — verifies every record's signature AND every chain link; returns `{ valid, firstInvalidIndex, reason }`.
- `toNdjson` / `fromNdjson` — stable serialization for durable storage.
- 34 unit tests covering happy paths, tamper detection, and chain reconstruction.

### Notes

- This is the first public release. The API has been stable inside GTCX for months as the substrate behind the SIGNAL S2 audit-trail and I2 audit-immutability claims.
- Reports of any cryptographic concerns are welcome via GitHub Security Advisories on the parent repository.

[0.1.0]: https://github.com/gtcx-ecosystem/gtcx-infrastructure/tree/main/tools/audit-signer
