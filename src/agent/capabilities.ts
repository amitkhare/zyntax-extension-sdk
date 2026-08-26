import {
  AI_MODEL_CAPABILITIES,
  AI_PROVIDER_CAPABILITIES,
} from "../capabilities.js";

export { AI_MODEL_CAPABILITIES, AI_PROVIDER_CAPABILITIES };

export type AIModelCapability = (typeof AI_MODEL_CAPABILITIES)[number];

export type AIProviderCapability = (typeof AI_PROVIDER_CAPABILITIES)[number];

/** Exact capabilities a harness needs from one provider/model pair. */
export interface AgentProviderRequirements {
  readonly providerCapabilities: readonly AIProviderCapability[];
  readonly modelCapabilities: readonly AIModelCapability[];
}

/** Capabilities advertised by a provider contribution before activation. */
export interface AIProviderCapabilitySelector {
  readonly providerCapabilities: readonly AIProviderCapability[];
  /** Capabilities offered by at least one model exposed by this provider. */
  readonly modelCapabilities: readonly AIModelCapability[];
}

export interface AIModelDescriptor {
  readonly id: string;
  readonly label: string;
  readonly capabilities: readonly AIModelCapability[];
  readonly contextWindow?: number;
  readonly maximumOutputTokens?: number;
}

function containsEvery<T extends string>(
  available: readonly T[],
  required: readonly T[],
): boolean {
  const availableSet = new Set(available);
  return required.every((capability) => availableSet.has(capability));
}

/**
 * Capability matching is conjunctive and exact. An unadvertised capability is
 * incompatible; the host never guesses support or substitutes another model.
 */
export function providerMatchesAgentRequirements(
  selector: AIProviderCapabilitySelector,
  requirements: AgentProviderRequirements,
): boolean {
  return (
    containsEvery(
      selector.providerCapabilities,
      requirements.providerCapabilities,
    ) &&
    containsEvery(selector.modelCapabilities, requirements.modelCapabilities)
  );
}

export function modelMatchesAgentRequirements(
  model: Pick<AIModelDescriptor, "capabilities">,
  requirements: Pick<AgentProviderRequirements, "modelCapabilities">,
): boolean {
  return containsEvery(model.capabilities, requirements.modelCapabilities);
}
