import path from 'path';

export default class Book {
  constructor(src) {
    this.src = src;
  }

  get id() {
    const segments = this.src.split(path.sep);
    return segments[segments.length - 1];
  }

  get name() {
    return this.id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

}
