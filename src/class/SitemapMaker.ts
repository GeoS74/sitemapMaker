import {
  readFile, writeFile, readdir, copyFile,
} from 'node:fs/promises';
import {
  readdirSync, mkdirSync, rmSync,
} from 'node:fs';
import path from 'path';
import config from '../config';
import { logger } from '../libs/logger';
import { ISitemapURL } from './ISitemapURL';

export class SitemapMaker {
  private static lastmod: Date = new Date();

  private static tempDir: string = path.join(__dirname, '../../sitemapTemp');

  private static dir: string = path.join(__dirname, '../../sitemap');

  // массив имён файлов sitemap, если не пустой, то файл индекса ещё не создан
  private static sitemapFilesName: string[] = [];

  // счётчик записанных урл-ов, если больше 0, то какой-то файл пишется
  private static countWriteURL = 0;

  public static async run() {
    SitemapMaker.cleanDir(SitemapMaker.tempDir);
    SitemapMaker.createDir(SitemapMaker.tempDir);
    SitemapMaker.lastmod = new Date();

    // чтение статичного файла с адресами страниц
    await SitemapMaker.readStaticURL();

    // чтение api товаров
    await SitemapMaker.readURL();

    if (SitemapMaker.countWriteURL > 0) {
      await SitemapMaker.closeFile();
    }

    // формирование файла индекса
    await SitemapMaker.makeSitemapIndexFile();

    // перенос файлов из временной папки
    SitemapMaker.cleanDir(SitemapMaker.dir);
    SitemapMaker.createDir(SitemapMaker.dir);
    await SitemapMaker.copyFiles(SitemapMaker.tempDir, SitemapMaker.dir);
    SitemapMaker.cleanDir(SitemapMaker.tempDir);

    logger.info('sitemaps created');
  }

  private static async copyFiles(from: string, to: string) {
    const files = await readdir(from);

    for (const f of files) {
      await copyFile(path.join(from, f), path.join(to, f));
    }
  }

  private static async readURL() {
    try {
      let offset = 0;
      const limit = +config.maker.limitURL;

      for (;;) {
        const arr = [];
        let i = 0;
        for (i = 0; i < +config.maker.limitFetch; i += 1) {
          arr.push(SitemapMaker.getRequestToAPI(limit * i + offset, limit));
        }
        offset += limit * i;

        await Promise.all(arr)
          .then((res) => res.flat())
          .then((res) => {
            if (!res.length) {
              throw new Error('res.length == 0');
            }
            return res;
          })
          .then(SitemapMaker.mapperSitemapURL)
          .then(SitemapMaker.writeURL)
          .catch((error) => {
            if (error instanceof Error) {
              logger.error(error.message);
            }
            throw new Error();
          });
      }
    } catch (error) { /* do nothing */ }
  }

  private static async readStaticURL(): Promise<void | never[]> {
    return readFile(path.join(__dirname, config.maker.staticURL))
      // в Set добавляются URL в строковом виде для исключения дубликатов
      // если в файле со статичными адресами страниц есть пустые строки
      // метод makeURL() вернёт базовый адрес сайта, так появляются дубликаты
      .then((res) => new Set(res.toString().split('\n').map((line) => SitemapMaker.makeURL(line).toString())))
      .then((res) => Array.from(res))
      .then(SitemapMaker.mapperSitemapURL)
      .then(SitemapMaker.writeURL)
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        return [];
      });
  }

  private static async makeSitemapIndexFile() {
    if (!SitemapMaker.sitemapFilesName.length) {
      return;
    }

    const fname = `${SitemapMaker.tempDir}/sitemap.xml`;
    await writeFile(fname, `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    `, { flag: 'w' });

    SitemapMaker.sitemapFilesName.map(async (e) => {
      await writeFile(fname, `
      <sitemap>
        <loc>${SitemapMaker.makeSitemapsPath(`/${e.split('/').pop()}` || '')}</loc>
        <lastmod>${SitemapMaker.lastmod.toISOString()}</lastmod>
      </sitemap>
      `, { flag: 'a' });
    });
    await writeFile(fname, '</sitemapindex>', { flag: 'a' });

    SitemapMaker.sitemapFilesName.length = 0;
  }

  private static async openFile() {
    const fname = SitemapMaker.getFileName();
    await writeFile(fname, `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemapURL.org/schemas/sitemap/0.9">
    `, { flag: 'w' });
  }

  private static async closeFile() {
    const fname = SitemapMaker.getFileName();
    await writeFile(fname, '</urlset>', { flag: 'a' });
    SitemapMaker.sitemapFilesName.push(fname);
    SitemapMaker.countWriteURL = 0;
  }

  private static async writeURL(urls: ISitemapURL[]) {
    const buff: string[] = [];

    for (const u of urls) {
      if (SitemapMaker.countWriteURL === 0) {
        await SitemapMaker.openFile();
      }

      SitemapMaker.countWriteURL += 1;

      buff.push(SitemapMaker.sitemapURLToString(u));

      if (buff.length > 500) {
        await writeFile(SitemapMaker.getFileName(), buff.join(''), { flag: 'a' });
        buff.length = 0;
      }

      if (SitemapMaker.countWriteURL > +config.maker.maxURLsForSitemap) {
        await SitemapMaker.closeFile();
      }
    }

    if (buff.length) {
      if (SitemapMaker.countWriteURL === 0) {
        await SitemapMaker.openFile();
      }

      await writeFile(SitemapMaker.getFileName(), buff.join(''), { flag: 'a' });
      buff.length = 0;
    }
  }

  private static sitemapURLToString(url: ISitemapURL) {
    return `
    <url>
      <loc>${url.loc.toString()}</loc>
      <lastmod>${url.lastmod.toISOString()}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>
    `;
  }

  private static async getRequestToAPI(offset: number, limit: number): Promise<string[] | never[]> {
    return fetch(`${config.maker.apiURL}?offset=${offset}&limit=${limit}`)
      .then(async (res) => {
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr) && arr.length) {
            return arr;
          }
        }
        return [];
      })
      .then((arr) => arr.map((e) => SitemapMaker.makeURL(`${config.maker.apiPrefix}/${e.alias}`).toString()))
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        return [];
      });
  }

  private static getFileName() {
    return `${SitemapMaker.tempDir}/sitemap${SitemapMaker.sitemapFilesName.length}.xml`;
  }

  private static mapperSitemapURL(urls: string[]): ISitemapURL[] {
    return urls.map((url) => ({
      loc: new URL(url),
      lastmod: SitemapMaker.lastmod,
      changefreq: 'weekly',
      priority: 0.8,
    }));
  }

  private static makeURL(path: string): URL {
    if (path.length === 1) {
      path = '';
    }
    return new URL(`${path}`, config.maker.base);
  }

  private static makeSitemapsPath(path: string): URL {
    if (path.length === 1) {
      path = '';
    }
    return new URL(`/sitemap${path}`, config.maker.base);
  }

  private static cleanDir(dir: string) {
    try { rmSync(dir, { recursive: true }); } catch (error) { /* do nothing */ }
  }

  private static createDir(dir: string) {
    try { readdirSync(dir); } catch (error) { mkdirSync(dir); }
  }
}
