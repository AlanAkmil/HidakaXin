'use client';

import { useState } from 'react';

export default function NativeVideoPlayer({ formats = {} }) {
  const entries = Object.entries(formats);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState('video'); // 'video' | 'iframe' | 'failed'
  const active = entries[activeIndex];

  if (!entries.length) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-line bg-black text-sm text-white/50">
        Sumber video tidak tersedia untuk episode ini.
      </div>
    );
  }

  const rawUrl = active[1];
  const proxiedSrc = `/api/watch-jp/proxy?url=${encodeURIComponent(rawUrl)}`;

  function handleVideoError() {
    // The URL might actually be an embed page rather than a raw video file
    // — try rendering it as an iframe instead before giving up.
    setMode('iframe');
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-line bg-black shadow-card">
        <div className="aspect-video">
          {mode === 'video' && (
            <video
              key={rawUrl}
              controls
              autoPlay={false}
              className="h-full w-full"
              src={proxiedSrc}
              onError={handleVideoError}
            />
          )}
          {mode === 'iframe' && (
            <iframe
              key={rawUrl + '-iframe'}
              src={rawUrl}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="no-referrer"
              className="h-full w-full"
              onError={() => setMode('failed')}
            />
          )}
          {mode === 'failed' && (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/60">
              Video tidak bisa dimuat. Coba pilih kualitas lain di bawah, atau server sumbernya lagi bermasalah.
            </div>
          )}
        </div>
      </div>
      {entries.length > 1 && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-faint">Kualitas</p>
          <div className="flex flex-wrap gap-2">
            {entries.map(([label], i) => (
              <button
                key={label}
                onClick={() => {
                  setActiveIndex(i);
                  setMode('video');
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  i === activeIndex ? 'border-accent bg-accent-50 text-accent' : 'border-line bg-white text-ink-soft hover:border-accent hover:text-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
