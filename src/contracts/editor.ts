import type { ExtensionCancellationToken } from "../contract.js";
import type { ExtensionProjectScope } from "./projectContexts.js";

export interface ExtensionEditorContext {
  readonly project: ExtensionProjectScope;
  readonly projectUri: string | null;
  readonly documentUri: string | null;
  readonly languageId: string | null;
  readonly modifiedSources: readonly string[];
}

export interface ExtensionEditorSourceLocation {
  /** Canonical project-confined document URI, at most 4096 characters. */
  readonly uri: string;
  /** One-based integer from 1 through 2147483647; zero-based offsets are not accepted. */
  readonly line: number;
  /** One-based integer from 1 through 2147483647. */
  readonly column?: number;
}

/** Data-only owner-scoped annotation; no debugger-specific meaning or persistence. */
export interface ExtensionEditorMarker extends ExtensionEditorSourceLocation {
  /** Nonempty owner-group-unique identifier, at most 192 characters; no control characters. */
  readonly id: string;
  readonly icon: "circle" | "arrow";
  readonly filled?: boolean;
  readonly tone: "accent" | "danger" | "muted";
  /** Nonempty accessible label, at most 256 characters; no control characters. */
  readonly label: string;
  readonly highlight?: boolean;
}

export type ExtensionEditorEvent =
  | { readonly kind: "context" }
  | { readonly kind: "click"; readonly group: string; readonly uri: string; readonly line: number }
  | { readonly kind: "markers"; readonly group: string; readonly markers: readonly ExtensionEditorMarker[] };

export interface ExtensionEditorUpdate {
  /** Monotonic safe nonnegative integer, not a timestamp. */
  readonly cursor: number;
  readonly events: readonly ExtensionEditorEvent[];
}

/** Shared native editor integration; a scope other than the current Explorer root is rejected. */
export interface ExtensionEditorApi {
  context(request: { readonly project: ExtensionProjectScope }, cancellation: ExtensionCancellationToken): Promise<ExtensionEditorContext>;
  /**
   * Replace this owner's marker group. An empty array clears it. The host confines URIs,
   * validates source coordinates and maps marker positions through edits. One call accepts
   * at most 512 markers. Group names are nonempty, control-free and at most 96 characters.
   * Shared annotation count/group/encoded-byte limits may reject otherwise valid calls
   * explicitly; callers must not assume other extensions leave that capacity available.
   * Interactive groups receive gutter clicks, including lines without an existing marker.
   * Extension code owns annotation meaning and storage; groups disappear on owner disposal.
   */
  replaceMarkers(
    request: { readonly project: ExtensionProjectScope; readonly group: string; readonly markers: readonly ExtensionEditorMarker[]; readonly interactive: boolean },
    cancellation: ExtensionCancellationToken,
  ): Promise<void>;
  /**
   * Wait for context, owned gutter interactions or mapped marker changes. Zero begins
   * observation/resynchronization with current context and group snapshots. Negative,
   * unsafe, future or expired nonzero cursors are rejected explicitly. Context and
   * marker snapshots may coalesce; clicks are ordered and never silently dropped.
   * Event-queue overflow reports that resynchronization is required.
   * Cancelling the wait does not clear markers or stop extension-owned work.
   */
  observe(project: ExtensionProjectScope, cursor: number, cancellation: ExtensionCancellationToken): Promise<ExtensionEditorUpdate>;
  reveal(request: ExtensionEditorSourceLocation & { readonly project: ExtensionProjectScope }, cancellation: ExtensionCancellationToken): Promise<void>;
  /** Resolve a native adapter path as data only; outside-root/symlink paths grant no access. */
  resolvePath(
    request: { readonly project: ExtensionProjectScope; readonly path: string; readonly kind: "file" | "executable" },
    cancellation: ExtensionCancellationToken,
  ): Promise<{ readonly uri: string } | null>;
  /** Flush unsaved editors in this project before launching tools; failures remain explicit. */
  save(request: { readonly project: ExtensionProjectScope }, cancellation: ExtensionCancellationToken): Promise<void>;
}
