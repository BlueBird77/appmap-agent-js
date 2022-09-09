/* globals APPMAP_HOOK_EVAL */

import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookESM from "./index.mjs";

const _eval = eval;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const { createConfiguration } = await buildTestComponentAsync("configuration");
const component = HookESM(dependencies);

assertDeepEqual(
  await testHookAsync(
    component,
    {
      configuration: {
        hooks: { eval: ["eval"] },
        packages: [
          {
            regexp: "^",
            shallow: true,
          },
        ],
      },
      url: "file:///base",
    },
    async () => {
      assertEqual(_eval(APPMAP_HOOK_EVAL("file:///foo", "123;")), 123);
    },
  ),
  [
    {
      type: "source",
      url: "file:///foo",
      content: "123;",
      shallow: true,
      exclude: createConfiguration("file:///home").exclude,
      inline: false,
    },
  ],
);

assertDeepEqual(
  await testHookAsync(
    component,
    {
      configuration: {
        hooks: { eval: [] },
        packages: [],
      },
    },
    async () => {
      assertEqual(_eval(APPMAP_HOOK_EVAL("file:///foo", "123;")), 123);
    },
  ),
  [],
);