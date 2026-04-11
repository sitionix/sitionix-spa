import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateAgentSheet } from "../../../../../features/workspace/ui/components/CreateAgentSheet";
import { createAgent } from "../../../../../features/workspace/api/agentsApi";

vi.mock("../../../../../features/workspace/api/agentsApi", () => ({
  createAgent: vi.fn(),
}));

const createAgentMock = vi.mocked(createAgent);

describe("CreateAgentSheet", () => {
  beforeEach(() => {
    createAgentMock.mockReset();
  });

  it("returns null when sheet is closed", () => {
    render(<CreateAgentSheet open={false} onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.queryByRole("heading", { name: "Create Agent" })).not.toBeInTheDocument();
  });

  it("validates required fields and submits trimmed payload", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();

    createAgentMock.mockResolvedValue({
      id: "agent-1",
      name: "Agent",
      description: "Description",
      status: "DRAFT",
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    render(<CreateAgentSheet open onClose={onClose} onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: "Create Agent" }));

    expect(await screen.findByText("Назва агента обов'язкова.")).toBeInTheDocument();
    expect(screen.getByText("Опис агента обов'язковий.")).toBeInTheDocument();
    expect(createAgentMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Name"), "  Agent  ");
    await user.type(screen.getByLabelText("Description"), "  Description  ");
    await user.click(screen.getByRole("button", { name: "Create Agent" }));

    expect(createAgentMock).toHaveBeenCalledWith({
      name: "Agent",
      description: "Description",
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onCreated).toHaveBeenCalledWith({
        id: "agent-1",
        name: "Agent",
        description: "Description",
        status: "DRAFT",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      });
    });
  });

  it("shows error toast when create request fails", async () => {
    const user = userEvent.setup();

    createAgentMock.mockRejectedValue(new Error("Boom"));

    render(<CreateAgentSheet open onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Agent");
    await user.type(screen.getByLabelText("Description"), "Description");
    await user.click(screen.getByRole("button", { name: "Create Agent" }));

    expect(
      await screen.findByText("Не вдалося створити агента. Спробуйте ще раз.")
    ).toBeInTheDocument();
  });

  it("closes on overlay click and on escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <CreateAgentSheet open onClose={onClose} onCreated={vi.fn()} />
    );

    await user.click(screen.getByLabelText("Close create agent sheet"));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CreateAgentSheet open onClose={onClose} onCreated={vi.fn()} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
