// build.js
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { readdir, mkdir } from 'fs/promises';
import path from 'path';

class WorkerPool {
  constructor(workerScript, numWorkers = cpus().length) {
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;

    // Create worker pool
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(workerScript);
      this.workers.push({
        worker,
        busy: false,
        id: i,
      });

      worker.on('message', (result) => this.handleResult(i, result));
      worker.on('error', (error) => this.handleError(i, error));
    }
  }

  async run(task) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) return;

    const { task, resolve, reject } = this.taskQueue.shift();
    availableWorker.busy = true;
    availableWorker.currentTask = { resolve, reject };
    availableWorker.worker.postMessage(task);
    this.activeWorkers++;
  }

  handleResult(workerId, result) {
    const worker = this.workers[workerId];
    worker.busy = false;
    this.activeWorkers--;

    if (result.error) {
      worker.currentTask.reject(new Error(result.error));
    } else {
      worker.currentTask.resolve(result);
    }

    this.processQueue();
  }

  handleError(workerId, error) {
    const worker = this.workers[workerId];
    worker.busy = false;
    this.activeWorkers--;
    worker.currentTask.reject(error);
    this.processQueue();
  }

  async destroy() {
    await Promise.all(this.workers.map((w) => w.worker.terminate()));
  }
}

// Gather all tasks
async function gatherTasks() {
  const tasks = [];

  // Task 1: Generate HTML from JSON posts
  const posts = await readdir('./content/posts');
  for (const post of posts.filter((f) => f.endsWith('.json'))) {
    tasks.push({
      type: 'generate-html',
      input: path.join('./content/posts', post),
      output: path.join('./dist/posts', post.replace('.json', '.html')),
      template: './templates/post.html',
    });
  }

  // Task 2: Generate index pages
  tasks.push({
    type: 'generate-index',
    input: './content/posts',
    output: './dist/index.html',
    template: './templates/index.html',
  });

  // Task 3: Copy static assets
  const assets = await readdir('./static', { recursive: true });
  for (const asset of assets) {
    const sourcePath = path.join('./static', asset);
    tasks.push({
      type: 'copy-file',
      input: sourcePath,
      output: path.join('./dist', asset),
    });
  }

  // Task 4: Optimize images
  const images = await readdir('./images');
  for (const img of images.filter((f) => /\.(jpg|png|jpeg)$/.test(f))) {
    tasks.push({
      type: 'optimize-image',
      input: path.join('./images', img),
      output: path.join('./dist/images', img),
      quality: 80,
    });
  }

  // Task 5: Generate RSS feed
  tasks.push({
    type: 'generate-rss',
    input: './content/posts',
    output: './dist/feed.xml',
  });

  // Task 6: Generate sitemap
  tasks.push({
    type: 'generate-sitemap',
    input: './content/posts',
    output: './dist/sitemap.xml',
    baseUrl: 'https://example.com',
  });

  return tasks;
}

// Main build function
async function build() {
  console.log('🚀 Starting build...');
  const startTime = Date.now();

  // Ensure output directory exists
  await mkdir('./dist', { recursive: true });
  await mkdir('./dist/posts', { recursive: true });
  await mkdir('./dist/images', { recursive: true });

  // Gather all tasks
  const tasks = await gatherTasks();
  console.log(`📋 Found ${tasks.length} tasks to process`);

  // Create worker pool
  const pool = new WorkerPool('./worker.js');

  // Process all tasks
  const results = await Promise.allSettled(tasks.map((task) => pool.run(task)));

  // Report results
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nErrors:');
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.log(`  ${tasks[i].type}: ${r.reason.message}`);
      }
    });
  }

  await pool.destroy();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Build completed in ${duration}s`);
}

build().catch(console.error);
