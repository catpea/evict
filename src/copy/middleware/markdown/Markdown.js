import fs from "node:fs";
import path from "node:path";
import { hasChanged, updateMtime } from "../../cache.js";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import Chastity from "chastity";

import Middleware from "../Middleware.js";

export default class Markdown extends Middleware {

  constructor(options) {
    super(options)
    this.md = new Chastity();
  }

  async accepts(postFilePaths) {
    return postFilePaths.filter(postFilePath => postFilePath.endsWith(".md"));
  }

  async execute(srcFile, destDir, /*destFile*/) {
    const markdown = await readFile(srcFile, "utf8");
    const html = this.md.parse(markdown);
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, "index.html"), html);
  }

}
