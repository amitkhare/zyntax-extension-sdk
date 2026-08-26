import { EXTENSION_API_VERSION } from "./contracts/manifest.js";
import type { ExtensionManifest } from "./contracts/manifest.js";
import type {
  AgentHarnessAdapter,
  AIProviderAdapter,
} from "./agent/protocol.js";
import type {
  ExtensionCodeActionProvider,
  ExtensionCancellationToken,
  ExtensionCommandProvider,
  ExtensionCompletionProvider,
  ExtensionDebugAdapterDescriptorProvider,
  ExtensionDebugConfigurationProvider,
  ExtensionDebugDocumentPathReference,
  ExtensionDebugProjectPathKind,
  ExtensionDebugProjectPathReference,
  ExtensionDiagnosticsProvider,
  ExtensionDocumentFormatterProvider,
  ExtensionDisposable,
  ExtensionFileSearchProvider,
  ExtensionFixAllProvider,
  ExtensionHostPermission,
  ExtensionNotebookKernelProvider,
  ExtensionNotebookSerializerProvider,
  ExtensionProviderExports,
  ExtensionProviderFactory,
  ExtensionProviderModule,
  ExtensionQuickOpenProvider,
  ExtensionRangeFormatterProvider,
  ExtensionStructuralRegionProvider,
  ExtensionTextSearchProvider,
  ExtensionVirtualDocumentProvider,
} from "./contract.js";
import type {
  ExtensionAICodeActionProvider,
  ExtensionAssistedEditProvider,
  ExtensionDecorationProvider,
  ExtensionDocumentColorProvider,
  ExtensionHoverProvider,
  ExtensionInlineCompletionProvider,
  ExtensionPreviewProvider,
  ExtensionProjectTemplateProvider,
  ExtensionScmProvider,
  ExtensionTaskProvider,
  ExtensionTerminalProfileProvider,
} from "./extensionFirst.js";

export * from "./contract.js";
export * from "./managedToolProtocol.js";
export { EXTENSION_API_VERSION };

export function throwIfCancellationRequested(
  cancellation: ExtensionCancellationToken,
): void {
  cancellation.throwIfCancellationRequested();
}

/** Compile-time authoring helper; canonical validation remains host-owned. */
export function defineExtensionManifest<const TManifest extends ExtensionManifest>(
  manifest: TManifest,
): TManifest {
  return manifest;
}

/**
 * Defines the exact exports registered inside the isolated provider runtime.
 * The returned shape is consumed by extension tooling when it emits a
 * self-contained `providers/*.js` module.
 */
export function defineProviderModule<
  const TExports extends ExtensionProviderExports,
>(exports: TExports): ExtensionProviderModule<TExports> {
  return Object.freeze({
    ...exports,
    extensionApiVersion: EXTENSION_API_VERSION,
  });
}

export function defineCompletionProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionCompletionProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineStructuralRegionProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionStructuralRegionProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineVirtualDocumentProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionVirtualDocumentProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineDocumentFormatterProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionDocumentFormatterProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineRangeFormatterProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionRangeFormatterProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineDiagnosticsProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionDiagnosticsProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineCodeActionProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionCodeActionProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineCommandProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionCommandProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineFixAllProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionFixAllProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineDebugConfigurationProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionDebugConfigurationProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

/** Creates a host-resolved path reference for a debugger configuration. */
export function debugDocumentPath(
  documentUri: string,
): ExtensionDebugDocumentPathReference {
  if (typeof documentUri !== "string" || !documentUri.trim()) {
    throw new TypeError("Debug document URI must not be empty");
  }
  return Object.freeze({ $documentPath: documentUri });
}

/** Declares one project-confined path which Zyntax asks the user to review. */
export function debugProjectPath(
  id: string,
  label: string,
  kind: ExtensionDebugProjectPathKind,
): ExtensionDebugProjectPathReference {
  if (typeof id !== "string" || !/^[A-Za-z][A-Za-z0-9._-]{0,95}$/u.test(id)) {
    throw new TypeError("Debug project path id is invalid");
  }
  if (typeof label !== "string" || !label || label.trim() !== label) {
    throw new TypeError("Debug project path label must be a non-empty trimmed string");
  }
  if (kind !== "file" && kind !== "executable") {
    throw new TypeError("Debug project path kind must be file or executable");
  }
  return Object.freeze({
    $projectPath: Object.freeze({ id, label, kind }),
  });
}

export function defineDebugAdapterDescriptorProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionDebugAdapterDescriptorProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineNotebookSerializerProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionNotebookSerializerProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineNotebookKernelProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionNotebookKernelProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineFileSearchProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionFileSearchProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineTextSearchProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionTextSearchProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineQuickOpenProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionQuickOpenProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineInlineCompletionProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionInlineCompletionProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineAssistedEditProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionAssistedEditProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineAICodeActionProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionAICodeActionProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineDecorationProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionDecorationProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineDocumentColorProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionDocumentColorProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineHoverProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionHoverProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function definePreviewProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionPreviewProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineTaskProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionTaskProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineTerminalProfileProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionTerminalProfileProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineScmProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionScmProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineProjectTemplateProvider<
  TFactory extends ExtensionProviderFactory<
    ExtensionProjectTemplateProvider,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineAgentHarness<
  TFactory extends ExtensionProviderFactory<
    AgentHarnessAdapter,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}

export function defineAIProvider<
  TFactory extends ExtensionProviderFactory<
    AIProviderAdapter,
    ExtensionHostPermission
  >,
>(factory: TFactory): TFactory {
  return factory;
}
