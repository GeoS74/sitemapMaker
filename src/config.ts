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
    limitURL: process.env.API_PAGES_LIMIT || 150,
    maxURLsForSitemap: process.env.MAX_URLS_FOR_SITEMAP || 30000,
    firstStartDelay: process.env.START_MSTIME || 1000 * 60,
    restartDelay: process.env.RESTART_MSTIME || 1000 * 60 * 60 * 24 * 7,
    staticURL: '../../static.url',
  },
  log: {
    file: 'app.log',
  },
};
