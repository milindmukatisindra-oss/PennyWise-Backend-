import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  🪙 ======================================================== 🪙
     PENNYWISE — TEEN EXPENSE TRACKER BACKEND API
  🪙 ======================================================== 🪙
  🚀 Server running on: http://localhost:${PORT}
  📡 Health check:     http://localhost:${PORT}/api/health
  🔒 Environment:      ${config.nodeEnv}
  🗄️  Supabase URL:     ${config.supabaseUrl ? config.supabaseUrl : 'In-memory fallback (Ready for Supabase)'}
  =============================================================
  `);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
