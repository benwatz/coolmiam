import { describe, expect, it, vi } from 'vitest';
import { createUpdateStore, type UpdateSource } from '../../src/pwa/updateStore';

describe('createUpdateStore', () => {
  it('ne fait rien sans service worker enregistré', async () => {
    const store = createUpdateStore();
    await store.check();
    expect(store.getState().checkedAt).toBeNull();
  });

  it('enregistre une vérification réussie', async () => {
    const store = createUpdateStore();
    const update = vi.fn().mockResolvedValue(undefined);
    store.setSource({ update });
    await store.check();
    expect(update).toHaveBeenCalledOnce();
    expect(store.getState()).toMatchObject({ checking: false, failed: false });
    expect(store.getState().checkedAt).not.toBeNull();
  });

  it('signale un échec (hors ligne) sans bloquer les vérifications suivantes', async () => {
    const store = createUpdateStore();
    const update = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    store.setSource({ update });
    await store.check();
    expect(store.getState()).toMatchObject({ checking: false, failed: true });
    await store.check();
    expect(store.getState().failed).toBe(false);
  });

  it('ignore une vérification lancée pendant une autre', async () => {
    const store = createUpdateStore();
    let release!: () => void;
    const update = vi.fn(() => new Promise<void>((r) => (release = r)));
    store.setSource({ update });
    const first = store.check();
    await store.check();
    expect(update).toHaveBeenCalledOnce();
    release();
    await first;
  });

  it("attend la fin d'installation d'une nouvelle version avant de conclure", async () => {
    const store = createUpdateStore();
    let onChange!: () => void;
    const worker = { state: 'installing', addEventListener: (_t: 'statechange', cb: () => void) => (onChange = cb) };
    const source: UpdateSource = { update: () => Promise.resolve(), installing: worker };
    store.setSource(source);
    const done = store.check();
    await Promise.resolve();
    expect(store.getState().checking).toBe(true);
    worker.state = 'installed';
    onChange();
    await done;
    expect(store.getState().checking).toBe(false);
  });

  it('notifie les abonnés quand une version est disponible', () => {
    const store = createUpdateStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.markAvailable();
    expect(store.getState().available).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    off();
    store.markAvailable();
    expect(listener).toHaveBeenCalledOnce();
  });
});
