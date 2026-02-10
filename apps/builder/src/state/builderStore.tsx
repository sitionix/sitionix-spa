import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  createInitialDocument,
  type Breakpoint,
  type BuilderDocument,
} from "./document";
import { loadDraft } from "./storage";

export type BuilderEditorState = {
  mode: "edit" | "preview";
  activeBreakpoint: Breakpoint;
};

export type BuilderState = {
  siteId: string;
  document: BuilderDocument;
  editor: BuilderEditorState;
};

type BuilderAction =
  | { type: "setBreakpoint"; breakpoint: Breakpoint }
  | { type: "toggleMode" }
  | { type: "loadDocument"; document: BuilderDocument };

export const createInitialState = (siteId: string): BuilderState => {
  const draft = siteId === "local" ? loadDraft() : null;
  const document = draft ?? createInitialDocument(siteId);
  return {
    siteId,
    document,
    editor: {
      mode: "edit",
      activeBreakpoint: "desktop",
    },
  };
};

export const builderReducer = (
  state: BuilderState,
  action: BuilderAction
): BuilderState => {
  switch (action.type) {
    case "setBreakpoint":
      return {
        ...state,
        editor: { ...state.editor, activeBreakpoint: action.breakpoint },
      };
    case "toggleMode":
      return {
        ...state,
        editor: {
          ...state.editor,
          mode: state.editor.mode === "edit" ? "preview" : "edit",
        },
      };
    case "loadDocument":
      return {
        ...state,
        document: action.document,
      };
    default:
      return state;
  }
};

type BuilderStoreValue = {
  state: BuilderState;
  actions: {
    setActiveBreakpoint: (breakpoint: Breakpoint) => void;
    toggleMode: () => void;
    loadDocument: (document: BuilderDocument) => void;
  };
};

const BuilderStoreContext = createContext<BuilderStoreValue | null>(null);

export const BuilderStoreProvider = ({
  siteId,
  children,
}: {
  siteId: string;
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(builderReducer, siteId, createInitialState);

  const actions = useMemo(
    () => ({
      setActiveBreakpoint: (breakpoint: Breakpoint) =>
        dispatch({ type: "setBreakpoint", breakpoint }),
      toggleMode: () => dispatch({ type: "toggleMode" }),
      loadDocument: (document: BuilderDocument) =>
        dispatch({ type: "loadDocument", document }),
    }),
    []
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <BuilderStoreContext.Provider value={value}>
      {children}
    </BuilderStoreContext.Provider>
  );
};

export const useBuilderStore = () => {
  const ctx = useContext(BuilderStoreContext);
  if (!ctx) {
    throw new Error("useBuilderStore must be used within BuilderStoreProvider");
  }
  return ctx;
};
