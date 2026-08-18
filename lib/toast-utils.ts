/**
 * Deduped toast utility — prevents rapid-fire repeat toasts from spamming the UI.
 * If a toast with the same key fires within the dedup window, the existing toast
 * is updated (with a ×N count) rather than replaced.
 *
 * Usage:
 *   dedupedToast('gold-harvest', { title: '💰 Gold Collected', description: '+50 Gold' })
 */

import { toast } from '@/components/ui/use-toast';

interface DedupedToastOptions {
  title: string;
  description?: string;
  /** How long in ms to batch repeated calls under the same key. Default: 1500ms */
  windowMs?: number;
}

interface ToastEntry {
  id: string;
  count: number;
  title: string;
  baseDescription: string;
  windowMs: number;
  timer: ReturnType<typeof setTimeout>;
  updateFn: (opts: { id: string; title: string; description: string }) => void;
  dismiss: () => void;
}

const activeToasts = new Map<string, ToastEntry>();

export function dedupedToast(key: string, opts: DedupedToastOptions): void {
  const { title, description = '', windowMs = 1500 } = opts;

  const existing = activeToasts.get(key);

  if (existing) {
    // Increment count and update the existing toast
    existing.count += 1;
    clearTimeout(existing.timer);

    const newDescription =
      existing.count > 1
        ? `${existing.baseDescription} (×${existing.count})`
        : existing.baseDescription;

    existing.updateFn({ id: existing.id, title: existing.title, description: newDescription });

    existing.timer = setTimeout(() => {
      existing.dismiss();
      activeToasts.delete(key);
    }, windowMs);

    return;
  }

  // First occurrence — show a new toast
  const { id, update, dismiss } = toast({ title, description });

  const entry: ToastEntry = {
    id,
    count: 1,
    title,
    baseDescription: description,
    windowMs,
    updateFn: update as (opts: { id: string; title: string; description: string }) => void,
    dismiss,
    timer: setTimeout(() => {
      activeToasts.delete(key);
    }, windowMs),
  };

  activeToasts.set(key, entry);
}