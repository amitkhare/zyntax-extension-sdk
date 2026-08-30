import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  EXTENSION_API_VERSION,
  EXTENSION_CONTRIBUTION_FIELDS,
  EXTENSION_DEVELOPMENT_STACK_MAX_CONTRIBUTIONS,
  EXTENSION_DEVELOPMENT_STACK_MAX_REQUIREMENTS,
  EXTENSION_DIAGNOSTICS_MAX_BYTES,
  EXTENSION_DIAGNOSTICS_MAX_ITEMS,
  EXTENSION_DIAGNOSTICS_MAX_TOTAL_BYTES,
  EXTENSION_DIAGNOSTICS_MAX_TOTAL_ITEMS,
  EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH,
  EXTENSION_EXECUTION_MAX_ARGUMENTS,
  EXTENSION_LSP_DOCUMENT_CAPABILITIES,
  EXTENSION_LSP_EXCLUSIVE_CAPABILITIES,
  EXTENSION_LSP_POSITION_CAPABILITIES,
  EXTENSION_MANAGED_TOOL_INVOCATION_METHOD,
  EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION,
  EXTENSION_MANAGED_TOOL_MAX_FRAME_BYTES,
  EXTENSION_MANAGED_TOOL_MAX_REQUEST_BYTES,
  EXTENSION_MANAGED_TOOL_MAX_RESULT_BYTES,
  EXTENSION_NOTEBOOK_KERNEL_CANCEL_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_COMM_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_EVENT_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_EXECUTE_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_INITIALIZE_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_INPUT_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_INTERRUPT_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_JSON_RPC_VERSION,
  EXTENSION_NOTEBOOK_KERNEL_PROTOCOL,
  EXTENSION_NOTEBOOK_KERNEL_RESTART_METHOD,
  EXTENSION_NOTEBOOK_KERNEL_SHUTDOWN_METHOD,
  EXTENSION_JSON_MAX_DEPTH,
  EXTENSION_JSON_MAX_KEY_CODE_UNITS,
  EXTENSION_JSON_MAX_NODES,
  EXTENSION_PROVIDER_METHODS,
  EXTENSION_PERMISSIONS,
  EXTENSION_PREVIEW_MAX_INPUT_BYTES,
  EXTENSION_PREVIEW_MAX_BINARY_INPUT_BYTES,
  EXTENSION_PREVIEW_MAX_RESULT_BYTES,
  EXTENSION_RUNTIME_SOURCE_KINDS,
  EXTENSION_TASK_CONSOLES,
  EXTENSION_TASK_EXECUTION_KINDS,
  EXTENSION_TASK_PROVIDER_MAX_ITEMS,
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
  extensionJsonUtf8ByteLength,
  isExtensionExecutionArgument,
  isExtensionRuntimeCommandConfigurationReference,
  isExtensionRuntimeCommandReference,
  isExtensionRuntimeRequirementSources,
  throwIfCancellationRequested,
  type ExtensionCompletionProvider,
  type ExtensionAssistedEditProviderContribution,
  type ExtensionHostCapabilityMap,
  type ExtensionHostApi,
  type ExtensionHostPermission,
  type ExtensionHoverProvider,
  type ExtensionHtmlPreviewPolicy,
  type ExtensionHostTerminalProfileDescriptor,
  type ExtensionTerminalPackageIntent,
  type ExtensionTerminalPackageTransactionReceipt,
  type ExtensionJsonValue,
  type ExtensionLanguageServerCapabilityMatrix,
  type ExtensionManifest,
  type ExtensionNetworkRequest,
  type ExtensionNotebookExecutionRequest,
  type ExtensionNotebookKernelDescriptor,
  type ExtensionNotebookKernelEvent,
  type ExtensionNotebookKernelInputResult,
  type ExtensionNotebookKernelRestartRequest,
  type ExtensionPreviewProvider,
  type ExtensionPreviewProviderContribution,
  type ExtensionPreviewRequest,
  type ExtensionProviderConfigurationValue,
  type ExtensionProjectTemplatePlan,
  type ExtensionProviderActivationContext,
  type ExtensionManagedToolTaskExecution,
  type ExtensionRuntimeDescriptor,
  type ExtensionRuntimeCommandConfigurationReference,
  type ExtensionRuntimeCommandReference,
  type ExtensionRuntimeProviderContribution,
  type ExtensionRuntimeRequirement,
  type ExtensionRuntimeRequirementSources,
  type ExtensionRuntimeSelection,
  type ExtensionRuntimeTaskExecution,
  type ExtensionToolResourceReference,
  type ExtensionTaskExecution,
  type ExtensionTextMateGrammarContribution,
  type ExtensionWorkspaceFile,
  type ExtensionWorkspaceFileQuery,
} from "../src/index.js";

