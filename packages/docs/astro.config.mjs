// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import starlightBlog from 'starlight-blog'

// https://astro.build/config
export default defineConfig({
  base: '/docs',
  site: 'https://pixra.rxliuli.com/',
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
      head: [
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary' },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://pixra.rxliuli.com/docs/logo.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://pixra.rxliuli.com/docs/logo.png',
          },
        },
      ],
      plugins: [starlightBlog()],
    }),
    sitemap(),
  ],

  adapter: cloudflare(),
})
