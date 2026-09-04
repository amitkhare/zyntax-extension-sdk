import type {
  EXTENSION_API_VERSION,
  ExtensionActivationEvent,
  ExtensionManifest,
  ExtensionManagedToolArgument,
  ExtensionPermission,
  ExtensionProviderKind,
} from "./contracts/manifest.js";
import type {
  ExtensionJsonObject,
  ExtensionJsonValue,
} from "./contracts/json.js";
import type {
  ExtensionPersistentServiceLogSlice,
  ExtensionPersistentServiceStatus,
} from "./contracts/persistentServices.js";
import type {
  ExtensionTerminalPackageIntent,
  ExtensionTerminalPackageStackInspection,
  ExtensionTerminalPackageTransactionReceipt,
  ExtensionTerminalPackageTransactionSnapshot,
} from "./contracts/terminalPackages.js";
import type { EXTENSION_NOTEBOOK_KERNEL_PROTOCOL } from "./notebookKernelProtocol.js";
import type {
  ExtensionRuntimeCommandConfigurationReference,
  ExtensionRuntimeCommandReference,
} from "./contracts/runtimes.js";

export type * from "./contracts/manifest.js";
export type * from "./contracts/managedTools.js";
export { EXTENSION_PROVIDER_METHODS } from "./providerMethods.js";
export type { ExtensionProviderMethod } from "./providerMethods.js";
export {
  EXTENSION_ACTIVATION_PROVIDER_KINDS,
  EXTENSION_CONTRIBUTION_FIELDS,
  EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_DESCRIPTION_LENGTH,
  EXTENSION_DEVELOPMENT_STACK_MAX_LABEL_LENGTH,
  EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS,
  EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH,
  EXTENSION_EXECUTION_MAX_ARGUMENTS,
  EXTENSION_LSP_DOCUMENT_CAPABILITIES,
  EXTENSION_LSP_EXCLUSIVE_CAPABILITIES,
  EXTENSION_LSP_POSITION_CAPABILITIES,
  EXTENSION_PERMISSIONS,
  EXTENSION_PROVIDER_KINDS,
  EXTENSION_RUNTIME_SOURCE_KINDS,
  EXTENSION_SEARCH_PROVIDER_KINDS,
  EXTENSION_TASK_CONSOLES,
  EXTENSION_TASK_EXECUTION_KINDS,
  EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_SYMBOL_LENGTH,
  EXTENSION_TERMINAL_PACKAGE_REPOSITORIES,
  isExtensionExecutionArgument,
} from "./manifestConstants.js";
export {
  AI_MODEL_CAPABILITIES,
  AI_PROVIDER_CAPABILITIES,
} from "./capabilities.js";
export type * from "./agent/capabilities.js";
export type * from "./agent/contributions.js";
export type * from "./agent/protocol.js";
export type * from "./extensionFirst.js";
export type * from "./contracts/persistentServices.js";
export type * from "./contracts/terminalPackages.js";
export * from "./contracts/runtimes.js";
export * from "./notebookKernelProtocol.js";

export interface ExtensionDisposable {
  dispose(): void | Promise<void>;
}

export interface ExtensionCancellationToken {
  readonly isCancellationRequested: boolean;
  onCancellationRequested(listener: () => void): ExtensionDisposable;
  throwIfCancellationRequested(): void;
  /**
   * Yields isolated provider execution to the host event queue before checking
   * cancellation. The returned promise rejects with the host's cancellation
   * error when cancellation was requested while queued work was serviced.
   */
  checkpoint(): Promise<void>;
}

/** Ordered push boundary used by provider methods backed by a native stream. */
export interface ExtensionStreamSink<TEvent> {
  emit(event: TEvent): void | Promise<void>;
}

export class ExtensionDisposableStore implements ExtensionDisposable {
  readonly #disposables = new Set<ExtensionDisposable>();
  #disposed = false;

  add<TDisposable extends ExtensionDisposable>(disposable: TDisposable): TDisposable {
    if (this.#disposed) {
      void disposable.dispose();
      throw new Error("The extension disposable store is disposed");
    }
    this.#disposables.add(disposable);
    return disposable;
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    const disposables = [...this.#disposables].reverse();
    this.#disposables.clear();
    const results = await Promise.allSettled(
      disposables.map((disposable) => disposable.dispose()),
    );
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failure) throw failure.reason;
  }
}

export interface ExtensionDocumentCoordinateSpace {
  readonly kind: "source" | "virtual";
  readonly id: string;
  readonly ownerId: string;
}

export interface ExtensionSourceDocumentCoordinateSpace
  extends ExtensionDocumentCoordinateSpace {
  readonly kind: "source";
}

