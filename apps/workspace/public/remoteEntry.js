const moduleMap = {
  "./mount": () => import("../src/mf/mount.tsx")
};

export async function get(module) {
  const factory = moduleMap[module];
  if (!factory) {
    throw new Error(`Unknown module: ${module}`);
  }
  return factory;
}

export function init() {
  // No shared scope wiring in dev; preview/build uses the federation output.
}
