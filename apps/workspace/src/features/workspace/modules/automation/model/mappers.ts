export function toAutomationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
