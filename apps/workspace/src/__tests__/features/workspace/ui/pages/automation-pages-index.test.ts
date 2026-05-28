import { describe, expect, it } from "vitest";

import {
  AgentChatPage,
  AgentOverviewPage,
  AgentProjectDetailsPage,
  AutomationPage,
  ProjectConversationPage,
  ProjectFlowPage,
} from "../../../../../features/workspace/modules/automation/pages";

describe("automation pages index exports", () => {
  it("exports all automation pages", () => {
    expect(AgentChatPage).toBeTypeOf("function");
    expect(AgentOverviewPage).toBeTypeOf("function");
    expect(AgentProjectDetailsPage).toBeTypeOf("function");
    expect(AutomationPage).toBeTypeOf("function");
    expect(ProjectConversationPage).toBeTypeOf("function");
    expect(ProjectFlowPage).toBeTypeOf("function");
  });
});
