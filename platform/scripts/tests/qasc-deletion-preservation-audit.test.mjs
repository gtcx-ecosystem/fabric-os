import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCommits,
  analyzeCurrentStatus,
  parseNameStatusLog,
  statusLineIsArchiveDeleteRename,
  statusLineIsBareDelete,
} from '../qasc-deletion-preservation-audit.mjs';

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
});
