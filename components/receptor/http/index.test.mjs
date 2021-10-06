import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { Socket } from "net";
import { createMessage } from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Receptor from "./index.mjs";

const {
  // equal:assertEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const { requestAsync } = await buildTestComponentAsync("http");

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  getReceptorTracePort,
  getReceptorTrackPort,
  closeReceptorAsync,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const repository = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
const configuration = extendConfiguration(
  createConfiguration("/root"),
  {
    output: {
      directory: "directory",
    },
  },
  repository,
);
const receptor = await openReceptorAsync(configuration);

const assertRequestAsync = async (method, path, body, response) => {
  assertDeepEqual(
    await requestAsync(
      "localhost",
      getReceptorTrackPort(receptor),
      method,
      path,
      body,
    ),
    {
      code: 200,
      message: "OK",
      body: null,
      ...response,
    },
  );
};

await assertRequestAsync("GET", "/invalid-path", null, {
  code: 400,
  message: "Bad Request",
});
await assertRequestAsync("GET", "/missing-session/track", null, {
  code: 404,
  message: "Missing Session",
});
await assertRequestAsync("GET", "/_appmap/track", null, {
  code: 404,
  message: "No Active Session",
});

const socket = new Socket();
await new Promise((resolve) => {
  socket.on("connect", resolve);
  socket.connect(getReceptorTracePort(receptor));
});
socket.write(createMessage("session"));
socket.write(createMessage(JSON.stringify(configuration)));
await new Promise((resolve) => {
  setTimeout(resolve, 100);
});

await assertRequestAsync(
  "POST",
  "/session/track1",
  { path: null, data: { name: "name" } },
  {},
);
await assertRequestAsync(
  "POST",
  "/session/track1",
  { path: null, data: {} },
  { code: 409, message: "Duplicate Track" },
);
await assertRequestAsync("GET", "/_appmap/track1", null, {
  body: { enabled: true },
});
await assertRequestAsync(
  "DELETE",
  "/session/track1",
  { status: 123, errors: [] },
  {
    body: {
      configuration: { ...configuration, name: "name" },
      files: [],
      events: [],
      termination: { status: 123, errors: [] },
    },
  },
);
await assertRequestAsync("GET", "/_appmap/track1", null, {
  body: { enabled: false },
});
await assertRequestAsync(
  "DELETE",
  "/session/track1",
  { status: 123, errors: [] },
  { code: 404, message: "Missing Track" },
);
socket.write(
  createMessage(JSON.stringify(["start", "track2", { path: null, data: {} }])),
);
await new Promise((resolve) => {
  socket.on("close", resolve);
  socket.end();
});
await assertRequestAsync(
  "DELETE",
  "/session/track2",
  { status: 123, errors: [] },
  {
    body: {
      configuration,
      files: [],
      events: [],
      termination: {
        status: 1,
        errors: [{ name: "AppmapError", message: "disconnection", stack: "" }],
      },
    },
  },
);
await closeReceptorAsync(receptor);
