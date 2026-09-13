import type { ExtensionJsonObject } from './contract.js';
import { utf8ByteLength } from './utf8.js';

// The native worker provides standard JavaScript timers; no browser or Node type dependency.
declare function setTimeout(callback: () => void, milliseconds: number): unknown;
declare function clearTimeout(timer: unknown): void;

export interface RuntimeCredentialValue {
  readonly value: string | null;
  readonly revision: string | null;
}
export interface RuntimeCredentialClient {
  get(key: string): Promise<RuntimeCredentialValue>;
  set(key: string, value: string, revision: string | null): Promise<{ readonly revision: string }>;
  delete(key: string, revision: string | null): Promise<void>;
  list(): Promise<readonly string[]>;
  /** Resolves an owned secrets.request reference directly in native code, never provider RPC. */
  resolve(reference: string, options?: { readonly consume?: boolean }): Promise<string>;
  /** Call first in the worker's framed stdin dispatcher; true means consumed control traffic. */
  accept(message: ExtensionJsonObject): boolean;
  /** Call at worker shutdown; all outstanding operations reject. */
  dispose(): void;
}

/** Native-worker helper only. send writes Content-Length framed JSON to worker stdout.
 * Never connect this client to a WebView, provider host API, logger or persisted transcript.
 * No Node imports are needed: the worker supplies its existing framed transport.
 */
export function createRuntimeCredentialClient(options: {
  readonly send: (message: ExtensionJsonObject) => void | Promise<void>;
}): RuntimeCredentialClient {
  const pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  let sequence = 0, closed = false;
  const invalid = () => new TypeError('Runtime credential request is invalid.');
  function key(value: string): void {
    if (typeof value !== 'string' || !value.length || value.length > 128 || /[\u0000-\u001f\u007f-\u009f]/u.test(value)) throw invalid();
  }
  function revision(value: string | null): void {
    if (value !== null && (typeof value !== 'string' || !/^[A-Za-z0-9-]{1,64}$/u.test(value))) throw invalid();
  }
  function request(method: string, fields: ExtensionJsonObject = {}): Promise<unknown> {
    if (closed) return Promise.reject(new Error('Runtime credential client is closed.'));
    if (pending.size >= 32 || sequence >= Number.MAX_SAFE_INTEGER) return Promise.reject(new Error('Runtime credential request limit reached.'));
    const id = String(++sequence);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('Runtime credential request timed out.')); }, 30_000);
      pending.set(id, { resolve, reject, timer });
      Promise.resolve().then(() => pending.has(id) ? options.send({ $zyntax: 'credentials', id, method, ...fields }) : undefined).catch(() => {
        const operation = pending.get(id);
        if (!operation) return;
        pending.delete(id); clearTimeout(timer); operation.reject(new Error('Runtime credential transport failed.'));
      });
    });
  }
  function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Runtime credential response is invalid.');
    return value as Record<string, unknown>;
  }
  return {
    async get(name) {
      key(name); const value = object(await request('get', { key: name }));
      if (value.value !== null && typeof value.value !== 'string') throw new Error('Runtime credential response is invalid.');
      revision(value.revision as string | null);
      return { value: value.value as string | null, revision: value.revision as string | null };
    },
    async set(name, value, expected) {
      key(name); revision(expected);
      if (typeof value !== 'string' || utf8ByteLength(value) > 32 * 1024) throw invalid();
      const result = object(await request('set', { key: name, value, revision: expected }));
      if (typeof result.revision !== 'string') throw new Error('Runtime credential response is invalid.');
      revision(result.revision); return { revision: result.revision };
    },
    async delete(name, expected) { key(name); revision(expected); await request('delete', { key: name, revision: expected }); },
    async list() {
      const value = await request('list');
      if (!Array.isArray(value) || value.length > 128 || value.some(item => typeof item !== 'string')) throw new Error('Runtime credential response is invalid.');
      value.forEach(key); return value;
    },
    async resolve(reference, resolveOptions = {}) {
      if (typeof reference !== 'string' || !reference.length || reference.length > 192) throw invalid();
      const value = await request('resolve', { reference, consume: resolveOptions.consume ?? false });
      if (typeof value !== 'string') throw new Error('Runtime credential response is invalid.');
      return value;
    },
    accept(message) {
      if (!Object.hasOwn(message, '$zyntax')) return false;
      if (message.$zyntax !== 'credentials' || typeof message.id !== 'string') throw new Error('Runtime native control response is invalid.');
      const operation = pending.get(message.id);
      if (!operation) return true; // Timed-out replies remain private and never reach ordinary dispatch.
      pending.delete(message.id); clearTimeout(operation.timer);
      if (message.ok === true && Object.hasOwn(message, 'result')) operation.resolve(message.result);
      else {
        const code = ['invalid', 'conflict', 'unavailable'].includes(String(message.error)) ? String(message.error) : 'invalid';
        operation.reject(new Error(`Runtime credential operation ${code}.`));
      }
      return true;
    },
    dispose() {
      closed = true;
      for (const operation of pending.values()) { clearTimeout(operation.timer); operation.reject(new Error('Runtime credential client is closed.')); }
      pending.clear();
    },
  };
}
