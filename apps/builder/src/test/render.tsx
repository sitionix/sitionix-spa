import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { BuilderStoreProvider } from "../application/builderStore";

type RenderOptions = {
  siteId?: string;
};

export const renderWithProvider = (
  ui: ReactElement,
  { siteId = "local" }: RenderOptions = {}
) => {
  return render(<BuilderStoreProvider siteId={siteId}>{ui}</BuilderStoreProvider>);
};
