// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import starlightBlog from 'starlight-blog'

// https://astro.build/config
export default defineConfig({
  base: '/docs',
  site: 'https://pixra.rxliuli.com/docs/',
  integrations: [
    starlight({
      title: 'Pixra',
      description: 'A web-based image editor with powerful plugin support.',
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
        {
          icon: 'external',
          label: 'Pixra Website',
          href: 'https://pixra.rxliuli.com',
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
      plugins: [starlightBlog()],
    }),
    sitemap(),
  ],

  adapter: cloudflare(),
})
