import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `troublefree-holiday-backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`,
  );
});

function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    // Future phases: close database connections, socket server,
    // and job workers here before exiting.
    console.log('Server closed. Goodbye.');
    process.exit(0);
  });

  // Force-exit if shutdown hangs.
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
