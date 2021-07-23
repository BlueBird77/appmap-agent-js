import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import State from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const {
    createState,
    initializeState,
    terminateState,
    createTrack,
    controlTrack,
    declareGroup,
    getInstrumentationIdentifier,
    instrument,
  } = State(
    await buildAsync({
      util: "default",
      expect: "error",
      uuid: "mock",
      instrumentation: "mock",
      time: "mock",
    }),
  );
  const state = createState("options");
  assertDeepEqual(initializeState(state), {
    type: "initialize",
    session: "uuid",
    options: "options",
  });
  {
    const track = createTrack(state, "options");
    assertDeepEqual(track, {
      index: 1,
      state: { value: 0 },
      options: "options",
    });
    assertDeepEqual(controlTrack(state, track, "start"), {
      type: "send",
      session: "uuid",
      data: {
        type: "track",
        data: { type: "start", track: 1, options: "options" },
      },
    });
  }
  assertDeepEqual(declareGroup(state, "group"), {
    type: "send",
    session: "uuid",
    data: { type: "group", data: "group" },
  });
  assertEqual(typeof getInstrumentationIdentifier(state), "string");
  assertDeepEqual(instrument(state, "kind", "path", "code"), {
    message: {
      type: "send",
      session: "uuid",
      data: {
        type: "module",
        data: { kind: "kind", path: "path", code: "code", children: [] },
      },
    },
    code: "code",
  });
  assertDeepEqual(terminateState(state, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

mainAsync();
