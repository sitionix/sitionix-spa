import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigateInBrowserMock } = vi.hoisted(() => ({
  navigateInBrowserMock: vi.fn(),
}));

vi.mock("@sitionix/ui", () => ({
  navigateInBrowser: navigateInBrowserMock,
}));

import { navigateHost } from "../../utils/navigateHost";

describe("navigateHost", () => {
  beforeEach(() => {
    navigateInBrowserMock.mockReset();
  });

  it("delegates browser navigation to shared ui helper", () => {
    navigateHost("/workspace/sites");

    expect(navigateInBrowserMock).toHaveBeenCalledWith("/workspace/sites");
  });

  it("passes through arbitrary target paths", () => {
    navigateHost("/builder/site-1?siteName=Landing");

    expect(navigateInBrowserMock).toHaveBeenCalledWith(
      "/builder/site-1?siteName=Landing"
    );
  });
});
