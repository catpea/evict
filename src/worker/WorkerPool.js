export default class WorkerPool {
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
