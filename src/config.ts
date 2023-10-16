export default {
  node: {
    env: process.env.NODE_ENV || 'dev',
  },
  server: {
    host: process.env.SERVER_HOST || 'localhost',
    port: process.env.SERVER_PORT || 3150,
  },
  source: {
    url: process.env.API_COUNT || 'https://sgn74.ru/api/bridge/card/all/count',
    staticURL: process.env.STATIC_URL_LIST || '../staticURL',
    syncDelay: process.env.SYNC_MSTIME || 1000 * 60 * 60,
  },
  jwt: {
    check: process.env.JWT_CHECK === 'true',
    secretKey: process.env.JWT_SECRET_KEY || 'any_secret',
  },
  log: {
    file: 'app.log',
  },
};
