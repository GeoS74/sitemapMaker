import { readFile } from 'node:fs/promises';
import { readdirSync, mkdirSync, rmdirSync } from 'node:fs';
import path from 'path';
import config from '../config';
import { logger } from '../libs/logger';
import { ISitemap } from './ISitemap';

export class SitemapMaker {
  private lastmod?: Date;

  private dir: string = '../../sitemap';

  private siteMaps: ISitemap[] = [];

  constructor() {
    try { readdirSync(this.dir); } catch (error) { mkdirSync(this.dir); }
  }

  public async run() {
    this.lastmod = new Date();
    this.readStaticURLtoSitemap();
    this.makeSitemapIndexFile();
  }

  private async readStaticURLtoSitemap() {
    

    return readFile(path.join(__dirname, config.source.staticURL))
      .then((res) => {
        const siteMaps: ISitemap[] = [];
        res.toString().split('\n').map((line) => {
          try {
            const url = new URL(line).toString();

            console.log(new URL(line).toString());
          } catch (error) { /* прочитанная строке не URL, ничего не делать */ }
        });
      })
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(error.message);
        }
      });
  }

  private makeSitemapIndexFile() {

  }
}
