'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFavorites, getHistory, getProfile, setProfileName } from '../../lib/store';

const MENU = [
  { href: '/favorit', label: 'Favorit', icon: 'star' },
  { href: '/riwayat', label: 'Riwayat', icon: 'clock' },
  { href: '/chat', label: 'Chat', icon: 'chat' },
  { href: '/jadwal', label: 'Jadwal', icon: 'calendar' }
];

const ICONS = {
  star: <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  chat: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>
};

export default function ProfilePage() {
  const [name, setName] = useState('Penonton');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [favCount, setFavCount] = useState(0);
  const [histCount, setHistCount] = useState(0);

  useEffect(() => {
    const p = getProfile();
    setName(p.name);
    setDraft(p.name);
    setFavCount(getFavorites().length);
    setHistCount(getHistory().length);
  }, []);

  function saveName() {
    const trimmed = draft.trim() || 'Penonton';
    setProfileName(trimmed);
    setName(trimmed);
    setEditing(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-accent to-[#ff8a5c] p-6 text-white shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-black">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white placeholder:text-white/60 outline-none"
                  placeholder="Nama kamu"
                  autoFocus
                />
                <button onClick={saveName} className="flex-shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-accent">
                  Simpan
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="text-left">
                <p className="truncate font-display text-xl font-extrabold">{name}</p>
                <p className="text-xs text-white/80">Ketuk untuk ganti nama</p>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-6 text-sm">
          <div>
            <p className="font-display text-lg font-extrabold">{favCount}</p>
            <p className="text-xs text-white/80">Favorit</p>
          </div>
          <div>
            <p className="font-display text-lg font-extrabold">{histCount}</p>
            <p className="text-xs text-white/80">Riwayat</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white py-4 shadow-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff5a36" strokeWidth="2">
              {ICONS[m.icon]}
            </svg>
            <span className="text-[11px] font-bold text-ink-soft">{m.label}</span>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        Data profil, favorit, dan riwayat tersimpan lokal di HP ini — belum ada akun/login.
      </p>
    </div>
  );
}
