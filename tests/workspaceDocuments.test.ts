import { expect, expectTypeOf, it } from 'vitest';
import { EXTENSION_HOST_API_METHODS, EXTENSION_HOST_API_INTERACTIVE_METHODS,
  type ExtensionHostCapabilityMap, type ExtensionWorkspaceSnapshot,
  type ExtensionWorkspaceWriteTextRequest, type ExtensionWorkspaceWriteTextResult,
  type ExtensionWorkspaceDirectoryEntry } from '../src/index.js';

it('keeps document reads, direct directory listings and reviewed writes in generic workspace capabilities', () => {
  expectTypeOf<Awaited<ReturnType<ExtensionHostCapabilityMap['workspace.read']['snapshot']>>>().toEqualTypeOf<ExtensionWorkspaceSnapshot>();
  expectTypeOf<Awaited<ReturnType<ExtensionHostCapabilityMap['workspace.read']['listDirectory']>>>().toEqualTypeOf<readonly ExtensionWorkspaceDirectoryEntry[]>();
  expectTypeOf<Parameters<ExtensionHostCapabilityMap['workspace.write']['writeText']>[0]>().toEqualTypeOf<ExtensionWorkspaceWriteTextRequest>();
  expectTypeOf<Awaited<ReturnType<ExtensionHostCapabilityMap['workspace.write']['writeText']>>>().toEqualTypeOf<ExtensionWorkspaceWriteTextResult>();
  expect(EXTENSION_HOST_API_METHODS['workspace.read']).toContain('snapshot');
  expect(EXTENSION_HOST_API_INTERACTIVE_METHODS).toContain('workspace.write:writeText');
});

it('allows a definitive applied result when cancellation or project closure prevents a fresh snapshot', () => {
  const result: ExtensionWorkspaceWriteTextResult = { applied: true };
  expect(result.applied).toBe(true);
  expectTypeOf<ExtensionWorkspaceSnapshot['revision']>().toEqualTypeOf<string>();
});
