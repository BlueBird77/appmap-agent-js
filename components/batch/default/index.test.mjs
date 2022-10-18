import { assertEqual } from "../../__fixture__.mjs";
import { EventEmitter } from "events";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { mainAsync } from "./index.mjs?env=test";

const { setTimeout } = globalThis;

globalThis.GLOBAL_SPY_SPAWN = (exec, argv, _options) => {
  const emitter = new EventEmitter();
  emitter.kill = (signal) => {
    emitter.emit("close", null, signal);
  };
  assertEqual(exec, "shell");
  if (argv[0] === "success") {
    setTimeout(() => {
      emitter.emit("close", 0, null);
    }, 0);
  } else if (argv[0] === "failure") {
    setTimeout(() => {
      emitter.emit("close", 1, null);
    }, 0);
  } else {
    assertEqual(argv[0], "sleep");
  }
  return emitter;
};

const configuration = createConfiguration("file:///w:/home");

// no child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(emitter, configuration);
}

// single killed child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  setTimeout(() => {
    emitter.emit("SIGINT");
  }, 0);
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        scenario: "^",
        scenarios: {
          key1: { command: "sleep", "command-options": { shell: ["shell"] } },
          key2: { command: "sleep", "command-options": { shell: ["shell"] } },
        },
      },
      "file:///w:/base",
    ),
  );
}

// single child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        scenario: "^",
        scenarios: {
          key: {
            command: "success",
            "command-options": { shell: ["shell"] },
          },
        },
      },
      "file:///w:/base",
    ),
  );
}

// multiple child
{
  const emitter = new EventEmitter();
  emitter.env = {};
  await mainAsync(
    emitter,
    extendConfiguration(
      configuration,
      {
        recorder: "process",
        scenario: "^",
        scenarios: {
          key1: {
            command: "success",
            "command-options": { shell: ["shell"] },
          },
          key2: {
            command: "failure",
            "command-options": { shell: ["shell"] },
          },
        },
      },
      "file:///w:/base",
    ),
  );
}
