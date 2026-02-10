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
  type SiteState,
} from "../../domain/pages";
import { createInitialDocument } from "../../domain/document";

const createBaseState = (): SiteState => {
  const pageId = "page-home";
  const meta = {
    name: "Home",
    slug: "/",
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
  const firstId = "page-home";
  const secondId = "page-about";
  const thirdId = "page-contact";
  return {
    activePageId: secondId,
    pages: {
      [firstId]: {
        name: "Home",
        slug: "/",
        isHome: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      [secondId]: {
        name: "About",
        slug: "/about",
        isHome: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
      [thirdId]: {
        name: "Contact",
        slug: "/contact",
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
    const aboutId = "page-about";
    state.pages[aboutId] = {
      name: "About",
      slug: "/about",
      isHome: false,
      createdAt: 2000,
      updatedAt: 2000,
    };
    state.pageOrder.push(aboutId);
    state.documents[aboutId] = createInitialDocument(aboutId);

    const result = validateUniqueSlug(state, "/about");
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
    const swapped = applyHomePolicy(state.pages, "page-about", 5000);
    expect(swapped["page-about"].isHome).toBe(true);
    expect(swapped["page-about"].slug).toBe("/");
    expect(swapped["page-home"].isHome).toBe(false);
    expect(swapped["page-home"].slug).toBe("/home");

    const noHome = { ...state.pages };
    noHome["page-home"] = { ...noHome["page-home"], isHome: false, slug: "/home" };
    const ensured = ensureHomeExists(noHome, state.pageOrder, 6000);
    expect(ensured["page-home"].isHome).toBe(true);
    expect(ensured["page-home"].slug).toBe("/");
  });

  it("applies create/update/delete immutably", () => {
    const state = createBaseState();
    const originalOrder = [...state.pageOrder];
    const created = applyCommand(state, {
      type: "CREATE_PAGE",
      pageId: "page-2",
      meta: {
        name: "Pricing",
        slug: "/pricing",
        isHome: false,
        createdAt: 3000,
        updatedAt: 3000,
      },
      document: createInitialDocument("page-2"),
    });

    expect(created).not.toBe(state);
    expect(state.pageOrder).toEqual(["page-home"]);
    expect(created.pageOrder).toEqual(["page-home", "page-2"]);
    expect(state.pages["page-2"]).toBeUndefined();
    expect(created.pages["page-2"]).toBeDefined();

    const updated = applyCommand(created, {
      type: "UPDATE_PAGE_META",
      pageId: "page-2",
      patch: { name: "Pricing Plus" },
      timestamp: 4000,
    });
    expect(updated).not.toBe(created);
    expect(created.pages["page-2"].name).toBe("Pricing");
    expect(updated.pages["page-2"].name).toBe("Pricing Plus");

    const deleted = applyCommand(updated, {
      type: "DELETE_PAGE",
      pageId: "page-2",
    });
    expect(deleted).not.toBe(updated);
    expect(deleted.pages["page-2"]).toBeUndefined();
    expect(updated.pages["page-2"]).toBeDefined();
    expect(state.pageOrder).toEqual(originalOrder);
  });

  it("selects next active page deterministically on delete", () => {
    const state = createMultiPageState();
    const deletedMiddle = applyCommand(state, {
      type: "DELETE_PAGE",
      pageId: "page-about",
    });
    expect(deletedMiddle.activePageId).toBe("page-contact");

    const deletedLast = applyCommand(
      { ...deletedMiddle, activePageId: "page-contact" },
      { type: "DELETE_PAGE", pageId: "page-contact" }
    );
    expect(deletedLast.activePageId).toBe("page-home");
  });

  it("allows home swap on create", () => {
    const state = createBaseState();
    const command = {
      type: "CREATE_PAGE",
      pageId: "page-new-home",
      meta: {
        name: "New Home",
        slug: "/",
        isHome: true,
        createdAt: 2000,
        updatedAt: 2000,
      },
      document: createInitialDocument("page-new-home"),
    } as const;

    expect(validateCommand(state, command).ok).toBe(true);
    const next = applyCommand(state, command);
    expect(next.pages["page-new-home"].isHome).toBe(true);
    expect(next.pages["page-home"].isHome).toBe(false);
  });

  it("rejects invalid home slug combinations", () => {
    const state = createBaseState();
    const notHomeRoot = validateCommand(state, {
      type: "CREATE_PAGE",
      pageId: "page-about",
      meta: {
        name: "About",
        slug: "/",
        isHome: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
      document: createInitialDocument("page-about"),
    });
    expect(notHomeRoot.ok).toBe(false);

    const homeNonRoot = validateCommand(state, {
      type: "CREATE_PAGE",
      pageId: "page-home-2",
      meta: {
        name: "Home 2",
        slug: "/home-2",
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
      pageId: "missing",
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
