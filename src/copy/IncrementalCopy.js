import path from "node:path";
import { readdir, copyFile, mkdir } from 'node:fs/promises';
import Remaining from './middleware/remaining/Remaining.js';
import { info, success, warn, danger } from "../TerminalColor.js";

const IGNORE = [
  o=>(/post\.json/i.test(o)), // INTERNAL USE
  o=>(/index\.md/i.test(o)), // ignore old
  o=>(/summary\.txt/i.test(o)), // ignore old optimizations
  o=>(/^files\/(xs|sm|md|lg|xl)-[^.]+\.jpg/i.test(o)), // ignore old jpg optimizations
  o=>(/^files\/(xs|sm|md|lg|xl)-[^.]+\.avif/i.test(o)), // ignore transitional avif, temporarly used for animations in october 2025 catpea.com
  // o=>(/\.(tar|gz)$/i.test(o)), // ignore tar
];

export default class IncrementalCopy {

  constructor() {
    this.middleware = [];
    this.endware = [new Remaining()];
    this.ignore = IGNORE;
    this.handledFilePaths = [];
  }

  use(plugin) {
    this.middleware.push(plugin);
    return this;
  }

  async copy(srcDir, targetDir){
    this.handledFilePaths = [];

    const filePaths = (await readdir(srcDir, {recursive:true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name))
    .map(entry => path.relative(srcDir, entry))
    .filter(location => !this.ignore.some(fn => fn(location)));
    // console.log('---filePaths---')
    // console.log(filePaths)
    // console.log('---filePaths---')

    await this.process(srcDir, targetDir, this.middleware, filePaths)
    // console.log('---this.handledFilePaths---')
    // console.log(this.handledFilePaths)
    // console.log('---this.handledFilePaths---')
    const remainigFiles = [...new Set(filePaths).difference(new Set(this.handledFilePaths))];
    console.log('---remainigFiles---')
    console.log(remainigFiles)
    console.log('---remainigFiles---')

    await this.process(srcDir, targetDir, this.endware, remainigFiles);

  }

  async process(srcDir, targetDir, middleware, filePaths){

    for (const plugin of middleware) {
      const acceptedFilePaths = await plugin.accepts(filePaths);
      if(acceptedFilePaths.length){

        // danger(`${plugin.name} accepted`, acceptedFilePaths);

        this.handledFilePaths.push(...acceptedFilePaths);
        const haveChanged = await plugin.shouldRebuild(srcDir, acceptedFilePaths);
        if (haveChanged) {
          warn(`Rebuilding via ${plugin.name}...`);
          await plugin.run(srcDir, targetDir, acceptedFilePaths);
          if(plugin.other) await plugin.other(srcDir, targetDir, acceptedFilePaths);
        } else {
          // success(`Skipped "${plugin.name}", ${srcDir} no changes.`);
        } // changed
      } // accepted
    }

  }


}
