import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateCloudflaredApiRouting } from './cloudflared-api-gateway-check.mjs';

describe('cloudflared-api-gateway-check', () => {
  it('accepts compliance-gateway routing for api.gtcx.trade', () => {
    const text = [
      'ingress:',
      '  - hostname: api.gtcx.trade',
      '    service: http://compliance-gateway.gtcx.svc.cluster.local:8500',
      '  - service: http_status:404',
    ].join('\n');
    assert.deepEqual(validateCloudflaredApiRouting(text), []);
  });

  it('rejects query.gtcx.trade and legacy protocols routing', () => {
    const query = '  - hostname: query.gtcx.trade\n    service: http://x:8500';
    assert.ok(validateCloudflaredApiRouting(query).some((f) => f.includes('query.gtcx.trade')));

    const legacy = [
      '  - hostname: api.gtcx.trade',
      '    service: http://gtcx-protocols.gtcx.svc.cluster.local:8300',
    ].join('\n');
    assert.ok(validateCloudflaredApiRouting(legacy).some((f) => f.includes('compliance-gateway')));
  });
});
