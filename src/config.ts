export default {
  node: {
    env: process.env.NODE_ENV || 'dev',
  },
  server: {
    host: process.env.SERVER_HOST || 'localhost',
    port: process.env.SERVER_PORT || 3150,
  },
  maker: {
    base: process.env.BASE_URL || 'https://sgn74.ru',
    apiURL: process.env.API_PAGES || 'https://sgn74.ru/api/bridge/card',
    staticURL: process.env.STATIC_URL_LIST || '../../static.url',
    pathPrefix: process.env.SITEMAP_PATH_PREFIX || '/html',
    maxURLsForSitemap: process.env.MAX_URLS_FOR_SITEMAP || 30000,
    firstStartDelay: process.env.START_MSTIME || 1000 * 60,
    restartDelay: process.env.RESTART_MSTIME || 1000 * 60 * 60 * 24 * 7,
  },
  log: {
    file: 'app.log',
  },
};
