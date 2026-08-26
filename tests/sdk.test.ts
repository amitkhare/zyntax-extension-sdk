import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  EXTENSION_API_VERSION,
  EXTENSION_CONTRIBUTION_FIELDS,
  EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS,
  EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH,
  EXTENSION_EXECUTION_MAX_ARGUMENTS,
  EXTENSION_LSP_DOCUMENT_CAPABILITIES,
  EXTENSION_LSP_EXCLUSIVE_CAPABILITIES,
  EXTENSION_LSP_POSITION_CAPABILITIES,
  EXTENSION_MANAGED_TOOL_INVOCATION_METHOD,
  EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION,
  EXTENSION_PROVIDER_METHODS,
  EXTENSION_PERMISSIONS,
  EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES,
  EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES,
  EXTENSION_TERMINAL_PACKAGE_REPOSITORIES,
  debugDocumentPath,
  debugProjectPath,
  defineCompletionProvider,
  defineHoverProvider,
  defineProviderModule,
  definePreviewProvider,
  defineProjectTemplateProvider,
  isExtensionExecutionArgument,
  throwIfCancellationRequested,
  type ExtensionCompletionProvider,
  type ExtensionAssistedEditProviderContribution,
  type ExtensionHostCapabilityMap,
  type ExtensionHostApi,
  type ExtensionHoverProvider,
  type ExtensionHostTerminalProfileDescriptor,
  type ExtensionTerminalPackageIntent,
  type ExtensionTerminalPackageTransactionReceipt,
  type ExtensionJsonValue,
  type ExtensionLanguageServerCapabilityMatrix,
  type ExtensionNetworkRequest,
  type ExtensionPreviewProvider,
  type ExtensionPreviewProviderContribution,
  type ExtensionPreviewRequest,
  type ExtensionProjectTemplatePlan,
  type ExtensionProviderActivationContext,
  type ExtensionTextMateGrammarContribution,
  type ExtensionWorkspaceFile,
  type ExtensionWorkspaceFileQuery,
} from "../src/index.js";

