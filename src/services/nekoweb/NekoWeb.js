import path from 'path';
import importmap from '../../importmap.js';

const IncrementalCopy = await importmap("incremental-copy");

// const avif = await importmap("incremental-copy/avif/avif.js");
// const {echo} = await importmap("incremental-copy/echo/echo.js");

// const mp3 = await importmap("incremental-copy/mp3/mp3-ffmpeg.js");
// const avif = await importmap("incremental-copy/avif/avif-sharp.js");
// const markdown = await importmap("incremental-copy/markdown/markdown.js");

const Mp3      = await importmap("incremental-copy/mp3/Mp3.js");
const Avif     = await importmap("incremental-copy/avif/Avif.js");
const Markdown = await importmap("incremental-copy/markdown/Markdown.js");

console.log(importmap)
console.log(IncrementalCopy)

import Service from '../Service.js';

export default class NekoWeb extends Service {

  constructor({name, dest}){
    super()
    this.name = name;
    this.dest = dest;
  }

  async build(website){

    const id = 'site-'+super.uniqueId();
    const location = path.join(this.dest, this.name, 'artifacts', id);

    const site = {
      id,
      timestamp: new Date().toISOString(),
      status: 'success',
      metrics: { },
      location,
    };

    // COPY DATA

    const nekoCopier = new IncrementalCopy();
    nekoCopier
      .use(new Mp3({preset: 'tiny'}))
      .use(new Avif({ width:512, height:512, quality: 40, effort: 9 }))
      .use(new Markdown())


      // .use(html())
      // .use(js())
      // .use(txt())

    ;

    // .use(avif())
    // .use(mp3());

    // Dir
    for await (const [post, book] of website.posts(2)) {
      const src = post.src;
      const dest = path.resolve(path.join(location, 'permalink', post.guid));
      await nekoCopier.copy(src, dest);
    }





    // BROWSE

    const books = await website.books();
    console.log(`(=^･^=)∫ building ${books.length} book(s) in ${this.dest}`)

    for await (const book of await website.books()) {

      // create book1

      for await (const page of await book.pages()) {
        for await (const post of await page.posts()) {

        }
      }
    }

    return site;
  }

  publish(site){
    console.log(`Publishing site id ${site.id} from ${site.location}`);
  }

}
