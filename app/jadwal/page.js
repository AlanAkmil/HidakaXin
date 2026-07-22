import Link from 'next/link';
import JadwalCard from '../../components/JadwalCard';
import scraper from '../../lib/scraper';
import animeScraper from '../../lib/animeScraper';
import anichin from '../../lib/anichinScraper';
import { getDonghuaSource } from '../../lib/donghuaSource';
import { normalizeDonghua, normalizeAnichin, normalizeAnime, shuffleTogether, findScheduleKeyForDay, DAY_NAMES_ID } from '../../lib/normalize';

export const revalidate = 600;

const DAY_KEYS = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const DAY_SHORT = { Minggu: 'MIN', Senin: 'SEN', Selasa: 'SEL', Rabu: 'RAB', Kamis: 'KAM', Jumat: 'JUM', Sabtu: 'SAB' };

async function getSchedules() {
  const source = getDonghuaSource();
  const [donghuaPayload, animePayload] = await Promise.all([
    source === 'anichin' ? anichin.schedule().catch(() => null) : scraper.release().then((r) => r?.data?.schedule).catch(() => null),
    animeScraper.ongoing().catch(() => null)
  ]);

  const donghuaRaw = donghuaPayload || {};
  const normalizer = source === 'anichin' ? normalizeAnichin : normalizeDonghua;
  const donghua = {};
  for (const [day, items] of Object.entries(donghuaRaw)) {
    donghua[day] = (items || []).map(normalizer);
  }

  return { donghua, anime: animePayload?.data?.schedule || {}, source };
}

export default async function JadwalPage({ searchParams }) {
  const { donghua, anime } = await getSchedules();

  const todayIndex = new Date().getDay();
  const activeDay = searchParams?.hari || DAY_NAMES_ID[todayIndex];
  const activeIdx = DAY_NAMES_ID.indexOf(activeDay);
  const dayIdx = activeIdx >= 0 ? activeIdx : todayIndex;

  const animeList = (anime[DAY_KEYS[dayIdx]] || []).map(normalizeAnime);

  const donghuaKeys = Object.keys(donghua);
  const donghuaMatch = findScheduleKeyForDay(donghuaKeys, dayIdx);
  const donghuaList = donghuaMatch ? donghua[donghuaMatch] : [];

  const list = shuffleTogether(donghuaList, animeList);
  const hasAnySchedule = Object.keys(anime).length > 0 || donghuaKeys.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">Jadwal Rilis</h1>

      <div className="hide-scrollbar mb-5 flex gap-5 overflow-x-auto border-b border-line pb-2">
        {DAY_NAMES_ID.map((day) => {
          const active = day === activeDay;
          return (
            <Link
              key={day}
              href={`/jadwal?hari=${encodeURIComponent(day)}`}
              className={`relative flex-shrink-0 pb-2 text-sm font-bold tracking-wide ${active ? 'text-accent' : 'text-ink-faint'}`}
            >
              {DAY_SHORT[day]}
              {active && <span className="absolute -bottom-[9px] left-0 right-0 h-0.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </div>

      {!hasAnySchedule && (
        <p className="rounded-xl border border-line bg-white p-6 text-center text-ink-soft shadow-card">
          Gagal memuat jadwal rilis.
        </p>
      )}

      {list.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {list.map((item, i) => (
            <JadwalCard key={item.url + i} item={item} />
          ))}
        </div>
      ) : (
        hasAnySchedule && (
          <p className="rounded-xl border border-line bg-white p-6 text-center text-ink-soft shadow-card">
            Tidak ada jadwal untuk hari ini.
          </p>
        )
      )}
    </div>
  );
}
