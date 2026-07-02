import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeCommits,
  analyzeCurrentStatus,
  analyzeExactRecoveryManifest,
  parseNameStatusLog,
  statusLineIsArchiveDeleteRename,
  statusLineIsBareDelete,
} from '../qasc-deletion-preservation-audit.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(SCRIPTS, '../..');

describe('QASC deletion preservation audit', () => {
  it('scores bare historical deletes as preservation gaps', () => {
    const commits = parseNameStatusLog([
      '@@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\taaaaaaa\t2026-07-01\tchore(repo): remove active folder',
      'D\tagents/README.md',
      'D\tagents/FOLDER-SPEC.md',
      '',
    ].join('\n'));

    const result = analyzeCommits(commits);
    assert.equal(result.deleteCommits, 1);
    assert.equal(result.unsafeDeleteCommits, 1);
    assert.equal(result.archiveDeleteCommits, 0);
    assert.equal(result.deletedFiles, 2);
    assert.equal(result.historicalScore100, 0);
    assert.deepEqual(result.risky[0].sampleDeletes, ['agents/README.md', 'agents/FOLDER-SPEC.md']);
  });

  it('recognizes archive/_delete historical relocation in the same commit', () => {
    const commits = parseNameStatusLog([
      '@@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\tbbbbbbb\t2026-07-01\tchore(repo): archive retired folder',
      'D\tagents/README.md',
      'A\tarchive/_delete/retired-agents-2026-07-01/agents/README.md',
      '',
    ].join('\n'));

    const result = analyzeCommits(commits);
    assert.equal(result.deleteCommits, 1);
    assert.equal(result.unsafeDeleteCommits, 0);
    assert.equal(result.archiveDeleteCommits, 1);
    assert.equal(result.historicalScore100, 100);
  });

  it('detects current bare deletes separately from archive renames', () => {
    assert.equal(statusLineIsBareDelete(' D .claude/skills/test-driven-development'), true);
    assert.equal(statusLineIsBareDelete('D  agents/README.md'), true);
    assert.equal(statusLineIsBareDelete('R  agents/README.md -> archive/_delete/agents/README.md'), false);
    assert.equal(statusLineIsArchiveDeleteRename('R  agents/README.md -> archive/_delete/agents/README.md'), true);

    const status = analyzeCurrentStatus([
      ' D .claude/skills/test-driven-development',
      'R  agents/README.md -> archive/_delete/retired/agents/README.md',
      ' M package.json',
      '',
    ].join('\n'));

    assert.equal(status.dirty, true);
    assert.equal(status.bareDeleteCount, 1);
    assert.equal(status.archiveRenameCount, 1);
    assert.equal(status.currentScore100, 0);
  });

  it('scores exact delete recovery manifests as historical coverage', () => {
    const result = analyzeExactRecoveryManifest({
      schema: 'gtcx://fabric-os/archive-delete-exact-recovery/v1',
      since: '2026-06-02T00:00:00',
      deletionEvents: 3,
      uniqueDeletedPaths: 2,
      coveredEvents: 3,
      missingEvents: 0,
      collisionMarkers: 1,
    }, {
      since: '2026-06-02T00:00:00',
      expectedDeletedFiles: 3,
    });

    assert.equal(result.valid, true);
    assert.equal(result.score100, 100);
    assert.equal(result.coveredEvents, 3);
    assert.equal(result.collisionMarkers, 1);
  });

  it('emits compact JSON for nested fleet scorers', () => {
    const result = spawnSync(process.execPath, [
      join(SCRIPTS, 'qasc-deletion-preservation-audit.mjs'),
      '--compact-json',
      '--repos',
      'fabric-os',
    ], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.schema, 'gtcx://fabric-os/qasc-deletion-preservation-audit/v1');
    assert.equal(witness.repos[0].repo, 'fabric-os');
    assert.equal(witness.repos[0].historical.risky, undefined);
    assert.equal(typeof witness.repos[0].historical.exactRecovery.score100, 'number');
  });

  it('rejects exact delete recovery manifests that do not match git deletion events', () => {
    const result = analyzeExactRecoveryManifest({
      schema: 'gtcx://fabric-os/archive-delete-exact-recovery/v1',
      since: '2026-06-02T00:00:00',
      deletionEvents: 2,
      uniqueDeletedPaths: 2,
      coveredEvents: 2,
      missingEvents: 0,
      collisionMarkers: 0,
    }, {
      since: '2026-06-02T00:00:00',
      expectedDeletedFiles: 3,
    });

    assert.equal(result.valid, false);
    assert.equal(result.score100, 0);
    assert.match(result.problems[0], /does not match git deleted file events/);
  });
});
