import { validateSafeUrl } from '../utils/ssrfValidator.js';

export async function executePing(monitor) {
  // Re-verify safe URL before outbound request
  try {
    await validateSafeUrl(monitor.url);
  } catch (err) {
    return {
      status: 'DOWN',
      statusCode: null,
      latencyMs: 0,
      errorMessage: err.message,
    };
  }

  const controller = new AbortController();
  const timeoutMs = monitor.timeoutMs || 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = process.hrtime.bigint();

  try {
    const headers = {
      'User-Agent': 'PulseLedger-Telemetry/1.0',
      ...(monitor.headers || {}),
    };

    const hasBody = ['POST', 'PUT', 'PATCH'].includes(monitor.method) && monitor.body;

    const response = await fetch(monitor.url, {
      method: monitor.method || 'GET',
      headers,
      body: hasBody ? monitor.body : undefined,
      signal: controller.signal,
      redirect: 'follow',
    });

    const endTime = process.hrtime.bigint();
    const latencyMs = Number((endTime - startTime) / 1000000n);

    const isStatusExpected =
      response.status >= monitor.expectedStatusMin &&
      response.status <= monitor.expectedStatusMax;

    return {
      status: isStatusExpected ? 'UP' : 'DOWN',
      statusCode: response.status,
      latencyMs,
      errorMessage: isStatusExpected ? null : `Unexpected HTTP status ${response.status}`,
    };
  } catch (err) {
    const endTime = process.hrtime.bigint();
    const latencyMs = Number((endTime - startTime) / 1000000n);

    let errorMessage = err.message;
    if (err.name === 'AbortError') {
      errorMessage = `Request timed out after ${timeoutMs}ms`;
    }

    return {
      status: 'DOWN',
      statusCode: null,
      latencyMs,
      errorMessage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
