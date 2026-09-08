/** Shared declarative file-opening rules, also emitted for native host validation. */
export const FILE_OPENER_RULES = Object.freeze({
  maxSelectors: 32,
  maxPermissions: 16,
  extensionPattern: "^(?=.{2,64}$)\\.[a-z0-9][a-z0-9+_-]{0,15}(?:\\.[a-z0-9][a-z0-9+_-]{0,15})*$",
  filenamePattern: "^[^\\u0000-\\u001f\\u007f-\\u009f/\\\\:*?\"<>|]{1,128}$",
  mimeTypePattern: "^[a-z0-9][a-z0-9!#$&^_.+-]{0,63}/[a-z0-9][a-z0-9!#$&^_.+-]{0,127}$",
  permissionPattern: "^(?=.{1,128}$)[A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)+$",
});

export interface FileOpenerOptions {
  /** Lowercase literal suffixes, including compound extensions such as .tar.gz. */
  readonly extensions: readonly string[];
  /** Literal basenames, matched case-insensitively; no globs or directory paths. */
  readonly filenames: readonly string[];
  /** Exact MIME type sent to the operating system, never an arbitrary intent or URL. */
  readonly mimeType: string;
  /** Required platform manifest permissions; the extension cannot add or grant them. */
  readonly requiredPermissions: readonly string[];
}

/** Parses operation fields; the Workbench parser owns base fields and rejects unknown keys. */
export function parseFileOpenerOptions(value: unknown): FileOpenerOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("File opener must be an object");
  }
  const source = value as Record<string, unknown>;
  function list(key: string, pattern: string, limit: number, caseInsensitive = false): readonly string[] {
    const items = source[key];
    const matcher = new RegExp(pattern, "u");
    if (!Array.isArray(items) || items.length > limit) throw new TypeError(`Invalid file opener ${key}`);
    const seen = new Set<string>();
    for (const item of items) {
      if (typeof item !== "string" || !matcher.test(item) || item.trim() !== item || item === "." || item === "..") {
        throw new TypeError(`Invalid file opener ${key}`);
      }
      const identity = caseInsensitive ? item.toLowerCase() : item;
      if (seen.has(identity)) throw new TypeError(`Duplicate file opener ${key}`);
      seen.add(identity);
    }
    return Object.freeze([...items]);
  }
  const extensions = list("extensions", FILE_OPENER_RULES.extensionPattern, FILE_OPENER_RULES.maxSelectors);
  const filenames = list("filenames", FILE_OPENER_RULES.filenamePattern, FILE_OPENER_RULES.maxSelectors, true);
  if (!extensions.length && !filenames.length) throw new TypeError("File opener requires a file association");
  if (typeof source.mimeType !== "string" || source.mimeType.trim() !== source.mimeType
      || !new RegExp(FILE_OPENER_RULES.mimeTypePattern, "u").test(source.mimeType)) {
    throw new TypeError("File opener requires an exact MIME type");
  }
  return Object.freeze({
    extensions,
    filenames,
    mimeType: source.mimeType,
    requiredPermissions: list("requiredPermissions", FILE_OPENER_RULES.permissionPattern, FILE_OPENER_RULES.maxPermissions),
  });
}

/** Matching is metadata-only; the host separately validates file access and action availability. */
export function matchesFileOpener(opener: FileOpenerOptions, filename: string): boolean {
  const name = filename.toLowerCase();
  return opener.extensions.some(extension => name.endsWith(extension))
    || opener.filenames.some(candidate => candidate.toLowerCase() === name);
}
