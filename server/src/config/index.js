import 'dotenv/config';
import os from 'node:os';

/**
 * Reads an environment variable and fails fast when a required value is absent.
 * Failing at boot is far safer than discovering a missing secret on first request.
 */
function required(name, { fallback, validate } = {}) {
  const raw = process.env[name];
  const value = raw === undefined || raw === '' ? fallback : raw;

  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy server/.env.example to server/.env and fill it in.`,
    );
  }
  if (validate && !validate(value)) {
    throw new Error(`Environment variable "${name}" has an invalid value.`);
  }
  return value;
}

function optional(name, fallback = '') {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? fallback : raw;
}

function toList(value) {
  return value
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

const nodeEnv = optional('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

/**
 * Admin secrets are optional at boot so that a brand new clone still runs.
 * When they are absent the admin write endpoints respond 503 instead of
 * granting access - see middleware/requireAdmin.js.
 */
const adminApiKey = optional('ADMIN_API_KEY');
const adminSessionSecret = optional('ADMIN_SESSION_SECRET');

const adminConfigured =
  adminApiKey.length >= 16 && adminSessionSecret.length >= 16;

if (!adminConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n[config] Admin authentication is NOT configured.\n' +
      '         Project create/update/delete will return 503 until you set\n' +
      '         ADMIN_API_KEY and ADMIN_SESSION_SECRET in server/.env.\n' +
      '         Generate a pair with:  npm run admin:key\n',
  );
}

export const config = {
  env: nodeEnv,
  isProduction,
  isTest: nodeEnv === 'test',
  port: Number(required('PORT', { fallback: '4000', validate: (v) => !Number.isNaN(Number(v)) })),

  db: {
    connectionString: required('DATABASE_URL'),
    ssl: optional('DB_SSL', 'false').toLowerCase() === 'true' ? { rejectUnauthorized: false } : false,
    poolMax: Number(optional('DB_POOL_MAX', '10')),
  },

  cors: {
    origins: toList(optional('CLIENT_URL', 'http://localhost:5173')),
  },

  admin: {
    configured: adminConfigured,
    apiKey: adminApiKey,
    sessionSecret: adminSessionSecret,
    sessionTtlMinutes: Number(optional('ADMIN_SESSION_TTL_MINUTES', '120')),
  },

  // In development every loopback origin is allowed so the site works no matter
  // which port the dev server picks. In production only CLIENT_URL entries pass.
  get allowedOrigins() {
    if (isProduction) return this.cors.origins;
    return [...this.cors.origins, ...loopbackOrigins()];
  },
};

function loopbackOrigins() {
  const ports = ['5173', '5174', '4173', '3000', '8080'];
  const hosts = new Set(['localhost', '127.0.0.1', '[::1]', os.hostname()]);
  const origins = [];
  for (const host of hosts) {
    for (const port of ports) {
      origins.push(`http://${host}:${port}`);
    }
  }
  // Vite picks the next free port when 5173 is taken.
  for (let port = 5173; port <= 5183; port += 1) {
    origins.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
  }
  return origins;
}
