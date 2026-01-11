import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthRoutes } from "../../app/router";

describe("AuthRoutes", () => {
  it("Given default route When rendered Then shows registration page", () => {
    // Given
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthRoutes />
      </MemoryRouter>
    );

    // When
    const title = screen.getByText("Реєстраці");

    // Then
    expect(title).toBeInTheDocument();
  });

  it("Given authorisation route When rendered Then shows authorisation page", () => {
    // Given
    render(
      <MemoryRouter initialEntries={["/authorisation"]}>
        <AuthRoutes />
      </MemoryRouter>
    );

    // When
    const title = screen.getByText("Авторизація");

    // Then
    expect(title).toBeInTheDocument();
  });
});
