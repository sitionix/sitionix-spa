import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../app/App";

describe("App", () => {
  it("Given App When rendered Then shows routes content", () => {
    // Given
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // When
    const title = screen.getByText("Реєстраці");

    // Then
    expect(title).toBeInTheDocument();
  });
});
