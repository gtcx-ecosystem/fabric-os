// Astro Starlight configuration for gtcx.io/compliance.
//
// Source-of-truth markdown lives in `docs/external/docs-site/` at the repo
// root so the public docs are version-controlled alongside the substrate
// that they describe. `scripts/sync-content.mjs` mirrors that directory
// into `src/content/docs/` before Astro reads it; we deliberately avoid
// symlinks because they break on Windows and inside Docker build layers.

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://gtcx.io',
  base: '/compliance',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'GTCX Compliance',
      description: 'Compliance substrate documentation: audit-signer, compliance-db, compliance-gateway-mcp.',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/gtcx-ecosystem/gtcx-infrastructure' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@gtcx/audit-signer' },
      ],
      sidebar: [
        { label: 'Overview', link: '/' },
        {
          label: 'Primitives',
          items: [
            { label: '@gtcx/audit-signer', link: '/audit-signer' },
            { label: 'terraform-aws-compliance-db', link: '/compliance-db' },
            { label: 'compliance-gateway-mcp', link: '/compliance-gateway-mcp' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Architecture', link: '/architecture' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'meta',
          attrs: { name: 'robots', content: 'index,follow' },
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/gtcx-ecosystem/gtcx-infrastructure/edit/main/docs/external/docs-site/',
      },
      lastUpdated: true,
    }),
  ],
});
