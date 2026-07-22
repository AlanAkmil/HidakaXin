import axios from 'axios';

// Chapter-image CDN hosts on westmanhwa.net rotate (seen: imageainewgeneration.lol,
// himmga.lat, gaimgame.pics — likely more over time), so a fixed host allowlist
// would break constantly. Instead: require https, and block obviously-internal
// targets (basic SSRF guard) rather than allowlisting exact domains.
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

  if (parsed.protocol !== 'https:') {
    return new Response('Only https sources allowed', { status: 403 });
  }
  if (isPrivateHost(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  try {
    const res = await axios.get(target, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://westmanhwa.net/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    });
    return new Response(res.data, {
      headers: {
        'Content-Type': res.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (e) {
    return new Response('Failed to fetch image', { status: 502 });
  }
}
