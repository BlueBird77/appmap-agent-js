import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Recording from "./recording.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration },
  } = dependencies;
  const {
    createRecording,
    setCurrentGroup,
    getSerializationEmptyValue,
    incrementEventCounter,
    recordBeforeApply,
    recordAfterApply,
  } = Recording(dependencies);
  const { createSession, initializeSession } = Session(dependencies);
  const configuration = createConfiguration("/");
  const recording = createRecording(configuration);
  const session = createSession("uuid", configuration);
  setCurrentGroup({ recording }, "group");
  initializeSession(session);
  const default_serial = {
    type: null,
    index: null,
    constructor: null,
    truncated: false,
    print: null,
    specific: null,
  };
  assertEqual(typeof incrementEventCounter({ recording }), "number");
  assertEqual(typeof getSerializationEmptyValue({ recording }), "symbol");
  assertDeepEqual(
    recordBeforeApply({ session, recording }, "index", {
      function: "function",
      this: 123,
      arguments: [456],
    }),
    {
      type: "send",
      session: "uuid",
      data: {
        type: "event",
        data: {
          type: "before",
          time: 0,
          index: "index",
          group: "group",
          data: {
            type: "apply",
            function: "function",
            this: { ...default_serial, type: "number", print: "123" },
            arguments: [{ ...default_serial, type: "number", print: "456" }],
          },
        },
      },
    },
  );
  assertDeepEqual(
    recordAfterApply({ session, recording }, "index", {
      result: 123,
      error: 456,
    }),
    {
      type: "send",
      session: "uuid",
      data: {
        type: "event",
        data: {
          type: "after",
          time: 0,
          index: "index",
          group: "group",
          data: {
            type: "apply",
            result: { ...default_serial, type: "number", print: "123" },
            error: { ...default_serial, type: "number", print: "456" },
          },
        },
      },
    },
  );
};

testAsync();
