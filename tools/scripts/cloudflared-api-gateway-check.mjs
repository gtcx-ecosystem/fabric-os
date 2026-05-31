#!/usr/bin/env node
/**
 * @fileoverview Validate public API hostnames route through Cloudflare Tunnel.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG = join(
  ROOT,
  'infra',
  'kubernetes',
  'base',
  'services',
  'cloudflared',
  'config.yaml'
);

export function validateCloudflaredApiRouting(text) {
  const failures = [];
  if (text.includes('query.gtcx.trade')) {
    failures.push('query.gtcx.trade must not be published until zero-trust boundary exists');
  }
  const tradeApiRule = text.match(/- hostname: api\.gtcx\.trade\n\s+service: \S+/);
  if (!tradeApiRule) {
    failures.push('missing api.gtcx.trade ingress rule');
  } else {
    const service = tradeApiRule[0].split('\n').pop().trim();
    if (!service.includes('compliance-gateway.gtcx.svc.cluster.local:8500')) {
      failures.push(`api.gtcx.trade must route to compliance-gateway:8500 (got ${service})`);
    }
  }

  const baselineApiRule = text.match(/- hostname: api\.gtcx\.africa\n\s+service: \S+/);
  if (!baselineApiRule) {
    failures.push('missing api.gtcx.africa ingress rule');
  } else {
    const service = baselineApiRule[0].split('\n').pop().trim();
    if (!service.includes('baselineos.baselineos.svc.cluster.local:3141')) {
      failures.push(`api.gtcx.africa must route to baselineos:3141 (got ${service})`);
    }
  }

  return failures;
}

function main() {
  const text = readFileSync(CONFIG, 'utf8');
  const failures = validateCloudflaredApiRouting(text);
  if (failures.length > 0) {
    console.error('[cloudflared-api-gateway-check] routing drift:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log('[cloudflared-api-gateway-check] public API tunnel routes OK');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
