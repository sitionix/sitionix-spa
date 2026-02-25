import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../App";

const createShellRouterMock = vi.fn();
const bootstrapMock = vi.fn();
const configureMock = vi.fn();
const getAccessTokenMock = vi.fn();
const onUnauthenticatedMock = vi.fn(() => () => undefined);

vi.mock("../../app/router", () => ({
  createShellRouter: (...args: unknown[]) => createShellRouterMock(...args),
}));

vi.mock("react-router-dom", () => ({
  RouterProvider: () => <div data-testid="router-provider">router</div>,
}));

vi.mock("@sitionix/auth-session", () => ({
  authSessionManager: {
    bootstrap: (...args: unknown[]) => bootstrapMock(...args),
    configure: (...args: unknown[]) => configureMock(...args),
    getAccessToken: (...args: unknown[]) => getAccessTokenMock(...args),
    onUnauthenticated: (...args: unknown[]) => onUnauthenticatedMock(...args),
  },
}));

describe("Shell App bootstrap gate", () => {
  beforeEach(() => {
    createShellRouterMock.mockReset();
    createShellRouterMock.mockReturnValue({} as never);
    configureMock.mockReset();
    onUnauthenticatedMock.mockReset();
    onUnauthenticatedMock.mockReturnValue(() => undefined);
    bootstrapMock.mockReset();
    getAccessTokenMock.mockReset();
  });

  it("shows loader until bootstrap completes and then routes as authenticated", async () => {
    // Given
    let resolveBootstrap: () => void = () => undefined;
    bootstrapMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveBootstrap = resolve;
      })
    );
    getAccessTokenMock.mockReturnValue("token");

    // When
    render(<App />);

    // Then
    expect(screen.getByText("Loading session...")).toBeInTheDocument();
    resolveBootstrap();

    await waitFor(() => {
      expect(screen.getByTestId("router-provider")).toBeInTheDocument();
    });
    expect(createShellRouterMock).toHaveBeenLastCalledWith({
      isAuthenticated: true,
    });
  });
});
