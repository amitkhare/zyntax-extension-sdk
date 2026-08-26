import type {
  AgentProviderRequirements,
  AIProviderCapabilitySelector,
} from "./capabilities.js";

export interface AgentHarnessContribution {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  /** Competing harnesses in the same group require a deterministic selection. */
  readonly group: string;
  readonly priority: number;
  readonly composition: "exclusive";
  /** Symbolic package module resolved from the verified active manifest. */
  readonly module: string;
  readonly export: string;
  readonly providerRequirements: AgentProviderRequirements;
  readonly lifecycle: {
    /** Delay after final session demand ends before the harness is disposed. */
    readonly idleTimeoutMs: number;
  };
}

export interface AIProviderContribution {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  /** Competing providers in the same group require a deterministic selection. */
  readonly group: string;
  readonly priority: number;
  readonly composition: "exclusive";
  /** Symbolic package module resolved from the verified active manifest. */
  readonly module: string;
  readonly export: string;
  readonly selector: AIProviderCapabilitySelector;
}
