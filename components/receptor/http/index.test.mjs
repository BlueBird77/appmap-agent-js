import { tmpdir } from "os";
import { readFile } from "fs/promises";
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
} = Assert;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const { openReceptorAsync, getReceptorTracePort, closeReceptorAsync } =
  Receptor(await buildTestDependenciesAsync(import.meta.url));

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
const socket = new Socket();
socket.connect(getReceptorTracePort(receptor));
await new Promise((resolve) => {
  socket.on("connect", resolve);
});
socket.write(createMessage("session"));
socket.write(createMessage(JSON.stringify(configuration)));
socket.write(
  createMessage(JSON.stringify(["start", "record", { path: null, data: {} }])),
);
await new Promise((resolve) => {
  socket.on("close", resolve);
  socket.end();
});
await closeReceptorAsync(receptor);
await readFile(`${repository}/directory/anonymous.appmap.json`);
await readFile(`${repository}/directory/anonymous-1.appmap.json`);
await readFile(`${repository}/directory/name.appmap.json`);