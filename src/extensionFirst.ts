import type {
  ExtensionCancellationToken,
  ExtensionCodeActionRequest,
  ExtensionCommand,
  ExtensionDiagnostic,
  ExtensionDisposable,
  ExtensionOffsetRange,
  ExtensionStreamSink,
  ExtensionStructuralRegion,
  ExtensionTextDocumentSnapshot,
  ExtensionTextEdit,
  ExtensionWorkspaceWriteEdit,
} from "./contract.js";
import type {
  ExtensionJsonObject,
  ExtensionJsonValue,
} from "./contracts/json.js";

export type ExtensionInlineCompletionTrigger =
  | { readonly kind: "automatic" }
  | { readonly kind: "invoked" };

export interface ExtensionInlineCompletionRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly position: number;
  readonly selectedRange?: ExtensionOffsetRange;
  readonly trigger: ExtensionInlineCompletionTrigger;
}

export interface ExtensionInlineCompletionItem {
  readonly id: string;
  readonly insertText: string;
  readonly range: ExtensionOffsetRange;
  readonly filterText?: string;
  readonly command?: ExtensionCommand;
}

export interface ExtensionInlineCompletionResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly items: readonly ExtensionInlineCompletionItem[];
}

export interface ExtensionInlineCompletionProvider extends ExtensionDisposable {
  provideInlineCompletions(
    request: ExtensionInlineCompletionRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionInlineCompletionResult | Promise<ExtensionInlineCompletionResult>;
}

export interface ExtensionAssistedEditRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly range: ExtensionOffsetRange;
  readonly instruction: string;
  readonly context?: ExtensionJsonObject;
}

/** Host-reviewed proposal. Providers never apply workspace edits directly. */
export interface ExtensionAssistedEditProposal {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly edits: readonly ExtensionWorkspaceWriteEdit[];
}

export type ExtensionAssistedEditStreamEvent =
  | {
      readonly kind: "progress";
      readonly message: string;
    }
  | {
      readonly kind: "proposal";
      readonly proposal: ExtensionAssistedEditProposal;
    };

export interface ExtensionAssistedEditProvider extends ExtensionDisposable {
  provideAssistedEdits(
    request: ExtensionAssistedEditRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionAssistedEditProposal[]
    | Promise<readonly ExtensionAssistedEditProposal[]>;
  /** One ordered native stream; the host validates and reviews every proposal. */
  streamAssistedEdits(
    request: ExtensionAssistedEditRequest,
    sink: ExtensionStreamSink<ExtensionAssistedEditStreamEvent>,
    cancellation: ExtensionCancellationToken,
  ): void | Promise<void>;
}

export interface ExtensionAICodeActionRequest
  extends ExtensionCodeActionRequest {}

/** AI-generated action metadata; application remains host-reviewed and atomic. */
export interface ExtensionAICodeAction {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly summary: string;
  readonly preferred: boolean;
  readonly diagnostics: readonly string[];
  readonly edit?: readonly ExtensionWorkspaceWriteEdit[];
  readonly command?: ExtensionCommand;
  readonly disabledReason?: string;
}

export interface ExtensionAICodeActionProvider extends ExtensionDisposable {
  provideAICodeActions(
    request: ExtensionAICodeActionRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionAICodeAction[]
    | Promise<readonly ExtensionAICodeAction[]>;
}

export interface ExtensionRgbaColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  readonly alpha: number;
}

export interface ExtensionDecorationBorder {
  readonly color: ExtensionRgbaColor;
  readonly style: "solid" | "dashed" | "dotted";
  readonly width: 1 | 2;
}

/** Fixed host theme tokens available to data-only editor decorations. */
export type ExtensionEditorThemeToken =
  | "editorBracketHighlight.foreground1"
  | "editorBracketHighlight.foreground2"
  | "editorBracketHighlight.foreground3"
  | "editorBracketHighlight.foreground4"
  | "editorBracketHighlight.foreground5"
  | "editorBracketHighlight.foreground6"
  | "editorBracketHighlight.unexpectedBracket.foreground";

/** Data-only presentation; extensions cannot inject CSS, DOM, or editor objects. */
export interface ExtensionDecorationStyle {
  readonly foreground?: ExtensionRgbaColor;
  readonly foregroundThemeToken?: ExtensionEditorThemeToken;
  readonly background?: ExtensionRgbaColor;
  readonly border?: ExtensionDecorationBorder;
  readonly fontStyle?: "normal" | "italic";
  readonly fontWeight?: "normal" | "bold";
  readonly textDecoration?: "none" | "underline" | "line-through";
}

/** Host-parsed, source-coordinate bracket pair inside one structural region. */
export interface ExtensionSyntaxBracketPair {
  readonly regionId: string;
  readonly languageId: string;
  readonly nestingLevel: number;
  readonly open: ExtensionOffsetRange;
  readonly close: ExtensionOffsetRange;
}

export interface ExtensionDocumentDecoration {
  readonly id: string;
  readonly range: ExtensionOffsetRange;
  readonly style: ExtensionDecorationStyle;
  readonly hoverMessage?: string;
}

export interface ExtensionDecorationRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly visibleRanges: readonly ExtensionOffsetRange[];
  /** Parser-owned regions, all in the selected language and source coordinate space. */
  readonly regions: readonly ExtensionStructuralRegion[];
  /** Bounded syntax facts derived by the host parser. */
  readonly syntax: {
    readonly bracketPairs: readonly ExtensionSyntaxBracketPair[];
  };
}

