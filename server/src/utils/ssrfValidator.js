import dns from 'node:dns/promises';
import { AppError } from '../middlewares/errorHandler.js';

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true;
  }

  const [p0, p1] = parts;

  // 0.0.0.0/8, 127.0.0.0/8
  if (p0 === 0 || p0 === 127) return true;
  // 10.0.0.0/8
  if (p0 === 10) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata)
  if (p0 === 169 && p1 === 254) return true;
  // 172.16.0.0/12 (Docker / Private)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  // 192.168.0.0/16
  if (p0 === 192 && p1 === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;
  // 224.0.0.0/4 (Multicast), 240.0.0.0/4 (Reserved)
  if (p0 >= 224) return true;

  return false;
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();

  // Loopback and unspecified
  if (lower === '::1' || lower === '::') return true;

  // IPv4-mapped IPv6
  if (lower.startsWith('::ffff:')) {
    const ipv4Part = lower.replace('::ffff:', '');
    return isPrivateIPv4(ipv4Part);
  }

  // Unique local addresses fc00::/7 (fc00... or fd00...)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // Link-local unicast fe80::/10
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true;
  }

  // Multicast ff00::/8
  if (lower.startsWith('ff')) return true;

  return false;
}

export async function validateSafeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new AppError('The target URL format is invalid', 400, 'INVALID_URL', [
      { field: 'url', issue: 'Must be a well-formed URL' },
    ]);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError('Only http: and https: protocols are permitted', 400, 'INVALID_PROTOCOL', [
      { field: 'url', issue: 'Unsupported protocol scheme' },
    ]);
  }

  const hostname = parsed.hostname;
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new AppError('Access to localhost and internal domain names is prohibited', 400, 'SSRF_BLOCKED', [
      { field: 'url', issue: 'Target hostname is a restricted internal domain' },
    ]);
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      throw new AppError(
        `Could not resolve hostname "${hostname}". Please check that the domain exists.`,
        400,
        'DNS_NOT_FOUND',
        [{ field: 'url', issue: `Hostname ${hostname} could not be resolved` }]
      );
    }
    throw new AppError(`DNS resolution failed for host "${hostname}": ${err.message}`, 400, 'DNS_LOOKUP_FAILED', [
      { field: 'url', issue: err.message },
    ]);
  }

  for (const record of addresses) {
    const isBlocked = record.family === 6 ? isPrivateIPv6(record.address) : isPrivateIPv4(record.address);
    if (isBlocked) {
      throw new AppError(
        `Target URL resolves to a prohibited internal IP address (${record.address})`,
        400,
        'SSRF_BLOCKED',
        [{ field: 'url', issue: `Blocked address: ${record.address}` }]
      );
    }
  }

  return { isValid: true, addresses };
}
