export default {
  node: {
    env: process.env.NODE_ENV || 'dev',
  },
  server: {
    host: process.env.SERVER_HOST || 'localhost',
    port: process.env.SERVER_PORT || 3150,
  },
  maker: {
    base: 'https://sgn74.ru',
    apiURL: process.env.API_PAGES || 'https://sgn74.ru/api/bridge/card',
    staticURL: process.env.STATIC_URL_LIST || '../../static.url',
    psevdoPath: '/products',
    maxURLsForSitemap: 10000,
    syncDelay: process.env.SYNC_MSTIME || 1000 * 60 * 60,
  },
  // jwt: {
  //   check: process.env.JWT_CHECK === 'true',
  //   secretKey: process.env.JWT_SECRET_KEY || 'any_secret',
  // },
  log: {
    file: 'app.log',
  },
};
