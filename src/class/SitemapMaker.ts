import { readFile, writeFile } from 'node:fs/promises';
import { readdirSync, mkdirSync, rmdirSync } from 'node:fs';
import path from 'path';
import config from '../config';
import { logger } from '../libs/logger';
import { ISitemapURL } from './ISitemapURL';

export class SitemapMaker {
  private lastmod: Date = new Date();

  private dir: string = path.join(__dirname, '../../sitemap');

  private siteMaps: ISitemapURL[] = [];

  constructor() {
    try { readdirSync(this.dir); } catch (error) { mkdirSync(this.dir); }
  }

  

  public async run() {
    this.lastmod = new Date();
    const foo = (await this.readStaticURL()).map(e => {
      
    });
    console.log(foo)
    // this.makeSitemapFile(await this.readStaticURL())

    // let offset = 0;
    // const limit = 150;
    // let all = 0;
    // while(true) {
    //   const bar = await SitemapMaker.readURL(offset, limit);
    //   if(bar && bar.length) {
    //     console.log(bar.length);
    //     all += bar.length;
    //     console.log(all);
    //     offset += limit;
    //     continue;
    //   }
    //   break;
    // }
     
  }

  private async makeSitemapFile(paths: ISitemapURL[]) {
    const fname = this.getNextFileName();
    await writeFile(fname, '<?xml version="1.0" encoding="UTF-8"?>', {flag: 'w'});
    await writeFile(fname, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', {flag: 'a'});

    paths.map(async p => {
      await writeFile(fname, '</urlset>', {flag: 'a'});
    })

    await writeFile(fname, '</urlset>', {flag: 'a'});
    return fname;
  }

  private getValidURL(loc: string) {

  }

  private makeSitemapIndexFile() {

  }

  private getNextFileName() {
    return `${this.dir}/sitemap${this.siteMaps.length}.xml`;
  }

  private static async readURL(offset: number, limit: number) {
    console.log(`${config.source.apiURL}?offset=${offset}&limit=${limit}`);
    return fetch(`${config.source.apiURL}?offset=${offset}&limit=${limit}`)
    .then(async res => {
      if(res.ok) {
        const arr = await res.json();
        if(Array.isArray(arr) && arr.length) {
          return arr;
        }
      }
      throw new Error();
    })
    .then(arr => arr.map(e =>SitemapMaker.makeURL(`${config.source.psevdoPath}/${e.alias}`)))
    .catch((error) => null);
  }
   

  private async readStaticURL() {
    return readFile(path.join(__dirname, config.source.staticURL))
      .then((res) => new Set(res.toString().split('\n').map((line) => SitemapMaker.makeURL(line))))
      .then(res => Array.from(res))
      .then(res => this.makeSitemapURLs(res))
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        return [];
      });
  }

  private makeSitemapURLs(urls: URL[]): ISitemapURL[] {
    return urls.map(url => ({
      loc: url,
      lastmod: this.lastmod,
      changefreq: 'weekly',
      priority: 0.8
    }))
  }

  private static makeURL(path: string): URL {
    return new URL(path, config.source.base);
  }
}