export interface ExtensionDecorationResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly decorations: readonly ExtensionDocumentDecoration[];
}

export interface ExtensionDecorationProvider extends ExtensionDisposable {
  provideDecorations(
    request: ExtensionDecorationRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionDecorationResult | Promise<ExtensionDecorationResult>;
}

export interface ExtensionDocumentColor {
  readonly range: ExtensionOffsetRange;
  readonly color: ExtensionRgbaColor;
}

export interface ExtensionDocumentColorRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  /** Parser-owned regions, all in the selected language and source coordinate space. */
  readonly regions: readonly ExtensionStructuralRegion[];
}

export interface ExtensionDocumentColorResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly colors: readonly ExtensionDocumentColor[];
}

export interface ExtensionColorPresentationRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly range: ExtensionOffsetRange;
  readonly color: ExtensionRgbaColor;
}

export interface ExtensionColorPresentation {
  readonly label: string;
  readonly textEdit: ExtensionTextEdit;
  readonly additionalTextEdits: readonly ExtensionTextEdit[];
}

export interface ExtensionDocumentColorProvider extends ExtensionDisposable {
  provideDocumentColors(
    request: ExtensionDocumentColorRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionDocumentColorResult | Promise<ExtensionDocumentColorResult>;
  provideColorPresentations(
    request: ExtensionColorPresentationRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionColorPresentation[]
    | Promise<readonly ExtensionColorPresentation[]>;
}

/** Host-rendered hover content. Providers cannot return HTML, DOM, or editor objects. */
export interface ExtensionHoverContent {
  readonly kind: "plaintext" | "markdown";
  readonly value: string;
}

export interface ExtensionHoverRequest {
  readonly snapshot: ExtensionTextDocumentSnapshot;
  readonly position: number;
  /** Exact parser-owned region selected by the host at `position`. */
  readonly region: ExtensionStructuralRegion;
}

export interface ExtensionHoverResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly range: ExtensionOffsetRange;
  readonly contents: readonly ExtensionHoverContent[];
}

export interface ExtensionHoverProvider extends ExtensionDisposable {
  provideHover(
    request: ExtensionHoverRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionHoverResult | null | Promise<ExtensionHoverResult | null>;
}

export interface ExtensionPreviewIssue {
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
}

/** Safe host-rendered structured value. Providers cannot return markup, DOM, or components. */
export interface ExtensionStructuredPreviewBody {
  readonly kind: "structured";
  readonly value: ExtensionJsonValue;
  readonly formatted: string;
}

/** Safe host-rendered table. Each row has exactly one cell for every declared column. */
export interface ExtensionTablePreviewBody {
  readonly kind: "table";
  readonly columns: readonly string[];
  readonly rows: readonly (readonly ExtensionJsonValue[])[];
}

/** Plain text rendered by the host without HTML interpretation. */
export interface ExtensionTextPreviewBody {
  readonly kind: "text";
  readonly content: string;
}

export type ExtensionPreviewMediaType =
  | "image/avif"
  | "image/bmp"
  | "image/gif"
  | "image/jpeg"
  | "image/png"
  | "image/svg+xml"
  | "image/vnd.microsoft.icon"
  | "image/webp";

/** Explicit execution and resource policy for an isolated HTML resource session. */
export interface ExtensionHtmlPreviewPolicy {
  readonly scripts: "allow" | "block";
  readonly console: "eruda" | "disabled";
  readonly subresources: "project" | "none";
}

/**
 * An isolated host resource sourced from the exact canonical document. Providers return no
 * bytes, URI, markup, native handle, filesystem path, or WebView object.
 */
export interface ExtensionHtmlResourcePreviewBody {
  readonly kind: "resource";
  readonly source: "document";
  readonly renderer: "html";
  readonly policy: ExtensionHtmlPreviewPolicy;
}

export interface ExtensionSvgResourcePreviewBody {
  readonly kind: "resource";
  readonly source: "document";
  readonly renderer: "svg";
  readonly mediaType: "image/svg+xml";
  readonly encoding: "utf8";
  readonly alt: string;
}

export interface ExtensionImageResourcePreviewBody {
  readonly kind: "resource";
  readonly source: "document";
  readonly renderer: "image";
  readonly mediaType: Exclude<ExtensionPreviewMediaType, "image/svg+xml">;
  readonly encoding: "base64";
  readonly alt: string;
}

export type ExtensionResourcePreviewBody =
  | ExtensionHtmlResourcePreviewBody
  | ExtensionSvgResourcePreviewBody
  | ExtensionImageResourcePreviewBody;

export type ExtensionPreviewTone =
  | "neutral"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "purple"
  | "pink";

export interface ExtensionInspectorBadge {
  readonly label: string;
  readonly tone: ExtensionPreviewTone;
}

export interface ExtensionInspectorItem {
  readonly label: string;
  readonly detail?: string;
  readonly marker?: string;
  readonly tone?: ExtensionPreviewTone;
}

export interface ExtensionInspectorSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly ExtensionInspectorItem[];
}

export interface ExtensionInspectorTreeNode {
  readonly label: string;
  readonly depth: number;
  readonly kind: "element" | "component";
  readonly tags: readonly string[];
}

export interface ExtensionInspectorCodeSection {
  readonly id: string;
  readonly title: string;
  readonly languageId: string;
  readonly content: string;
}

/** Bounded data-only inspection model rendered entirely by the host. */
export interface ExtensionInspectorPreviewBody {
  readonly kind: "inspector";
  readonly badges: readonly ExtensionInspectorBadge[];
  readonly sections: readonly ExtensionInspectorSection[];
  readonly tree: readonly ExtensionInspectorTreeNode[];
  readonly code: readonly ExtensionInspectorCodeSection[];
}

export interface ExtensionPreviewToken {
  readonly name: string;
  readonly value: string;
  readonly scope: string;
  readonly category: "font" | "other";
}

/** Safe host-rendered design-token cards. CSS interpretation remains host-owned. */
export interface ExtensionTokensPreviewBody {
  readonly kind: "tokens";
  readonly tokens: readonly ExtensionPreviewToken[];
}

export type ExtensionPreviewBody =
  | ExtensionStructuredPreviewBody
  | ExtensionTablePreviewBody
  | ExtensionTextPreviewBody
  | ExtensionResourcePreviewBody
  | ExtensionInspectorPreviewBody
  | ExtensionTokensPreviewBody;

export interface ExtensionPreviewSelectorMatch {
  readonly id: string;
  readonly kind: "language" | "path";
}

export type ExtensionPreviewDocumentSnapshot = Omit<
  ExtensionTextDocumentSnapshot,
  "content"
>;

interface ExtensionPreviewRequestBase {
  /** Declarative selector mapping chosen by the host for this canonical snapshot. */
  readonly selector: ExtensionPreviewSelectorMatch;
}

export interface ExtensionTextPreviewRequest extends ExtensionPreviewRequestBase {
  readonly input: "text";
  readonly snapshot: ExtensionTextDocumentSnapshot;
}

export interface ExtensionDocumentPreviewRequest extends ExtensionPreviewRequestBase {
  readonly input: "document";
  readonly snapshot: ExtensionPreviewDocumentSnapshot;
}

export type ExtensionPreviewRequest =
  | ExtensionTextPreviewRequest
  | ExtensionDocumentPreviewRequest;

export interface ExtensionPreviewResult {
  readonly documentVersion: number;
  readonly documentGeneration: number;
  readonly title: string;
  readonly body: ExtensionPreviewBody;
  readonly issues: readonly ExtensionPreviewIssue[];
}

export interface ExtensionPreviewProvider extends ExtensionDisposable {
  providePreview(
    request: ExtensionPreviewRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionPreviewResult | Promise<ExtensionPreviewResult>;
}

export type ExtensionTaskGroup =
  | "build"
  | "test"
  | "run"
  | "clean"
  | "other";

/**
 * A reviewed task command for the host-owned interactive terminal.
 *
 * The executable is resolved by the user's terminal environment. Providers cannot supply a shell
 * command, native path, environment, or working-directory path; the host serializes the bounded
 * argv and resolves path segments inside the active project only after user approval.
 */
export interface ExtensionTerminalTaskExecution {
  readonly kind: "terminal";
  readonly executable: string;
  readonly arguments: readonly string[];
  readonly workingDirectory: readonly string[];
}

/**
 * A task executed by one exact managed-tool release declared by the owning extension.
 *
 * The provider supplies only symbolic identities, bounded argv values, and project-relative
 * working-directory segments. The host resolves the executable and working directory after
 * approval and never exposes either native path to the isolated provider.
 */
export interface ExtensionManagedToolTaskExecution {
  readonly kind: "managedTool";
  readonly tool: string;
  readonly entrypoint: string;
  readonly arguments: readonly string[];
  readonly workingDirectory: readonly string[];
}

export type ExtensionTaskExecution =
  | ExtensionTerminalTaskExecution
  | ExtensionManagedToolTaskExecution;

export interface ExtensionTaskDescriptor {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly description?: string;
  readonly group: ExtensionTaskGroup;
  readonly background: boolean;
  readonly execution: ExtensionTaskExecution;
  readonly metadata: ExtensionJsonObject;
}

export interface ExtensionTaskRequest {
  readonly projectUri: string;
  readonly taskType: string;
}

export interface ExtensionTaskResolveRequest extends ExtensionTaskRequest {
  readonly task: ExtensionTaskDescriptor;
}

export interface ExtensionTaskProvider extends ExtensionDisposable {
  provideTasks(
    request: ExtensionTaskRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionTaskDescriptor[]
    | Promise<readonly ExtensionTaskDescriptor[]>;
  resolveTask(
    request: ExtensionTaskResolveRequest,
    cancellation: ExtensionCancellationToken,
  ): ExtensionTaskDescriptor | Promise<ExtensionTaskDescriptor>;
}

export interface ExtensionTerminalProfileDescriptor {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  /** Symbolic registered command. The host owns interactive terminal creation. */
  readonly command: ExtensionCommand;
}

export interface ExtensionTerminalProfileRequest {
  readonly projectUri: string;
}

export interface ExtensionTerminalProfileResolveRequest
  extends ExtensionTerminalProfileRequest {
  readonly profile: ExtensionTerminalProfileDescriptor;
}

export interface ExtensionTerminalProfileProvider extends ExtensionDisposable {
  provideTerminalProfiles(
    request: ExtensionTerminalProfileRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionTerminalProfileDescriptor[]
    | Promise<readonly ExtensionTerminalProfileDescriptor[]>;
  resolveTerminalProfile(
    request: ExtensionTerminalProfileResolveRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionTerminalProfileDescriptor
    | Promise<ExtensionTerminalProfileDescriptor>;
}

export type ExtensionSourceControlResourceState =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "conflicted"
  | "untracked"
  | "ignored";

export interface ExtensionSourceControlResource {
  readonly id: string;
  readonly uri: string;
  readonly state: ExtensionSourceControlResourceState;
  readonly originalUri?: string;
  readonly command?: ExtensionCommand;
}

export interface ExtensionSourceControlGroup {
  readonly id: string;
  readonly label: string;
  readonly resources: readonly ExtensionSourceControlResource[];
}

export interface ExtensionSourceControlDescriptor {
  readonly id: string;
  readonly label: string;
  readonly rootUri: string;
  readonly inputPlaceholder?: string;
  readonly groups: readonly ExtensionSourceControlGroup[];
  readonly commands: readonly ExtensionCommand[];
}

export interface ExtensionSourceControlRequest {
  readonly projectUri: string;
}

export interface ExtensionSourceControlState {
  readonly controls: readonly ExtensionSourceControlDescriptor[];
}

export interface ExtensionScmProvider extends ExtensionDisposable {
  provideSourceControlState(
    request: ExtensionSourceControlRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionSourceControlState
    | Promise<ExtensionSourceControlState>;
}

export interface ExtensionProjectTemplateDescriptor {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly inputs: ExtensionJsonObject;
}

export interface ExtensionProjectTemplateRequest {
  readonly targetRootUri: string;
}

export interface ExtensionProjectTemplateResolveRequest
  extends ExtensionProjectTemplateRequest {
  readonly templateId: string;
  readonly inputs: ExtensionJsonObject;
}

export interface ExtensionProjectTemplateFile {
  /** Normalized relative identity; the host resolves it under targetRootUri. */
  readonly pathSegments: readonly string[];
  readonly encoding: "utf8";
  readonly content: string;
}

interface ExtensionProjectTemplatePlanBase {
  readonly templateId: string;
  readonly summary: string;
  readonly kind: "files" | "managedTool";
  readonly metadata: ExtensionJsonObject;
}

/** Host-reviewed file plan. Providers never write the target filesystem. */
export interface ExtensionProjectTemplateFilePlan
  extends ExtensionProjectTemplatePlanBase {
  readonly kind: "files";
  readonly files: readonly ExtensionProjectTemplateFile[];
}

export interface ExtensionProjectTemplateMarker {
  /** Regular file that must exist after the managed generator completes. */
  readonly pathSegments: readonly string[];
}

/**
 * A manifest-owned generator selected by an isolated provider. The host runs
 * it only after approval, with a new staging directory as its working root.
 * Providers never supply commands, executable paths, environment variables,
 * terminal access, or native filesystem paths.
 */
export interface ExtensionProjectTemplateManagedToolPlan
  extends ExtensionProjectTemplatePlanBase {
  readonly kind: "managedTool";
  readonly tool: string;
  readonly entrypoint: string;
  readonly request: ExtensionJsonObject;
  readonly markers: readonly ExtensionProjectTemplateMarker[];
}

export type ExtensionProjectTemplatePlan =
  | ExtensionProjectTemplateFilePlan
  | ExtensionProjectTemplateManagedToolPlan;

export interface ExtensionProjectTemplateProvider extends ExtensionDisposable {
  provideProjectTemplates(
    request: ExtensionProjectTemplateRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | readonly ExtensionProjectTemplateDescriptor[]
    | Promise<readonly ExtensionProjectTemplateDescriptor[]>;
  resolveProjectTemplate(
    request: ExtensionProjectTemplateResolveRequest,
    cancellation: ExtensionCancellationToken,
  ):
    | ExtensionProjectTemplatePlan
    | Promise<ExtensionProjectTemplatePlan>;
}

/** Provider-owned opaque state values must remain JSON-only. */
export type ExtensionContributionState = ExtensionJsonValue;
