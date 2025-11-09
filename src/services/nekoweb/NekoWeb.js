import path from 'path';
import importmap from '../../importmap.js';

const { camelToKebab } = await importmap("lib");

const IncrementalCopy = await importmap("incremental-copy");

const Mp3      = await importmap("incremental-copy/mp3/Mp3.js");
const Avif     = await importmap("incremental-copy/avif/Avif.js");
const Markdown = await importmap("incremental-copy/markdown/Markdown.js");

const Renderers = await importmap("renderers");

import Service from '../Service.js';

export default class NekoWeb extends Service {
#copier;
#renderers;

  constructor(options){
    super();

    Object.assign(this, options);

    // for permalinks
    this.#copier = new IncrementalCopy();
    this.#copier.use(new Mp3({preset: 'tiny'}));
    this.#copier.use(new Avif({ width:512, height:512, quality: 40, effort: 9 }));
    this.#copier.use(new Markdown());

    // for pagination
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

}
