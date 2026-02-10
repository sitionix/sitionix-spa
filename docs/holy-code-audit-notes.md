# Holy Code Audit Notes — Builder v1

## Findings (before)
- UI layer invoked persistence directly (`saveDraft` in TopBar), violating application boundary.
- Reusable empty-state rendering was duplicated across Canvas/Inspector/Components placeholders.
- Dependency gate lived in `ui/components` without clear “pattern” grouping.
- Domain rules for deterministic active-page selection lacked explicit guardrails in tests.

## Fixes applied
- **Application boundary:** `saveDraft` is now triggered through `builderStore` actions; UI only dispatches events.
- **Reusable patterns:** introduced `EmptyState` and moved `DependencyGate` under `ui/patterns/` for clear reuse.
- **Inspector layout:** already isolated as `ui/inspector/InspectorLayout` (no page-specific knowledge).
- **Determinism tests:** added domain test coverage for delete-active selection (“next else prev”) and dependency checks.
- **Types:** added explicit domain types (`Slug`, `PageMetaPatch`, `CommandResult`) to clarify intent.

## Rules now enforced
- UI only renders + dispatches events; no persistence side-effects.
- Domain owns normalization/validation/policies; application orchestrates commands and persistence.
- Deterministic page deletion selection is enforced by tests.
- Empty states and dependency gating are reusable patterns.

## Notes
- No UX/behavior changes were introduced; only structural cleanup and test coverage.
