import path from 'path';
import importmap from '../../importmap.js';

const { camelToKebab } = await importmap("lib");

const IncrementalCopy = await importmap("incremental-copy");
const Renderers = await importmap("renderers");

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
#copier;
#renderers;

  constructor(options){
    super()
    Object.assign(this, options);

    this.#copier = new IncrementalCopy();
    this.#copier.use(new Mp3({preset: 'tiny'}));
    this.#copier.use(new Avif({ width:512, height:512, quality: 40, effort: 9 }));
    this.#copier.use(new Markdown());

    this.#renderers = new Renderers();
  }

  get location(){

    return path.join(this.dest, camelToKebab(this.service), this.id, 'wwwroot' );
  }

  // PHASE I. PERMALINKS (for all books)
  // "Single Pages", "single page templates"  Content Processing, "rendering posts". template rendering"
  async permalinks(website){
    // console.log(`(=^･^=)∫ Compiling Permalink Database containg ${books.length} book${books.length!==1?'s':''} into ${this.location}`)
    for await (const [post, book] of website.posts(2)) {
      const src = post.src;
      const dest = path.resolve(path.join(this.location, 'permalink', post.guid));
      await this.#copier.copy(src, dest);
    }
  }

  // PHASE II. PAGINATION
   // Pagination, Aggregation, Index Generation,
  // "List Pages", Collection Rendering or List Templates, "building pages", "collection templates"
  async pagination(website) {
    // console.log(`(=^･^=)∫ Building Website and List Pages containg ${books.length} book${books.length!==1?'s':''} into ${this.location}`)
    this.#renderers[this.renderer].render(this, website);
  }

  publishing(website){
    console.log(`Publishing website id ${this.id} from ${this.location}...`);
  }

  async render(website){

    return console.log('(=^･^=)∫  NekoWeb Says: RENDER website!',  website);
    const books = await website.books();


    // these are set in services file
    this.renderer = renderer;
    this.theme = theme;

    for await (const book of books) {
      // book.id = furkies-purkies
      // book.name
      // book.posts
      // book.pages
      for await (const page of await book.pages()) {
        // page.posts()
        // page.isHome
        // page.fileName
        // page.pager
        for await (const post of await page.posts()) {
          // post has post.json fileds
        }
      }
    }
  }






}
