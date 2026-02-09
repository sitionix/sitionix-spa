import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash2 } from "lucide-react";
import { PageHeader } from "../../../../features/workspace/ui/components/PageHeader";
import { ConfirmationDialog } from "../../../../features/workspace/ui/components/ConfirmationDialog";
import { EmptyState } from "../../../../features/workspace/ui/components/EmptyState";
import { StatCard } from "../../../../features/workspace/ui/components/StatCard";

function DummyIcon() {
  return <div data-testid="dummy-icon" />;
}

describe("ui components", () => {
  it("renders PageHeader with actions and subtitle", () => {
    render(
      <PageHeader
        title="Header"
        subtitle="Sub"
        actions={<button>Action</button>}
      />
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Sub")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders StatCard", () => {
    render(
      <StatCard label="Visits" value={10} icon={DummyIcon} tone="blue" />
    );

    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-icon")).toBeInTheDocument();
  });

  it("renders EmptyState", () => {
    render(
      <EmptyState
        title="Empty"
        description="Nothing here"
        icon={Trash2}
      />
    );

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders ConfirmationDialog and handles actions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmationDialog
        open={false}
        title="Title"
        confirmLabel="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.queryByText("Title")).not.toBeInTheDocument();

    rerender(
      <ConfirmationDialog
        open
        title="Title"
        description="Desc"
        confirmLabel="Confirm"
        tone="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Скасувати" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });
});
