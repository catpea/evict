# Queue System with Native Worker Threads

Here's a complete implementation of your Queue class with EnhancedEmitter and all the static helpers:

## **EnhancedEmitter.js**

```javascript
// EnhancedEmitter.js
import { EventEmitter } from 'events';

export class EnhancedEmitter extends EventEmitter {

  /**
   * Wait for all emitters to emit a specific event
   * @param {string} eventName - Event to listen for
   * @param {...EventEmitter} emitters - Emitters to wait for
   * @returns {EventEmitter} - Emits 'complete' when all done
   */
  static all(eventName, ...emitters) {
    const coordinator = new EventEmitter();
    const emittersList = emitters.flat();

    if (emittersList.length === 0) {
      process.nextTick(() => coordinator.emit('complete', []));
      return coordinator;
    }

    let completed = 0;
    const results = new Map();

    emittersList.forEach((emitter, index) => {
      emitter.once(eventName, (data) => {
        results.set(index, data);
        completed++;

        if (completed === emittersList.length) {
          const orderedResults = Array.from(results.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([_, value]) => value);
          coordinator.emit('complete', orderedResults);
        }
      });

      emitter.once('error', (error) => {
        coordinator.emit('error', { emitter, error });
      });
    });

    return coordinator;
  }

  /**
   * Wait for any emitter to emit a specific event
   * @param {string} eventName - Event to listen for
   * @param {...EventEmitter} emitters - Emitters to watch
   * @returns {EventEmitter} - Emits 'complete' on first occurrence
   */
  static any(eventName, ...emitters) {
    const coordinator = new EventEmitter();
    const emittersList = emitters.flat();

    if (emittersList.length === 0) {
      process.nextTick(() => coordinator.emit('complete', null));
      return coordinator;
    }

    let triggered = false;

    emittersList.forEach((emitter) => {
      emitter.once(eventName, (data) => {
        if (!triggered) {
          triggered = true;
          coordinator.emit('complete', { emitter, data, emitters: emittersList });
        }
      });
    });

    return coordinator;
  }

  /**
   * Run all emitters in parallel (same as all, but more explicit)
   * @param {string} eventName - Event to listen for
   * @param {...EventEmitter} emitters - Emitters to run in parallel
   * @returns {EventEmitter} - Emits 'complete' when all done
   */
  static parallel(eventName, ...emitters) {
    return this.all(eventName, ...emitters);
  }

  /**
   * Run emitters sequentially
   * @param {string} eventName - Event to listen for
   * @param {...EventEmitter} emitters - Emitters to run in sequence
   * @returns {EventEmitter} - Emits 'complete' when all done
   */
  static serial(eventName, ...emitters) {
    const coordinator = new EventEmitter();
    const emittersList = emitters.flat();

    if (emittersList.length === 0) {
      process.nextTick(() => coordinator.emit('complete', []));
      return coordinator;
    }

    const results = [];
    let currentIndex = 0;

    const processNext = () => {
      if (currentIndex >= emittersList.length) {
        coordinator.emit('complete', results);
        return;
      }

      const current = emittersList[currentIndex];

      // If it's a function, execute it
      if (typeof current === 'function') {
        try {
          const result = current();
          results.push(result);
          currentIndex++;
          process.nextTick(processNext);
        } catch (error) {
          coordinator.emit('error', { index: currentIndex, error });
        }
        return;
      }

      // If it's an EventEmitter, wait for event
      current.once(eventName, (data) => {
        results.push(data);
        currentIndex++;
        processNext();
      });

      current.once('error', (error) => {
        coordinator.emit('error', { index: currentIndex, emitter: current, error });
      });

      // If the emitter has a start method, call it
      if (typeof current.start === 'function') {
        current.start();
      }
    };

    process.nextTick(processNext);
    return coordinator;
  }
}
```

## **Queue.js**

