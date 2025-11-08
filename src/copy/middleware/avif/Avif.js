
import fs from "node:fs";
import path from "node:path";
import { mkdir } from 'node:fs/promises';
import sharp from "sharp";
import { hasChanged, updateMtime } from "../../cache.js";
import Middleware from "../Middleware.js";

// import { readFile, mkdir, writeFile } from "node:fs/promises";

export default class Avif extends Middleware {

  constructor(configuration) {
    const defaults = { width: 1024, height: 1024, quality: 80, effort:4 };
    const options = {...defaults, ...configuration};
    super(options);
  }

  async accepts(postFilePaths) {
    return postFilePaths.filter(postFilePath=>/\.(jpg|png)$/i.test(postFilePath));
  }

  async execute(srcFile, destDir, /*destFile*/) {
    await mkdir(destDir, { recursive: true });
    const fileName = path.basename(srcFile, path.extname(srcFile)) + '.avif';
    const destFile = path.join(destDir, fileName);
    const { width, height, quality, effort } = this.options;
    await sharp(srcFile)
    .resize( width, height, { kernel: sharp.kernel.mks2013, fit: 'inside' }) // NOTE: on fit: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified.
    .avif({ quality, effort })
    .toFile(destFile);
  } // execute

}
