#!/usr/bin/env node
/**
 * Verify griot-ai HTTPS ingress (FB-002).
 *
 * Usage:
 *   node platform/scripts/staging/verify-griot-ai-https.mjs [--write]
 *
 * Checks:
 *   1. ACM certificate exists for the configured domain (default: griot-staging.gtcx.trade)
 *   2. ACM certificate status is ISSUED
 *   3. Route53 A record for the configured domain exists
 *   4. K8s ingress exists in griot-ai-staging namespace
 *   5. K8s ingress has HTTPS:443 listener and certificate-arn annotation
 *
 * With --write: writes local witness + redacted hub witness.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const WRITE = process.argv.includes('--write');
const ROOT = process.cwd();
const LOCAL_WITNESS = join(ROOT, 'audit/evidence/griot-ai-https-verify-latest.json');
const HUB_WITNESS = join(ROOT, '../bridge-os/pm/ci/fabric-os-blocker-fb002-latest.json');

const PRIMARY_DOMAIN = process.env.GRIOT_AI_DOMAIN || 'griot-staging.gtcx.trade';
const GRIOT_AI_APEX = process.env.GRIOT_AI_APEX_DOMAIN || 'gtcx.trade';
const NAMESPACE = 'griot-ai-staging';
const INGRESS_NAME = 'griot-api';

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

function acmCert() {
  const certs = awsJson(
    `aws acm list-certificates --includes keyTypes=RSA_2048,EC_secp384r1 --output json`
  );
  if (!Array.isArray(certs?.CertificateSummaryList)) return null;
  return certs.CertificateSummaryList.find((c) => c.DomainName === PRIMARY_DOMAIN) || null;
}

function acmCertDetail(arn) {
  return awsJson(`aws acm describe-certificate --certificate-arn ${arn} --output json`);
}

function route53ZoneId(apex) {
  const zones = awsJson(`aws route53 list-hosted-zones --output json`);
  if (!Array.isArray(zones?.HostedZones)) return null;
  const zone = zones.HostedZones.find((z) => z.Name === `${apex}.`);
  return zone?.Id?.replace('/hostedzone/', '') || null;
}

function route53ARecord(zoneId) {
  if (!zoneId) return null;
  const records = awsJson(`aws route53 list-resource-record-sets --hosted-zone-id ${zoneId} --output json`);
  if (!Array.isArray(records?.ResourceRecordSets)) return null;
  return records.ResourceRecordSets.find(
    (r) => r.Name === `${PRIMARY_DOMAIN}.` && r.Type === 'A'
  ) || null;
}

function k8sIngress() {
  const out = sh(
    `kubectl get ingress -n ${NAMESPACE} ${INGRESS_NAME} -o json`,
    { ignoreError: true }
  );
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function checkAcmExists() {
  const cert = acmCert();
  return { ok: !!cert, detail: cert ? { arn: cert.CertificateArn, status: cert.Status } : null };
}

function checkAcmIssued() {
  const cert = acmCert();
  if (!cert?.CertificateArn) return { ok: false, detail: null };
  const detail = acmCertDetail(cert.CertificateArn);
  return { ok: detail?.Certificate?.Status === 'ISSUED', detail: { status: detail?.Certificate?.Status } };
}

function checkRoute53A() {
  const zoneId = route53ZoneId(GRIOT_AI_APEX);
  const record = route53ARecord(zoneId);
  return { ok: !!record, detail: record ? { zoneId, aliasTarget: record.AliasTarget?.DNSName } : { zoneId } };
}

function checkK8sIngressExists() {
  const ing = k8sIngress();
  return { ok: !!ing, detail: ing ? { namespace: NAMESPACE, name: INGRESS_NAME } : null };
}

function checkK8sIngressHttps() {
  const ing = k8sIngress();
  if (!ing) return { ok: false, detail: null };
  const annotations = ing.metadata?.annotations || {};
  const certArn = annotations['alb.ingress.kubernetes.io/certificate-arn'];
  const listenPorts = annotations['alb.ingress.kubernetes.io/listen-ports'];
  const hasHttps = listenPorts && listenPorts.includes('443');
  return { ok: !!certArn && hasHttps, detail: { certArn: !!certArn, https: hasHttps } };
}

const gates = [
  { id: 'acm-certificate-exists', label: `ACM certificate exists for ${PRIMARY_DOMAIN}`, check: checkAcmExists },
  { id: 'acm-certificate-issued', label: `ACM certificate status is ISSUED for ${PRIMARY_DOMAIN}`, check: checkAcmIssued },
  { id: 'route53-a-record-exists', label: `Route53 A record for ${PRIMARY_DOMAIN} exists`, check: checkRoute53A },
  { id: 'k8s-ingress-exists', label: 'K8s ingress exists in griot-ai-staging', check: checkK8sIngressExists },
  { id: 'k8s-ingress-https-listener', label: 'K8s ingress has HTTPS:443 listener and certificate', check: checkK8sIngressHttps },
];

function run() {
  const results = gates.map((g) => {
    const r = g.check();
    const status = r.ok ? 'OK' : 'FAIL';
    console.log(`${status} ${g.id}`);
    return { id: g.id, label: g.label, status: r.ok ? 'pass' : 'fail', detail: r.detail };
  });

  const pass = results.every((r) => r.status === 'pass');
  console.log(`${pass ? 'PASS' : 'FAIL'} — griot-ai HTTPS ingress`);

  if (WRITE) {
    const witness = {
      schema: 'gtcx://fabric-os/blocker-verify/v1',
      blockerId: 'FB-002',
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
      blockerId: 'FB-002',
      updated: new Date().toISOString(),
      owner: 'fabric-os',
      status: pass ? 'ready' : 'not_ready',
      class: 'A',
      infrastructureReady: pass,
      evidencePath: 'audit/evidence/griot-ai-https-verify-latest.json',
      runbookPath: 'docs/operations/runbooks/griot-ai-https.md',
    };

    mkdirSync(dirname(HUB_WITNESS), { recursive: true });
    writeFileSync(HUB_WITNESS, JSON.stringify(hub, null, 2));
    console.log(`Wrote ${HUB_WITNESS}`);
  }

  process.exit(pass ? 0 : 1);
}

run();
