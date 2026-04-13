import type { ErrorDTO } from "@sitionix/app-afesox-bffssox-frontend-sitionix-108-unstable/models";

export function normalizeRegisterError(error: ErrorDTO | null | undefined): ErrorDTO {
  if (!error) {
    return {
      code: 0,
      title: "Unknown error",
      details: "Unexpected error",
    };
  }
  return error;
}
