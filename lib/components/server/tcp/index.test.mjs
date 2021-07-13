import { strict as Assert } from "assert";
import { connect } from "net";
import { spawnSync } from "child_process";
import { patch } from "net-socket-messaging";
import component from "./index.mjs";

const testAsync = async () => {
  // happy path //
  // {
  //   const {initializeServerAsync, terminateServer} = component(
  //     {
  //       backend: {
  //         initializeBackend: () => ({termination, handle}),
  //         sendBackend: (handle, data) => {
  //           Assert.equal(data, 123);
  //
  //         }
  //           close: () => {
  //             terminateServer(handle);
  //           },
  //           receive: (data) => {
  //             Assert.equal(data, 123);
  //             socket.end();
  //           },
  //         }),
  //       },
  //     },
  //     { port: 0 },
  //   );
  //   const { termination, handle } = initializeServerAsync();
  //   const { port } = handle.server.address();
  //   connect(port);
  //   const socket = connect(port);
  //   patch(socket);
  //   socket.send("123");
  //   await termination;
  // }
  // // unhappy path (unix-domain socket) //
  // {
  //   spawnSync("rm", ["tmp/sock", "-f"]);
  //   let resolve;
  //   const promise = new Promise((_resolve) => {
  //     resolve = _resolve;
  //   });
  //   const { life, server } = await component(
  //     {
  //       backend: {
  //         open: () => ({
  //           close: () => {
  //             resolve();
  //           },
  //           receive: (data) => {
  //             Assert.fail();
  //           },
  //         }),
  //       },
  //     },
  //     { port: "tmp/sock" },
  //   ).openAsync();
  //   server.on("connection", (socket) => {
  //     socket.emit("error", new Error("BOUM SOCKET"));
  //     server.emit("error", new Error("BOUM SERVER"));
  //   });
  //   connect("tmp/sock");
  //   try {
  //     await life;
  //     Assert.fail();
  //   } catch (error) {
  //     Assert.equal(error.message, "BOUM SERVER");
  //   }
  //   await promise;
  // }
};

testAsync().catch((error) => {
  throw error;
});
