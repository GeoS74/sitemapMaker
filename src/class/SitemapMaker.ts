import { readFile, writeFile } from 'node:fs/promises';
import { readdirSync, mkdirSync, rmSync } from 'node:fs';
import path from 'path';
import config from '../config';
import { logger } from '../libs/logger';
import { ISitemapURL } from './ISitemapURL';

export class SitemapMaker {
  private static lastmod: Date = new Date();

  private static dir: string = path.join(__dirname, '../../sitemap');

  private static sitemapURL: ISitemapURL[] = [];

  private static sitemapFilesName: string[] = [];

  public static async run() {
    SitemapMaker.cleanDir();
    SitemapMaker.createDir();
    SitemapMaker.lastmod = new Date();

    // чтение статичного файла с адресами страниц
    // await SitemapMaker.readStaticURL()
    //   .then(SitemapMaker.mapperURL)
    //   .then(SitemapMaker.addURL);

    // чтение api товаров
    await SitemapMaker.readURL();
    logger.info('все страницы опрошены');

    if(SitemapMaker.countWriteURL > 0) {
      console.log(`закрываю the end`)
      await SitemapMaker.closeFile();
      SitemapMaker.countWriteURL = 0;
    }

    // запись оставшихся адресов
    // if (SitemapMaker.sitemapURL.length) {
    //   // вызов асинхронного метода makeSitemapFile без await
    //   SitemapMaker.makeSitemapFile([...SitemapMaker.sitemapURL]);
    //   SitemapMaker.sitemapURL.length = 0;
    //   SitemapMaker.sitemapFilesName.length = 0;
    // }

    // формирование файла индекса
    // ...
  }

  private static async readURL() {
    try {
      let offset = 0;
      const limit = 10;

      while (true) {
        logger.info(`offset: ${offset} memory: ${process.memoryUsage().heapUsed}`);
        
        const arr = [];
        let i = 0;
        for (i = 0; i < 1; i += 1) {
          arr.push(SitemapMaker.getRequestToAPI(limit * i + offset, limit));
        }
        offset += limit * i;

        await Promise.all(arr)
          .then((res) => res.flat())
          .then((res) => {
            if (!res.length) {
              throw new Error();
            }
            return res;
          })
          .then(SitemapMaker.mapperURL)
          .then(SitemapMaker.writeURL)
          // .then(res => console.log(res.length))
          .then(() => {
            throw new Error()
          })
      }
    } catch (error) { /* do nothing */ }
  }






  private static countWriteURL = 0;

  private static async openFile() {
    const fname = SitemapMaker.getFileName();
    await writeFile(fname, `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemapURL.org/schemas/sitemap/0.9">
    `, { flag: 'w' });
  }

  private static async closeFile() {
    const fname = SitemapMaker.getFileName();
    await writeFile(fname, `</urlset>`, { flag: 'a' });
    SitemapMaker.sitemapFilesName.push(fname);
  }

  private static async writeURL(urls: ISitemapURL[]) {
    const fname = SitemapMaker.getFileName();
    let buff: string[] = [];

    for(let u of urls) {
      if(SitemapMaker.countWriteURL === 0) {
        console.log(`открытого файла нет, создаю  ${SitemapMaker.getFileName()}`)
        await SitemapMaker.openFile();
      }

      SitemapMaker.countWriteURL += 1;

      buff.push(SitemapMaker.urlToString(u));

      if(buff.length > 9) {
        console.log(`пишу  ${buff.length} строк в   ${SitemapMaker.getFileName()}`)
        await writeFile(SitemapMaker.getFileName(), buff.join(''), { flag: 'a' })
        buff.length = 0;
      }

      if(SitemapMaker.countWriteURL > 9) {
        console.log(`закрываю ${SitemapMaker.getFileName()}`)
        await SitemapMaker.closeFile();
        SitemapMaker.countWriteURL = 0;
      }
    }

     

    if(buff.length) {
      console.log(`есть не записанные строки`)

      if(SitemapMaker.countWriteURL === 0) {
        console.log(`создаю  ${SitemapMaker.getFileName()}`)
        await SitemapMaker.openFile();
      }

      console.log(`пишу  ${buff.length} строк в   ${SitemapMaker.getFileName()}`)
      await writeFile(SitemapMaker.getFileName(), buff.join(''), { flag: 'a' });
      buff.length = 0;
    }
  }

  private static urlToString(url: ISitemapURL) {
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
        throw new Error();
      })
      .then((arr) => arr.map((e) => SitemapMaker.makeURL(`${config.maker.psevdoPath}/${e.alias}`).toString()))
      .catch((error) => {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        return [];
      });
  }

  private static async readStaticURL(): Promise<string[] | never[]> {
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

  private static async makeSitemapFile(sitemapURLSs: ISitemapURL[]) {
    const fname = SitemapMaker.getFileName();
    SitemapMaker.sitemapFilesName.push(fname);

    await writeFile(fname, '<?xml version="1.0" encoding="UTF-8"?>\n', { flag: 'w' });
    await writeFile(fname, '<urlset xmlns="http://www.sitemapURL.org/schemas/sitemap/0.9">', { flag: 'a' });

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
  }

  private makeSitemapIndexFile() {

  }

  private static getFileName() {
    return `${SitemapMaker.dir}/sitemap${SitemapMaker.sitemapFilesName.length}.xml`;
  }

  private static async addURL(urls: ISitemapURL[]) {
    SitemapMaker.sitemapURL = SitemapMaker.sitemapURL.concat(urls);

    if (SitemapMaker.sitemapURL.length > config.maker.maxURLsForSitemap) {
      // вызов асинхронного метода makeSitemapFile() без await
      // метод получает срез массива адресов и начинает их писать в файл не блокируя дальнейшее чтение
      SitemapMaker.makeSitemapFile(SitemapMaker.sitemapURL.slice(0, config.maker.maxURLsForSitemap));
      SitemapMaker.sitemapURL = SitemapMaker.sitemapURL.slice(config.maker.maxURLsForSitemap);
    }
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

  private static cleanDir() {
    try { rmSync(SitemapMaker.dir, { recursive: true }); } catch (error) { }
  }

  private static createDir() {
    try { readdirSync(SitemapMaker.dir); } catch (error) { mkdirSync(SitemapMaker.dir); }
  }
}
