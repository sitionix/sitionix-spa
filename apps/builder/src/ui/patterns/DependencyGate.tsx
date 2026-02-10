import type { ReactNode } from "react";
import {
  type DependencyCheck,
  type DependencyResult,
} from "../../domain/pages";
import { useBuilderStore } from "../../application/builderStore";

type DependencyGateProps = {
  check: DependencyCheck;
  fallback?: ReactNode;
  children: (props: { disabled: boolean; result: DependencyResult }) => ReactNode;
};

export const DependencyGate = ({
  check,
  fallback,
  children,
}: DependencyGateProps) => {
  const { derived } = useBuilderStore();
  const result = derived.dependency(check);
  const disabled = !result.ok;

  return (
    <div className="space-y-2">
      {children({ disabled, result })}
      {disabled ? fallback : null}
    </div>
  );
};
