import { describe, expect, it } from "vitest";
import { createMockWorkspaceApi } from "../../../../features/workspace/api/workspaceMockApi";

const getFirstSite = async (api: ReturnType<typeof createMockWorkspaceApi>) => {
  const sites = await api.getSites();
  const first = sites.items[0];
  if (!first) {
    throw new Error("Expected at least one site");
  }
  return first;
};

describe("createMockWorkspaceApi", () => {
  it("returns dashboard summary derived from sites", async () => {
    const api = createMockWorkspaceApi();
    const sites = await api.getSites();
    const summary = await api.getDashboardSummary();

    expect(summary.totalSites).toBe(sites.items.length);
    expect(summary.publishedSites).toBeGreaterThanOrEqual(0);
    expect(summary.totalVisits).toBeGreaterThan(0);
    expect(summary.recentSites.length).toBeGreaterThan(0);
  });

  it("supports search and sorting", async () => {
    const api = createMockWorkspaceApi();
    const sites = await api.getSites();
    const target = sites.items[0];

    const filtered = await api.getSites({ search: target.name.slice(0, 3) });
    expect(filtered.items.some((item) => item.id === target.id)).toBe(true);

    const sortedByName = await api.getSites({ sortBy: "name" });
    const names = sortedByName.items.map((item) => item.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "uk-UA"));
    expect(names).toEqual(sorted);
  });

  it("can duplicate and update a site", async () => {
    const api = createMockWorkspaceApi();
    const original = await getFirstSite(api);

    const duplicate = await api.duplicateSite(original.id);
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.name).toContain("Копія");

    const updated = await api.updateSite(duplicate.id, { name: "Новий сайт" });
    expect(updated.name).toBe("Новий сайт");

    const fetched = await api.getSite(duplicate.id);
    expect(fetched.name).toBe("Новий сайт");
  });

  it("moves sites to trash and restores them", async () => {
    const api = createMockWorkspaceApi();
    const original = await getFirstSite(api);

    await api.deleteSite(original.id);
    const sitesAfterDelete = await api.getSites();
    expect(sitesAfterDelete.items.some((item) => item.id === original.id)).toBe(false);

    const trash = await api.getTrash();
    expect(trash.items.some((item) => item.id === original.id)).toBe(true);

    await api.restoreSite(original.id);
    const sitesAfterRestore = await api.getSites();
    expect(sitesAfterRestore.items.some((item) => item.id === original.id)).toBe(true);
  });

  it("clears trash and handles permanent delete", async () => {
    const api = createMockWorkspaceApi();
    const original = await getFirstSite(api);

    await api.deleteSite(original.id);
    await api.permanentlyDeleteSite(original.id);
    const trashAfterDelete = await api.getTrash();
    expect(trashAfterDelete.items.some((item) => item.id === original.id)).toBe(false);

    const another = await getFirstSite(api);
    await api.deleteSite(another.id);
    await api.clearTrash();
    const emptyTrash = await api.getTrash();
    expect(emptyTrash.items.length).toBe(0);
  });

  it("manages collections", async () => {
    const api = createMockWorkspaceApi();
    const collectionsBefore = await api.getCollections();
    const targetCollection = collectionsBefore.items.find((item) => item.id === "col-4");
    expect(targetCollection).toBeTruthy();

    const sites = await api.getSites();
    const siteWithoutCollection = sites.items.find((item) => !item.collectionId);
    expect(siteWithoutCollection).toBeTruthy();

    await api.addToCollection(siteWithoutCollection!.id, targetCollection!.id);
    const collectionsAfterAdd = await api.getCollections();
    const updated = collectionsAfterAdd.items.find((item) => item.id === targetCollection!.id);
    expect(updated?.sitesCount).toBe((targetCollection?.sitesCount ?? 0) + 1);

    await api.removeFromCollection(siteWithoutCollection!.id);
    const collectionsAfterRemove = await api.getCollections();
    const updatedAfterRemove = collectionsAfterRemove.items.find(
      (item) => item.id === targetCollection!.id
    );
    expect(updatedAfterRemove?.sitesCount).toBe(targetCollection?.sitesCount ?? 0);
  });

  it("exposes editor and CRM data", async () => {
    const api = createMockWorkspaceApi();
    const site = await getFirstSite(api);

    const editor = await api.getEditorData(site.id);
    expect(editor.preview.heroTitle).toContain(site.name);
    expect(editor.palette.length).toBeGreaterThan(0);

    const crm = await api.getCrmSummary();
    expect(crm.overview.totalViews).toBeGreaterThan(0);
    expect(crm.sitePerformance.length).toBeGreaterThan(0);
  });
});
