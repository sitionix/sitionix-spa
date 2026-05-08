import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Messaging for project conversations is not available yet.")).toBeInTheDocument();
  });
});