```javascript
// Queue.js
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { EnhancedEmitter } from './EnhancedEmitter.js';

export class Queue extends EnhancedEmitter {
  constructor(workerScript, options = {}) {
    super();

    this.workerScript = workerScript;
    this.name = options.name || 'Unnamed Queue';
    this.description = options.description || '';
    this.maxThreads = options.maxThreads || cpus().length;

    this.jobs = [];
    this.workers = [];
    this.activeJobs = new Map();
    this.completedJobs = [];
    this.failedJobs = [];

    this.started = false;
    this.completed = false;
    this.aborted = false;

    this.abortController = new AbortController();
    this.startTime = null;
  }

  /**
   * Add a job to the queue
   * @param {Object} job - Job data (must be serializable)
   */
  add(job) {
    if (this.started) {
      throw new Error(`Cannot add jobs to "${this.name}" after starting`);
    }

    // Validate job is an object with strings
    if (typeof job !== 'object' || job === null) {
      throw new Error('Job must be an object');
    }

    this.jobs.push(job);
    return this;
  }

  /**
   * Start processing the queue
   */
  async start() {
    if (this.started) {
      throw new Error(`Queue "${this.name}" already started`);
    }

    if (this.jobs.length === 0) {
      this.emit('complete', { completed: 0, failed: 0 });
      return;
    }

    this.started = true;
    this.startTime = Date.now();

    // Create worker pool
    this._createWorkers();

    return new Promise((resolve, reject) => {
      this.once('complete', resolve);
      this.once('error', reject);

      // Start processing
      this._processQueue();
    });
  }

  /**
   * Abort all jobs
   */
  abort() {
    if (this.aborted) return;

    this.aborted = true;
    this.abortController.abort();

    // Terminate all workers
    this.workers.forEach(({ worker }) => {
      worker.terminate();
    });

    this.emit('abort', {
      completed: this.completedJobs.length,
      remaining: this.jobs.length
    });
  }

  /**
   * Create worker pool
   * @private
   */
  _createWorkers() {
    const numWorkers = Math.min(this.maxThreads, this.jobs.length);

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(this.workerScript);

      this.workers.push({
        worker,
        busy: false,
        id: i
      });

      worker.on('message', (result) => this._handleResult(i, result));
      worker.on('error', (error) => this._handleError(i, error));
      worker.on('exit', (code) => {
        if (code !== 0 && !this.aborted) {
          this._handleError(i, new Error(`Worker stopped with exit code ${code}`));
        }
      });
    }
  }

  /**
   * Process the job queue
   * @private
   */
  _processQueue() {
    if (this.aborted) return;
    if (this.jobs.length === 0 && this.activeJobs.size === 0) {
      this._finish();
      return;
    }

    // Find available workers and assign jobs
    this.workers.forEach((workerInfo) => {
      if (!workerInfo.busy && this.jobs.length > 0) {
        const job = this.jobs.shift();
        this._assignJob(workerInfo, job);
      }
    });
  }

  /**
   * Assign a job to a worker
   * @private
   */
  _assignJob(workerInfo, job) {
    workerInfo.busy = true;
    workerInfo.currentJob = job;

    this.activeJobs.set(workerInfo.id, job);
    workerInfo.worker.postMessage(job);
  }

  /**
   * Handle result from worker
   * @private
   */
  _handleResult(workerId, result) {
    const workerInfo = this.workers[workerId];
    const job = this.activeJobs.get(workerId);

    workerInfo.busy = false;
    this.activeJobs.delete(workerId);

    if (result.success) {
      this.completedJobs.push({ job, result });
      this.emit('job', { job, result, success: true });
    } else {
      this.failedJobs.push({ job, error: result.error });
      this.emit('job', { job, error: result.error, success: false });
    }

    this._emitProgress();
    this._processQueue();
  }

  /**
   * Handle error from worker
   * @private
   */
  _handleError(workerId, error) {
    const workerInfo = this.workers[workerId];
    const job = this.activeJobs.get(workerId);

    workerInfo.busy = false;
    this.activeJobs.delete(workerId);

    this.failedJobs.push({ job, error: error.message });
    this.emit('job', { job, error: error.message, success: false });

    this._emitProgress();
    this._processQueue();
  }

  /**
   * Emit progress event
   * @private
   */
  _emitProgress() {
    const total = this.completedJobs.length + this.failedJobs.length + this.jobs.length + this.activeJobs.size;
    const completed = this.completedJobs.length + this.failedJobs.length;
    const progress = ((completed / total) * 100).toFixed(1);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    this.emit('progress', {
      progress: parseFloat(progress),
      completed,
      total,
      elapsed: parseFloat(elapsed),
      remaining: this.jobs.length + this.activeJobs.size
    });
  }

  /**
   * Finish processing
   * @private
   */
  async _finish() {
    this.completed = true;

    // Terminate all workers
    await Promise.all(
      this.workers.map(({ worker }) => worker.terminate())
    );

    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    this.emit('complete', {
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      duration: parseFloat(duration),
      results: this.completedJobs,
      errors: this.failedJobs
    });
  }
}
```

