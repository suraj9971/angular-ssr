import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

const readEnv = (name: string, fallback = ''): string => {
  const value = process.env[name] ?? process.env[`APPSETTING_${name}`];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
};

const runtimeConfig = {
  BASE_CURRENCY: readEnv('BASE_CURRENCY', 'LOCALSERVER-USD'),
  BASE_LANGUAGE: readEnv('BASE_LANGUAGE', 'localserver-env'),
  BASE_SITE_ID: readEnv('BASE_SITE_ID', 'localserver-site'),
  OCC_BASE_URL: readEnv('OCC_BASE_URL', 'https://localserver.example.com'),
  WEBSITE_NODE_DEFAULT_VERSION: readEnv('WEBSITE_NODE_DEFAULT_VERSION', 'localserver-node')
};

(globalThis as typeof globalThis & { __APP_RUNTIME_CONFIG__?: typeof runtimeConfig; __APP_RUNTIME_CONFIG_SOURCE__?: string }).__APP_RUNTIME_CONFIG__ = runtimeConfig;
(globalThis as typeof globalThis & { __APP_RUNTIME_CONFIG__?: typeof runtimeConfig; __APP_RUNTIME_CONFIG_SOURCE__?: string }).__APP_RUNTIME_CONFIG_SOURCE__ = 'process.env';

app.get('/api/runtime-config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.json(runtimeConfig);
});

/**
 * Example Express Rest API endpoints can be defined here.

 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.get('/assets/env.json', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.json(runtimeConfig);
});

app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html'
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || process.env['APPSETTING_PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}
