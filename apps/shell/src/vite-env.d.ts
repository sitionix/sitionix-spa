// apps/shell/src/vite-env.d.ts
/// <reference types="vite/client" />

declare module "auth/mount" {
  export type MountResult = { unmount: () => void };
  export type MountFn = (container: Element, options?: { basename?: string }) => MountResult;

  export const mount: MountFn;
  const defaultExport: MountFn;
  export default defaultExport;
}

declare module "workspace/mount" {
  export type MountResult = { unmount: () => void };
  export type MountFn = (container: Element, options?: { basename?: string }) => MountResult;

  export const mount: MountFn;
  const defaultExport: MountFn;
  export default defaultExport;
}