## **Example Worker: article-processor.js**

```javascript
// article-processor.js
import { parentPort } from 'worker_threads';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

parentPort.on('message', async (job) => {
  try {
    // Read configuration
    const confData = await readFile(job.conf, 'utf8');
    const conf = JSON.parse(confData);

    // Read markdown source
    const markdown = await readFile(job.src, 'utf8');

    // Convert markdown to HTML (simplified - use your preferred markdown parser)
    const html = generateHTML(markdown, conf);

    // Ensure output directory exists
    const outputPath = path.join(job.dest, `${conf.id}.html`);
    await mkdir(path.dirname(outputPath), { recursive: true });

    // Write HTML file
    await writeFile(outputPath, html, 'utf8');

    parentPort.postMessage({
      success: true,
      job,
      output: outputPath,
      title: conf.title,
      bytes: html.length
    });

  } catch (error) {
    parentPort.postMessage({
      success: false,
      job,
      error: error.message,
      stack: error.stack
    });
  }
});

function generateHTML(markdown, conf) {
  // Simple markdown to HTML conversion
  // In production, use marked, markdown-it, or similar
  const content = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(conf.title)}</title>
  <meta name="description" content="${escapeHtml(conf.description || '')}">
  ${conf.tags ? `<meta name="keywords" content="${conf.tags.join(', ')}">` : ''}
</head>
<body>
  <article>
    <header>
      <h1>${escapeHtml(conf.title)}</h1>
      ${conf.image ? `<img src="${conf.image}" alt="${escapeHtml(conf.title)}">` : ''}
      <time datetime="${conf.date}">${new Date(conf.date).toLocaleDateString()}</time>
    </header>
    <div class="content">
      <p>${content}</p>
    </div>
    ${conf.tags ? `<footer><div class="tags">${conf.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</div></footer>` : ''}
  </article>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

## **Usage Example: build.js**

```javascript
// build.js
import { Queue } from './Queue.js';
import { cpus } from 'os';

// Make queues globally accessible
globalThis.queues = {};

// Create queues
const articleQueue = new Queue('./article-processor.js', {
  name: 'Article Processor',
  description: 'Convert article.md to article.html',
  maxThreads: cpus().length,
});

const imageQueue = new Queue('./image-processor.js', {
  name: 'Image Processor',
  description: 'Optimize and copy images',
  maxThreads: 2, // Limit for I/O-heavy tasks
});

const copyQueue = new Queue('./copy-processor.js', {
  name: 'File Copier',
  description: 'Copy static assets',
  maxThreads: cpus().length,
});

globalThis.queues = { articleQueue, imageQueue, copyQueue };

// Add event listeners
articleQueue.on('progress', ({ progress, elapsed, completed, total }) => {
  process.stdout.write(
    `\r⚡ ${articleQueue.name}: ${progress}% (${completed}/${total}) - ${elapsed}s`
  );
});

articleQueue.on('job', ({ job, success, error }) => {
  if (!success) {
    console.error(`\n❌ Failed: ${job.src} - ${error}`);
  }
});

articleQueue.on('complete', ({ completed, failed, duration }) => {
  console.log(`\n✅ ${articleQueue.name} complete: ${completed} succeeded, ${failed} failed in ${duration}s`);
});

// Spider your data structure and add jobs
async function gatherJobs(website) {
  website.books.forEach(book => {
    book.pages.forEach(page => {
      page.posts.forEach(post => {
        articleQueue.add({
          conf: post.confPath,
          src: post.srcPath,
          dest: post.destPath
        });
      });
    });

    book.posts.forEach(post => {
      articleQueue.add({
        conf: post.confPath,
        src: post.srcPath,
        dest: post.destPath
      });
    });
  });

  website.pages.forEach(page => {
    articleQueue.add({
      conf: page.confPath,
      src: page.srcPath,
      dest: page.destPath
    });
  });

  // Add image processing jobs
  website.images.forEach(image => {
    imageQueue.add({
      src: image.srcPath,
      dest: image.destPath,
      optimize: true
    });
  });

  // Add static file copy jobs
  website.staticFiles.forEach(file => {
    copyQueue.add({
      src: file.srcPath,
      dest: file.destPath
    });
  });
}

// Build process
async function build() {
  console.log('🚀 Starting build...\n');

  // Spider and gather all jobs
  const website = await loadWebsiteStructure();
  await gatherJobs(website);

  console.log(`📋 Gathered ${articleQueue.jobs.length} articles`);
  console.log(`📋 Gathered ${imageQueue.jobs.length} images`);
  console.log(`📋 Gathered ${copyQueue.jobs.length} files\n`);

  // Process all queues in parallel
  await Queue.parallel('complete',
    articleQueue.start(),
    imageQueue.start(),
    copyQueue.start()
  ).on('complete', () => {
    console.log('\n🎉 All queues completed!');
  });

  // Or handle errors from any queue
  Queue.any('error', articleQueue, imageQueue, copyQueue)
    .on('complete', ({ emitter, emitters }) => {
      console.error('\n⚠️  Error detected, aborting all queues...');
      emitters.forEach(q => q.abort());
    });
}

// Alternative: Sequential processing
async function buildSequential() {
  const website = await loadWebsiteStructure();
  await gatherJobs(website);

  await Queue.serial('complete',
    () => console.log('Step 1: Processing articles...'),
    articleQueue,
    () => console.log('Step 2: Processing images...'),
    imageQueue,
    () => console.log('Step 3: Copying files...'),
    copyQueue
  ).on('complete', () => {
    console.log('Build complete!');
  });
}

build().catch(console.error);
```

## **Additional Worker Examples**

```javascript
// image-processor.js
import { parentPort } from 'worker_threads';
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';

parentPort.on('message', async (job) => {
  try {
    await mkdir(path.dirname(job.dest), { recursive: true });

    if (job.optimize) {
      // Add sharp or other optimization here
      // const sharp = require('sharp');
      // await sharp(job.src).jpeg({ quality: 80 }).toFile(job.dest);
      await copyFile(job.src, job.dest);
    } else {
      await copyFile(job.src, job.dest);
    }

    parentPort.postMessage({
      success: true,
      job,
      output: job.dest
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      job,
      error: error.message
    });
  }
});
```

```javascript
// copy-processor.js
import { parentPort } from 'worker_threads';
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';

parentPort.on('message', async (job) => {
  try {
    await mkdir(path.dirname(job.dest), { recursive: true });
    await copyFile(job.src, job.dest);

    parentPort.postMessage({
      success: true,
      job,
      output: job.dest
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      job,
      error: error.message
    });
  }
});
```

This gives you:
- ✅ **Reusable Queue class** for different processors
- ✅ **EnhancedEmitter** with static coordination helpers
- ✅ **Progress tracking** built-in
- ✅ **Abort support** with AbortController
- ✅ **Event-driven architecture**
- ✅ **Serial and parallel execution** patterns
- ✅ **Clean separation** between queue management and job processing

You're welcome, and good luck with your static site generator! 🚀
