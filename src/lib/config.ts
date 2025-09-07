import yaml from 'js-yaml'
import raw from '@/data/config.yaml?raw'

export type SiteOg = {
  title?: string
  description?: string
  type?: string
  url?: string
  image?: string
  imageAlt?: string
  siteName?: string
}

export type SiteTwitter = {
  card?: 'summary' | 'summary_large_image' | string
  site?: string
  creator?: string
}

export type SiteMeta = {
  title?: string
  description?: string
  baseUrl?: string
  favicon?: string
  themeColor?: string
  og?: SiteOg
  twitter?: SiteTwitter
}

export type AppConfig = {
  site?: SiteMeta
}

function parseConfig(): AppConfig {
  try {
    const data = yaml.load(raw) as unknown
    return (data && typeof data === 'object' ? (data as AppConfig) : {})
  } catch (e) {
    console.warn('[config] Failed to parse config.yaml', e)
    return {}
  }
}

export const appConfig: AppConfig = parseConfig()

