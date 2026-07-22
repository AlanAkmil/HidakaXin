// Manga/manhwa/manhua scraper for westmanhwa.net.
//
// Replaces the earlier v1.makota.asia-based scraper, which turned out to be
// protected by a JavaScript challenge ("Aktifkan JavaScript untuk
// melanjutkan") — a plain HTTP scraper can never get past that, since the
// real page never renders without executing JS. westmanhwa.net serves
// normal server-rendered HTML instead, so it's actually scrapable.
//
// Note: exact CSS class names on westmanhwa.net weren't directly
// inspectable while writing this, so extraction leans on stable signals
// (href patterns like /komik/{slug}/ and /chapter/{slug}/, and visible text
// patterns like "Ch. 123", "8.5", "31.3K") rather than guessed class names.
// If the site's markup differs from assumptions, individual fields may need
// small selector tweaks — but the overall approach should degrade
// gracefully (worst case: some fields come back null, not a hard failure).

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const BASE_URL = 'https://westmanhwa.net';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.104 Mobile Safari/537.36'
];
let uaIndex = 0;

function getHeaders() {
  const ua = userAgents[uaIndex % userAgents.length];
  uaIndex++;
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': BASE_URL + '/'
  };
}

async function fetchHTML(url, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, {
        headers: getHeaders(),
        timeout: 20000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        validateStatus: (s) => s >= 200 && s < 400
      });
      return res.data;
    } catch (e) {
      lastError = e;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastError;
}

function abs(href) {
  if (!href) return null;
  return href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
}

function slugFromKomikUrl(url) {
  const m = url.match(/\/komik\/([^/]+)\/?/);
  return m ? m[1] : null;
}

function slugFromChapterUrl(url) {
  const m = url.match(/\/chapter\/([^/]+)\/?/);
  return m ? m[1] : null;
}

class WestmanhwaScraper {
  constructor() {
    this.base = BASE_URL;
  }

  async list(url) {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    const seen = new Set();

    $('a[href*="/komik/"]').each((i, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      if (!href || !/\/komik\/[^/?]+\/?$/.test(href)) return;
      const full = abs(href);
      const slug = slugFromKomikUrl(full);
      if (!slug || slug.length < 2 || seen.has(slug)) return;

      const text = $a.text().replace(/\s+/g, ' ').trim();
      if (!text) return;

      const imgEl = $a.find('img').first();
      const img = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-original') || imgEl.attr('src') || null;
      const chapterMatch = text.match(/Ch\.\s*([\d.]+(?:\s*End)?)/i);
      const ratingMatch = text.match(/\b(\d(?:\.\d{1,2})?)\b(?=\s|$)/);
      const viewsMatch = text.match(/\b([\d.]+K)\b/i);
      const formatMatch = text.match(/\b(Manga|Manhwa|Manhua)\b/i);
      const title = text
        .replace(/Ch\.\s*[\d.]+(?:\s*End)?/i, '')
        .replace(/\b(Manga|Manhwa|Manhua)\b/i, '')
        .replace(/Baca Komik$/i, '')
        .split(/\s\d(?:\.\d{1,2})?\s/)[0]
        .trim();

      // Skip generic UI elements (sort/filter controls etc.) that aren't
      // actually manga cards — real cards always have a chapter or rating.
      if (!title || title.length < 2) return;
      if (!chapterMatch && !ratingMatch && !formatMatch) return;

      seen.add(slug);
      items.push({
        title,
        slug,
        url: full,
        image: img ? abs(img) : null,
        chapter: chapterMatch ? `Chapter ${chapterMatch[1]}` : null,
        rating: ratingMatch ? ratingMatch[1] : null,
        views: viewsMatch ? viewsMatch[1] : null,
        type: formatMatch ? formatMatch[1] : null
      });
    });

    let next = null;
    const nextEl = $('a').filter((i, el) => $(el).text().trim().toLowerCase().includes('halaman berikutnya'));
    if (nextEl.length) next = abs(nextEl.first().attr('href'));

    return { url, count: items.length, items, next };
  }

