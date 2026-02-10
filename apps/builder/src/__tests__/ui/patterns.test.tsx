import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../ui/patterns/EmptyState";
import { InspectorLayout } from "../../ui/inspector/InspectorLayout";

describe("ui patterns", () => {
  it("renders empty state with subtitle and action", () => {
    render(
      <EmptyState
        title="Nothing here"
        subtitle="Add something"
        action={<button type="button">Add</button>}
      />
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add something")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("renders inspector layout content and footer", () => {
    render(
      <InspectorLayout>
        <InspectorLayout.Content>
          <div>Content</div>
        </InspectorLayout.Content>
        <InspectorLayout.Footer>
          <div>Footer</div>
        </InspectorLayout.Footer>
      </InspectorLayout>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders inspector layout without footer", () => {
    render(
      <InspectorLayout>
        <InspectorLayout.Content>
          <div>Content only</div>
        </InspectorLayout.Content>
      </InspectorLayout>
    );

    expect(screen.getByText("Content only")).toBeInTheDocument();
  });
});
