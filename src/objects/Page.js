
export default class Page {
  constructor(slice, number, allPosts, bookId=null) {

    this.chunk = slice;
    this.index = number;
    this.chunks = allPosts;
    this.bookId = bookId;
    this.pagerRadius = 5;

  }

  async posts(){
    return this.chunk;
  }

  get isHome() { return this.isLastPage; }

  get fileName() { return this.toFileName(this.pageIndex); }
  get nextFileName() { return this.toFileName(this.nextIndex); }
  get prevFileName() { return this.toFileName(this.prevIndex); }

  get pageIndex() { return this.index; }
  get nextIndex() { return this.index + 1 > this.chunks.length - 1 ? 0 : this.index + 1; }
  get prevIndex() { return this.index - 1 < 0 ? this.chunks.length - 1 : this.index - 1; }

  get isFirstPage() { return this.index===0; }
  get isLastPage() { return this.index == this.chunks.length - 1; }
  get totalPages() { return this.chunks.length; }

  get pager(){
    return Array.from({length: this.pagerRadius * 2 + 1}, (_, i) =>  (this.pageIndex - this.pagerRadius + i + this.totalPages) % this.totalPages ).map(index=>({text:`${index}`, href:this.toFileName(index), ariaCurrent:(this.pageIndex===index)}));
  }

  toFileName(index) {
    const fileName = this.bookId?this.bookId:'index';
    return `${fileName}-${index}.html`;
    return index == 0 ? `${fileName}.html` : `${fileName}-${index}.html`;
  }



}