describe("public extension SDK", () => {
  it("keeps inline HTML previews script-blocked", () => {
    const policy: ExtensionHtmlPreviewPolicy = { subresources: "project" };
    expect(policy).toEqual({ subresources: "project" });
    // @ts-expect-error Script policy is host-owned and not an extension contract.
    const scripted: ExtensionHtmlPreviewPolicy = { subresources: "project", scripts: "allow" };
    void scripted;
  });

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

  it("validates exact runtime requirement source declarations", () => {
    expect(isExtensionRuntimeRequirementSources({ selected: true })).toBe(true);
    expect(isExtensionRuntimeRequirementSources({
      managed: { tool: "zyntax.python-runtime" },
    })).toBe(true);
    expect(isExtensionRuntimeRequirementSources({
      selected: true,
      managed: { tool: "zyntax.python-runtime" },
    })).toBe(true);

    expect(isExtensionRuntimeRequirementSources(undefined)).toBe(false);
    expect(isExtensionRuntimeRequirementSources({})).toBe(false);
    expect(isExtensionRuntimeRequirementSources({ automatic: true })).toBe(false);
    expect(isExtensionRuntimeRequirementSources({ selected: false })).toBe(false);
    expect(isExtensionRuntimeRequirementSources({
      managed: { tool: "zyntax.python-runtime", command: "python" },
    })).toBe(false);
    expect(isExtensionRuntimeRequirementSources({
      managed: { tool: "/data/data/com.termux/files/usr/bin/python" },
    })).toBe(false);
  });

  it("exports the canonical API and provider method contract", () => {
    expect(EXTENSION_API_VERSION).toBe(1);
    expect(EXTENSION_MANAGED_TOOL_JSON_RPC_VERSION).toBe("2.0");
    expect(EXTENSION_MANAGED_TOOL_INVOCATION_METHOD).toBe("zyntax/toolInvocation");
    expect(EXTENSION_MANAGED_TOOL_MAX_FRAME_BYTES).toBe(4 * 1024 * 1024);
    expect(EXTENSION_MANAGED_TOOL_MAX_REQUEST_BYTES).toBe((4 * 1024 * 1024) - (4 * 1024));
    expect(EXTENSION_MANAGED_TOOL_MAX_RESULT_BYTES).toBe((4 * 1024 * 1024) - (4 * 1024));
    expect(EXTENSION_NOTEBOOK_KERNEL_PROTOCOL).toBe("zyntax-notebook-jsonrpc");
    expect(EXTENSION_NOTEBOOK_KERNEL_JSON_RPC_VERSION).toBe("2.0");
    expect([
      EXTENSION_NOTEBOOK_KERNEL_INITIALIZE_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_EXECUTE_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_INTERRUPT_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_RESTART_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_SHUTDOWN_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_EVENT_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_INPUT_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_COMM_METHOD,
      EXTENSION_NOTEBOOK_KERNEL_CANCEL_METHOD,
    ]).toEqual([
      "zyntax/notebook/initialize",
      "zyntax/notebook/execute",
      "zyntax/notebook/interrupt",
      "zyntax/notebook/restart",
      "zyntax/notebook/shutdown",
      "zyntax/notebook/event",
      "zyntax/notebook/input",
      "zyntax/notebook/comm",
      "$/cancelRequest",
    ]);
    expect(EXTENSION_DIAGNOSTICS_MAX_BYTES).toBe((4 * 1024 * 1024) - (4 * 1024));
    expect(EXTENSION_DIAGNOSTICS_MAX_ITEMS).toBe(16_384);
    expect(EXTENSION_DIAGNOSTICS_MAX_TOTAL_BYTES).toBe(16 * 1024 * 1024);
    expect(EXTENSION_DIAGNOSTICS_MAX_TOTAL_ITEMS).toBe(65_536);
    expect(EXTENSION_TASK_PROVIDER_MAX_ITEMS).toBe(4_096);
    expect(EXTENSION_PREVIEW_MAX_INPUT_BYTES).toBe(10 * 1024 * 1024);
    expect(EXTENSION_PREVIEW_MAX_BINARY_INPUT_BYTES).toBe(24 * 1024 * 1024);
    expect(EXTENSION_PREVIEW_MAX_RESULT_BYTES).toBe(16 * 1024 * 1024);
    expect(EXTENSION_JSON_MAX_DEPTH).toBe(60);
    expect(EXTENSION_JSON_MAX_NODES).toBe(1_000_000 - 16);
    expect(EXTENSION_JSON_MAX_KEY_CODE_UNITS).toBe(256);
    expect(EXTENSION_EXECUTION_MAX_ARGUMENTS).toBe(32);
    expect(EXTENSION_EXECUTION_MAX_ARGUMENT_LENGTH).toBe(512);
    expect(EXTENSION_PERMISSIONS).toContain("terminal.packages");
    expect(EXTENSION_PERMISSIONS).toContain("runtimes.execute");
    expect(EXTENSION_CONTRIBUTION_FIELDS).toContain("developmentStacks");
    expect(EXTENSION_CONTRIBUTION_FIELDS).toContain("runtimeProviders");
    expect(EXTENSION_RUNTIME_SOURCE_KINDS).toEqual([
      "terminalPackage",
      "managedTool",
    ]);
    expect(EXTENSION_TASK_EXECUTION_KINDS).toEqual(["managedTool", "runtime"]);
    expect(EXTENSION_TASK_CONSOLES).toEqual(["terminal", "captured"]);
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
    expect(isExtensionRuntimeCommandReference({
      requirement: "project-runtime",
      command: "runtime",
    })).toBe(true);
    expect(isExtensionRuntimeCommandReference({
      requirement: "project-runtime",
      command: "runtime",
      executable: "/bin/runtime",
    })).toBe(false);
    expect(isExtensionRuntimeCommandReference({
      requirement: "project/runtime",
      command: "runtime",
    })).toBe(false);
    expect(isExtensionRuntimeCommandConfigurationReference({
      $runtimeCommand: {
        requirement: "project-runtime",
        command: "runtime",
      },
    })).toBe(true);
    expect(isExtensionRuntimeCommandConfigurationReference({
      $runtimeCommand: {
        requirement: "project-runtime",
        command: "runtime",
        executable: "/bin/runtime",
      },
    })).toBe(false);
    expect(isExtensionRuntimeCommandConfigurationReference({
      $runtimeCommand: {
        requirement: "project-runtime",
        command: "runtime",
      },
      fallback: "runtime",
    })).toBe(false);
    expect(isExtensionRuntimeCommandConfigurationReference({
      requirement: "project-runtime",
      command: "runtime",
    })).toBe(false);
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
    expectTypeOf<ExtensionNotebookExecutionRequest>().toMatchTypeOf<{
      readonly executionId: string;
      readonly kernelGeneration: number;
      readonly documentVersion: number;
      readonly documentGeneration: number;
      readonly cells: readonly {
        readonly cellId: string;
        readonly languageId: string;
        readonly content: string;
      }[];
    }>();
    expectTypeOf<ExtensionNotebookKernelRestartRequest>().toEqualTypeOf<{
      readonly kernelGeneration: number;
      readonly nextKernelGeneration: number;
    }>();
    expectTypeOf<ExtensionNotebookKernelInputResult>().toEqualTypeOf<
      | Readonly<{ kind: "value"; value: string }>
      | Readonly<{ kind: "cancelled" }>
    >();
    expectTypeOf<ExtensionManifest["runtimeRequirements"]>()
      .toEqualTypeOf<ExtensionRuntimeRequirement[] | undefined>();
    expectTypeOf<ExtensionManifest["required"]>()
      .toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ExtensionRuntimeRequirement>().toEqualTypeOf<{
      readonly id: string;
      readonly runtime: string;
      readonly minimumVersion: string;
      readonly capabilities: readonly string[];
      readonly sources: ExtensionRuntimeRequirementSources;
    }>();
    expectTypeOf<ExtensionRuntimeProviderContribution>().toEqualTypeOf<{
      readonly id: string;
      readonly runtime: string;
      readonly label: string;
      readonly capabilities: readonly string[];
      readonly package: {
        readonly repository: string;
        readonly name: string;
      };
      readonly commands: readonly {
        readonly id: string;
        readonly path: string;
        readonly package?: {
          readonly repository: string;
          readonly name: string;
        };
        readonly capabilities?: readonly string[];
      }[];
      readonly versionProbe: {
        readonly command: string;
        readonly args: readonly string[];
        readonly stream: "stdout" | "stderr";
        readonly prefix: string;
      };
    }>();
    expectTypeOf<ExtensionRuntimeCommandReference>().toEqualTypeOf<{
      readonly requirement: string;
      readonly command: string;
    }>();
    expectTypeOf<
      "source" extends keyof ExtensionRuntimeDescriptor ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<Extract<
      ExtensionTaskExecution,
      { readonly kind: "runtime" }
    >>().toEqualTypeOf<ExtensionRuntimeTaskExecution>();
    expectTypeOf<ExtensionRuntimeTaskExecution>().toMatchTypeOf<{
      readonly kind: "runtime";
      readonly requirement: string;
      readonly command: string;
      readonly args: readonly string[];
      readonly workingDirectory: readonly string[];
      readonly console: "terminal" | "captured";
    }>();
    expectTypeOf<ExtensionRuntimeCommandConfigurationReference>()
      .toEqualTypeOf<{
        readonly $runtimeCommand: ExtensionRuntimeCommandReference;
      }>();
    expectTypeOf<ExtensionRuntimeCommandConfigurationReference>()
      .toMatchTypeOf<ExtensionProviderConfigurationValue>();
    expectTypeOf<ExtensionManagedToolTaskExecution["console"]>()
      .toEqualTypeOf<"terminal" | "captured">();
    expectTypeOf<ExtensionManagedToolTaskExecution["args"]>()
      .toEqualTypeOf<readonly string[]>();
    expectTypeOf<Extract<ExtensionTaskExecution, { readonly kind: "terminal" }>>()
      .toEqualTypeOf<never>();
    expectTypeOf<ExtensionNotebookKernelDescriptor>().toEqualTypeOf<{
      readonly kind: "runtime";
      readonly executable: ExtensionRuntimeCommandReference;
      readonly args: readonly (string | ExtensionToolResourceReference)[];
      readonly protocol: typeof EXTENSION_NOTEBOOK_KERNEL_PROTOCOL;
    }>();
    expectTypeOf<
      "tool" extends keyof ExtensionNotebookKernelDescriptor ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      "entrypoint" extends keyof ExtensionNotebookKernelDescriptor ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      "arguments" extends keyof ExtensionNotebookKernelDescriptor ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      "runtimes.execute" extends ExtensionHostPermission ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<Extract<
      ExtensionRuntimeSelection,
      { readonly state: "ready" }
    >["provider"]["identity"]>().toEqualTypeOf<{
      readonly source:
        | { readonly kind: "terminalPackage"; readonly providerId: string }
        | { readonly kind: "managedTool"; readonly toolId: string };
      readonly runtimeId: string;
      readonly fingerprint: string;
    }>();
    expectTypeOf<Extract<
      ExtensionNotebookKernelEvent,
      { readonly kind: "output" }
    >["mutation"]>().toMatchTypeOf<
      | { readonly operation: "append" | "replace"; readonly cellId: string }
      | { readonly operation: "clear"; readonly cellId: string; readonly wait: boolean }
    >();
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
        placement: "adjacent";
        encoding: "utf8";
        paths: [];
      } extends ExtensionPreviewProviderContribution ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      {
        id: "preview";
        module: "providers/preview.js";
        export: "createPreview";
        input: "text";
        placement: "adjacent";
        languages: [{
          id: "example";
          schemes: ["file"];
          group: "example.preview";
          priority: 100;
          composition: "exclusive";
        }];
      } extends ExtensionPreviewProviderContribution ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      {
        id: "preview";
        module: "providers/preview.js";
        export: "createPreview";
        input: "text";
        encoding: "utf8";
        languages: [{
          id: "example";
          schemes: ["file"];
          group: "example.preview";
          priority: 100;
          composition: "exclusive";
        }];
      } extends ExtensionPreviewProviderContribution ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      {
        id: "preview";
        module: "providers/preview.js";
        export: "createPreview";
        input: "text";
        placement: "adjacent";
        encoding: "base64";
        languages: [{
          id: "example";
          schemes: ["file"];
          group: "example.preview";
          priority: 100;
          composition: "exclusive";
        }];
      } extends ExtensionPreviewProviderContribution ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<
      {
        id: "preview";
        module: "providers/preview.js";
        export: "createPreview";
        input: "document";
        placement: "adjacent";
        encoding: "base64";
        paths: [{
          id: "example";
          glob: "*.png";
          schemes: ["file"];
          group: "example.preview";
          priority: 100;
          composition: "exclusive";
        }];
      } extends ExtensionPreviewProviderContribution ? true : false
    >().toEqualTypeOf<false>();
  });

  it("measures exact host-neutral UTF-8 JSON bytes", () => {
    expect(extensionJsonUtf8ByteLength("a")).toBe(3);
    expect(extensionJsonUtf8ByteLength("界")).toBe(5);
    expect(extensionJsonUtf8ByteLength("😀")).toBe(6);
    expect(() => extensionJsonUtf8ByteLength("\ud800")).toThrow("invalid Unicode");
    expect(() => extensionJsonUtf8ByteLength(undefined)).toThrow("not serializable");
    expect(() => extensionJsonUtf8ByteLength({
      ["x".repeat(EXTENSION_JSON_MAX_KEY_CODE_UNITS + 1)]: null,
    })).toThrow("key exceeds");

    let deeplyNested: unknown = null;
    for (let depth = 0; depth < EXTENSION_JSON_MAX_DEPTH; depth += 1) {
      deeplyNested = [deeplyNested];
    }
    expect(extensionJsonUtf8ByteLength(deeplyNested)).toBe(124);
    expect(() => extensionJsonUtf8ByteLength([deeplyNested])).toThrow(
      "structural limit",
    );
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
          : {
              kind: "markup",
              format: "html",
              content: "<p>Preview</p>",
              scroll: "independent",
            },
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
