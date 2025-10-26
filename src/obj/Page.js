import path from 'path';

export default class Page {
  constructor(chunk, index, chunks) {
    this.chunk = chunk;
    this.index = index;
    this.chunks = chunks;
    this.pagerRadius = 5;
  }

  get isHome() {
    return this.index == 0;
  }

  get fileName() {
    return this.index == 0 ? 'index.html' : `index-${this.index}.html`;
  }

  get currentPage() {
    return this.index;
  }
  get nextPage() {
    return this.index + 1 > this.chunks.length - 1 ? 0 : this.index + 1;
  }

  get prevPage() {
    return this.index - 1 < 0 ? this.chunks.length - 1 : this.index - 1;
  }

  get isFirstPage() {
    return !this.index;
  }

  get isLastPage() {
    return this.index == this.chunks.length - 1;
  }

  get totalPages() {
    return this.chunks.length;
  }

  get navPager(){
    return Array.from({length: this.pagerRadius * 2 + 1}, (_, i) =>  (this.currentPage - this.pagerRadius + i + this.totalPages) % this.totalPages );
  }

}
