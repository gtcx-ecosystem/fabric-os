#!/usr/bin/env node
/**
 * Verify griot-ai production HTTPS endpoint (F-prod-06).
 *
 * Usage:
 *   node platform/scripts/production/verify-griot-ai-https-prod.mjs [--write]
 *
 * Checks:
 *   1. ACM certificate for griot.gtcx.trade is ISSUED
 *   2. HTTPS /health returns 200
 *   3. HTTP /health returns 200 or 308 redirect to HTTPS
 *
 * With --write: writes local witness + redacted hub witness.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const WRITE = process.argv.includes('--write');
const ROOT = process.cwd();
const LOCAL_WITNESS = join(ROOT, 'audit/evidence/griot-ai-https-prod-verify-latest.json');
const HUB_WITNESS = join(ROOT, '../bridge-os/machine/ci/fabric-os-blocker-fprod06-latest.json');

const HTTPS_URL = 'https://griot.gtcx.trade/health';
const HTTP_URL = 'http://griot.gtcx.trade/health';
const DOMAIN = 'griot.gtcx.trade';
const CERT_ARN = 'arn:aws:acm:eu-west-1:348389439381:certificate/078c204c-e90e-46fb-b3b2-2749439b10ae';

function sh(cmd, { ignoreError = false } = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    if (ignoreError) return '';
    return null;
  }
}

function awsJson(cmd) {
  const out = sh(cmd, { ignoreError: true });
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function curlStatus(url, { follow = false } = {}) {
  const flag = follow ? '-sSL' : '-sS';
  const out = sh(`curl ${flag} -o /dev/null -w '%{http_code}' --max-time 15 '${url}'`, { ignoreError: true });
  if (!out) return null;
  return parseInt(out, 10) || null;
}

function curlRedirectLocation(url) {
  const out = sh(`curl -sS -o /dev/null -w '%{redirect_url}' --max-time 15 '${url}'`, { ignoreError: true });
  return out || null;
}

function checkAcmIssued() {
  const detail = awsJson(`aws acm describe-certificate --certificate-arn ${CERT_ARN} --region eu-west-1 --output json`);
  const status = detail?.Certificate?.Status;
  const domainStatus = detail?.Certificate?.DomainValidationOptions?.find((d) => d.DomainName === DOMAIN)?.ValidationStatus;
  return {
    ok: status === 'ISSUED' && domainStatus === 'SUCCESS',
    detail: { status, domainStatus, arn: CERT_ARN },
  };
}

function checkHttps200() {
  const status = curlStatus(HTTPS_URL, { follow: true });
  return { ok: status === 200, detail: { status } };
}

function checkHttpRedirect() {
  const status = curlStatus(HTTP_URL, { follow: false });
  const location = curlRedirectLocation(HTTP_URL);
  const ok = status === 200 || (status === 308 && location?.startsWith('https://'));
  return { ok, detail: { status, location } };
}

const gates = [
  { id: 'acm-cert-issued', label: `ACM certificate ${CERT_ARN} is ISSUED for ${DOMAIN}`, check: checkAcmIssued },
  { id: 'https-200', label: `${HTTPS_URL} returns HTTP 200`, check: checkHttps200 },
  { id: 'http-ok-or-redirect', label: `${HTTP_URL} returns HTTP 200 or 308 redirect to HTTPS`, check: checkHttpRedirect },
];

function run() {
  const results = gates.map((g) => {
    const r = g.check();
    const status = r.ok ? 'OK' : 'FAIL';
    console.log(`${status} ${g.id}`);
    return { id: g.id, label: g.label, status: r.ok ? 'pass' : 'fail', detail: r.detail };
  });

  const pass = results.every((r) => r.status === 'pass');
  console.log(`${pass ? 'PASS' : 'FAIL'} — griot-ai production HTTPS`);

  if (WRITE) {
    const witness = {
      schema: 'gtcx://fabric-os/blocker-verify/v1',
      blockerId: 'F-prod-06',
      updated: new Date().toISOString(),
      repo: 'fabric-os',
      status: pass ? 'ready' : 'not_ready',
      gates: results,
    };

    mkdirSync(dirname(LOCAL_WITNESS), { recursive: true });
    writeFileSync(LOCAL_WITNESS, JSON.stringify(witness, null, 2));
    console.log(`Wrote ${LOCAL_WITNESS}`);

    const hub = {
      schema: 'gtcx://fabric-os/hub-witness/v1',
      blockerId: 'F-prod-06',
      updated: new Date().toISOString(),
      owner: 'fabric-os',
      status: pass ? 'ready' : 'not_ready',
      class: 'A',
      infrastructureReady: pass,
      evidencePath: 'audit/evidence/griot-ai-https-prod-verify-latest.json',
      runbookPath: 'docs/operations/runbooks/griot-ai-https-production.md',
      operatorStep: 'None — griot.gtcx.trade production HTTPS is green',
    };

    mkdirSync(dirname(HUB_WITNESS), { recursive: true });
    writeFileSync(HUB_WITNESS, JSON.stringify(hub, null, 2));
    console.log(`Wrote ${HUB_WITNESS}`);
  }

  process.exit(pass ? 0 : 1);
}

run();
