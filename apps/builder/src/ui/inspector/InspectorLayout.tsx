import type { ReactNode } from "react";
import { Children, isValidElement } from "react";

type InspectorLayoutProps = {
  children?: ReactNode;
};

type InspectorLayoutSectionProps = {
  children?: ReactNode;
};

const InspectorLayoutContent = ({ children }: InspectorLayoutSectionProps) => {
  return <>{children}</>;
};

const InspectorLayoutFooter = ({ children }: InspectorLayoutSectionProps) => {
  return <>{children}</>;
};

const InspectorLayoutBase = ({ children }: InspectorLayoutProps) => {
  let content: ReactNode = null;
  let footer: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === InspectorLayoutContent) {
      content = child.props.children;
    }
    if (child.type === InspectorLayoutFooter) {
      footer = child.props.children;
    }
  });

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-4">{content}</div>
      {footer ? (
        <div className="border-t border-zinc-200 bg-white p-4">{footer}</div>
      ) : null}
    </div>
  );
};

type InspectorLayoutComponent = typeof InspectorLayoutBase & {
  Content: typeof InspectorLayoutContent;
  Footer: typeof InspectorLayoutFooter;
};

export const InspectorLayout = InspectorLayoutBase as InspectorLayoutComponent;

InspectorLayout.Content = InspectorLayoutContent;
InspectorLayout.Footer = InspectorLayoutFooter;
