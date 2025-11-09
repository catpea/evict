import { dir } from '../lib.js';
import Book from './Book.js';
import { Memoize } from './lib/Memoize.js';

// import Post from './obj/Post.js';
// import Page from './obj/Page.js';

export default class Website {
  constructor(options) {
    Object.assign(this, options);

    // this.memoized = new Memoize(this, [this.books, this.stats, this.posts]);
    // return this.memoized;
  }

  async stats() {
    return {
      books: await this.books(),
      posts: (await Array.fromAsync(this.posts())).length,
    };
  }

  async books() {
    return (await dir(this.src)).map((o) => new Book(o));
  }

  async *posts(count = Infinity) {
    const reversed = count < 0;
    const limit = Math.abs(count);

    // these are objects, already in memeory
    // this is required for coherent sort operation across multiple books
    const buffer = [];

    for await (const book of await this.memoized.books()) {
      for await (const page of await book.pages()) {
        for await (const post of await page.posts()) {
          buffer.push([post, book]);
        }
      }
    }

    buffer.sort(function (a, b) {
      return new Date(b[0].date) - new Date(a[0].date);
    });

    if (reversed) buffer.reverse();

    let yielded = 0;
    for (const item of buffer) {
      if (yielded >= limit) return;
      yield item;
      yielded++;
    }
  }

}
