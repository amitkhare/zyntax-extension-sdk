import type {
  ExtensionJsonObject,
  ExtensionJsonValue,
} from "../contracts/json.js";
import type { ExtensionStreamSink } from "../contract.js";

import type { AIModelDescriptor } from "./capabilities.js";

export interface AgentContributionReference {
  readonly extensionId: string;
  readonly contributionId: string;
}

export type AgentMessageRole = "system" | "user" | "assistant" | "tool";

export type AgentMessagePart =
  | { readonly kind: "text"; readonly text: string }
  | {
      readonly kind: "asset";
      /** Host-owned opaque asset reference; never a filesystem path. */
      readonly assetId: string;
      readonly mediaType: string;
      readonly name?: string;
    }
  | {
      readonly kind: "toolCall";
      readonly callId: string;
      readonly tool: string;
      readonly input: ExtensionJsonObject;
    }
  | {
      readonly kind: "toolResult";
      readonly callId: string;
      readonly output: ExtensionJsonValue;
      readonly isError: boolean;
    };

export interface AgentConversationMessage {
  readonly id: string;
  readonly role: AgentMessageRole;
  readonly parts: readonly AgentMessagePart[];
}

export interface AgentToolDescriptor {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ExtensionJsonObject;
}

export interface AgentSessionOpenRequest {
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly harness: AgentContributionReference;
  readonly provider: AgentContributionReference;
  readonly modelId: string;
  /** Host-owned persisted transcript supplied as an immutable snapshot. */
  readonly history: readonly AgentConversationMessage[];
}

export interface AgentPromptRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly message: AgentConversationMessage;
}

export type AgentCancellationReason =
  | "user"
  | "superseded"
  | "sessionClosed"
  | "hostShutdown";

/** Serializable cancellation message sent across the extension boundary. */
export interface AgentCancellationRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly reason: AgentCancellationReason;
}

export type AgentSessionCloseReason = "idle" | "user" | "hostShutdown";

export interface AgentSessionCloseRequest {
  readonly sessionId: string;
  readonly reason: AgentSessionCloseReason;
}

export interface AgentHostToolRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly tool: string;
  readonly input: ExtensionJsonObject;
}

export interface AgentHostToolResult {
  readonly requestId: string;
  readonly output: ExtensionJsonValue;
  readonly isError: boolean;
}

export interface AgentWorkspaceTextEdit {
  readonly uri: string;
  readonly version: number;
  readonly edits: readonly {
    readonly from: number;
    readonly to: number;
    readonly text: string;
  }[];
}

export interface AgentWorkspaceEditProposalRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly summary: string;
  readonly changes: readonly AgentWorkspaceTextEdit[];
}

export interface AgentWorkspaceEditProposalResult {
  readonly requestId: string;
  readonly proposalId: string;
  readonly status: "pendingReview";
}

export interface AIProviderModelListRequest {
  readonly requestId: string;
  readonly provider: AgentContributionReference;
}

export interface AIProviderModelListResult {
  readonly requestId: string;
  readonly models: readonly AIModelDescriptor[];
}

export interface AIProviderStreamRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly provider: AgentContributionReference;
  readonly modelId: string;
  readonly messages: readonly AgentConversationMessage[];
  readonly tools: readonly AgentToolDescriptor[];
  /** Validated provider-owned settings. Credentials stay in the host vault. */
  readonly settings: ExtensionJsonObject;
}

export interface AIProviderUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly cachedInputTokens?: number;
  readonly reasoningTokens?: number;
}

export interface AgentProtocolError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

/** JSON-only stream frames emitted independently by a selected provider. */
export type AIProviderStreamEvent =
  | { readonly kind: "started"; readonly requestId: string }
  | {
      readonly kind: "textDelta";
      readonly requestId: string;
      readonly delta: string;
    }
  | {
      readonly kind: "reasoningDelta";
      readonly requestId: string;
      readonly delta: string;
    }
  | {
      readonly kind: "toolCall";
      readonly requestId: string;
      readonly callId: string;
      readonly tool: string;
      readonly input: ExtensionJsonObject;
    }
  | {
      readonly kind: "usage";
      readonly requestId: string;
      readonly usage: AIProviderUsage;
    }
  | {
      readonly kind: "completed";
      readonly requestId: string;
      readonly finishReason: "stop" | "length" | "toolCalls";
    }
  | {
      readonly kind: "cancelled";
      readonly requestId: string;
      readonly reason: AgentCancellationReason;
    }
  | {
      readonly kind: "failed";
      readonly requestId: string;
      readonly error: AgentProtocolError;
    };

export type AgentHarnessStreamEvent =
  | AIProviderStreamEvent
  | {
      readonly kind: "status";
      readonly requestId: string;
      readonly status: "planning" | "runningTool" | "waitingForApproval";
      readonly label?: string;
    }
  | {
      readonly kind: "workspaceEdit";
      readonly requestId: string;
      /** Opaque host-staged edit proposal; application remains host-owned. */
      readonly proposalId: string;
      readonly summary: string;
    };

export type AgentStreamSink<TEvent> = ExtensionStreamSink<TEvent>;

/** Exact selected-provider route. The host owns dispatch and permissions. */
export interface AgentAIProviderBroker {
  listModels(request: AIProviderModelListRequest): Promise<AIProviderModelListResult>;
  stream(
    request: AIProviderStreamRequest,
    sink: AgentStreamSink<AIProviderStreamEvent>,
  ): Promise<void>;
  cancel(request: AgentCancellationRequest): Promise<void>;
}

export interface AgentToolBroker {
  invoke(request: AgentHostToolRequest): Promise<AgentHostToolResult>;
}

export interface AgentWorkspaceEditBroker {
  stage(
    request: AgentWorkspaceEditProposalRequest,
  ): Promise<AgentWorkspaceEditProposalResult>;
}

/** Services mediated by the host; none grants direct native or WebView access. */
export interface AgentHarnessHostServices {
  readonly provider: AgentAIProviderBroker;
  readonly tools: AgentToolBroker;
  readonly workspaceEdits: AgentWorkspaceEditBroker;
}

/** Runtime object returned by the one selected harness contribution. */
export interface AgentHarnessSession {
  submit(
    request: AgentPromptRequest,
    sink: AgentStreamSink<AgentHarnessStreamEvent>,
  ): Promise<void>;
  cancel(request: AgentCancellationRequest): Promise<void>;
  dispose(request: AgentSessionCloseRequest): Promise<void>;
}

export interface AgentHarnessSessionActivator {
  activate(
    request: AgentSessionOpenRequest,
    host: AgentHarnessHostServices,
  ): Promise<AgentHarnessSession>;
}

/** Package-level harness instance; individual sessions dispose independently. */
export interface AgentHarnessAdapter extends AgentHarnessSessionActivator {
  dispose(): void | Promise<void>;
}

/** Runtime object returned by the one selected provider contribution. */
export interface AIProviderAdapter {
  listModels(request: AIProviderModelListRequest): Promise<AIProviderModelListResult>;
  stream(
    request: AIProviderStreamRequest,
    sink: AgentStreamSink<AIProviderStreamEvent>,
  ): Promise<void>;
  cancel(request: AgentCancellationRequest): Promise<void>;
  dispose(): void | Promise<void>;
}
