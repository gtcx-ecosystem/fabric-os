-- =============================================================================
-- GTCX Audit Database Schema
-- =============================================================================
-- Dedicated audit database — append-heavy, compliance-critical.
-- Separated from operational DB per AUDITABLE (3): independent retention,
-- independent access controls, independent backup schedule.
--
-- Per RESILIENT (12): Audit records survive operational DB failures
-- Per SOVEREIGN (6): Co-located with operational data in-region
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Audit Records
-- =============================================================================

CREATE TABLE audit_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  request_id          UUID NOT NULL,
  actor_did           VARCHAR(255) NOT NULL,
  action              VARCHAR(512) NOT NULL,
  resource_id         VARCHAR(255),
  timestamp           TIMESTAMPTZ NOT NULL,
  outcome             VARCHAR(20) NOT NULL,
  status_code         INT NOT NULL,
  entity_type         VARCHAR(50),
  jurisdiction_code   VARCHAR(10),
  processing_time_ms  INT,
  request_body_hash   VARCHAR(64),
  metadata            JSONB,

  CONSTRAINT audit_outcome_check CHECK (
    outcome IN ('SUCCESS', 'FAILURE', 'REJECTED')
  )
);

-- =============================================================================
-- Indexes — optimized for compliance queries
-- =============================================================================

-- Primary query patterns: by actor, by time range, by action, by outcome
CREATE INDEX idx_audit_actor ON audit_records(actor_did);
CREATE INDEX idx_audit_action ON audit_records(action);
CREATE INDEX idx_audit_timestamp ON audit_records(timestamp);
CREATE INDEX idx_audit_outcome ON audit_records(outcome);
CREATE INDEX idx_audit_resource ON audit_records(resource_id);
CREATE INDEX idx_audit_jurisdiction ON audit_records(jurisdiction_code);
CREATE INDEX idx_audit_entity_type ON audit_records(entity_type);
CREATE INDEX idx_audit_request_id ON audit_records(request_id);

-- Composite index for common compliance queries
CREATE INDEX idx_audit_actor_time ON audit_records(actor_did, timestamp);
CREATE INDEX idx_audit_jurisdiction_time ON audit_records(jurisdiction_code, timestamp);