export interface ExtensionTextDocumentSnapshot {
  readonly uri: string;
  readonly languageId: string;
  readonly content: string;
  readonly version: number;
  readonly generation: number;
  readonly coordinateSpace: ExtensionDocumentCoordinateSpace;
}

/** A host-owned source snapshot used to open one structural document session. */
export interface ExtensionSourceTextDocumentSnapshot
  extends Omit<ExtensionTextDocumentSnapshot, "coordinateSpace"> {
  readonly coordinateSpace: ExtensionSourceDocumentCoordinateSpace;
}

/** Neutral snapshot request shared by stateless document providers. */
export interface ExtensionTextDocumentRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
}

export interface ExtensionOffsetRange {
  readonly from: number;
  readonly to: number;
}

export interface ExtensionStructuralRegion {
  readonly id: string;
  readonly kind:
    | "document"
    | "fragment"
    | "element-content"
    | "attribute-value"
    | "expression";
  readonly languageId: string;
  readonly ownerId: string;
  readonly range: ExtensionOffsetRange;
  readonly parentId: string | null;
  readonly depth: number;
  readonly affinity: {
    readonly start: "inclusive" | "exclusive";
    readonly end: "inclusive" | "exclusive";
  };
}

/** One UTF-16 text edit. Every edit in a batch addresses the same base revision. */
export interface ExtensionTextDocumentChange extends ExtensionOffsetRange {
  readonly insert: string;
}

/** Opens one host-owned structural document identity with its only full-text transfer. */
export interface ExtensionStructuralDocumentOpenRequest {
  readonly documentId: string;
  readonly snapshot: ExtensionSourceTextDocumentSnapshot;
}

/** Advances an open structural document by exactly one version in the same generation. */
export interface ExtensionStructuralDocumentChangeRequest {
  readonly documentId: string;
  readonly baseVersion: number;
  readonly version: number;
  readonly generation: number;
  readonly changes: readonly ExtensionTextDocumentChange[];
}

/** Selects one exact revision of an open structural document. */
export interface ExtensionStructuralDocumentRequest {
  readonly documentId: string;
  readonly version: number;
  readonly generation: number;
}

/** How a zero-width position is associated with parser-owned regions. */
export type ExtensionStructuralPositionAssociation = "cursor" | "insertion";

export interface ExtensionStructuralRegionPositionRequest
  extends ExtensionStructuralDocumentRequest {
  readonly position: number;
  readonly association: ExtensionStructuralPositionAssociation;
}

/** Closes one structural document identity. Closing an unknown id is idempotent. */
export interface ExtensionStructuralDocumentCloseRequest {
  readonly documentId: string;
}

/** Confirms the exact open revision atomically retained by the provider. */
export interface ExtensionStructuralDocumentSynchronizationResult {
  readonly documentId: string;
  readonly version: number;
  readonly generation: number;
}

/** Confirms that the provider released one structural document identity. */
export interface ExtensionStructuralDocumentCloseResult {
  readonly documentId: string;
}

export interface ExtensionStructuralRegionDocument {
  readonly documentId: string;
  readonly sourceUri: string;
  readonly sourceVersion: number;
  readonly sourceGeneration: number;
  readonly providerId: string;
  readonly regions: readonly ExtensionStructuralRegion[];
}

/** The validated root-to-owner path for one exact document position. */
export interface ExtensionStructuralRegionPositionResult {
  readonly documentId: string;
  readonly sourceUri: string;
  readonly sourceVersion: number;
  readonly sourceGeneration: number;
  readonly providerId: string;
  readonly path: readonly ExtensionStructuralRegion[];
}

export interface ExtensionSourceMapSegment {
  readonly source: ExtensionOffsetRange;
  readonly virtual: ExtensionOffsetRange;
}

export interface ExtensionVirtualDocument {
  readonly uri: string;
  readonly languageId: string;
  readonly content: string;
  readonly version: number;
  readonly generation: number;
  readonly coordinateSpace: ExtensionTextDocumentSnapshot["coordinateSpace"];
  readonly sourceUri: string;
  readonly sourceVersion: number;
  readonly sourceGeneration: number;
  readonly regionId: string;
  readonly ownerId: string;
  readonly map: readonly ExtensionSourceMapSegment[];
}

export type ExtensionCompletionTrigger =
  | { readonly kind: "automatic" }
  | { readonly kind: "invoked" }
  | { readonly kind: "tab" }
  | { readonly kind: "triggerCharacter"; readonly character: string };

