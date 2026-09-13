import type {
  ExtensionCancellationToken,
  ExtensionDebugConfiguration,
} from "../contract.js";
import type { ExtensionProjectScope } from "./projectContexts.js";

export interface ExtensionDebugAvailability {
  readonly providerId: string;
  readonly label: string;
  readonly debugType: string;
  readonly languageId: string | null;
}

/** Editor integration uses the active Explorer project, never a silently substituted root. */
export interface ExtensionDebugWorkspaceContext {
  readonly project: ExtensionProjectScope;
  readonly projectUri: string | null;
  readonly documentUri: string | null;
  readonly languageId: string | null;
  readonly available: readonly ExtensionDebugAvailability[];
}

export interface ExtensionDebugConfigurationSelection {
  readonly project: ExtensionProjectScope;
  readonly debugType: string;
  readonly documentUri: string | null;
  readonly languageId: string | null;
}

/** Opaque owner-scoped identity; provider binding and activation identity remain host-private. */
export interface ExtensionDebugLaunch {
  readonly id: string;
  readonly configuration: ExtensionDebugConfiguration;
}

export interface ExtensionDebugPreparedProcess {
  /** Opaque single-use process ticket bound to provider, consumer and trusted project. */
  readonly ticket: string;
  /** Tagged document paths remain symbolic until sent through the managed transport. */
  readonly configuration: ExtensionDebugConfiguration;
}

/**
 * Generic consumer access to installed debugger providers. Scope must resolve to the
 * current Explorer project for shared editor integration; unrelated roots are rejected.
 * Launch IDs cannot cross owner/activation boundaries. Persisted declared-path selections
 * remain data and are revalidated against the current trusted project on every preparation.
 * This broker never implements DAP sessions or inspection state; the extension does.
 */
export interface ExtensionDebugApi {
  context(
    request: { readonly project: ExtensionProjectScope },
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionDebugWorkspaceContext>;
  configurations(
    request: ExtensionDebugConfigurationSelection,
    cancellation: ExtensionCancellationToken,
  ): Promise<readonly ExtensionDebugLaunch[]>;
  /** Bind an extension-stored configuration to the currently selected provider. */
  bindConfiguration(
    request: ExtensionDebugConfigurationSelection & { readonly configuration: ExtensionDebugConfiguration },
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionDebugLaunch>;
  /** User selects/reviews a declared $projectPath slot. Cancellation returns null. */
  selectPath(
    request: { readonly project: ExtensionProjectScope; readonly launch: string; readonly pathId: string },
    cancellation: ExtensionCancellationToken,
  ): Promise<string | null>;
  /**
   * Resolve the exact provider's configuration/descriptor once, after project trust checks.
   * projectPaths may reuse canonical URI selections persisted by the consumer for this
   * project's declared $projectPath slots. Every selection is revalidated for its declared
   * kind and project confinement with no-follow checks; undeclared selections are rejected.
   * Reusing a valid selection does not require a new picker or per-launch confirmation.
   */
  prepare(
    request: { readonly project: ExtensionProjectScope; readonly launch: string; readonly projectPaths: Readonly<Record<string, string>> },
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionDebugPreparedProcess>;
}
