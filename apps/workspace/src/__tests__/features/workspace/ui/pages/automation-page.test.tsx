import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AutomationPage } from "../../../../../features/workspace/ui/pages/AutomationPage";
import { getAgents } from "../../../../../features/workspace/api/agentsApi";

vi.mock("../../../../../features/workspace/api/agentsApi", () => ({
  getAgents: vi.fn(),
}));

vi.mock("../../../../../features/workspace/ui/components/CreateAgentSheet", () => ({
  CreateAgentSheet: ({
    open,
    onClose,
    onCreated,
  }: {
    open: boolean;
    onClose: () => void;
    onCreated: (agent: {
      id: string;
      name: string;
      description: string;
      status: "DRAFT";
      createdAt: string;
      updatedAt: string;
    }) => void;
  }) => (
    open ? (
      <div>
        <button type="button" onClick={onClose}>
          Close mocked sheet
        </button>
        <button
          type="button"
          onClick={() =>
            onCreated({
              id: "agent-created",
              name: "Created Agent",
              description: "Created description",
              status: "DRAFT",
              createdAt: "2026-04-11T10:00:00.000Z",
              updatedAt: "2026-04-11T10:00:00.000Z",
            })
          }
        >
          Emit created
        </button>
      </div>
    ) : null
  ),
}));

const getAgentsMock = vi.mocked(getAgents);

describe("AutomationPage", () => {
  beforeEach(() => {
    getAgentsMock.mockReset();
  });

  it("renders empty state when no agents are returned", async () => {
    getAgentsMock.mockResolvedValue([]);

    render(<AutomationPage />);

    expect(await screen.findByText("No agents yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Create Agent" })).toHaveLength(2);
  });

  it("renders error block and retries loading", async () => {
    const firstError = new Error("Network unavailable");
    getAgentsMock
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce([
        {
          id: "agent-1",
          name: "Agent",
          description: "Description",
          status: "DRAFT",
          createdAt: "2026-04-11T10:00:00.000Z",
          updatedAt: "2026-04-11T10:00:00.000Z",
        },
      ]);

    render(<AutomationPage />);

    expect(await screen.findByText("Не вдалося завантажити Automation")).toBeInTheDocument();
    expect(screen.getByText("Network unavailable")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Agent")).toBeInTheDocument();
    expect(getAgentsMock).toHaveBeenCalledTimes(2);
  });

  it("opens create sheet and prepends created agent", async () => {
    getAgentsMock.mockResolvedValue([
      {
        id: "agent-1",
        name: "Existing Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ]);

    const user = userEvent.setup();
    render(<AutomationPage />);

    expect(await screen.findByText("Existing Agent")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Agent" }));
    await user.click(screen.getByRole("button", { name: "Emit created" }));

    await waitFor(() => {
      const headings = screen.getAllByRole("heading", { level: 2 });
      expect(headings[0]).toHaveTextContent("Created Agent");
    });
  });
});
