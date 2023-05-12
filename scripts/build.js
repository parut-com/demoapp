#!/usr/bin/env node

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ansiHTML from 'ansi-html';

const copyFile = async (filePath) => {
  const destPath = path.resolve('dist', filePath.slice(6));

  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await fs.promises.copyFile(filePath, destPath);
};

export async function cleanupDist () {
  await fs.promises.rm('./dist', { recursive: true, force: true });
  await fs.promises.mkdir('./dist');
}

process.env.PUBLIC_KEY = await fs.promises.readFile('./config/public.key', 'utf8');

export async function buildJs () {
  try {
    const result = await esbuild.build({
      jsxFactory: 'h',
      splitting: false,
      format: 'esm',
      minify: true,
      bundle: true,
      entryPoints: ['./src/index.jsx'],
      outdir: 'dist',
      sourcemap: 'both',
      metafile: true,
      jsxFragment: 'Component',
      define: {
        'process.env.OAUTH_PROVIDER_URL': `"${process.env.OAUTH_PROVIDER_URL}"`,
        'process.env.OAUTH_CLIENT_ID': `"${process.env.OAUTH_CLIENT_ID}"`
      },
      loader: {
        '.svg': 'file',
        '.gif': 'file',
        '.png': 'file',
        '.jsx': 'jsx'
      }
    });
    await buildHtml();
    fs.writeFileSync('meta.json', JSON.stringify(result.metafile, null, 2));
  } catch (error) {
    const formattedErrors = esbuild.formatMessagesSync(error.errors, {
      kind: 'error',
      color: false,
      terminalWidth: 100,
    });
    fs.writeFileSync('dist/index.html', `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Compile Error</title>
          <style>
            * {
              box-sizing: border-box;
            }
            .error {
              background-color: #7d0b0b;
              color: white;
              border: 5px solid #700e0e;
              border-radius: 8px;
              box-shadow: 2px 2px 2px #969696;
            }
            h1 {
              background-color: #700e0e;
              margin: 0;
              padding: 5px 5px 5px 5px;
              font-size: 100%;
            }
            pre {
              margin: 0;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Compile Error</h1>
            <pre><code>${ansiHTML(formattedErrors)}</code></pre>
          </div>
        </body>
      </html>
    `);
  }
}

export async function buildCss () {
  await esbuild.build({
    entryPoints: ['./src/index.css'],
    bundle: true,
    sourcemap: true,
    outfile: './dist/index.css',
    loader: {
      '.svg': 'file',
      '.png': 'file'
    }
  });
}

export async function buildStatic () {
  glob('./src/**.txt', (errors, files) => files.forEach(copyFile));
}

export async function buildHtml () {
  let html = await fs.promises.readFile('./src/index.html', 'utf8');

  html = html.replace('{BASE_URL}', process.env.BASE_URL || '/');

  await Promise.all([
    fs.promises.writeFile('./dist/index.html', html),
    fs.promises.writeFile('./dist/404.html', html)
  ]);
}

export default async function build () {
  await cleanupDist();

  await Promise.all([
    buildStatic(),
    buildCss(),
    buildJs(),
    buildHtml()
  ]);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  build(false);
}
