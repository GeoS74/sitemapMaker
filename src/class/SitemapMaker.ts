import { readFile, writeFile } from 'node:fs/promises';
import { readdirSync, mkdirSync, rmdirSync } from 'node:fs';
import path from 'path';
import config from '../config';
import { logger } from '../libs/logger';
import { ISitemapURL } from './ISitemapURL';

export class SitemapMaker {
  private static lastmod: Date = new Date();

  private static dir: string = path.join(__dirname, '../../sitemap');

  private static sitemapURL: ISitemapURL[] = [];

  private static sitemapFilesName: string[] = [];

  constructor() {
    try { readdirSync(SitemapMaker.dir); } catch (error) { mkdirSync(SitemapMaker.dir); }
  }

  private static async createDir() {
    try { readdirSync(SitemapMaker.dir); } catch (error) { mkdirSync(SitemapMaker.dir); }
  }

  public static async run() {
    await SitemapMaker.createDir();
    SitemapMaker.lastmod = new Date();

    // чтение статичного файла с адресами страниц
    await SitemapMaker.readStaticURL()
      .then(SitemapMaker.mapperURL)
      .then(SitemapMaker.addURL);

    // чтение api товаров
    // ...

    // запись оставшихся адресов
    if (SitemapMaker.sitemapURL.length) {
      SitemapMaker.makeSitemapFile([...SitemapMaker.sitemapURL]);
      SitemapMaker.sitemapURL.length = 0;
      SitemapMaker.sitemapFilesName.length = 0;
    }

    // формирование файла индекса
    // ...

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

  private static async makeSitemapFile(sitemapURLSs: ISitemapURL[]) {
    const fname = SitemapMaker.getFileName();

    await writeFile(fname, `<?xml version="1.0" encoding="UTF-8"?>\n`, { flag: 'w' });
    await writeFile(fname, `<urlset xmlns="http://www.sitemapURL.org/schemas/sitemap/0.9">`, { flag: 'a' });

    sitemapURLSs.map(async (u) => {
      await writeFile(fname, `
      <url>
        <loc>${u.loc.toString()}</loc>
        <lastmod>${u.lastmod.toISOString()}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
      </url>
      `, { flag: 'a' });
    });

    await writeFile(fname, '</urlset>', { flag: 'a' });
    SitemapMaker.sitemapFilesName.push(fname);
  }

  private getValidURL(loc: string) {

  }

  private makeSitemapIndexFile() {

  }

  private static getFileName() {
    return `${SitemapMaker.dir}/sitemap${SitemapMaker.sitemapFilesName.length}.xml`;
  }

  private static async readURL(offset: number, limit: number) {
    return fetch(`${config.maker.apiURL}?offset=${offset}&limit=${limit}`)
      .then(async (res) => {
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr) && arr.length) {
            return arr;
          }
        }
        throw new Error();
      })
      .then((arr) => arr.map((e) => SitemapMaker.makeURL(`${config.maker.psevdoPath}/${e.alias}`)))
      .catch((error) => null);
  }

  private static async addURL(urls: ISitemapURL[]) {
    SitemapMaker.sitemapURL = SitemapMaker.sitemapURL.concat(urls);

    if (SitemapMaker.sitemapURL.length > config.maker.maxURLsForSitemap) {
      SitemapMaker.makeSitemapFile(SitemapMaker.sitemapURL.slice(0, config.maker.maxURLsForSitemap));
      SitemapMaker.sitemapURL = SitemapMaker.sitemapURL.slice(config.maker.maxURLsForSitemap);
    }
  }

  private static async readStaticURL() {
    return readFile(path.join(__dirname, config.maker.staticURL))
      // в Set добавляются URL в строковом виде для исключения дубликатов
      // если в файле со статичными адресами страниц есть пустые строки
      // метод makeURL() вернёт базовый адрес сайта, так появляются дубликаты
      .then((res) => new Set(res.toString().split('\n').map((line) => SitemapMaker.makeURL(line).toString())))
      .then((res) => Array.from(res))
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        return [];
      });
  }

  private static mapperURL(urls: string[]): ISitemapURL[] {
    return urls.map((url) => ({
      loc: new URL(url),
      lastmod: SitemapMaker.lastmod,
      changefreq: 'weekly',
      priority: 0.8,
    }));
  }

  private static makeURL(path: string): URL {
    return new URL(path, config.maker.base);
  }
}
