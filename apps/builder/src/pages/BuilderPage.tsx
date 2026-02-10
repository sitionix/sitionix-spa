import { useParams } from "react-router-dom";
import { BuilderShell } from "../ui/components/BuilderShell";
import { BuilderStoreProvider } from "../application/builderStore";

export const BuilderPage = () => {
  const { siteId } = useParams();
  const resolvedSiteId = siteId ?? "local";

  return (
    <BuilderStoreProvider key={resolvedSiteId} siteId={resolvedSiteId}>
      <BuilderShell siteId={resolvedSiteId} />
    </BuilderStoreProvider>
  );
};
