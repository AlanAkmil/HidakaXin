import Link from 'next/link';
import webtoons from '../../../../lib/webtoonsScraper';
import Pagination from '../../../../components/Pagination';

export const revalidate = 300;

async function getEpisodes(url, page) {
  try {
    return await webtoons.episodes(url, page);
  } catch {
    return null;
  }
}

export default async function WebtoonDetailPage({ params, searchParams }) {
  const url = decodeURIComponent(params.slug);
  const page = parseInt(searchParams?.page || '1');
  const d = await getEpisodes(url, page);

  if (!d || !d.title) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-ink-soft">Webtoon tidak ditemukan atau sumber sedang bermasalah.</p>
        <Link href="/komik" className="mt-4 inline-block font-semibold text-accent">← Kembali ke Komik</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        <div className="overflow-hidden rounded-xl border border-line shadow-card">
          {d.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.thumbnail} alt={d.title} className="w-full object-cover" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center bg-paper-soft text-ink-faint font-display text-4xl">?</div>
          )}
        </div>

        <div>
          <span className="mb-2 inline-block rounded-full bg-accent-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent">Webtoons</span>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{d.title}</h1>
          {d.author && <p className="mt-1 text-sm text-ink-faint">oleh {d.author}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {d.status && <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent">{d.status}</span>}
            {d.rating && <span className="flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold">★ {d.rating}</span>}
            {d.genre && <span className="rounded-full bg-paper-soft px-3 py-1 text-xs font-semibold text-ink-soft">{d.genre}</span>}
          </div>

          {d.synopsis && <p className="mt-4 text-sm leading-relaxed text-ink-soft line-clamp-6">{d.synopsis}</p>}
        </div>
      </div>

      {d.episodesList?.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 font-display text-lg font-extrabold text-ink">Daftar Episode</p>
          <div className="space-y-1.5">
            {d.episodesList.map((ep, i) => (
              <Link
                key={ep.url + i}
                href={`/komik/wt/baca/${encodeURIComponent(ep.url)}`}
                className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-2.5 text-sm shadow-card transition hover:border-accent"
              >
                <span className="font-semibold text-ink">{ep.title || `Episode ${ep.episodeNo}`}</span>
                {ep.date && <span className="text-xs text-ink-faint">{ep.date}</span>}
              </Link>
            ))}
          </div>
          <Pagination current={d.page} total={d.totalPages} basePath={`/komik/wt/${encodeURIComponent(url)}`} />
        </div>
      )}
    </div>
  );
}
