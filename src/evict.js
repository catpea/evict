#!/usr/bin/env node

import { cpus } from 'os';
import { opt } from './lib.js';

import Website from './objects/Website.js';
import Generator from './objects/Generator.js';

const defaults = {
  maxThreads: cpus().length,
  pp: 24,
  src: 'samples/database',
  dest: 'dist',
  upload: 'samples/targets.json',
};

const options = opt(defaults);
console.log(options);

console.time("Execution Time");


const website = new Website(options);
const generator = new Generator(options);

for (const target of await generator.targets()) {
  console.log(target)
  website.src = target.src;
  // await target.permalinks(website);
  await target.pagination(website);
  await target.publishing(website);
}

console.timeEnd("Execution Time");

// const posts = books.reduce((a, book)=>a.concat(dir(book.src)),[]).map(o=>new Post(o)); // all posts from all books
// await Promise.all(posts.map(post=>post.load())) // load all posts
// const pages = chunk(posts, options.pp).map((o,i,a)=>new Page(o,i,a));

// Example usage with website.stats
// for (let i = 0; i < 13; i++) {
//     await measureExecution(website.stats.bind(website));
// }
// async function measureExecution(asyncFunc, ...args) {
//     console.time("Execution Time");
//     const result = await asyncFunc(...args);
//     // console.log(result);
//     console.timeEnd("Execution Time");
// }
