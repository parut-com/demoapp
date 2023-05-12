#!/usr/bin/env node

import {
  cleanupDist,
  buildCss,
  buildJs,
  buildHtml,
  buildStatic
} from './build.js';

import { extname } from 'path';
import chokidar from 'chokidar';

const extentions = {
  '.jsx': buildJs,
  '.js': buildJs,
  '.css': buildCss,
  '.txt': buildStatic,
  '.html': buildHtml
};

export default async function watch () {
  await cleanupDist();

  await Promise.all([
    buildStatic(),
    buildCss(),
    buildJs(),
    buildHtml()
  ]);

  chokidar.watch('./src', {
    ignoreInitial: true
  }).on('all', async (event, path) => {
    const ext = extname(path);
    const builder = extentions[ext];

    if (builder) {
      console.log(new Date(), path, 'triggered', builder.name + '()');
      builder();
    }
  });

  console.log('Watching for changes in ./src');
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  watch(false);
}
