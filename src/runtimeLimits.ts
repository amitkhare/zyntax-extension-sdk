/** Canonical UTF-8 JSON message limit for one managed-tool protocol frame. */
export const EXTENSION_MANAGED_TOOL_MAX_FRAME_BYTES = 4 * 1024 * 1024;

const EXTENSION_RPC_ENVELOPE_BYTES = 4 * 1024;

/**
 * Managed-tool payload limits reserve four KiB for the JSON-RPC envelope carried
 * inside the full protocol frame.
 */
export const EXTENSION_MANAGED_TOOL_MAX_REQUEST_BYTES =
  EXTENSION_MANAGED_TOOL_MAX_FRAME_BYTES - EXTENSION_RPC_ENVELOPE_BYTES;
export const EXTENSION_MANAGED_TOOL_MAX_RESULT_BYTES =
  EXTENSION_MANAGED_TOOL_MAX_FRAME_BYTES - EXTENSION_RPC_ENVELOPE_BYTES;

/** Maximum diagnostics returned by one pull provider or one publish request. */
export const EXTENSION_DIAGNOSTICS_MAX_ITEMS = 16_384;
export const EXTENSION_DIAGNOSTICS_MAX_BYTES =
  EXTENSION_MANAGED_TOOL_MAX_FRAME_BYTES - EXTENSION_RPC_ENVELOPE_BYTES;

/** Aggregate diagnostics budget for one document across selected providers. */
export const EXTENSION_DIAGNOSTICS_MAX_TOTAL_ITEMS = 65_536;
export const EXTENSION_DIAGNOSTICS_MAX_TOTAL_BYTES = 16 * 1024 * 1024;

/** Maximum task descriptors returned by one task provider invocation. */
export const EXTENSION_TASK_PROVIDER_MAX_ITEMS = 4_096;

/** Canonical UTF-8 budgets for one text-preview request and validated result. */
export const EXTENSION_PREVIEW_MAX_INPUT_BYTES = 10 * 1024 * 1024;
/** Maximum decoded source bytes for one binary preview document. */
export const EXTENSION_PREVIEW_MAX_BINARY_INPUT_BYTES = 24 * 1024 * 1024;
export const EXTENSION_PREVIEW_MAX_RESULT_BYTES = 16 * 1024 * 1024;

/** Structural payload limits reserve room for host protocol envelopes. */
export const EXTENSION_JSON_MAX_DEPTH = 60;
export const EXTENSION_JSON_MAX_NODES = 1_000_000 - 16;
export const EXTENSION_JSON_MAX_KEY_CODE_UNITS = 256;

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (
      code >= 0xd800
      && code <= 0xdbff
      && index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00
      && value.charCodeAt(index + 1) <= 0xdfff
    ) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function jsonStringByteLength(value: string): number {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      if (
        index + 1 >= value.length
        || value.charCodeAt(index + 1) < 0xdc00
        || value.charCodeAt(index + 1) > 0xdfff
      ) {
        throw new TypeError("Extension JSON string contains invalid Unicode.");
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError("Extension JSON string contains invalid Unicode.");
    }
  }
  return utf8ByteLength(JSON.stringify(value));
}

/** Returns the exact UTF-8 byte length of a valid extension JSON value. */
export function extensionJsonUtf8ByteLength(value: unknown): number {
  type Task =
    | {
        readonly kind: "value";
        readonly value: unknown;
        readonly containerDepth: number;
      }
    | { readonly kind: "leave"; readonly value: object };

  let bytes = 0;
  let nodes = 0;
  const active = new Set<object>();
  const tasks: Task[] = [{ kind: "value", value, containerDepth: 0 }];
  while (tasks.length) {
    const task = tasks.pop()!;
    if (task.kind === "leave") {
      active.delete(task.value);
      continue;
    }

    nodes += 1;
    if (nodes > EXTENSION_JSON_MAX_NODES) {
      throw new RangeError("Extension JSON value exceeds its structural limit.");
    }
    const candidate = task.value;
    if (candidate === null) {
      bytes += 4;
      continue;
    }
    if (typeof candidate === "string") {
      bytes += jsonStringByteLength(candidate);
      continue;
    }
    if (typeof candidate === "boolean") {
      bytes += candidate ? 4 : 5;
      continue;
    }
    if (typeof candidate === "number") {
      if (!Number.isFinite(candidate)) {
        throw new TypeError("Extension JSON value is not serializable.");
      }
      bytes += String(candidate).length;
      continue;
    }
    if (!candidate || typeof candidate !== "object") {
      throw new TypeError("Extension JSON value is not serializable.");
    }
    if (active.has(candidate)) {
      throw new TypeError("Extension JSON value is not serializable.");
    }
    const containerDepth = task.containerDepth + 1;
    if (containerDepth > EXTENSION_JSON_MAX_DEPTH) {
      throw new RangeError("Extension JSON value exceeds its structural limit.");
    }
    active.add(candidate);
    tasks.push({ kind: "leave", value: candidate });

    if (Array.isArray(candidate)) {
      bytes += 2;
      if (candidate.length > 1) bytes += candidate.length - 1;
      for (let index = candidate.length - 1; index >= 0; index -= 1) {
        if (!Object.prototype.hasOwnProperty.call(candidate, index)) {
          throw new TypeError("Extension JSON value is not serializable.");
        }
        tasks.push({
          kind: "value",
          value: candidate[index],
          containerDepth,
        });
      }
      continue;
    }

    const prototype = Object.getPrototypeOf(candidate);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Extension JSON value is not serializable.");
    }
    const keys = Object.keys(candidate);
    bytes += 2;
    if (keys.length > 1) bytes += keys.length - 1;
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index]!;
      if (key.length > EXTENSION_JSON_MAX_KEY_CODE_UNITS) {
        throw new RangeError("Extension JSON object key exceeds its length limit.");
      }
      bytes += jsonStringByteLength(key) + 1;
      tasks.push({
        kind: "value",
        value: (candidate as Readonly<Record<string, unknown>>)[key],
        containerDepth,
      });
    }
  }
  return bytes;
}
