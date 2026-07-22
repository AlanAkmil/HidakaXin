import Link from 'next/link';
import webtoons from '../../../../../lib/webtoonsScraper';
import RetryImage from '../../../../../components/RetryImage';
import HistoryRecorder from '../../../../../components/HistoryRecorder';

export const revalidate = 300;

async function getImages(url) {
  try {
    const images = await webtoons.episodeImages(url);
    return images;
  } catch {
    return null;
  }
}

export default async function WebtoonReaderPage({ params }) {
  const url = decodeURIComponent(params.slug);
  const images = await getImages(url);

  if (!images) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">Gagal memuat chapter ini.</p>
        <Link href="/komik" className="mt-4 inline-block font-semibold text-accent">← Kembali ke Komik</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-0 py-0 sm:px-4 sm:py-5">
      <HistoryRecorder item={{ url, title: 'Webtoons episode', source: 'webtoons' }} />

      <div className="sticky top-[52px] z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:rounded-xl sm:border">
        <Link href="/komik" className="flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
          Kembali
        </Link>
      </div>

      {images.length === 0 && (
        <p className="mx-4 mt-6 rounded-xl border border-line bg-white p-6 text-center text-ink-soft shadow-card">
          Gagal memuat halaman chapter ini. Sumbernya mungkin lagi bermasalah.
        </p>
      )}

      <div className="flex flex-col">
        {images.map((src, i) => (
          <RetryImage key={i} src={src} alt={`Halaman ${i + 1}`} index={i + 1} className="w-full" />
        ))}
      </div>
    </div>
  );
}
