import { createApp } from './app.js';
import { config } from './config/index.js';
import { checkConnection, closePool } from './db/pool.js';

async function start() {
  const app = createApp();

  // Fail loudly but do not crash: the API still serves /api/health so a
  // misconfigured DATABASE_URL is easy to diagnose from the browser or a
  // hosting provider's log view.
  try {
    await checkConnection();
    console.log('[db] connected');
  } catch (error) {
    console.error(`[db] connection failed: ${error.message}`);
    console.error('[db] run "npm run db:migrate" once your DATABASE_URL is correct.');
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log('');
    console.log(`  Portfolio API listening on http://localhost:${config.port}`);
    console.log(`  Environment      : ${config.env}`);
    console.log(`  Allowed origins  : ${config.allowedOrigins.join(', ') || '(none)'}`);
    console.log(`  Admin auth       : ${config.admin.configured ? 'enabled' : 'DISABLED (set ADMIN_API_KEY + ADMIN_SESSION_SECRET)'}`);
    console.log('');
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received, shutting down`);
    server.close(async () => {
      await closePool().catch(() => {});
      process.exit(0);
    });
    // Do not hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('[server] failed to start:', error.message);
  process.exit(1);
});
