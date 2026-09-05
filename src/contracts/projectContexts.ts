import type { ExtensionCancellationToken } from "../contract.js";

/** null explicitly selects the explorer workspace; a string names an owned selected project. */
export type ExtensionProjectScope = string | null;

export interface ExtensionProjectContext {
  /** Immutable location identity, never rebound when a saved selection key changes. */
  readonly id: string;
  readonly uri: string;
  readonly label: string;
}

export interface ExtensionLocationSelection {
  /** Selection identity, persisted locally per extension and explorer workspace. */
  readonly key: string;
  readonly title: string;
  /** Picker input only. ~/ uses the terminal home; project picking is explorer-relative. */
  readonly initialPath?: string;
}

/** Selecting a project never changes the explorer root or silently trusts a new location. */
export interface ExtensionProjectsApi {
  select(
    request: ExtensionLocationSelection,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionProjectContext | null>;
  get(key: string, cancellation: ExtensionCancellationToken): Promise<ExtensionProjectContext | null>;
  /** Replaces the list of declared integrations allowed to use this selected context.
   * Host review is required; grants cover project services, never selected files or secrets.
   * Related providers receive the explicit scope in their activation/request context.
   */
  bindIntegrations(
    request: { readonly project: string; readonly extensions: readonly string[] },
    cancellation: ExtensionCancellationToken,
  ): Promise<void>;
  /** Forgets the selection and its bindings. Running tasks keep their launch context until exit. */
  forget(key: string): Promise<void>;
}

export interface ExtensionSelectedFile {
  /** Immutable location identity. Replacing a saved selection produces a new reference. */
  readonly id: string;
  readonly kind: "file" | "directory";
  readonly label: string;
}

export interface ExtensionFileSelection extends ExtensionLocationSelection {
  /** Relative picker input resolves from this project, not from the explorer root. */
  readonly project: ExtensionProjectScope;
  readonly kind: "file" | "directory";
}

export interface ExtensionFilesApi {
  /** Explicit user selection may leave the project; ordinary relative file requests may not. */
  select(
    request: ExtensionFileSelection,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionSelectedFile | null>;
  get(key: string, cancellation: ExtensionCancellationToken): Promise<ExtensionSelectedFile | null>;
  forget(key: string): Promise<void>;
  /** Exports a project artifact to a user-chosen destination without moving its source. */
  export(
    request: { readonly project: ExtensionProjectScope; readonly uri: string },
    cancellation: ExtensionCancellationToken,
  ): Promise<{ readonly exported: boolean }>;
}

export interface ExtensionWorkspaceDocumentRequest {
  readonly project: ExtensionProjectScope;
  readonly uri: string;
}
