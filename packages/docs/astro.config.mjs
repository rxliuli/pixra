// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

import cloudflare from '@astrojs/cloudflare'

// https://astro.build/config
export default defineConfig({
  base: '/docs',
  integrations: [
    starlight({
      title: 'Pixra',
      favicon: '/favicon.png',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/rxliuli/pixra',
        },
        {
          icon: 'twitter',
          label: 'Twitter',
          href: 'https://x.com/moeruri',
        },
      ],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Using Plugins', slug: 'guides/using-plugins' },
          ],
        },
        {
          label: 'Plugin Development',
          items: [
            { label: 'Getting Started', slug: 'plugins/getting-started' },
            { label: 'API Reference', slug: 'plugins/api-reference' },
            { label: 'CLI Reference', slug: 'plugins/cli-reference' },
            { label: 'Publishing', slug: 'plugins/publishing' },
          ],
        },
      ],
    }),
  ],

  adapter: cloudflare(),
})
