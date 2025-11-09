import path from 'path';

import {chunk, dir} from '../lib.js';

import Post from './Post.js';
import Page from './Page.js';

import {Memoize} from './lib/Memoize.js';

//NOTE: a book has access to all posts, it is a virtual concept only
export default class Book {

  pp = 12 * 3;

  constructor(src) {
    this.src = src;
    // this.memoized = new Memoize(this, [this.posts, this.pages]);
    // return this.memoized;
  }

  get id() {
    const segments = this.src.split(path.sep);
    return segments[segments.length - 1];
  }

  get name() {
    return this.id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }


  get navPager(){
    return Array.from({length: this.pagerRadius * 2 + 1}, (_, i) =>  (this.currentPage - this.pagerRadius + i + this.totalPages) % this.totalPages );
  }

  async posts(){
    // NOTE: Remember that Book is just a prev <> next helper, it actually has access to all th posts
    const dirs = await dir(this.src);
    const posts = dirs.map(o=>new Post(o));
    await Promise.all(posts.map(post=>post.load()));
    return posts.reverse();
  }

  async pages(){
    const chunks = chunk((await this.posts()), this.pp);
    const response = chunks.map((slice, index)=>new Page(slice, index, chunks, this.id));
    return response;
    // return (await dir(this.src)).map(o=>new Book(o));
  }

}
