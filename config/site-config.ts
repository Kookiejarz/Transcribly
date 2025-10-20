import siteConfigData from "../public/site-config.json"

export type SiteAssets = {
  logo: string
  logoDark?: string
  favicon: string
  appleTouchIcon?: string
}

export type SiteStatusPalette = {
  healthy: string
  unhealthy: string
  checking: string
}

export type SiteColors = {
  accent: string
  accentSecondary: string
  status: SiteStatusPalette
}

export type SiteConfig = {
  name: string
  shortName?: string
  tagline: string
  description: string
  assets: SiteAssets
  colors: SiteColors
}

export const siteConfig = siteConfigData as SiteConfig

export default siteConfig
