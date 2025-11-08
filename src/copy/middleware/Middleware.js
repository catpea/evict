import path from "node:path";
import { hasChanged, updateMtime } from "../cache.js";
// import { readFile, mkdir, writeFile } from "node:fs/promises";

export default class Middleware {

  constructor(options) {
    this.name = this.constructor.name;
    this.options = options;
  }

  async accepts(postFilePaths) {
    console.info('Override This Method')
    return []; // postFilePaths.filter(postFilePath => postFilePath.endsWith(".xxx"));
  }

  async shouldRebuild(srcDir, acceptedFilePaths) {
    return acceptedFilePaths.some(f => hasChanged(path.join(srcDir, f)));
  }

  async run(postDirectory, targetDirectory, acceptedFilePaths) {
    for (const filePath of acceptedFilePaths) {
      const srcFile = path.join(postDirectory, filePath);
      const destFile = path.join(targetDirectory, filePath);
      const destDir = path.dirname(destFile);
      await this.execute(srcFile, destDir, destFile);
      updateMtime(srcFile);
    }
  }

  async execute(srcFile, destDir, destFile) {
    console.info('Override This Method')
  }

}
