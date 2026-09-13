import { afterEach, expect, it, vi } from 'vitest';
import { createRuntimeCredentialClient } from '../src/runtimeCredentials.js';
import type { ExtensionJsonObject } from '../src/contract.js';

afterEach(() => vi.useRealTimers());
function setup() {
  const messages: ExtensionJsonObject[] = [];
  const client = createRuntimeCredentialClient({ send: message => { messages.push(message); } });
  async function respond(result: unknown) {
    await Promise.resolve();
    client.accept({ $zyntax: 'credentials', id: messages.at(-1)!.id!, ok: true, result } as ExtensionJsonObject);
  }
  return { client, messages, respond };
}
it('uses private framed messages with explicit revision compare-and-swap and one-time references', async () => {
  const h = setup();
  const read = h.client.get('provider'); await h.respond({ value: null, revision: null });
  await expect(read).resolves.toEqual({ value: null, revision: null });
  const write = h.client.set('provider', 'SECRET', null); await h.respond({ revision: 'revision-1' });
  await expect(write).resolves.toEqual({ revision: 'revision-1' });
  expect(h.messages.at(-1)).toMatchObject({ method: 'set', key: 'provider', value: 'SECRET', revision: null });
  const resolve = h.client.resolve('ref', { consume: true }); await h.respond('private-input');
  await expect(resolve).resolves.toBe('private-input');
  expect(h.messages.at(-1)).toMatchObject({ method: 'resolve', reference: 'ref', consume: true });
  const list = h.client.list(); await h.respond(['provider']); await expect(list).resolves.toEqual(['provider']);
  const remove = h.client.delete('provider', 'revision-1'); await h.respond(null); await expect(remove).resolves.toBeUndefined();
  expect(h.client.accept({ event: 'normal' })).toBe(false);
  h.client.dispose();
});
it('keeps conflicts explicit and consumes timed-out private responses without leaking to ordinary dispatch', async () => {
  vi.useFakeTimers(); const h = setup();
  const write = h.client.set('provider', 'SECRET', null); await Promise.resolve();
  const rejected = expect(write).rejects.toThrow('conflict');
  h.client.accept({ $zyntax: 'credentials', id: h.messages[0]!.id!, ok: false, error: 'conflict' });
  await rejected;
  const read = h.client.get('provider'), timedOut = expect(read).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(30_000); await timedOut;
  expect(h.client.accept({ $zyntax: 'credentials', id: h.messages.at(-1)!.id!, ok: true, result: 'PRIVATE' })).toBe(true);
  h.client.dispose();
});
it('bounds requests and rejects pending operations on disposal', async () => {
  const h = setup();
  await expect(h.client.set('provider', 'x'.repeat(32 * 1024 + 1), null)).rejects.toThrow('invalid');
  await expect(h.client.get('bad\nkey')).rejects.toThrow('invalid');
  const pending = h.client.get('provider'), rejected = expect(pending).rejects.toThrow('closed');
  h.client.dispose(); await rejected;
});
