import type { ApiError } from "@sitionix/contracts";

export function normalizeRegisterError(error: ApiError | null | undefined): ApiError {
  if (!error) {
    return {
      code: 0,
      title: "Unknown error",
      details: "Unexpected error",
    };
  }
  return error;
}
