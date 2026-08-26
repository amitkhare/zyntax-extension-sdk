import type { ExtensionProviderKind } from "./contracts/manifest.js";

export const EXTENSION_PROVIDER_METHODS: Readonly<{
  readonly completion: readonly ["provideCompletions"];
  readonly structuralRegions: readonly ["provideRegions"];
  readonly virtualDocuments: readonly ["provideVirtualDocuments"];
  readonly documentParser: readonly ["parseDocument"];
  readonly documentFormatting: readonly ["provideDocumentFormatting"];
  readonly rangeFormatting: readonly ["provideRangeFormatting"];
  readonly diagnostics: readonly ["provideDiagnostics"];
  readonly codeActions: readonly ["provideCodeActions"];
  readonly fixAll: readonly ["provideFixAll"];
  readonly debugConfiguration: readonly [
    "provideDebugConfigurations",
    "resolveDebugConfiguration",
  ];
  readonly debugAdapter: readonly ["provideDebugAdapterDescriptor"];
  readonly notebookType: readonly ["deserializeNotebook", "serializeNotebook"];
  readonly notebookKernel: readonly ["provideNotebookKernelDescriptor"];
  readonly command: readonly ["executeCommand"];
  readonly agent: readonly ["activate"];
  readonly aiProvider: readonly ["listModels", "stream", "cancel"];
  readonly fileSearch: readonly ["provideFileSearchResults"];
  readonly textSearch: readonly ["provideTextSearchResults"];
  readonly quickOpen: readonly ["provideQuickOpenResults"];
  readonly inlineCompletion: readonly ["provideInlineCompletions"];
  readonly assistedEdit: readonly ["provideAssistedEdits", "streamAssistedEdits"];
  readonly aiCodeAction: readonly ["provideAICodeActions"];
  readonly decoration: readonly ["provideDecorations"];
  readonly documentColor: readonly [
    "provideDocumentColors",
    "provideColorPresentations",
  ];
  readonly hover: readonly ["provideHover"];
  readonly preview: readonly ["providePreview"];
  readonly task: readonly ["provideTasks", "resolveTask"];
  readonly terminalProfile: readonly [
    "provideTerminalProfiles",
    "resolveTerminalProfile",
  ];
  readonly scm: readonly ["provideSourceControlState"];
  readonly projectTemplate: readonly [
    "provideProjectTemplates",
    "resolveProjectTemplate",
  ];
}>;

export type ExtensionProviderMethod<
  TKind extends ExtensionProviderKind = ExtensionProviderKind,
> = (typeof EXTENSION_PROVIDER_METHODS)[TKind][number];
