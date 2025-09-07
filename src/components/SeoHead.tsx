import { useEffect } from 'react'
import { appConfig } from '@/lib/config'

function upsertMeta(selector: { name?: string; property?: string }, content: string | undefined) {
  if (!content) return
  const attr = selector.name ? 'name' : 'property'
  const key = selector.name ?? selector.property ?? ''
  if (!key) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string | undefined) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default function SeoHead() {
  useEffect(() => {
    const site = appConfig.site || {}
    if (site.title) document.title = site.title
    upsertMeta({ name: 'description' }, site.description)
    if (site.themeColor) upsertMeta({ name: 'theme-color' }, site.themeColor)
    if (site.favicon) upsertLink('icon', site.favicon)

    const og = site.og || {}
    upsertMeta({ property: 'og:title' }, og.title || site.title)
    upsertMeta({ property: 'og:description' }, og.description || site.description)
    upsertMeta({ property: 'og:type' }, og.type || 'website')
    upsertMeta({ property: 'og:url' }, og.url || site.baseUrl)
    upsertMeta({ property: 'og:image' }, og.image)
    upsertMeta({ property: 'og:image:alt' }, og.imageAlt)
    upsertMeta({ property: 'og:site_name' }, og.siteName)

    const tw = site.twitter || {}
    upsertMeta({ name: 'twitter:card' }, tw.card || 'summary_large_image')
    upsertMeta({ name: 'twitter:site' }, tw.site)
    upsertMeta({ name: 'twitter:creator' }, tw.creator)
    upsertMeta({ name: 'twitter:title' }, og.title || site.title)
    upsertMeta({ name: 'twitter:description' }, og.description || site.description)
    upsertMeta({ name: 'twitter:image' }, og.image)
  }, [])

  return null
}

