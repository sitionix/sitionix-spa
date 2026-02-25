import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
});
