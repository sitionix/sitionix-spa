import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageNode } from "../../renderer/nodeComponents/PageNode";

describe("PageNode", () => {
  it("renders children inside page shell", () => {
    render(
      <PageNode>
        <div>Child content</div>
      </PageNode>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
