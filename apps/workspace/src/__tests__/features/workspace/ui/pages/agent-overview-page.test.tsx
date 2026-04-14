import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { formatDateTime } from "../../../../../features/workspace/model/formatters";
import { AgentOverviewPage } from "../../../../../features/workspace/modules/automation/pages/AgentOverviewPage";
import {
  getAgentById,
  getErrorHttpStatus,
} from "../../../../../features/workspace/modules/automation/api";

vi.mock("../../../../../features/workspace/modules/automation/api", () => ({
  getAgentById: vi.fn(),
  getErrorHttpStatus: vi.fn(),
}));

const getAgentByIdMock = vi.mocked(getAgentById);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);

const agent = {
  id: "agent-1",
  name: "Overview Agent",
  description: "Agent overview description",
  status: "DRAFT" as const,
  createdAt: "2026-04-11T10:00:00.000Z",
  updatedAt: "2026-04-12T15:30:00.000Z",
};

function renderOverview(initialPath = "/automation/agents/agent-1") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/automation" element={<div>Automation Home</div>} />
        <Route path="/automation/agents/:agentId" element={<AgentOverviewPage />} />
        <Route path="/automation/agents" element={<AgentOverviewPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AgentOverviewPage", () => {
  beforeEach(() => {
    getAgentByIdMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("renders loading and then successful overview with future-ready sections", async () => {
    getAgentByIdMock.mockResolvedValue(agent);

    renderOverview();

    expect(screen.getByText("Loading agent overview...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Overview Agent" })).toBeInTheDocument();
    expect(screen.getByText("Agent overview description")).toBeInTheDocument();
    expect(screen.getByText("ID: agent-1")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(agent.createdAt))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(agent.updatedAt))).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Configuration" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rules" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suggested Rules" })).toBeInTheDocument();
    expect(
      screen.getByText("System-suggested candidate rules will appear here once rule suggestions are available.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/guidance support/i)).not.toBeInTheDocument();
  });

  it("renders not-found state for 404 and supports back navigation", async () => {
    const notFoundError = new Error("Not found");
    getAgentByIdMock.mockRejectedValue(notFoundError);
    getErrorHttpStatusMock.mockReturnValue(404);

    const user = userEvent.setup();
    renderOverview();

    expect(await screen.findByRole("heading", { name: "Agent not found" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to Automation" }));
    expect(await screen.findByText("Automation Home")).toBeInTheDocument();
  });

  it("renders generic error state and retries loading", async () => {
    const user = userEvent.setup();
    getAgentByIdMock.mockRejectedValueOnce(new Error("Boom")).mockResolvedValueOnce(agent);
    getErrorHttpStatusMock.mockReturnValue(null);

    renderOverview();

    expect(await screen.findByRole("heading", { name: "Unable to load Agent Overview" })).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Agent Overview" })).toBeInTheDocument();
    expect(getAgentByIdMock).toHaveBeenCalledTimes(2);
  });

  it("renders not-found and skips api call when agentId route param is missing", async () => {
    renderOverview("/automation/agents");

    expect(await screen.findByRole("heading", { name: "Agent not found" })).toBeInTheDocument();
    expect(getAgentByIdMock).not.toHaveBeenCalled();
  });
});
