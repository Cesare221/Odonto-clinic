import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllowedClientOrigins,
  isAllowedClientOrigin,
  resolveClientUrlForRequest,
} from '../backend/config/runtime.js';

test('getAllowedClientOrigins reads comma-separated values from CLIENT_URLS', () => {
  const originalClientUrls = globalThis.process.env.CLIENT_URLS;

  globalThis.process.env.CLIENT_URLS = 'http://localhost:5173, https://clinica-odonto-ashy.vercel.app';

  try {
    assert.deepEqual(getAllowedClientOrigins(), [
      'http://localhost:5173',
      'https://clinica-odonto-ashy.vercel.app',
      'http://127.0.0.1:5173',
    ]);
  } finally {
    globalThis.process.env.CLIENT_URLS = originalClientUrls;
  }
});

test('getAllowedClientOrigins expands localhost and 127 aliases for local dev', () => {
  const originalClientUrls = globalThis.process.env.CLIENT_URLS;
  const originalClientUrl = globalThis.process.env.CLIENT_URL;

  delete globalThis.process.env.CLIENT_URLS;
  globalThis.process.env.CLIENT_URL = 'http://localhost:5173';

  try {
    assert.deepEqual(getAllowedClientOrigins(), [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    assert.equal(isAllowedClientOrigin('http://127.0.0.1:5173'), true);
  } finally {
    globalThis.process.env.CLIENT_URLS = originalClientUrls;
    globalThis.process.env.CLIENT_URL = originalClientUrl;
  }
});

test('isAllowedClientOrigin accepts exact and wildcard Vercel origins', () => {
  const originalClientUrls = globalThis.process.env.CLIENT_URLS;

  globalThis.process.env.CLIENT_URLS = 'http://localhost:5173,https://clinica-odonto-*.vercel.app';

  try {
    assert.equal(isAllowedClientOrigin('http://localhost:5173'), true);
    assert.equal(
      isAllowedClientOrigin('https://clinica-odonto-ashy.vercel.app'),
      true
    );
    assert.equal(
      isAllowedClientOrigin('https://clinica-odonto-7khxosd5h-cesar-s-project.vercel.app'),
      true
    );
    assert.equal(isAllowedClientOrigin('https://outro-projeto.vercel.app'), false);
  } finally {
    globalThis.process.env.CLIENT_URLS = originalClientUrls;
  }
});

test('isAllowedClientOrigin accepts default local dev origins', () => {
  const originalClientUrls = globalThis.process.env.CLIENT_URLS;
  const originalClientUrl = globalThis.process.env.CLIENT_URL;

  delete globalThis.process.env.CLIENT_URLS;
  delete globalThis.process.env.CLIENT_URL;

  try {
    assert.deepEqual(getAllowedClientOrigins(), [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    assert.equal(isAllowedClientOrigin('http://localhost:5173'), true);
    assert.equal(isAllowedClientOrigin('http://127.0.0.1:5173'), true);
  } finally {
    globalThis.process.env.CLIENT_URLS = originalClientUrls;
    globalThis.process.env.CLIENT_URL = originalClientUrl;
  }
});

test('resolveClientUrlForRequest prefers the current allowed frontend origin', () => {
  const originalClientUrls = globalThis.process.env.CLIENT_URLS;
  const originalPublicAppUrl = globalThis.process.env.PUBLIC_APP_URL;

  globalThis.process.env.CLIENT_URLS = 'https://clinica-odonto-*.vercel.app';
  globalThis.process.env.PUBLIC_APP_URL = 'https://clinica-odonto-ashy.vercel.app';

  try {
    const req = {
      get: (headerName) => (
        headerName === 'origin'
          ? 'https://clinica-odonto-gamma.vercel.app'
          : ''
      ),
    };

    assert.equal(
      resolveClientUrlForRequest(req),
      'https://clinica-odonto-gamma.vercel.app'
    );
  } finally {
    globalThis.process.env.CLIENT_URLS = originalClientUrls;
    globalThis.process.env.PUBLIC_APP_URL = originalPublicAppUrl;
  }
});
