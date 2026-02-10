import { useEffect, useRef } from "react";
import { PanelShell } from "./PanelShell";
import { useBuilderStore } from "../../application/builderStore";
import { InspectorLayout } from "../inspector/InspectorLayout";
import { PageInspectorContent } from "../inspector/PageInspectorContent";
import { PageInspectorDangerZone } from "../inspector/PageInspectorDangerZone";
import { EmptyState } from "../patterns/EmptyState";

export const RightPanel = () => {
  const {
    state: { editor, ui, site },
    derived,
    actions,
  } = useBuilderStore();
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ui.focusTarget !== "inspector-name") return;
    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
    actions.clearFocusTarget();
  }, [actions, ui.focusTarget]);

  if (!derived.hasPages) {
    return (
      <PanelShell title="Inspector">
        <InspectorLayout>
          <InspectorLayout.Content>
            <EmptyState
              title="No page selected"
              subtitle="Create a page to start editing."
              className="space-y-2"
              titleClassName="text-sm font-semibold text-zinc-900"
              subtitleClassName="text-xs text-zinc-500"
            />
          </InspectorLayout.Content>
        </InspectorLayout>
      </PanelShell>
    );
  }

  if (editor.selectedNodeId) {
    return (
      <PanelShell title="Inspector">
        <InspectorLayout>
          <InspectorLayout.Content>
            <EmptyState
              title="Select an element to inspect its properties."
              className="space-y-0"
              titleClassName="text-sm text-zinc-500 font-normal"
            />
          </InspectorLayout.Content>
        </InspectorLayout>
      </PanelShell>
    );
  }

  const activePage = derived.activePage;
  if (!activePage) {
    return (
      <PanelShell title="Inspector">
        <InspectorLayout>
          <InspectorLayout.Content>
            <EmptyState
              title="No page selected."
              className="space-y-0"
              titleClassName="text-sm text-zinc-500 font-normal"
            />
          </InspectorLayout.Content>
        </InspectorLayout>
      </PanelShell>
    );
  }

  const showNameError =
    !!derived.inspector.nameError &&
    (ui.inspector.nameTouched || ui.inspector.draftName.length > 0);
  const showSlugError =
    !!derived.inspector.slugError &&
    (ui.inspector.slugTouched || ui.inspector.draftSlug.length > 0);

  return (
    <PanelShell title="Inspector">
      <InspectorLayout>
        <InspectorLayout.Content>
          <PageInspectorContent
            nameInputRef={nameInputRef}
            name={ui.inspector.draftName}
            slug={ui.inspector.draftSlug}
            isHome={activePage.isHome}
            showNameError={showNameError}
            nameError={derived.inspector.nameError}
            showSlugError={showSlugError}
            slugError={derived.inspector.slugError}
            onNameChange={actions.updateInspectorName}
            onNameBlur={actions.commitInspectorName}
            onSlugChange={actions.updateInspectorSlug}
            onSlugBlur={actions.commitInspectorSlug}
            onSetHome={actions.setHomePage}
          />
        </InspectorLayout.Content>
        <InspectorLayout.Footer>
          <PageInspectorDangerZone
            onDelete={() => actions.requestDeletePage(site.activePageId!)}
          />
        </InspectorLayout.Footer>
      </InspectorLayout>
    </PanelShell>
  );
};
