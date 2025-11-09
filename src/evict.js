#!/usr/bin/env node
import runstop from 'runstop';

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
// await runstop({options});

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
