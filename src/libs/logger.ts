import log4js from 'log4js';
import path from 'path';
import config from '../config';

log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
    },
    app: {
      type: 'file',
      filename: path.join(__dirname, `../../log/${config.log.file}`),
    },
  },
  categories: {
    default: {
      appenders: ['out', 'app'],
      level: 'all',
    },
  },
});

export const logger: log4js.Logger = log4js.getLogger('default');
