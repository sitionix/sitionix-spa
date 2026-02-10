import { describe, expect, it } from "vitest";
import {
  applyCommand,
  checkDependency,
  normalizeSlug,
  slugifyNameToSlug,
  ensureUniqueSlug,
  applyHomePolicy,
  ensureHomeExists,
  validatePageName,
  validateCommand,
  validateSlug,
  validateUniqueSlug,
  runCommand,
  asPageId,
  asSlug,
  type SiteState,
} from "../../domain/pages";
import { createInitialDocument } from "../../domain/document";

const createBaseState = (): SiteState => {
  const pageId = asPageId("page-home");
  const meta = {
    name: "Home",
    slug: asSlug("/"),
    isHome: true,
    createdAt: 1000,
    updatedAt: 1000,
  };
  const document = createInitialDocument(pageId);
  return {
    activePageId: pageId,
    pages: { [pageId]: meta },
    pageOrder: [pageId],
    documents: { [pageId]: document },
  };
};

const createMultiPageState = (): SiteState => {
  const firstId = asPageId("page-home");
  const secondId = asPageId("page-about");
  const thirdId = asPageId("page-contact");
  return {
    activePageId: secondId,
    pages: {
      [firstId]: {
        name: "Home",
        slug: asSlug("/"),
        isHome: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      [secondId]: {
        name: "About",
        slug: asSlug("/about"),
        isHome: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
      [thirdId]: {
        name: "Contact",
        slug: asSlug("/contact"),
        isHome: false,
        createdAt: 3000,
        updatedAt: 3000,
      },
    },
    pageOrder: [firstId, secondId, thirdId],
    documents: {
      [firstId]: createInitialDocument(firstId),
      [secondId]: createInitialDocument(secondId),
      [thirdId]: createInitialDocument(thirdId),
    },
  };
};

describe("page domain", () => {
  it("normalizes slugs", () => {
    expect(normalizeSlug("about")).toBe("/about");
    expect(normalizeSlug("/about/")).toBe("/about");
    expect(normalizeSlug(" /About Us ")).toBe("/about us");
  });

  it("slugifies names deterministically", () => {
    expect(slugifyNameToSlug("About Us")).toBe("/about-us");
    expect(slugifyNameToSlug("  ")).toBe("/page-1");
  });

  it("validates slug rules", () => {
    expect(validateSlug("/").ok).toBe(true);
    expect(validateSlug("/docs/getting-started").ok).toBe(true);
    expect(validateSlug("about").ok).toBe(false);
    expect(validateSlug(`/${"a".repeat(121)}`).ok).toBe(false);
    expect(validateSlug("/about/").ok).toBe(false);
    expect(validateSlug("/about us").ok).toBe(false);
    expect(validateSlug("//about").ok).toBe(false);
    expect(validateSlug("/about//x").ok).toBe(false);
    expect(validateSlug("/about?").ok).toBe(false);
    expect(validateSlug("/builder").ok).toBe(false);
  });

  it("rejects duplicate slugs", () => {
    const state = createBaseState();
    const aboutId = asPageId("page-about");
    state.pages[aboutId] = {
      name: "About",
      slug: asSlug("/about"),
      isHome: false,
      createdAt: 2000,
      updatedAt: 2000,
    };
    state.pageOrder.push(aboutId);
    state.documents[aboutId] = createInitialDocument(aboutId);

    const result = validateUniqueSlug(state, asSlug("/about"));
    expect(result.ok).toBe(false);
  });

  it("validates page names", () => {
    expect(validatePageName("")).toMatchObject({ ok: false });
    expect(validatePageName("A".repeat(61))).toMatchObject({ ok: false });
    expect(validatePageName("About").ok).toBe(true);
  });

  it("ensures unique slugs with home fallback", () => {
    const unique = ensureUniqueSlug("/", ["/", "/home-2", "/home-3"]);
    expect(unique).toBe("/home-4");
  });

  it("applies home policy and ensures home exists", () => {
    const state = createMultiPageState();
    const aboutId = asPageId("page-about");
    const homeId = asPageId("page-home");
    const swapped = applyHomePolicy(state.pages, aboutId, 5000);
    expect(swapped[aboutId].isHome).toBe(true);
    expect(swapped[aboutId].slug).toBe(asSlug("/"));
    expect(swapped[homeId].isHome).toBe(false);
    expect(swapped[homeId].slug).toBe(asSlug("/home"));

    const noHome = { ...state.pages };
    noHome[homeId] = { ...noHome[homeId], isHome: false, slug: asSlug("/home") };
    const ensured = ensureHomeExists(noHome, state.pageOrder, 6000);
    expect(ensured[homeId].isHome).toBe(true);
    expect(ensured[homeId].slug).toBe(asSlug("/"));
  });

  it("applies create/update/delete immutably", () => {
    const state = createBaseState();
    const originalOrder = [...state.pageOrder];
    const page2Id = asPageId("page-2");
    const created = applyCommand(state, {
      type: "CREATE_PAGE",
      pageId: page2Id,
      meta: {
        name: "Pricing",
        slug: asSlug("/pricing"),
        isHome: false,
        createdAt: 3000,
        updatedAt: 3000,
      },
      document: createInitialDocument("page-2"),
    });

    expect(created).not.toBe(state);
    expect(state.pageOrder).toEqual(["page-home"]);
    expect(created.pageOrder).toEqual(["page-home", "page-2"]);
    expect(state.pages[page2Id]).toBeUndefined();
    expect(created.pages[page2Id]).toBeDefined();

    const updated = applyCommand(created, {
      type: "UPDATE_PAGE_META",
      pageId: page2Id,
      patch: { name: "Pricing Plus" },
      timestamp: 4000,
    });
    expect(updated).not.toBe(created);
    expect(created.pages[page2Id].name).toBe("Pricing");
    expect(updated.pages[page2Id].name).toBe("Pricing Plus");

    const deleted = applyCommand(updated, {
      type: "DELETE_PAGE",
      pageId: page2Id,
    });
    expect(deleted).not.toBe(updated);
    expect(deleted.pages[page2Id]).toBeUndefined();
    expect(updated.pages[page2Id]).toBeDefined();
    expect(state.pageOrder).toEqual(originalOrder);
  });

  it("selects next active page deterministically on delete", () => {
    const state = createMultiPageState();
    const deletedMiddle = applyCommand(state, {
      type: "DELETE_PAGE",
      pageId: asPageId("page-about"),
    });
    expect(deletedMiddle.activePageId).toBe(asPageId("page-contact"));

    const deletedLast = applyCommand(
      { ...deletedMiddle, activePageId: asPageId("page-contact") },
      { type: "DELETE_PAGE", pageId: asPageId("page-contact") }
    );
    expect(deletedLast.activePageId).toBe(asPageId("page-home"));
  });

  it("allows home swap on create", () => {
    const state = createBaseState();
    const command = {
      type: "CREATE_PAGE",
      pageId: asPageId("page-new-home"),
      meta: {
        name: "New Home",
        slug: asSlug("/"),
        isHome: true,
        createdAt: 2000,
        updatedAt: 2000,
      },
      document: createInitialDocument("page-new-home"),
    } as const;

    expect(validateCommand(state, command).ok).toBe(true);
    const next = applyCommand(state, command);
    const newHomeId = asPageId("page-new-home");
    const homeId = asPageId("page-home");
    expect(next.pages[newHomeId].isHome).toBe(true);
    expect(next.pages[homeId].isHome).toBe(false);
  });

  it("rejects invalid home slug combinations", () => {
    const state = createBaseState();
    const notHomeRoot = validateCommand(state, {
      type: "CREATE_PAGE",
      pageId: asPageId("page-about"),
      meta: {
        name: "About",
        slug: asSlug("/"),
        isHome: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
      document: createInitialDocument("page-about"),
    });
    expect(notHomeRoot.ok).toBe(false);

    const homeNonRoot = validateCommand(state, {
      type: "CREATE_PAGE",
      pageId: asPageId("page-home-2"),
      meta: {
        name: "Home 2",
        slug: asSlug("/home-2"),
        isHome: true,
        createdAt: 2000,
        updatedAt: 2000,
      },
      document: createInitialDocument("page-home-2"),
    });
    expect(homeNonRoot.ok).toBe(false);
  });

  it("runs command pipeline with validation", () => {
    const state = createBaseState();
    const result = runCommand(state, {
      type: "DELETE_PAGE",
      pageId: asPageId("missing"),
    });
    expect(result.ok).toBe(false);
  });

  it("checks dependencies", () => {
    const empty: SiteState = {
      activePageId: null,
      pages: {},
      pageOrder: [],
      documents: {},
    };
    expect(
      checkDependency(empty, { type: "REQUIRES_AT_LEAST_ONE_PAGE" }).ok
    ).toBe(false);
    expect(
      checkDependency(empty, { type: "REQUIRES_ACTIVE_PAGE" }).ok
    ).toBe(false);

    const withPage = createBaseState();
    expect(
      checkDependency(withPage, { type: "REQUIRES_AT_LEAST_ONE_PAGE" }).ok
    ).toBe(true);
    expect(
      checkDependency(withPage, { type: "REQUIRES_ACTIVE_PAGE" }).ok
    ).toBe(true);
  });
});
