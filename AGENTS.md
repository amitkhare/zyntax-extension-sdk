# Repository instructions

- This repository is the canonical public extension contract for Zyntax.
- Keep contracts generic, minimal, DRY, and independent of app internals or individual extension identities.
- Test, build, push, publish to npm, and create the matching Git tag before app or extension consumers use a changed contract.
- Consumers must pin an exact npm release; never document or commit local-path SDK dependencies.
- Keep the SDK README and conformance fixture synchronized with every public contract change.
