import {
  createServer, Server, IncomingMessage, ServerResponse,
} from 'http';
import { readFile } from 'fs';
import path from 'path';

import config from './config';
import { logger } from './libs/logger';
import { _errorToJSON, _isNodeError } from './libs/errors';
import { _isSitemapXML } from './libs/url.validator';
import { SitemapMaker } from './class/SitemapMaker';
import { delay } from './libs/delay';

(async () => {
  await delay(+config.maker.firstStartDelay);

  (async function autoStarter() {
    SitemapMaker.run();
    await delay(+config.maker.restartDelay);
    autoStarter();
  }());
})();

const server: Server<typeof IncomingMessage, typeof ServerResponse> = createServer();

server.on('request', (req: IncomingMessage, res: ServerResponse<IncomingMessage>): void => {
  try {
    if (req.method === 'GET') {
      if (_isSitemapXML(req.url)) {
        readFile(path.join(__dirname, '..', req.url?.toString() || ''), (error, data) => {
          if (error) {
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.statusCode = 404;
            res.end(_errorToJSON('not found'));
            return;
          }
          res.setHeader('content-type', 'application/xml; charset=utf-8');
          res.setHeader('content-length', Buffer.byteLength(data, 'utf8'));
          res.statusCode = 200;
          res.end(data.toString());
        });
        return;
      }
    }

    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.statusCode = 404;
    res.end(_errorToJSON('not found'));
  } catch (error) {
    if (_isNodeError(error)) {
      logger.error(error.message);
      res.statusCode = 500;
      res.end(_errorToJSON('internal server error'));
    }
  }
});

server.listen(config.server.port, (): void => {
  logger.info(`server run at ${config.server.port} port`);
});
