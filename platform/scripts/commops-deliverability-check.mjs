#!/usr/bin/env node
/**
 * CommOps deliverability substrate witness (fabric-os).
 * Usage: node commops-deliverability-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SUBSTRATE = join(ROOT, 'pm/commops-substrate-contract.json');
const OUT = join(ROOT, 'audit/evidence/commops-deliverability-latest.json');
const OVERLAY = join(ROOT, 'deploy/kubernetes/overlays/staging/commops');
const SERVER = join(ROOT, 'platform/tools/commops-bounce-webhook/server.mjs');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

let channels = [];
let deliverability = {};
if (existsSync(SUBSTRATE)) {
  const sub = JSON.parse(readFileSync(SUBSTRATE, 'utf8'));
  channels = sub.channels ?? [];
  deliverability = sub.deliverability ?? {};
}

function overlayFile(name) {
  return join(OVERLAY, name);
}

function ingressPathsOk() {
  const ingress = overlayFile('ingress.yaml');
  if (!existsSync(ingress)) return { ok: false };
  const body = readFileSync(ingress, 'utf8');
  const sendgridPath = deliverability.bounceWebhookPaths?.sendgrid ?? '/webhooks/sendgrid/events';
  const twilioPath = deliverability.bounceWebhookPaths?.twilio ?? '/webhooks/twilio/status';
  return {
    ok: body.includes(sendgridPath) && body.includes(twilioPath),
    sendgridPath,
    twilioPath,
  };
}

function liveWebhookProbe() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SERVER], {
      cwd: ROOT,
      env: { ...process.env, PORT: '18080', HOST: '127.0.0.1' },
      stdio: 'ignore',
    });
    const finish = (result) => {
      child.kill('SIGTERM');
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, error: 'timeout' }), 8000);
    setTimeout(() => {
      const health = spawnSync('curl', ['-sf', 'http://127.0.0.1:18080/health'], { encoding: 'utf8' });
      if ((health.status ?? 1) !== 0) {
        clearTimeout(timer);
        finish({ ok: false, error: 'health_probe_failed' });
        return;
      }
      const bounce = spawnSync(
        'curl',
        [
          '-sf',
          '-X',
          'POST',
          'http://127.0.0.1:18080/webhooks/sendgrid/events',
          '-H',
          'content-type: application/json',
          '-d',
          '[{"event":"bounce","email":"probe@staging.gtcx.trade"}]',
        ],
        { encoding: 'utf8' },
      );
      clearTimeout(timer);
      finish({
        ok: (bounce.status ?? 1) === 0 && (bounce.stdout ?? '').includes('received'),
        healthExit: health.status ?? 1,
        bounceExit: bounce.status ?? 1,
      });
    }, 400);
  });
}

function stagingHealthProbe(host) {
  const r = spawnSync('curl', ['-sf', '--max-time', '8', `https://${host}/health`], { encoding: 'utf8' });
  return {
    ok: (r.status ?? 1) === 0,
    advisory: true,
    host,
    exitCode: r.status ?? 1,
  };
}

const ingressCheck = ingressPathsOk();
const gates = {
  substrate: { ok: existsSync(SUBSTRATE) },
  channelCount: { ok: channels.length >= 3, count: channels.length },
  dkimRequired: { ok: deliverability.dkimRequired === true },
  spfRequired: { ok: deliverability.spfRequired === true },
  bounceOverlay: { ok: existsSync(join(OVERLAY, 'kustomization.yaml')) },
  bounceIngress: { ok: existsSync(overlayFile('ingress.yaml')) },
  bounceDeployment: { ok: existsSync(overlayFile('deployment.yaml')) },
  bounceService: { ok: existsSync(overlayFile('service.yaml')) },
  webhookPaths: { ok: ingressCheck.ok, ...ingressCheck },
  bounceServerSource: { ok: existsSync(SERVER) },
  liveBounceWebhook: { ok: false },
  stagingHealthLive: { ok: false, advisory: true },
};

const live = await liveWebhookProbe();
gates.liveBounceWebhook = live;

const host = deliverability.bounceWebhookHost;
if (host) {
  gates.stagingHealthLive = stagingHealthProbe(host);
}

const requiredOk =
  gates.substrate.ok &&
  gates.channelCount.ok &&
  gates.dkimRequired.ok &&
  gates.spfRequired.ok &&
  gates.bounceOverlay.ok &&
  gates.bounceIngress.ok &&
  gates.bounceDeployment.ok &&
  gates.bounceService.ok &&
  gates.webhookPaths.ok &&
  gates.bounceServerSource.ok &&
  gates.liveBounceWebhook.ok;

const witness = {
  $schema: 'gtcx://fabric-os/commops-deliverability/v1',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  lane: 'CommOps',
  channels: channels.map((c) => ({ id: c.id, provider: c.provider, status: c.status })),
  bounceWebhookUrl: host
    ? `https://${host}${deliverability.bounceWebhookPaths?.sendgrid ?? '/webhooks/sendgrid/events'}`
    : null,
  gates,
  ok: requiredOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log('=== CommOps deliverability ===\n');
  for (const [k, v] of Object.entries(gates)) {
    const tag = v.advisory && !v.ok ? 'ADVISORY' : v.ok ? 'OK' : 'FAIL';
    console.log(`${tag} ${k}`);
  }
  console.log(`\n${requiredOk ? 'PASS' : 'FAIL'}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(requiredOk ? 0 : 1);
