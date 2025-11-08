import path from 'path';

import {readJson} from '../lib.js';

export default class Post {
  #loading = false;
  #loaded = false;
  constructor(src) {
    this.src = src;
  }

  async load(){
    if(this.#loading) return console.error('Post is loading...');
    this.#loading = true;
    const location = path.join(this.src, 'post.json');
    const data = await readJson(location);
    for (const [propertyName, value] of Object.entries(data)){
      Object.defineProperty(this, propertyName, {
        // get: ()=>value,
        value,
        enumerable: true, // Optional: makes the property show up in iterations
        configurable: false // Optional: allows the property to be changed later
      });
    }
    this.#loaded = true;
    this.#loading = false;
  }

}
