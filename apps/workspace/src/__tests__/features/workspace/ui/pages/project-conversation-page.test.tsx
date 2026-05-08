import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectConversationPage } from "../../../../../features/workspace/modules/automation/pages/ProjectConversationPage";
import { getErrorHttpStatus, getProjectConversation } from "../../../../../features/workspace/modules/automation/api/agentsApi";

vi.mock("../../../../../features/workspace/modules/automation/api/agentsApi", () => ({
  getProjectConversation: vi.fn(),
  getErrorHttpStatus: vi.fn(),
}));

const getProjectConversationMock = vi.mocked(getProjectConversation);
const getErrorHttpStatusMock = vi.mocked(getErrorHttpStatus);

describe("ProjectConversationPage", () => {
  beforeEach(() => {
    getProjectConversationMock.mockReset();
    getErrorHttpStatusMock.mockReset();
    getErrorHttpStatusMock.mockReturnValue(null);
  });

  it("renders conversation shell details and disabled messaging", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-1",
      projectId: "project-1",
      project: { id: "project-1", name: "Sitionix", context: "Context" },
      title: "Team chat",
      type: "MULTI_AGENT",
      status: "ACTIVE",
      participants: [{ type: "AGENT", agentId: "agent-1", name: "Writer", description: "Writes copy", status: "ACTIVE" }],
      messages: [],
      canSendMessages: false,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-1"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Team chat")).toBeInTheDocument();
    expect(screen.getByText("Type:")).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    expect(screen.getByText("Messaging for project conversations is not available yet.")).toBeInTheDocument();
  });

  it("renders not found when route params are blank", async () => {
    render(
      <MemoryRouter initialEntries={["/automation/projects/%20/conversations/%20"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Conversation not found")).toBeInTheDocument();
    expect(getProjectConversationMock).not.toHaveBeenCalled();
  });

  it("renders not found on 404 response", async () => {
    getProjectConversationMock.mockRejectedValue(new Error("not found"));
    getErrorHttpStatusMock.mockReturnValue(404);

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-404"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Conversation not found")).toBeInTheDocument();
  });

  it("renders generic error when details loading fails", async () => {
    getProjectConversationMock.mockRejectedValue(new Error("Gateway timeout"));

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-1"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Unable to load conversation")).toBeInTheDocument();
    expect(screen.getByText("Gateway timeout")).toBeInTheDocument();
  });

  it("navigates back to project details", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-1",
      projectId: "project-1",
      project: { id: "project-1", name: "Sitionix", context: "Context" },
      title: "Team chat",
      type: "MULTI_AGENT",
      status: "ACTIVE",
      participants: [],
      messages: [],
      canSendMessages: false,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/automation/projects/project-1/conversations/conv-1"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
          <Route path="/automation/projects/:projectId" element={<div>Project details page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Team chat");
    await user.click(screen.getByRole("button", { name: "Back to Project" }));
    expect(await screen.findByText("Project details page")).toBeInTheDocument();
  });

  it("renders fallback values and filters non-agent participants", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-2",
      projectId: "project-2",
      project: null,
      title: "",
      type: "DIRECT",
      status: "ACTIVE",
      participants: [
        { type: "USER", agentId: null, name: "Owner", description: null, status: "ACTIVE" },
        { type: "AGENT", agentId: "agent-2", name: "Reviewer", description: " ", status: "ACTIVE" },
      ],
      messages: [],
      canSendMessages: false,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-2/conversations/conv-2"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Project chat")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });

  it("navigates back when project id is missing in params", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-2",
      projectId: "project-2",
      project: null,
      title: "",
      type: "DIRECT",
      status: "ACTIVE",
      participants: [],
      messages: [],
      canSendMessages: false,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/automation/projects/conversations/conv-2"]}>
        <Routes>
          <Route path="/automation/projects/conversations/:conversationId" element={<ProjectConversationPage />} />
          <Route path="/automation/projects/" element={<div>Project list page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Conversation not found");
    await user.click(screen.getByRole("button", { name: "Back to Project" }));
    expect(await screen.findByText("Project list page")).toBeInTheDocument();
  });

  it("renders agent participant when agent id is null", async () => {
    getProjectConversationMock.mockResolvedValue({
      id: "conv-3",
      projectId: "project-3",
      project: { id: "project-3", name: "Sitionix", context: "Context" },
      title: "Team chat",
      type: "MULTI_AGENT",
      status: "ACTIVE",
      participants: [{ type: "AGENT", agentId: null, name: "Planner", description: "Plans tasks", status: "ACTIVE" }],
      messages: [],
      canSendMessages: false,
      createdAt: "2026-05-08T10:00:00Z",
      updatedAt: "2026-05-08T10:00:00Z",
      lastMessageAt: null,
    });

    render(
      <MemoryRouter initialEntries={["/automation/projects/project-3/conversations/conv-3"]}>
        <Routes>
          <Route path="/automation/projects/:projectId/conversations/:conversationId" element={<ProjectConversationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Planner")).toBeInTheDocument();
  });
});
