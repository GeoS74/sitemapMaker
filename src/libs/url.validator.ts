export function _isSitemapXML(url?: string): boolean {
  return !!(url && /^\/sitemap\/sitemap.{0,4}\.xml/.test(url));
}
