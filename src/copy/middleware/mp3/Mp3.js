import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import presets from './presets.js';

// import { hasChanged, updateMtime } from '../../cache.js';

import Middleware from '../Middleware.js';

export default class Mp3 extends Middleware {
  constructor(configuration = {}) {
    const defaults = { preset: 'balanced' };
    const options = { ...defaults, ...configuration };
    super(options);

    if (!presets[this.options.preset]) {
      throw new Error(`Unknown preset: ${this.options.preset}. Available: ${Object.keys(presets).join(', ')}`);
    }
  }

  async accepts(postFilePaths) {
    return postFilePaths.filter((postFilePath) => /\.(mp3|wav|ogg|flac|m4a)$/i.test(postFilePath));
  }

  async execute(srcFile, destDir /*destFile*/) {
    await mkdir(destDir, { recursive: true });
    const fileName = path.basename(srcFile, path.extname(srcFile)) + '.mp3';
    const destFile = path.join(destDir, fileName);
    const commandArguments = presets[this.options.preset](srcFile, destFile);
    await this.transmute(commandArguments);
    await this.verify(srcFile, destFile, this.options.preset);

  }

  async transmute(commandArguments) {
    const ffmpeg = spawn('ffmpeg', commandArguments);
    let stderr = '';

    // Capture stderr for error messages
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for the process to complete
    const [code] = await once(ffmpeg, 'close');

    if (code !== 0) {
      throw new Error(`FFmpeg exited with code ${code}${stderr ? ': ' + stderr : ''}`);
    }
  }

  async verify(srcFile, destFile, presetName) {
    // Verify output file exists and has reasonable size
    if (!fs.existsSync(destFile)) {
      throw new Error(`Output file not created: ${destFile}`);
    }

    const stats = fs.statSync(destFile);
    if (stats.size < 1000) {
      throw new Error(`Output file suspiciously small (${stats.size} bytes)`);
    }

    // Success! Show some stats
    const inputSize = fs.statSync(srcFile).size;
    const outputSize = stats.size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    const direction = reduction > 0 ? 'smaller' : 'larger';
    console.log(`✓ ${presetName}: ${path.basename(srcFile)} ${(inputSize / 1024).toFixed(1)}KB → ${(outputSize / 1024).toFixed(1)}KB (${Math.abs(reduction)}% ${direction})`);
  }
}
