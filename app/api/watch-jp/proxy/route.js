export const dynamic = 'force-dynamic';

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

function isPrivateHost(hostname) {
  if (BLOCKED_HOSTS.includes(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  return false;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new Response('Missing url', { status: 400 });

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }
  if (parsed.protocol !== 'https:' || isPrivateHost(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  const range = request.headers.get('range');

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://nimegami.id/',
        ...(range ? { Range: range } : {})
      }
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response('Upstream fetch failed', { status: 502 });
    }

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
    headers.set('Accept-Ranges', 'bytes');
    const len = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (len) headers.set('Content-Length', len);
    if (cr) headers.set('Content-Range', cr);
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}
