import type { ExtensionProviderKind } from "./contracts/manifest.js";

/** Required public provider methods, keyed by the canonical capability kind. */
export const EXTENSION_PROVIDER_METHODS = Object.freeze({
  completion: Object.freeze(["provideCompletions"] as const),
  structuralRegions: Object.freeze([
    "openDocument",
    "applyDocumentChanges",
    "provideRegion",
    "provideRegionDocument",
    "closeDocument",
  ] as const),
  virtualDocuments: Object.freeze(["provideVirtualDocuments"] as const),
  documentParser: Object.freeze(["parseDocument"] as const),
  documentFormatting: Object.freeze(["provideDocumentFormatting"] as const),
  rangeFormatting: Object.freeze(["provideRangeFormatting"] as const),
  diagnostics: Object.freeze(["provideDiagnostics"] as const),
  codeActions: Object.freeze(["provideCodeActions"] as const),
  fixAll: Object.freeze(["provideFixAll"] as const),
  debugConfiguration: Object.freeze([
    "provideDebugConfigurations",
    "resolveDebugConfiguration",
  ] as const),
  debugAdapter: Object.freeze(["provideDebugAdapterDescriptor"] as const),
  notebookType: Object.freeze(["deserializeNotebook", "serializeNotebook"] as const),
  notebookKernel: Object.freeze(["provideNotebookKernelDescriptor"] as const),
  command: Object.freeze(["executeCommand"] as const),
  agent: Object.freeze(["activate"] as const),
  aiProvider: Object.freeze(["listModels", "stream", "cancel"] as const),
  fileSearch: Object.freeze(["provideFileSearchResults"] as const),
  textSearch: Object.freeze(["provideTextSearchResults"] as const),
  quickOpen: Object.freeze(["provideQuickOpenResults"] as const),
  inlineCompletion: Object.freeze(["provideInlineCompletions"] as const),
  assistedEdit: Object.freeze(["provideAssistedEdits", "streamAssistedEdits"] as const),
  aiCodeAction: Object.freeze(["provideAICodeActions"] as const),
  decoration: Object.freeze(["provideDecorations"] as const),
  documentColor: Object.freeze([
    "provideDocumentColors",
    "provideColorPresentations",
  ] as const),
  hover: Object.freeze(["provideHover"] as const),
  preview: Object.freeze(["providePreview"] as const),
  task: Object.freeze(["provideTasks", "resolveTask"] as const),
  terminalProfile: Object.freeze([
    "provideTerminalProfiles",
    "resolveTerminalProfile",
  ] as const),
  scm: Object.freeze(["provideSourceControlState"] as const),
  projectTemplate: Object.freeze([
    "provideProjectTemplates",
    "resolveProjectTemplate",
  ] as const),
} satisfies Record<ExtensionProviderKind, readonly string[]>);

export type ExtensionProviderMethod<
  TKind extends ExtensionProviderKind = ExtensionProviderKind,
> = (typeof EXTENSION_PROVIDER_METHODS)[TKind][number];
