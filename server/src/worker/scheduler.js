import { executePing } from './pinger.js';

export async function checkMonitorWithRetry(monitor) {
  let result = await executePing(monitor);

  // Anti-flapping: if previously UP and initial ping fails, retry once after 5s
  if (result.status === 'DOWN' && monitor.currentStatus === 'UP') {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    result = await executePing(monitor);
  }

  return result;
}
