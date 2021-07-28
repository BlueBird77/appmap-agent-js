import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Instrumentation from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const { createInstrumentation, instrument, getInstrumentationIdentifier } =
    Instrumentation(await buildTestAsync(import.meta));
  const instrumentation = createInstrumentation({ "hidden-identifier": "$" });
  assertEqual(getInstrumentationIdentifier(instrumentation), "$");
  assertDeepEqual(instrument(instrumentation, "kind", "path", "code"), {
    module: { kind: "kind", path: "path", code: "code", children: [] },
    code: "code",
  });
};

testAsync();