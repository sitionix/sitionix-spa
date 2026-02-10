/* istanbul ignore file -- barrel exports only */
export type {
  PageId,
  Slug,
  PageMeta,
  SiteState,
  ValidationError,
  ValidationResult,
  CommandResult,
  DependencyCheck,
  DependencyResult,
  PageMetaPatch,
} from "./types";
export { asPageId, asSlug } from "./types";

export {
  normalizeSlug,
  slugifyNameToSlug,
} from "./slug";

export {
  validateSlug,
  validatePageName,
  validateUniqueSlug,
} from "./validation";

export {
  ensureUniqueSlug,
  checkDependency,
  applyHomePolicy,
  ensureHomeExists,
} from "./policies";

export type { Command } from "./commands";
export {
  normalizeCommand,
  validateCommand,
  applyCommand,
  runCommand,
} from "./commands";
