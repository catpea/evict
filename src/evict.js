#!/usr/bin/env node

import { cpus } from 'os';
import { opt } from './lib.js';

import Website from './objects/Website.js';
import Publishing from './objects/Publishing.js';

const defaults = {
  maxThreads: cpus().length,
  pp: 24,
  src: 'samples/database',
  dest: 'dist',
  pub: 'samples/services.json',
};

const options = opt(defaults);
console.log(options);

console.time("Execution Time");


const website = new Website(options);
const publishing = new Publishing(options);

for (const service of await publishing.services()) {
  const generation = await service.build(website);
  await service.publish(generation);
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
