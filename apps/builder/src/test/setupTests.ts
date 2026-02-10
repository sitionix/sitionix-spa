import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
