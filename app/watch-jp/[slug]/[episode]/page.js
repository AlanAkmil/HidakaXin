import Link from 'next/link';
import animeScraper from '../../../../lib/animeScraper';
import NativeVideoPlayer from '../../../../components/NativeVideoPlayer';
import HistoryRecorder from '../../../../components/HistoryRecorder';

export const revalidate = 300;

async function getData(slug) {
  try {
    const [detailPayload, episodePayload] = await Promise.all([
      animeScraper.detail(slug),
      animeScraper.episode(slug)
    ]);
    return { detail: detailPayload?.data, all: episodePayload?.data?.streaming || [], downloads: episodePayload?.data?.downloads || [] };
  } catch {
    return { detail: null, all: [], downloads: [] };
  }
}

export default async function WatchJpPage({ params }) {
  const slug = params.slug;
  const epNum = parseInt(params.episode);
  const { detail, all, downloads } = await getData(slug);

  const sorted = [...all].sort((a, b) => (a.episode || 0) - (b.episode || 0));
  const current = sorted.find((e) => e.episode === epNum);
  const currentIndex = sorted.findIndex((e) => e.episode === epNum);
  const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
  const epDownloads = downloads.find((dl) => dl.episode === epNum);

  if (!detail || !current) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-ink-soft">Episode tidak ditemukan atau sumber sedang bermasalah.</p>
        <Link href={`/anime-jp/${slug}`} className="mt-4 inline-block font-semibold text-accent">← Kembali ke detail</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <HistoryRecorder item={{ url: `https://nimegami.id/${slug}#ep${epNum}`, title: `${detail.title} — ${current.title}`, image: detail.poster, source: 'anime' }} />

      <Link href={`/anime-jp/${slug}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-accent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
        </svg>
        {detail.title}
      </Link>

      <h1 className="mb-4 font-display text-xl font-extrabold text-ink sm:text-2xl">{current.title || `Episode ${epNum}`}</h1>

      <NativeVideoPlayer formats={current.formats} />

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        {prev ? (
          <Link href={`/watch-jp/${slug}/${prev.episode}`} className="text-sm font-semibold text-ink-soft hover:text-accent">← Sebelumnya</Link>
        ) : <span />}
        <Link href={`/anime-jp/${slug}`} className="text-sm font-bold text-accent">Semua Episode</Link>
        {next ? (
          <Link href={`/watch-jp/${slug}/${next.episode}`} className="text-sm font-semibold text-ink-soft hover:text-accent">Selanjutnya →</Link>
        ) : <span />}
      </div>

      {epDownloads?.resolutions && Object.keys(epDownloads.resolutions).length > 0 && (
        <div className="mt-8">
          <p className="mb-3 font-display text-lg font-extrabold text-ink">Unduh Episode</p>
          <div className="space-y-3">
            {Object.entries(epDownloads.resolutions).map(([res, links]) => (
              <div key={res} className="rounded-xl border border-line bg-white p-4 shadow-card">
                <p className="mb-2 text-sm font-bold text-accent">{res}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(links).map(([host, url]) => (
                    <a
                      key={host}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold capitalize text-ink-soft hover:border-accent hover:text-accent"
                    >
                      {host}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