/** Immutable JSON value carried by a provider request. */
export type ExtensionProviderConfigurationValue =
  | null
  | boolean
  | number
  | string
  | ExtensionRuntimeCommandConfigurationReference
  | readonly ExtensionProviderConfigurationValue[]
  | { readonly [key: string]: ExtensionProviderConfigurationValue };

export interface ExtensionCompletionRequest extends ExtensionTextDocumentRequest {
  readonly position: number;
  readonly region: ExtensionStructuralRegion;
  readonly provider: {
    readonly id: string;
    readonly group: string;
    readonly role:
      | "authoritative"
      | "companion"
      | "supplemental"
      | "snippet"
      | "emmet";
    readonly composition: "exclusive" | "additive";
  };
  readonly configuration: Readonly<
    Record<string, ExtensionProviderConfigurationValue>
  >;
  readonly trigger: ExtensionCompletionTrigger;
}

export interface ExtensionTextEdit extends ExtensionOffsetRange {
  readonly text: string;
}

export interface ExtensionCompletionTextEdit extends ExtensionTextEdit {}

export interface ExtensionCompletionItem {
  readonly label: string;
  readonly detail?: string;
  readonly type?: string;
  readonly insertText: string;
  readonly snippet?: boolean;
  readonly sortText?: string;
  readonly replacement?: ExtensionOffsetRange;
  readonly additionalEdits?: readonly ExtensionCompletionTextEdit[];
}

export interface ExtensionCompletionResult {
  readonly generation: number;
  readonly coordinateSpaceId: string;
  readonly from: number;
  readonly to: number;
  readonly options: readonly ExtensionCompletionItem[];
}

