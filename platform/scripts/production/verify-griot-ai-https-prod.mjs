#!/usr/bin/env node
/**
 * Verify griot-ai production HTTPS endpoints (F-prod-06).
 *
 * Usage:
 *   node platform/scripts/production/verify-griot-ai-https-prod.mjs [--write]
 *
 * Checks:
 *   1. ACM certificate for griot.gtcx.trade is ISSUED (eu-west-1)
 *   2. HTTPS /health returns 200 on griot.gtcx.trade
 *   3. HTTP /health returns 200 or 308 redirect on griot.gtcx.trade
 *   4. ACM certificate for api.griot.ai is VALIDATED (af-south-1)
 *   5. ACM validation CNAME for api.griot.ai is resolvable
 *   6. HTTPS /health returns 200 on api.griot.ai
 *   7. HTTP /health returns 200 or 308 redirect on api.griot.ai
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

const CANONICAL_DOMAIN = 'griot.gtcx.trade';
const CANONICAL_CERT_ARN =
  'arn:aws:acm:eu-west-1:348389439381:certificate/078c204c-e90e-46fb-b3b2-2749439b10ae';
const CANONICAL_HTTPS_URL = `https://${CANONICAL_DOMAIN}/health`;
const CANONICAL_HTTP_URL = `http://${CANONICAL_DOMAIN}/health`;

const API_DOMAIN = 'api.griot.ai';
const API_CERT_ARN =
  'arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1';
const API_HTTPS_URL = `https://${API_DOMAIN}/health`;
const API_HTTP_URL = `http://${API_DOMAIN}/health`;

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
  const out = sh(`curl ${flag} -o /dev/null -w '%{http_code}' --max-time 15 '${url}'`, {
    ignoreError: true,
  });
  if (!out) return null;
  return parseInt(out, 10) || null;
}

function curlRedirectLocation(url) {
  const out = sh(`curl -sS -o /dev/null -w '%{redirect_url}' --max-time 15 '${url}'`, {
    ignoreError: true,
  });
  return out || null;
}

function checkCanonicalAcmIssued() {
  const detail = awsJson(
    `aws acm describe-certificate --certificate-arn ${CANONICAL_CERT_ARN} --region eu-west-1 --output json`
  );
  const status = detail?.Certificate?.Status;
  const domainStatus = detail?.Certificate?.DomainValidationOptions?.find(
    (d) => d.DomainName === CANONICAL_DOMAIN
  )?.ValidationStatus;
  return {
    ok: status === 'ISSUED' && domainStatus === 'SUCCESS',
    detail: { status, domainStatus, arn: CANONICAL_CERT_ARN },
  };
}

function checkCanonicalHttps200() {
  const status = curlStatus(CANONICAL_HTTPS_URL, { follow: true });
  return { ok: status === 200, detail: { status } };
}

function checkCanonicalHttpRedirect() {
  const status = curlStatus(CANONICAL_HTTP_URL, { follow: false });
  const location = curlRedirectLocation(CANONICAL_HTTP_URL);
  const ok = status === 200 || (status === 308 && location?.startsWith('https://'));
  return { ok, detail: { status, location } };
}

function checkApiAcmValidated() {
  const detail = awsJson(
    `aws acm describe-certificate --certificate-arn ${API_CERT_ARN} --region af-south-1 --output json`
  );
  const status = detail?.Certificate?.Status;
  const dvo = detail?.Certificate?.DomainValidationOptions?.find(
    (d) => d.DomainName === API_DOMAIN
  );
  const domainStatus = dvo?.ValidationStatus;
  const resourceRecord = dvo?.ResourceRecord;
  return {
    ok: status === 'ISSUED' && domainStatus === 'SUCCESS',
    detail: { status, domainStatus, arn: API_CERT_ARN, resourceRecord },
  };
}

function checkApiAcmCnamePresent() {
  const dvo = awsJson(
    `aws acm describe-certificate --certificate-arn ${API_CERT_ARN} --region af-south-1 --output json`
  )?.Certificate?.DomainValidationOptions?.find((d) => d.DomainName === API_DOMAIN);
  const name = dvo?.ResourceRecord?.Name?.replace(/\.$/, '');
  if (!name) return { ok: false, detail: { reason: 'cannot determine validation CNAME from ACM' } };
  const value = sh(`dig +short ${name} CNAME`, { ignoreError: true });
  return {
    ok: Boolean(value) && value.includes('acm-validations.aws'),
    detail: { cname: name, resolvedValue: value || null, expectedValue: dvo.ResourceRecord.Value },
  };
}

function checkApiHttps200() {
  const status = curlStatus(API_HTTPS_URL, { follow: true });
  return { ok: status === 200, detail: { status } };
}

function checkApiHttpRedirect() {
  const status = curlStatus(API_HTTP_URL, { follow: false });
  const location = curlRedirectLocation(API_HTTP_URL);
  const ok = status === 200 || (status === 308 && location?.startsWith('https://'));
  return { ok, detail: { status, location } };
}

const gates = [
  {
    id: 'canonical-acm-cert-issued',
    label: `ACM certificate ${CANONICAL_CERT_ARN} is ISSUED for ${CANONICAL_DOMAIN}`,
    check: checkCanonicalAcmIssued,
  },
  {
    id: 'canonical-https-200',
    label: `${CANONICAL_HTTPS_URL} returns HTTP 200`,
    check: checkCanonicalHttps200,
  },
  {
    id: 'canonical-http-ok-or-redirect',
    label: `${CANONICAL_HTTP_URL} returns HTTP 200 or 308 redirect to HTTPS`,
    check: checkCanonicalHttpRedirect,
  },
  {
    id: 'api-acm-cert-validated',
    label: `ACM certificate ${API_CERT_ARN} is VALIDATED for ${API_DOMAIN}`,
    check: checkApiAcmValidated,
  },
  {
    id: 'api-acm-cname-present',
    label: `ACM validation CNAME for ${API_DOMAIN} is resolvable`,
    check: checkApiAcmCnamePresent,
  },
  { id: 'api-https-200', label: `${API_HTTPS_URL} returns HTTP 200`, check: checkApiHttps200 },
  {
    id: 'api-http-ok-or-redirect',
    label: `${API_HTTP_URL} returns HTTP 200 or 308 redirect to HTTPS`,
    check: checkApiHttpRedirect,
  },
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
      operatorStep: pass
        ? 'None — griot.gtcx.trade and api.griot.ai production HTTPS are green'
        : 'Add Dynadot CNAME + repoint api.griot.ai A record to the Griot ALB, then apply ../griot-ai/deploy/infra/k8s/ingress-https.yaml',
    };

    mkdirSync(dirname(HUB_WITNESS), { recursive: true });
    writeFileSync(HUB_WITNESS, JSON.stringify(hub, null, 2));
    console.log(`Wrote ${HUB_WITNESS}`);
  }

  process.exit(pass ? 0 : 1);
}

run();
