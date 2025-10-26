#!/usr/bin/env node
import { argv } from 'node:process';

import fs from 'fs';
import path from 'path';

import Book from './obj/Book.js';
import Post from './obj/Post.js';
import Page from './obj/Page.js';

const dir = src => fs.readdirSync(src, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).filter(dirent => !dirent.name.startsWith('_')).map(({name}) => path.join(src, name))
const chunk = (arr, chunkSize) => Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>  arr.slice(i * chunkSize, i * chunkSize + chunkSize) );

const defaults = { pp: 24, src: 'samples/database', dest: 'dist', };
const options = {...defaults, ...Object.fromEntries(argv.filter(a=>a.startsWith('--')).map(a=>a.substring(2).split('=')))};

const books = dir(options.src).map(o=>new Book(o));
const posts = books.reduce((a, book)=>a.concat(dir(book.src)),[]).map(o=>new Post(o)); // all posts from all books
await Promise.all(posts.map(post=>post.load())) // load all posts
const pages = chunk(posts, options.pp).map((o,i,a)=>new Page(o,i,a));


// console.dir(books);
// console.dir(posts);
// console.dir(pages);
// console.dir(pages[3].navPager );
