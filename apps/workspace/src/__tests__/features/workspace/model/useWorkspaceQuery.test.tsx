import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useWorkspaceQuery } from "../../../../features/workspace/model/useWorkspaceQuery";

function TestHarness({ fetcher }: { fetcher: () => Promise<string> }) {
  const { status, data, error, refresh } = useWorkspaceQuery(fetcher, [fetcher]);
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="data">{data ?? "none"}</div>
      <div data-testid="error">{error ?? ""}</div>
      <button onClick={() => void refresh()}>refresh</button>
    </div>
  );
}

describe("useWorkspaceQuery", () => {
  it("loads data and exposes ready state", async () => {
    const fetcher = vi.fn().mockResolvedValue("ok");

    render(<TestHarness fetcher={fetcher} />);

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("ready");
    });

    expect(screen.getByTestId("data").textContent).toBe("ok");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("handles errors", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("boom"));

    render(<TestHarness fetcher={fetcher} />);

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("error");
    });

    expect(screen.getByTestId("error").textContent).toBe("boom");
  });
});
