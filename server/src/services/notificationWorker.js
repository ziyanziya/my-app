const notifications = require('./notification-domain.service');

let workerInterval = null;
let running = false;

async function processActiveNotifications() {
  if (running) return 0;
  running = true;
  try {
    return await notifications.runOnce();
  } catch (error) {
    // Durable rows stay queued; an explicit error is safer than a false success.
    console.error('Notification worker cycle failed:', error);
    return 0;
  } finally {
    running = false;
  }
}

function startWorker(intervalMs = 30_000) {
  if (workerInterval) return;
  workerInterval = setInterval(processActiveNotifications, intervalMs);
  void processActiveNotifications();
}

function stopWorker() {
  if (workerInterval) clearInterval(workerInterval);
  workerInterval = null;
}

module.exports = { startWorker, stopWorker, processActiveNotifications };
