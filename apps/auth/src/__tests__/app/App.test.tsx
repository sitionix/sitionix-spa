import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { authSessionManager } from "@sitionix/auth-session";
import { App } from "../../app/App";

describe("App", () => {
  it("Given App When rendered Then shows routes content", async () => {
    // Given
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Then
    await waitFor(() => {
      expect(screen.getByText("Реєстраці")).toBeInTheDocument();
    });
  });

  it("Given AuthApp When rendered Then doesNotBootstrapSession", async () => {
    // Given
    const bootstrapSpy = vi.spyOn(authSessionManager, "bootstrap");

    // When
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Then
    await waitFor(() => {
      expect(screen.getByText("Реєстраці")).toBeInTheDocument();
    });
    expect(bootstrapSpy).not.toHaveBeenCalled();
  });
});