describe("public extension SDK", () => {
  it("creates immutable host-resolved debug document paths", () => {
    const reference = debugDocumentPath("file:///project/main.py");
    expect(reference).toEqual({ $documentPath: "file:///project/main.py" });
    expect(Object.isFrozen(reference)).toBe(true);
    expectTypeOf(reference).toMatchTypeOf<ExtensionJsonValue>();
    expect(() => debugDocumentPath(" ")).toThrow("must not be empty");
  });

  it("declares reviewed project path slots without a native path", () => {
    const reference = debugProjectPath("program", "Program", "executable");
    expect(reference).toEqual({
      $projectPath: { id: "program", label: "Program", kind: "executable" },
    });
    expect(Object.isFrozen(reference)).toBe(true);
    expect(Object.isFrozen(reference.$projectPath)).toBe(true);
    expectTypeOf(reference).toMatchTypeOf<ExtensionJsonValue>();
    expect(() => debugProjectPath(" program ", "Program", "file")).toThrow("id is invalid");
    expect(() => debugProjectPath("program", "", "file")).toThrow(
      "non-empty trimmed string",
    );
  });

  it("exports the canonical API and provider method contract", () => {
    expect(EXTENSION_API_VERSION).toBe(1);
    expect(EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION).toBe("2.0");
    expect(EXTENSION_MANAGED_TOOL_INVOCATION_METHOD).toBe("zyntax/toolInvocation");
    expect(EXTENSION_EXECUTION_MAX_ARGUMENTS).toBe(32);
    expect(EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH).toBe(512);
    expect(EXTENSION_PERMISSIONS).toContain("terminal.packages");
    expect(EXTENSION_CONTRIBUTION_FIELDS).toContain("developmentStacks");
    expect(EXTENSION_TERMINAL_PACKAGE_REPOSITORIES).toEqual([
      "zyntax",
      "termux-main",
    ]);
    expect(EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS).toBe(8);
    expect(EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS).toBe(32);
    expect(EXTENSION_TERMINAL_PACKAGE_MAX_REQUEST_BYTES).toBe(8 * 1024);
    expect(EXTENSION_TERMINAL_PACKAGE_MAX_RESULT_BYTES).toBe(16 * 1024);
    expect(isExtensionExecutionArgument("a".repeat(512))).toBe(true);
    expect(isExtensionExecutionArgument("a".repeat(513))).toBe(false);
    expect(isExtensionExecutionArgument("")).toBe(true);
    expect(isExtensionExecutionArgument("bad\u0080arg")).toBe(false);
    expect(EXTENSION_LSP_POSITION_CAPABILITIES).toContain("documentHighlights");
    expect(EXTENSION_LSP_DOCUMENT_CAPABILITIES).toEqual(expect.arrayContaining([
      "documentSymbols",
      "foldingRanges",
    ]));
    expect(EXTENSION_LSP_EXCLUSIVE_CAPABILITIES).toEqual(expect.arrayContaining([
      "rename",
      "typeHierarchy",
      "semanticTokens",
      "documentFormatting",
    ]));
    expect(EXTENSION_PROVIDER_METHODS.debugConfiguration).toEqual([
      "provideDebugConfigurations",
      "resolveDebugConfiguration",
    ]);
    expect(EXTENSION_PROVIDER_METHODS.documentColor).toEqual([
      "provideDocumentColors",
      "provideColorPresentations",
    ]);
    expect(EXTENSION_PROVIDER_METHODS.hover).toEqual(["provideHover"]);
    expect(EXTENSION_PROVIDER_METHODS.assistedEdit).toEqual([
      "provideAssistedEdits",
      "streamAssistedEdits",
    ]);
    expect(EXTENSION_PROVIDER_METHODS.projectTemplate).toEqual([
      "provideProjectTemplates",
      "resolveProjectTemplate",
    ]);
    expectTypeOf<ExtensionTextMateGrammarContribution["path"]>().toEqualTypeOf<
      | `syntaxes/${string}.tmLanguage`
      | `syntaxes/${string}.tmLanguage.json`
    >();
    expectTypeOf<ExtensionTextMateGrammarContribution["languages"]>()
      .toEqualTypeOf<string[] | undefined>();
    expectTypeOf<ExtensionLanguageServerCapabilityMatrix>().toMatchTypeOf<{
      documentHighlights?: readonly unknown[];
      documentSymbols?: object;
      foldingRanges?: object;
    }>();
    expectTypeOf<
      [] extends ExtensionAssistedEditProviderContribution["languages"]
        ? true
        : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      {
        id: "preview";
        module: "providers/preview.js";
        export: "createPreview";
        input: "text";
        paths: [];
      } extends ExtensionPreviewProviderContribution ? true : false
    >().toEqualTypeOf<false>();
  });

  it("reserves the provider module API version for the SDK", () => {
    const createProvider = vi.fn(() => ({ dispose() {} }));
    const module = defineProviderModule({ createProvider });

    expect(module.extensionApiVersion).toBe(EXTENSION_API_VERSION);
    expect(module.createProvider).toBe(createProvider);
    expect(Object.isFrozen(module)).toBe(true);
    expectTypeOf(module.extensionApiVersion)
      .toEqualTypeOf<typeof EXTENSION_API_VERSION>();

    const override = vi.fn(() => ({ dispose() {} }));
    // @ts-expect-error extensionApiVersion is an SDK-owned export.
    const attemptedOverride = defineProviderModule({ extensionApiVersion: override });
    expect(attemptedOverride.extensionApiVersion).toBe(EXTENSION_API_VERSION);
  });

  it("keeps provider helpers host-neutral", () => {
    const factory = vi.fn((): ExtensionCompletionProvider => ({
      provideCompletions: () => null,
      dispose: vi.fn(),
    }));
    expect(defineCompletionProvider(factory)).toBe(factory);
    expectTypeOf(defineCompletionProvider(factory)).toEqualTypeOf(factory);
    const previews = vi.fn((): ExtensionPreviewProvider => ({
      providePreview: (request: ExtensionPreviewRequest) => ({
        documentVersion: request.snapshot.version,
        documentGeneration: request.snapshot.generation,
        title: "Preview",
        body: request.input === "document"
          ? {
              kind: "resource",
              source: "document",
              renderer: "svg",
              mediaType: "image/svg+xml",
              encoding: "utf8",
              alt: "Vector image",
            }
          : { kind: "tokens", tokens: [] },
        issues: [],
      }),
      dispose() {},
    }));
    expect(definePreviewProvider(previews)).toBe(previews);
    const hover = vi.fn((): ExtensionHoverProvider => ({
      provideHover: () => null,
      dispose() {},
    }));
    expect(defineHoverProvider(hover)).toBe(hover);
    const templates = vi.fn();
    expect(defineProjectTemplateProvider(templates)).toBe(templates);
    expectTypeOf<ExtensionProjectTemplatePlan>().toMatchTypeOf<
      | {
          readonly kind: "files";
          readonly templateId: string;
          readonly summary: string;
          readonly files: readonly {
            readonly pathSegments: readonly string[];
            readonly encoding: "utf8";
            readonly content: string;
          }[];
          readonly metadata: Record<string, ExtensionJsonValue>;
        }
      | {
          readonly kind: "managedTool";
          readonly templateId: string;
          readonly summary: string;
          readonly tool: string;
          readonly entrypoint: string;
          readonly request: Record<string, ExtensionJsonValue>;
          readonly markers: readonly { readonly pathSegments: readonly string[] }[];
          readonly metadata: Record<string, ExtensionJsonValue>;
        }
    >();
  });

  it("matches the native provider activation host contract", () => {
    expectTypeOf<ExtensionProviderActivationContext["extensionId"]>()
      .toEqualTypeOf<string>();
    expectTypeOf<ExtensionProviderActivationContext["host"]>()
      .toEqualTypeOf<ExtensionHostApi<never>>();
    expectTypeOf<ExtensionProviderActivationContext<"storage">["host"]>()
      .toEqualTypeOf<ExtensionHostApi<"storage">>();
    expectTypeOf<ExtensionHostCapabilityMap["terminal"]["profiles"]>()
      .returns.toEqualTypeOf<Promise<readonly ExtensionHostTerminalProfileDescriptor[]>>();
    expectTypeOf<Parameters<ExtensionHostCapabilityMap["network"]["request"]>[0]>()
      .toEqualTypeOf<ExtensionNetworkRequest>();
    expectTypeOf<Parameters<ExtensionHostCapabilityMap["workspace.read"]["findFiles"]>[0]>()
      .toEqualTypeOf<ExtensionWorkspaceFileQuery>();
    expectTypeOf<Awaited<ReturnType<
      ExtensionHostCapabilityMap["workspace.read"]["findFiles"]
    >>>().toEqualTypeOf<readonly ExtensionWorkspaceFile[]>();
    expectTypeOf<Awaited<ReturnType<
      ExtensionHostCapabilityMap["workspace.read"]["relativePath"]
    >>>().toEqualTypeOf<string | null>();
    expectTypeOf<Parameters<
      ExtensionHostCapabilityMap["terminal.packages"]["requestTransaction"]
    >[0]>().toEqualTypeOf<{
      readonly stack: string;
      readonly intent: ExtensionTerminalPackageIntent;
    }>();
    expectTypeOf<Awaited<ReturnType<
      ExtensionHostCapabilityMap["terminal.packages"]["requestTransaction"]
    >>>().toEqualTypeOf<ExtensionTerminalPackageTransactionReceipt>();
  });

  it("observes the canonical cancellation token", () => {
    const throwIfCancelled = vi.fn();
    throwIfCancellationRequested({
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose() {} }),
      throwIfCancellationRequested: throwIfCancelled,
    });
    expect(throwIfCancelled).toHaveBeenCalledOnce();
  });
});
