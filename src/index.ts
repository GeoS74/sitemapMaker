import {
  createServer, Server, IncomingMessage, ServerResponse,
} from 'http';

import config from './config';
import { logger } from './libs/logger';
import { _errorToJSON, _isNodeError } from './libs/errors';
import { _isSitemapXML } from './libs/url.validator';
import { SitemapMaker } from './class/SitemapMaker';

SitemapMaker.run();

const server: Server<typeof IncomingMessage, typeof ServerResponse> = createServer();

server.on('request', (req: IncomingMessage, res: ServerResponse<IncomingMessage>): void => {
  try {
    if (req.method === 'GET') {
      if (_isSitemapXML(req.url)) {
        res.setHeader('content-type', 'application/xml; charset=utf-8');
        res.statusCode = 200;
        res.end('');
        return;
      }
    }

    throw new Error('not found');
  } catch (error) {
    res.setHeader('content-type', 'application/json');

    if (_isNodeError(error) && error.code === 'ENOENT') {
      res.statusCode = 404;
      res.end(_errorToJSON('not found'));
      return;
    }

    if (error instanceof Error) {
      logger.error(error.message);
      res.statusCode = 500;
      res.end(_errorToJSON('internal server error'));
    }
  }
});

server.listen(config.server.port, (): void => logger.info(`server run at ${config.server.port} port`));
