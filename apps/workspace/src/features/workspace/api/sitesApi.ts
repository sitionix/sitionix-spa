export type CreateSiteRequest = {
  name: string;
  type?: "portfolio" | "business" | "blog" | "store" | "landing" | "other";
  description?: string;
  template?: "blank" | "portfolio" | "business";
};

export type CreateSiteResponse = {
  id: string;
};

const MOCK_DELAY_MS = 400;

let createSiteCallCount = 0;

const parseFailureEveryN = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const mockFailureEveryN = parseFailureEveryN(
  import.meta.env.VITE_CREATE_SITE_FAIL_EVERY_N
);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export async function createSite(
  payload: CreateSiteRequest
): Promise<CreateSiteResponse> {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Site name is required");
  }

  await sleep(MOCK_DELAY_MS);

  createSiteCallCount += 1;
  if (
    mockFailureEveryN &&
    createSiteCallCount % mockFailureEveryN === 0
  ) {
    throw new Error("Mock create site request failed");
  }

  return {
    id: `site_${Date.now()}`,
  };
}

export const sitesApi = {
  createSite,
};
