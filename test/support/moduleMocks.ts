import * as path from "node:path";

const ModuleAny = require("node:module") as {
  _load: Function;
};

export function withPatchedModuleLoader<T>(
  mocks: Record<string, unknown>,
  run: () => T,
): T {
  const originalLoad = ModuleAny._load;

  ModuleAny._load = function patchedLoad(
    this: unknown,
    request: string,
    parent: NodeJS.Module | null,
    isMain: boolean,
  ): unknown {
    if (request in mocks) {
      return mocks[request];
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return run();
  } finally {
    ModuleAny._load = originalLoad;
  }
}

export function importFresh<T>(modulePath: string): T {
  const normalized = modulePath.startsWith("../src/")
    ? path.join(
        process.cwd(),
        "dist-test",
        "src",
        modulePath.replace("../src/", ""),
      )
    : modulePath;

  const resolved = require.resolve(normalized);
  delete require.cache[resolved];
  return require(resolved) as T;
}