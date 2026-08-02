/**
 * Local listening position — CONTENTS.md §14.
 * v1 keeps no account state; this is device-local only, and when nothing is
 * stored the「続きから聴く」CTA simply does not render.
 */

const KEY = 'zenkyoku:last-track';

type Store = Record<string, number>;

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    // Private mode, disabled storage, corrupt JSON — all degrade to "no history".
    return {};
  }
}

export function getLastTrack(albumId: string): number | null {
  const value = read()[albumId];
  return typeof value === 'number' ? value : null;
}

export function setLastTrack(albumId: string, trackNumber: number): void {
  try {
    const store = read();
    store[albumId] = trackNumber;
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storing progress is a convenience; failing to store must never break navigation.
  }
}