export interface ExtensionCompletionProvider extends ExtensionDisposable {
  provideCompletions(
    request: ExtensionCompletionRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionCompletionResult | null | Promise<ExtensionCompletionResult | null>;
  dispose(): void | Promise<void>;
}

export interface ExtensionStructuralRegionProvider extends ExtensionDisposable {
  /**
   * Atomically retains the initial source text. The host serializes lifecycle
   * calls for each document id.
   */
  openDocument(
    request: ExtensionStructuralDocumentOpenRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionStructuralDocumentSynchronizationResult
    | Promise<ExtensionStructuralDocumentSynchronizationResult>;
  /**
   * Atomically applies one ordered, non-overlapping UTF-16 change batch.
   */
  applyDocumentChanges(
    request: ExtensionStructuralDocumentChangeRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionStructuralDocumentSynchronizationResult
    | Promise<ExtensionStructuralDocumentSynchronizationResult>;
  /**
   * Resolves the root-to-owner path for one position in an exact open revision.
   * Preparation must cooperatively observe cancellation and publish no partial
   * or cancelled parser state.
   */
  provideRegion(
    request: ExtensionStructuralRegionPositionRequest,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionStructuralRegionPositionResult>;
  /**
   * Resolves the complete region document for an exact open revision.
   * Preparation must cooperatively observe cancellation and publish no partial
   * or cancelled parser state.
   */
  provideRegionDocument(
    request: ExtensionStructuralDocumentRequest,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionStructuralRegionDocument>;
  /** Releases one document's retained text and parser state. Must be idempotent. */
  closeDocument(
    request: ExtensionStructuralDocumentCloseRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionStructuralDocumentCloseResult
    | Promise<ExtensionStructuralDocumentCloseResult>;
  dispose(): void | Promise<void>;
}

export interface ExtensionVirtualDocumentProvider extends ExtensionDisposable {
  provideVirtualDocuments(
    request: ExtensionTextDocumentRequest,
    cancellation: ExtensionCancellationToken,
  ): readonly ExtensionVirtualDocument[] | Promise<readonly ExtensionVirtualDocument[]>;
  dispose(): void | Promise<void>;
}

export interface ExtensionFormattingOptions {
  readonly tabSize: number;
  readonly insertSpaces: boolean;
  readonly trimTrailingWhitespace: boolean;
  readonly insertFinalNewline: boolean;
}

export interface ExtensionDocumentFormattingRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly options: ExtensionFormattingOptions;
}

export interface ExtensionRangeFormattingRequest
  extends ExtensionDocumentFormattingRequest {
  readonly range: ExtensionOffsetRange;
}

export interface ExtensionFormattingResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly edits: readonly ExtensionTextEdit[];
}

export interface ExtensionDocumentFormatterProvider extends ExtensionDisposable {
  provideDocumentFormatting(
    request: ExtensionDocumentFormattingRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionFormattingResult | Promise<ExtensionFormattingResult>;
}

export interface ExtensionRangeFormatterProvider extends ExtensionDisposable {
  provideRangeFormatting(
    request: ExtensionRangeFormattingRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionFormattingResult | Promise<ExtensionFormattingResult>;
}

export type ExtensionDiagnosticSeverity =
  | "error"
  | "warning"
  | "information"
  | "hint";

export interface ExtensionDiagnosticRelatedInformation {
  readonly uri: string;
  readonly range: ExtensionOffsetRange;
  readonly message: string;
}

export interface ExtensionDiagnostic {
  readonly id: string;
  readonly range: ExtensionOffsetRange;
  readonly severity: ExtensionDiagnosticSeverity;
  readonly message: string;
  readonly source?: string;
  readonly code?: string;
  readonly tags?: readonly ("unnecessary" | "deprecated")[];
  readonly relatedInformation?: readonly ExtensionDiagnosticRelatedInformation[];
}

export interface ExtensionDiagnosticsRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
}

export interface ExtensionDiagnosticsReport {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly resultId: string;
  readonly diagnostics: readonly ExtensionDiagnostic[];
}

export interface ExtensionDiagnosticsProvider extends ExtensionDisposable {
  provideDiagnostics(
    request: ExtensionDiagnosticsRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionDiagnosticsReport | Promise<ExtensionDiagnosticsReport>;
}

export interface ExtensionCommand {
  readonly id: string;
  readonly title: string;
  readonly arguments?: readonly ExtensionJsonValue[];
}

export interface ExtensionCommandExecutionRequest {
  readonly commandId: string;
  readonly arguments?: ExtensionJsonObject;
}

export interface ExtensionCommandProvider extends ExtensionDisposable {
  executeCommand(
    request: ExtensionCommandExecutionRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionJsonValue | Promise<ExtensionJsonValue>;
}

export interface ExtensionCodeActionRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly range: ExtensionOffsetRange;
  readonly diagnostics: readonly ExtensionDiagnostic[];
  readonly only?: readonly string[];
}

export interface ExtensionCodeAction {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly preferred: boolean;
  readonly diagnostics: readonly string[];
  readonly edit?: readonly ExtensionWorkspaceWriteEdit[];
  readonly command?: ExtensionCommand;
  readonly disabledReason?: string;
}

export interface ExtensionCodeActionProvider extends ExtensionDisposable {
  provideCodeActions(
    request: ExtensionCodeActionRequest,
    cancellation: ExtensionCancellationToken,
  ): readonly ExtensionCodeAction[] | Promise<readonly ExtensionCodeAction[]>;
}

export interface ExtensionFixAllRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly diagnostics: readonly ExtensionDiagnostic[];
  readonly kind: string;
}

export interface ExtensionFixAllResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly edits: readonly ExtensionWorkspaceWriteEdit[];
}

export interface ExtensionFixAllProvider extends ExtensionDisposable {
  provideFixAll(
    request: ExtensionFixAllRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionFixAllResult | Promise<ExtensionFixAllResult>;
}

export type ExtensionDebugConfiguration = Readonly<{
  readonly type: string;
  readonly request: "launch" | "attach";
  readonly name: string;
}> & Readonly<Record<string, ExtensionJsonValue>>;

/**
 * A filesystem path requested by a debugger without exposing native app paths
 * to the isolated provider. The host resolves the URI immediately before it
 * sends the launch or attach request to the managed debug adapter.
 */
export interface ExtensionDebugDocumentPathReference extends ExtensionJsonObject {
  readonly $documentPath: string;
}

export type ExtensionDebugProjectPathKind = "file" | "executable";

/**
 * A symbolic, host-reviewed project path. The isolated provider declares the
 * slot but never receives the selected native path. Zyntax persists the
 * canonical document URI and resolves it only in the managed DAP host.
 */
export interface ExtensionDebugProjectPathReference extends ExtensionJsonObject {
  readonly $projectPath: Readonly<{
    readonly id: string;
    readonly label: string;
    readonly kind: ExtensionDebugProjectPathKind;
  }>;
}

export interface ExtensionDebugConfigurationRequest {
  readonly projectUri: string;
  readonly documentUri: string | null;
  readonly languageId: string | null;
}

export interface ExtensionDebugConfigurationResolveRequest
  extends ExtensionDebugConfigurationRequest {
  readonly configuration: ExtensionDebugConfiguration;
}

export interface ExtensionDebugConfigurationProvider extends ExtensionDisposable {
  provideDebugConfigurations(
    request: ExtensionDebugConfigurationRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionDebugConfiguration[]
    | Promise<readonly ExtensionDebugConfiguration[]>;
  resolveDebugConfiguration(
    request: ExtensionDebugConfigurationResolveRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionDebugConfiguration | Promise<ExtensionDebugConfiguration>;
}

export interface ExtensionDebugAdapterDescriptor {
  readonly kind: "managedTool";
  readonly tool: string;
  readonly entrypoint: string;
  readonly arguments: readonly string[];
  readonly protocol: "stdio";
}

export interface ExtensionDebugAdapterDescriptorRequest {
  readonly projectUri: string;
  readonly documentUri: string | null;
  readonly configuration: ExtensionDebugConfiguration;
}

export interface ExtensionDebugAdapterDescriptorProvider
  extends ExtensionDisposable {
  provideDebugAdapterDescriptor(
    request: ExtensionDebugAdapterDescriptorRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionDebugAdapterDescriptor
    | Promise<ExtensionDebugAdapterDescriptor>;
}

export type ExtensionDebugProtocolMessage =
  | Readonly<{
      seq: number;
      type: "request";
      command: string;
      arguments?: ExtensionJsonObject;
    }>
  | Readonly<{
      seq: number;
      type: "response";
      request_seq: number;
      success: boolean;
      command: string;
      message?: string;
      body?: ExtensionJsonValue;
    }>
  | Readonly<{
      seq: number;
      type: "event";
      event: string;
      body?: ExtensionJsonValue;
    }>;

export interface ExtensionSourceBreakpoint {
  readonly id: string;
  readonly uri: string;
  readonly line: number;
  readonly column?: number;
  readonly enabled: boolean;
  readonly condition?: string;
  readonly hitCondition?: string;
  readonly logMessage?: string;
}

export interface ExtensionDebugSessionSnapshot {
  readonly id: string;
  readonly state: "starting" | "running" | "stopped" | "terminated";
  readonly configuration: ExtensionDebugConfiguration;
  readonly breakpoints: readonly ExtensionSourceBreakpoint[];
}

export type ExtensionNotebookCellKind = "code" | "markup";

export interface ExtensionNotebookOutputItem {
  readonly mime: string;
  readonly encoding: "utf8" | "base64";
  readonly data: string;
}

export interface ExtensionNotebookOutput {
  readonly id: string;
  readonly items: readonly ExtensionNotebookOutputItem[];
  readonly metadata: ExtensionJsonObject;
}

export interface ExtensionNotebookCell {
  readonly id: string;
  readonly kind: ExtensionNotebookCellKind;
  readonly languageId: string;
  readonly content: string;
  readonly outputs: readonly ExtensionNotebookOutput[];
  readonly executionOrder: number | null;
  readonly metadata: ExtensionJsonObject;
}

export interface ExtensionNotebookDocumentSnapshot {
  readonly uri: string;
  readonly notebookType: string;
  readonly version: number;
  readonly generation: number;
  readonly cells: readonly ExtensionNotebookCell[];
  readonly metadata: ExtensionJsonObject;
}

export interface ExtensionNotebookData {
  readonly encoding: "utf8" | "base64";
  readonly data: string;
}

export interface ExtensionNotebookDeserializeRequest {
  readonly uri: string;
  readonly notebookType: string;
  readonly data: ExtensionNotebookData;
}

export interface ExtensionNotebookSerializerProvider extends ExtensionDisposable {
  deserializeNotebook(
    request: ExtensionNotebookDeserializeRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionNotebookDocumentSnapshot
    | Promise<ExtensionNotebookDocumentSnapshot>;
  serializeNotebook(
    document: ExtensionNotebookDocumentSnapshot,
    cancellation: ExtensionCancellationToken,
  ): ExtensionNotebookData | Promise<ExtensionNotebookData>;
}

export interface ExtensionNotebookKernelCellInput {
  readonly cellId: string;
  readonly languageId: string;
  readonly content: string;
  readonly metadata: ExtensionJsonObject;
}

export interface ExtensionNotebookKernelInitializeRequest {
  readonly projectUri: string;
  readonly notebookUri: string;
  readonly notebookType: string;
  readonly languages: readonly string[];
  readonly kernelGeneration: number;
}

export interface ExtensionNotebookKernelInitializeResult {
  readonly kernelGeneration: number;
}

export interface ExtensionNotebookExecutionRequest {
  readonly executionId: string;
  readonly kernelGeneration: number;
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly cells: readonly ExtensionNotebookKernelCellInput[];
}

export type ExtensionNotebookCellExecutionOutcome =
  | "success"
  | "error"
  | "cancelled";

export interface ExtensionNotebookCellExecutionResult {
  readonly cellId: string;
  readonly outcome: ExtensionNotebookCellExecutionOutcome;
  readonly executionOrder: number | null;
}

export interface ExtensionNotebookExecutionResult {
  readonly executionId: string;
  readonly kernelGeneration: number;
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly cells: readonly ExtensionNotebookCellExecutionResult[];
}

export type ExtensionNotebookKernelStatus =
  | "starting"
  | "idle"
  | "busy"
  | "restarting"
  | "stopping";

export type ExtensionNotebookOutputMutation =
  | Readonly<{
      operation: "append";
      cellId: string;
      output: ExtensionNotebookOutput;
    }>
  | Readonly<{
      operation: "replace";
      cellId: string;
      output: ExtensionNotebookOutput;
    }>
  | Readonly<{
      operation: "clear";
      cellId: string;
      wait: boolean;
    }>;

export type ExtensionNotebookCommMessage =
  | Readonly<{
      operation: "open";
      commId: string;
      target: string;
      data: ExtensionJsonObject;
      buffers: readonly ExtensionNotebookData[];
    }>
  | Readonly<{
      operation: "message";
      commId: string;
      data: ExtensionJsonObject;
      buffers: readonly ExtensionNotebookData[];
    }>
  | Readonly<{
      operation: "close";
      commId: string;
      data: ExtensionJsonObject;
    }>;

interface ExtensionNotebookKernelEventBase {
  /** Monotonically increases across the complete adapter session, including restarts. */
  readonly sequence: number;
  readonly kernelGeneration: number;
  readonly executionId: string | null;
}

export type ExtensionNotebookKernelEvent =
  | (ExtensionNotebookKernelEventBase & Readonly<{
      kind: "status";
      status: ExtensionNotebookKernelStatus;
    }>)
  | (ExtensionNotebookKernelEventBase & Readonly<{
      kind: "output";
      mutation: ExtensionNotebookOutputMutation;
    }>)
  | (ExtensionNotebookKernelEventBase & Readonly<{
      kind: "comm";
      message: ExtensionNotebookCommMessage;
    }>);

export interface ExtensionNotebookKernelInputRequest {
  readonly kernelGeneration: number;
  readonly executionId: string;
  readonly cellId: string;
  readonly prompt: string;
  readonly password: boolean;
}

export type ExtensionNotebookKernelInputResult =
  | Readonly<{ kind: "value"; value: string }>
  | Readonly<{ kind: "cancelled" }>;

export interface ExtensionNotebookKernelCommRequest {
  readonly kernelGeneration: number;
  readonly executionId: string | null;
  readonly message: ExtensionNotebookCommMessage;
}

export interface ExtensionNotebookKernelInterruptRequest {
  readonly kernelGeneration: number;
  readonly executionId: string;
}

export interface ExtensionNotebookKernelInterruptResult {
  readonly executionId: string;
  readonly accepted: boolean;
}

export interface ExtensionNotebookKernelRestartRequest {
  readonly kernelGeneration: number;
  readonly nextKernelGeneration: number;
}

export interface ExtensionNotebookKernelRestartResult {
  /**
   * Commits the new generation. The adapter must return this response before
   * emitting any event whose kernelGeneration equals this value.
   */
  readonly kernelGeneration: number;
}

export interface ExtensionNotebookKernelShutdownRequest {
  readonly kernelGeneration: number;
}

export interface ExtensionNotebookKernelShutdownResult {
  readonly kernelGeneration: number;
}

/**
 * Symbolic kernel process selected by an isolated extension provider. The host
 * resolves the globally selected runtime and signed tool resources, then owns
 * the process and framed protocol for the complete notebook lifetime.
 */
export interface ExtensionNotebookKernelDescriptor {
  readonly kind: "runtime";
  readonly executable: ExtensionRuntimeCommandReference;
  readonly args: readonly ExtensionManagedToolArgument[];
  readonly protocol: typeof EXTENSION_NOTEBOOK_KERNEL_PROTOCOL;
}

export interface ExtensionNotebookKernelDescriptorRequest {
  readonly projectUri: string;
  readonly notebookUri: string;
  readonly notebookType: string;
  readonly languages: readonly string[];
}

export interface ExtensionNotebookKernelProvider extends ExtensionDisposable {
  provideNotebookKernelDescriptor(
    request: ExtensionNotebookKernelDescriptorRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionNotebookKernelDescriptor
    | Promise<ExtensionNotebookKernelDescriptor>;
}

export interface ExtensionSearchOpenDocument {
  readonly uri: string;
  readonly text: string;
  readonly version: number;
}

export interface ExtensionSearchContext {
  readonly projectUri: string;
  readonly scopeUri: string;
  readonly excludes: readonly string[];
  readonly openDocuments: readonly ExtensionSearchOpenDocument[];
}

export interface ExtensionFileSearchRequest {
  readonly query: string;
  readonly maxResults: number;
  readonly context: ExtensionSearchContext;
}

export interface ExtensionFileSearchResult {
  readonly uri: string;
  readonly label: string;
  readonly score: number;
}

export interface ExtensionFileSearchProvider extends ExtensionDisposable {
  provideFileSearchResults(
    request: ExtensionFileSearchRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionFileSearchResult[]
    | Promise<readonly ExtensionFileSearchResult[]>;
}

export interface ExtensionTextSearchRequest {
  readonly query: string;
  readonly maxResults: number;
  readonly caseSensitive: boolean;
  readonly regularExpression: boolean;
  readonly include?: string;
  readonly context: ExtensionSearchContext;
}

export interface ExtensionTextSearchResult {
  readonly uri: string;
  readonly label: string;
  readonly preview: string;
  readonly line: number;
  readonly column: number;
}

export interface ExtensionTextSearchProvider extends ExtensionDisposable {
  provideTextSearchResults(
    request: ExtensionTextSearchRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionTextSearchResult[]
    | Promise<readonly ExtensionTextSearchResult[]>;
}

export interface ExtensionQuickOpenRequest {
  readonly query: string;
  readonly maxResults: number;
  readonly context: ExtensionSearchContext;
}

export interface ExtensionQuickOpenResult {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly detail?: string;
  readonly uri: string;
  readonly line?: number;
  readonly column?: number;
  readonly score: number;
}

export interface ExtensionQuickOpenProvider extends ExtensionDisposable {
  provideQuickOpenResults(
    request: ExtensionQuickOpenRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionQuickOpenResult[]
    | Promise<readonly ExtensionQuickOpenResult[]>;
}

export interface ExtensionWorkspaceReadApi {
  /** Returns the canonical project-relative path for a document, or null outside the project. */
  relativePath(
    uri: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<string | null>;
  readText(uri: string, cancellation: ExtensionCancellationToken): Promise<string>;
  readTextIfExists(
    uri: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<
    | { readonly found: false }
    | { readonly found: true; readonly text: string }
  >;
  /** Finds files in the open project using project-relative glob patterns. */
  findFiles(
    query: ExtensionWorkspaceFileQuery,
    cancellation: ExtensionCancellationToken,
  ): Promise<readonly ExtensionWorkspaceFile[]>;
}

export interface ExtensionWorkspaceFileQuery {
  /** Required project-relative glob. A basename-only pattern matches at any depth. */
  readonly include: string;
  /** Optional project-relative glob removed from the include result. */
  readonly exclude?: string;
  /** Required host-enforced result limit. */
  readonly maxResults: number;
}

export interface ExtensionWorkspaceFile {
  readonly uri: string;
  readonly relativePath: string;
}

export interface ExtensionWorkspaceWriteEdit {
  readonly uri: string;
  readonly version: number;
  readonly edits: readonly (ExtensionOffsetRange & { readonly text: string })[];
}

export interface ExtensionWorkspaceWriteApi {
  applyEdits(
    edits: readonly ExtensionWorkspaceWriteEdit[],
    cancellation: ExtensionCancellationToken,
  ): Promise<void>;
}

export interface ExtensionCommandsApi {
  execute(
    command: string,
    arguments_: readonly ExtensionJsonValue[],
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionJsonValue>;
}

export interface ExtensionDiagnosticsApi {
  publish(uri: string, diagnostics: readonly ExtensionDiagnostic[]): Promise<void>;
  clear(uri: string): Promise<void>;
}

export interface ExtensionToolsApi {
  invoke(
    tool: string,
    entrypoint: string,
    request: ExtensionJsonObject,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionJsonValue>;
}

export interface ExtensionStorageApi {
  get(key: string): Promise<ExtensionJsonValue | undefined>;
  set(key: string, value: ExtensionJsonValue): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ExtensionNetworkRequest {
  readonly url: string;
  readonly method: "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  /** Opaque reference returned by authentication.getSession; never a credential. */
  readonly session?: string;
}

export interface ExtensionNetworkResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface ExtensionNetworkApi {
  request(
    request: ExtensionNetworkRequest,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionNetworkResponse>;
}

export interface ExtensionAuthenticationApi {
  /** Returns an opaque vault-backed session reference, never raw credentials. */
  getSession(
    provider: string,
    scopes: readonly string[],
    cancellation: ExtensionCancellationToken,
  ): Promise<{ readonly session: string } | null>;
}

export interface ExtensionNotificationsApi {
  show(message: string, severity: "info" | "warning" | "error"): Promise<void>;
}

export interface ExtensionHostTerminalProfileDescriptor {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface ExtensionTerminalApi {
  profiles(
    cancellation: ExtensionCancellationToken,
  ): Promise<readonly ExtensionHostTerminalProfileDescriptor[]>;
  launch(
    profile: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<{ readonly sessionId: string }>;
}

/** Symbolic lifecycle access to services declared by this exact extension activation. */
export interface ExtensionPersistentServicesApi {
  list(
    cancellation: ExtensionCancellationToken,
  ): Promise<readonly ExtensionPersistentServiceStatus[]>;
  status(
    service: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionPersistentServiceStatus>;
  start(
    service: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionPersistentServiceStatus>;
  stop(
    service: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionPersistentServiceStatus>;
  restart(
    service: string,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionPersistentServiceStatus>;
  readLog(
    service: string,
    maximumBytes: number,
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionPersistentServiceLogSlice>;
}

/** Reviewed access to terminal packages declared by this exact extension generation. */
export interface ExtensionTerminalPackagesApi {
  inspectStack(stack: string): Promise<ExtensionTerminalPackageStackInspection>;
  requestTransaction(
    request: {
      readonly stack: string;
      readonly intent: ExtensionTerminalPackageIntent;
    },
    cancellation: ExtensionCancellationToken,
  ): Promise<ExtensionTerminalPackageTransactionReceipt>;
  inspectTransaction(
    transaction: string,
  ): Promise<ExtensionTerminalPackageTransactionSnapshot>;
  cancelTransaction(
    transaction: string,
  ): Promise<ExtensionTerminalPackageTransactionSnapshot>;
}

export interface ExtensionHostCapabilityMap {
  "workspace.read": ExtensionWorkspaceReadApi;
  "workspace.write": ExtensionWorkspaceWriteApi;
  "commands.execute": ExtensionCommandsApi;
  "diagnostics.publish": ExtensionDiagnosticsApi;
  "tools.execute": ExtensionToolsApi;
  storage: ExtensionStorageApi;
  network: ExtensionNetworkApi;
  authentication: ExtensionAuthenticationApi;
  notifications: ExtensionNotificationsApi;
  "services.manage": ExtensionPersistentServicesApi;
  terminal: ExtensionTerminalApi;
  "terminal.packages": ExtensionTerminalPackagesApi;
}

export type ExtensionHostPermission = Exclude<
  ExtensionPermission,
  "extension.execute" | "runtimes.execute"
>;

export type ExtensionHostApi<TPermission extends ExtensionHostPermission> = Readonly<{
  [TKey in TPermission]: ExtensionHostCapabilityMap[TKey];
}>;

/** Immutable host-owned state for the canonical active project. */
export interface ExtensionWorkspaceContext {
  readonly isTrusted: boolean;
}

export interface ExtensionProviderActivationContext<
  TPermission extends ExtensionHostPermission = never,
> {
  readonly apiVersion: typeof EXTENSION_API_VERSION;
  readonly extensionId: string;
  readonly providerId: string;
  readonly providerKind: ExtensionProviderKind;
  readonly workspace: ExtensionWorkspaceContext;
  /** Runtime keys are the exact host permissions declared by the installed manifest. */
  readonly host: ExtensionHostApi<TPermission>;
}

export type ExtensionProviderFactory<
  TProvider extends ExtensionDisposable,
  TPermission extends ExtensionHostPermission = never,
> = (
  context: ExtensionProviderActivationContext<TPermission>,
) => TProvider | Promise<TProvider>;

/** Provider exports excluding the SDK-owned module version marker. */
export type ExtensionProviderExports = Record<
  string,
  ExtensionProviderFactory<ExtensionDisposable, ExtensionHostPermission>
> & {
  readonly extensionApiVersion?: never;
};

export interface ExtensionActivationContext<
  TPermission extends ExtensionHostPermission = never,
> {
  readonly apiVersion: typeof EXTENSION_API_VERSION;
  readonly extensionId: string;
  readonly event: ExtensionActivationEvent;
  readonly workspace: ExtensionWorkspaceContext;
  readonly host: ExtensionHostApi<TPermission>;
  readonly subscriptions: ExtensionDisposableStore;
}

export type ExtensionProviderModule<
  TExports extends ExtensionProviderExports,
> = Readonly<{ extensionApiVersion: typeof EXTENSION_API_VERSION }>
  & Omit<TExports, "extensionApiVersion">;

export type ExtensionManifestDefinition = ExtensionManifest;
