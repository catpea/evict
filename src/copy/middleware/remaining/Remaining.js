import { mkdir, copyFile } from 'node:fs/promises';
import Middleware from "../Middleware.js";

export default class Remaining extends Middleware {

  async accepts(postFilePaths) {
    return postFilePaths; // accept all files that remain
  }

  async execute(srcFile, destDir, destFile) {
    return console.log('OTHER COPY', destFile)
    await mkdir(destDir, { recursive: true });
    await copyFile(srcFile, destFile);
  } // execute

}