  async home(page = 1) {
    const url = page === 1 ? `${this.base}/komik/` : `${this.base}/komik/page/${page}/`;
    return this.list(url);
  }

  async search(query, page = 1) {
    const url = page === 1
      ? `${this.base}/komik/?s=${encodeURIComponent(query)}`
      : `${this.base}/komik/page/${page}/?s=${encodeURIComponent(query)}`;
    return this.list(url);
  }

  async detail(slug) {
    const url = slug.startsWith('http') ? slug : `${this.base}/komik/${slug.replace(/^\/+|\/+$/g, '')}/`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || null;
    const coverEl = $('img[alt*="Cover" i]').first();
    const cover = $('meta[property="og:image"]').attr('content')
      || coverEl.attr('data-src') || coverEl.attr('data-lazy-src') || coverEl.attr('src') || null;

    const genres = [];
    $('a[href*="/genre/"]').each((i, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });

    // Longest paragraph near the synopsis area — same defensive approach
    // used for the donghua source, avoids grabbing unrelated short labels.
    const candidates = [];
    $('p').each((i, el) => {
      const t = $(el).text().trim();
      if (t.length > 40) candidates.push(t);
    });
    const synopsis = candidates.sort((a, b) => b.length - a.length)[0] || null;

    const bodyText = $('body').text();
    const ratingMatch = bodyText.match(/\|\s*(\d(?:\.\d{1,2})?)\s*\n?\s*Berikan rating/i);
    const rating = ratingMatch ? ratingMatch[1] : null;

    const statusMatch = bodyText.match(/\b(Ongoing|Complete|Hiatus)\b/i);
    const status = statusMatch ? statusMatch[1] : null;

    const chapters = [];
    $('a[href*="/chapter/"]').each((i, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      const label = $a.text().replace(/\s+/g, ' ').trim();
      if (!href || !label || !/chapter/i.test(label)) return;
      const full = abs(href);
      const chSlug = slugFromChapterUrl(full);
      if (!chSlug || chapters.some((c) => c.slug === chSlug)) return;
      chapters.push({ label, url: full, slug: chSlug });
    });

    // Sort by chapter number ascending (labels look like "Chapter 12", "Chapter 52.1")
    chapters.sort((a, b) => {
      const na = parseFloat((a.label.match(/[\d.]+/) || ['0'])[0]);
      const nb = parseFloat((b.label.match(/[\d.]+/) || ['0'])[0]);
      return na - nb;
    });

    if (!title) return null;

    return { slug: slugFromKomikUrl(url) || slug, url, title, cover, synopsis, genres, status, rating, chapters };
  }

  async read(chapterSlugOrUrl) {
    const url = chapterSlugOrUrl.startsWith('http')
      ? chapterSlugOrUrl
      : `${this.base}/chapter/${chapterSlugOrUrl.replace(/^\/+|\/+$/g, '')}/`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    let images = [];
    $('img[alt*="Panel" i], img[alt*="Halaman" i]').each((i, el) => {
      const $el = $(el);
      const src = $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('data-original') || $el.attr('src');
      if (src) images.push(abs(src));
    });

    // Fallback: any <img> pointing at what looks like a chapter-image CDN path.
    if (!images.length) {
      $('img').each((i, el) => {
        const $el = $(el);
        const src = $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('data-original') || $el.attr('src');
        if (src && /\/data\/\d+\//.test(src)) images.push(abs(src));
      });
    }

    let prevUrl = null;
    let nextUrl = null;
    $('a').each((i, el) => {
      const t = $(el).text().trim().toLowerCase();
      const href = $(el).attr('href');
      if (!href) return;
      if (t === 'next' || t === '> next') nextUrl = abs(href);
      if (t === 'prev' || t === '> prev') prevUrl = abs(href);
    });

    return { url, images, prevUrl, nextUrl };
  }
}

module.exports = new WestmanhwaScraper();
module.exports.WestmanhwaScraper = WestmanhwaScraper;
module.exports.slugFromChapterUrl = slugFromChapterUrl;
module.exports.slugFromKomikUrl = slugFromKomikUrl;
