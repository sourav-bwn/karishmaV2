// Explicit user-managed memory. No automatic extraction or cloud sync.
export interface MemoryNote { id: string; category: string; text: string; }
const KEY = 'karishma_mvp_memory_notes';
export function readNotes(): MemoryNote[] {
  try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value.filter(n => typeof n.id === 'string' && typeof n.category === 'string' && typeof n.text === 'string').slice(0, 30) : []; } catch { return []; }
}
export function writeNotes(notes: MemoryNote[]): void { if (notes.length > 30 || notes.some(n => !n.text.trim() || n.text.length > 500)) throw new Error('Up to 30 notes, each 1 to 500 characters.'); localStorage.setItem(KEY, JSON.stringify(notes)); }
export function memoryForChat(): string[] { if (localStorage.getItem('karishma_memory_enabled') === 'off') return []; return readNotes().map(n => `${n.category}: ${n.text}`); }
